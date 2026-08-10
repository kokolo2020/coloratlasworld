import fs from "node:fs";

const countries = JSON.parse(fs.readFileSync("data/countries.json", "utf8"));
const metrics = JSON.parse(fs.readFileSync("data/world-bank.json", "utf8"));
const urbanRaw = JSON.parse(fs.readFileSync("/tmp/wb-urban.json", "utf8"));
const wikiRaw = JSON.parse(fs.readFileSync("/tmp/wikidata-country-enrichment-v2.json", "utf8"));

const urbanByCode = new Map();
for (const row of urbanRaw[1] || []) {
  if (!row.countryiso3code || row.value == null || urbanByCode.has(row.countryiso3code)) continue;
  urbanByCode.set(row.countryiso3code, { value: Number(row.value), year: row.date });
}

const wikiByCode = new Map((wikiRaw.results?.bindings || []).map((row) => [row.iso3?.value, row]));
const leftDriving = new Set(["AG","AU","BS","BD","BB","BT","BW","BN","CY","DM","SZ","FJ","GD","GY","IN","ID","IE","JM","JP","KE","KI","LS","MW","MY","MV","MT","MU","MZ","NA","NR","NP","NZ","PK","PG","KN","LC","VC","WS","SC","SG","SB","ZA","LK","SR","TZ","TH","TL","TO","TT","TV","UG","GB","ZM","ZW"]);
const governmentAllow = /(republic|monarchy|democracy|federation|federal|parliamentary|presidential|one-party|unitary state|emirate|sultanate|military|theocracy|principality|constitutional)/i;

function value(row, key) { return row?.[key]?.value || null; }
function climateFor(country) {
  const latitude = Math.abs(country.latlng?.[0] || 0);
  if (latitude >= 66) return "Polar and subpolar zones";
  if (latitude >= 45) return "Cool temperate to continental zones";
  if (latitude >= 23.5) return "Temperate to subtropical zones";
  return "Tropical to subtropical zones";
}
function commonsUrl(raw) { return raw ? raw.replace(/^http:/, "https:") : null; }
function fmtArea(area) { return area ? `${new Intl.NumberFormat("en").format(area)} km²` : null; }

const output = {};
for (const country of countries) {
  const wiki = wikiByCode.get(country.cca3);
  const urban = urbanByCode.get(country.cca3) || null;
  const officialLanguages = Object.values(country.languages || {});
  const inception = value(wiki, "inception");
  const inceptionYear = inception ? new Date(inception).getUTCFullYear() : null;
  const govRaw = value(wiki, "government");
  const government = govRaw && governmentAllow.test(govRaw) ? govRaw : null;
  const borderNames = country.borders.map((code) => countries.find((item) => item.cca3 === code)?.name).filter(Boolean);
  const countryMetrics = metrics[country.cca3] || {};
  const facts = [
    country.capital ? `${country.capital} is the capital city.` : null,
    country.area ? `${country.name} covers ${fmtArea(country.area)}.` : null,
    country.landlocked ? `${country.name} is landlocked.` : `${country.name} is not classified as landlocked.`,
    borderNames.length ? `It shares land borders with ${borderNames.slice(0, 5).join(", ")}${borderNames.length > 5 ? ` and ${borderNames.length - 5} more` : ""}.` : "It has no listed land borders.",
    officialLanguages.length ? `Listed official languages include ${officialLanguages.slice(0, 4).join(", ")}.` : null,
    country.callingCode ? `Its international calling code is ${country.callingCode}.` : null,
    countryMetrics.population?.value ? `The latest published population in this atlas is ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(countryMetrics.population.value)} (${countryMetrics.population.year}).` : null,
    country.currencies && Object.keys(country.currencies).length ? `The listed currency code is ${Object.keys(country.currencies)[0]}.` : null,
  ].filter(Boolean).slice(0, 8);

  output[country.cca3] = {
    demographics: {
      urbanPercent: urban,
      ruralPercent: urban ? { value: 100 - urban.value, year: urban.year } : null,
      medianAge: null,
      officialLanguages,
      largestCities: country.capital ? [country.capital] : [],
      compositionNote: "Ethnic and religious categories vary by national census and are not presented without a directly comparable, dated source.",
    },
    history: {
      currentStateSince: inceptionYear,
      summary: inceptionYear
        ? `Wikidata records the current state as dating from ${inceptionYear}. Earlier state forms, independence milestones, and later constitutional changes may use different dates, so this is a starting point rather than a complete national timeline.`
        : `A single internationally comparable founding date is not available in the current dataset. National independence, state formation, and constitutional milestones can refer to different events.`,
    },
    government: {
      type: government,
      headOfState: value(wiki, "headState"),
      headOfGovernment: value(wiki, "headGovernment"),
      constitutionDate: null,
      retrieved: "2026-08-10",
      sourceUrl: value(wiki, "wikidataUrl"),
    },
    environment: {
      climate: climateFor(country),
      highestPoint: /^Q\d+$/.test(value(wiki, "highestPoint") || "") ? null : value(wiki, "highestPoint"),
      geography: `${country.name} is in ${country.subregion}${country.landlocked ? " and has no coastline" : ""}. Its listed area is ${fmtArea(country.area) || "not published"}.`,
      majorRivers: null,
      naturalResources: null,
    },
    dailyLife: {
      drivingSide: leftDriving.has(country.cca2) ? "Left" : "Right",
      timeZones: null,
      plugTypes: null,
      tipping: null,
      emergencyNumbers: null,
      callingCode: country.callingCode || null,
    },
    neighbors: borderNames,
    facts,
    images: [
      commonsUrl(value(wiki, "capitalImage")) ? { url: commonsUrl(value(wiki, "capitalImage")), label: country.capital ? `${country.capital}, ${country.name}` : country.name, source: "Wikimedia Commons" } : null,
    ].filter(Boolean),
  };
}

fs.writeFileSync("data/country-enrichment.json", `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(
  "data/country-enrichment.js",
  `// Generated by scripts/generate-country-enrichment.mjs. Keep the catalog as a string so the bundler does not infer a 199-country object type.\nexport default JSON.parse(${JSON.stringify(JSON.stringify(output))});\n`,
);
console.log(`Wrote enrichment for ${Object.keys(output).length} countries.`);
