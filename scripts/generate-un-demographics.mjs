import { createReadStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";

const REFERENCE_YEAR = 2026;
const DEMOGRAPHICS_FILE = process.env.UN_WPP_DEMOGRAPHICS_FILE || "/tmp/WPP2024_Demographic_Indicators_Medium.csv.gz";
const AGE_FILE = process.env.UN_WPP_AGE_FILE || "/tmp/WPP2024_PopulationByAge5GroupSex_Medium.csv.gz";
const DEMOGRAPHICS_URL = "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz";
const AGE_URL = "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_PopulationByAge5GroupSex_Medium.csv.gz";

async function ensureSource(file, url) {
  try {
    await access(file);
    return;
  } catch {}
  const response = await fetch(url);
  if (!response.ok) throw new Error(`UN WPP download failed (${response.status}): ${url}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  console.log(`Downloaded ${file}.`);
}

function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  cells.push(value);
  return cells;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readRows(file, onRow) {
  const input = createReadStream(file).pipe(createGunzip());
  const lines = createInterface({ input, crlfDelay: Infinity });
  let headers;
  for await (const line of lines) {
    const cells = parseCsvLine(line);
    if (!headers) {
      headers = cells.map((cell) => cell.replace(/^\uFEFF/, ""));
      continue;
    }
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
    onRow(row);
  }
}

const countries = {};
await ensureSource(DEMOGRAPHICS_FILE, DEMOGRAPHICS_URL);
await ensureSource(AGE_FILE, AGE_URL);
await readRows(DEMOGRAPHICS_FILE, (row) => {
  if (row.LocTypeName !== "Country/Area" || Number(row.Time) !== REFERENCE_YEAR || !row.ISO3_code) return;
  const populationThousands = number(row.TPopulation1July);
  const femaleThousands = number(row.TPopulationFemale1July);
  const maleThousands = number(row.TPopulationMale1July);
  const totalBySex = femaleThousands != null && maleThousands != null ? femaleThousands + maleThousands : null;
  countries[row.ISO3_code] = {
    locationName: row.Location,
    population: populationThousands == null ? null : { value: populationThousands * 1000, year: String(REFERENCE_YEAR), source: "UN DESA", status: "medium projection" },
    lifeExpectancy: number(row.LEx) == null ? null : { value: number(row.LEx), year: String(REFERENCE_YEAR), source: "UN DESA", status: "medium projection" },
    medianAge: number(row.MedianAgePop),
    populationGrowth: number(row.PopGrowthRate),
    fertilityRate: number(row.TFR),
    gender: totalBySex ? {
      femalePercent: (femaleThousands / totalBySex) * 100,
      malePercent: (maleThousands / totalBySex) * 100,
    } : null,
    ageDistribution: null,
  };
});

const ageTotals = new Map();
await readRows(AGE_FILE, (row) => {
  if (row.LocTypeName !== "Country/Area" || Number(row.Time) !== REFERENCE_YEAR || !row.ISO3_code) return;
  const age = number(row.AgeGrpStart);
  const population = number(row.PopTotal);
  if (age == null || population == null) return;
  const bucket = age < 15 ? "0-14" : age < 30 ? "15-29" : age < 45 ? "30-44" : age < 60 ? "45-59" : age < 75 ? "60-74" : "75+";
  if (!ageTotals.has(row.ISO3_code)) ageTotals.set(row.ISO3_code, new Map());
  const totals = ageTotals.get(row.ISO3_code);
  totals.set(bucket, (totals.get(bucket) || 0) + population);
});

const bucketOrder = ["0-14", "15-29", "30-44", "45-59", "60-74", "75+"];
for (const [code, totals] of ageTotals) {
  const country = countries[code];
  if (!country) continue;
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  country.ageDistribution = total ? bucketOrder.map((label) => ({ label, value: (totals.get(label) || 0) / total * 100 })) : null;
}

const output = {
  metadata: {
    publisher: "United Nations, Department of Economic and Social Affairs, Population Division",
    dataset: "World Population Prospects 2024, Online Edition",
    edition: "2024 Revision",
    referenceYear: REFERENCE_YEAR,
    status: "medium projection",
    generatedAt: new Date().toISOString().slice(0, 10),
    sourceUrl: "https://population.un.org/wpp/downloads",
  },
  countries,
};

await writeFile("data/un-demographics.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated UN demographics for ${Object.keys(countries).length} countries and areas (${REFERENCE_YEAR} medium projection).`);
