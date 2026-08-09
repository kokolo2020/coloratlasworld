import fs from "node:fs";

const source = JSON.parse(fs.readFileSync("/tmp/coloratlas-countries.json", "utf8"));
const included = new Set(["PS", "VA", "TW", "XK", "CK", "NU"]);
const countries = source
  .filter((country) => country.unMember || included.has(country.cca2))
  .map((country) => ({
    name: country.name.common,
    officialName: country.name.official,
    cca2: country.cca2,
    cca3: country.cca3,
    capital: country.capital?.[0] || null,
    region: country.region,
    subregion: country.subregion || country.region,
    currencies: country.currencies || {},
    languages: country.languages || {},
    latlng: country.latlng || [0, 0],
    area: country.area || null,
    landlocked: Boolean(country.landlocked),
    borders: country.borders || [],
    flag: country.flag,
    demonym: country.demonyms?.eng?.m || country.demonyms?.eng?.f || null,
    callingCode: `${country.idd?.root || ""}${country.idd?.suffixes?.[0] || ""}` || null,
    aliases: country.altSpellings || [],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const indicators = {
  population: JSON.parse(fs.readFileSync("/tmp/wb-pop.json", "utf8")),
  lifeExpectancy: JSON.parse(fs.readFileSync("/tmp/wb-life.json", "utf8")),
  gdp: JSON.parse(fs.readFileSync("/tmp/wb-gdp.json", "utf8")),
  gdpPerCapita: JSON.parse(fs.readFileSync("/tmp/wb-gdppc.json", "utf8")),
  gdpGrowth: JSON.parse(fs.readFileSync("/tmp/wb-growth.json", "utf8")),
};

function latestByCode(payload) {
  const result = {};
  for (const row of payload[1] || []) {
    const code = row.countryiso3code;
    if (code && row.value != null && !result[code]) result[code] = { value: row.value, year: row.date };
  }
  return result;
}

const lookup = Object.fromEntries(Object.entries(indicators).map(([key, value]) => [key, latestByCode(value)]));
const metrics = Object.fromEntries(countries.map((country) => [country.cca3, Object.fromEntries(
  Object.entries(lookup).map(([key, values]) => [key, values[country.cca3] || null])
)]));

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/countries.json", `${JSON.stringify(countries, null, 2)}\n`);
fs.writeFileSync("data/world-bank.json", `${JSON.stringify(metrics, null, 2)}\n`);
console.log(`Generated ${countries.length} country profiles.`);
