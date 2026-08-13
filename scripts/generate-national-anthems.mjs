import { readFile, writeFile } from "node:fs/promises";

const countries = JSON.parse(await readFile("data/countries.json", "utf8"));
const countryCodes = new Set(countries.map((country) => country.cca3));

const manualAnthems = {
  CAN: {
    title: "O Canada",
    type: "Instrumental version",
    credit: "Toronto Symphony Orchestra · conducted by Peter Oundjian",
    audioUrl: "https://www.canada.ca/content/dam/pch/audios/services/anthems-canada/O-Canada.mp3",
    sourceUrl: "https://www.canada.ca/en/canadian-heritage/services/anthem-canada.html",
  },
};

function isLikelyInstrumentalAudio(url) {
  return /instrumental|orchestral|orchestra|band|navy|military/i.test(decodeURIComponent(url));
}

function normalizeAudioUrl(url) {
  return url.replace(/^http:/, "https:");
}

const query = `
SELECT ?iso3 ?anthem ?anthemLabel ?audio WHERE {
  ?country wdt:P298 ?iso3;
    wdt:P85 ?anthem.
  OPTIONAL { ?anthem wdt:P51 ?audio. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;

const response = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, {
  headers: { "User-Agent": "ColorAtlasWorld/1.0 (educational site)" },
});

if (!response.ok) throw new Error(`Wikidata anthem query failed: ${response.status}`);

const payload = await response.json();
const output = { ...manualAnthems };

for (const row of payload.results.bindings) {
  const code = row.iso3?.value;
  const audioUrl = row.audio?.value;
  if (!countryCodes.has(code) || output[code] || !audioUrl || !isLikelyInstrumentalAudio(audioUrl)) continue;
  output[code] = {
    title: row.anthemLabel?.value || "National anthem",
    type: "Instrumental audio",
    credit: "Wikidata / Wikimedia Commons",
    audioUrl: normalizeAudioUrl(audioUrl),
    sourceUrl: row.anthem?.value?.replace(/^http:/, "https:") || normalizeAudioUrl(audioUrl),
  };
}

await writeFile("data/national-anthems.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated ${Object.keys(output).length} national anthem audio entries.`);
