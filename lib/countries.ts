import countriesData from "@/data/countries.json";
import metricsData from "@/data/world-bank.json";
import enrichmentData from "@/data/country-enrichment.js";

export type CountryRecord = (typeof countriesData)[number];
type Metric = { value: number; year: string } | null;
export type CountryMetrics = {
  population: Metric;
  lifeExpectancy: Metric;
  gdp: Metric;
  gdpPerCapita: Metric;
  gdpGrowth: Metric;
};
export type CountryEnrichment = {
  snapshotAbout?: string;
  demographics: { urbanPercent: Metric; ruralPercent: Metric; medianAge: number | null; officialLanguages: string[]; largestCities: string[]; compositionNote: string };
  history: { currentStateSince: number | null; summary: string };
  government: { type: string | null; headOfState: string | null; headOfGovernment: string | null; constitutionDate: string | null; retrieved: string; sourceUrl: string | null };
  environment: { climate: string; highestPoint: string | null; geography: string; majorRivers: string | null; naturalResources: string | null };
  dailyLife: { drivingSide: string; timeZones: string | null; plugTypes: string | null; tipping: string | null; emergencyNumbers: string | null; callingCode: string | null };
  neighbors: string[];
  facts: string[];
  images: { url: string; label: string; source: string }[];
};

export function slugifyCountry(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const COUNTRIES = countriesData.map((country, index) => ({
  ...country,
  slug: slugifyCountry(country.name),
  profileNumber: index + 1,
}));

export const COUNTRY_SEARCH_INDEX = COUNTRIES.map((country) => ({
  name: country.name,
  slug: country.slug,
  terms: [country.name, country.officialName, country.cca2, country.cca3, ...country.aliases,
    ...(country.cca2 === "US" ? ["USA", "America"] : []),
    ...(country.cca2 === "GB" ? ["UK", "Britain", "Great Britain"] : []),
  ].join(" ").toLowerCase(),
}));

export function getCountryBySlug(slug: string) {
  return COUNTRIES.find((country) => country.slug === slug);
}

export function getCountryByCca3(code: string) { return COUNTRIES.find((country) => country.cca3 === code); }
export function getEnrichment(code: string): CountryEnrichment { return (enrichmentData as Record<string, CountryEnrichment>)[code]; }

const metricRows = Object.entries(metricsData as Record<string, CountryMetrics>);
export const COUNTRY_AVERAGE_POPULATION = metricRows.reduce((sum, [, row]) => sum + (row.population?.value || 0), 0) / metricRows.filter(([, row]) => row.population?.value).length;
export function getGdpRank(code: string) {
  const ranked = metricRows.filter(([, row]) => row.gdp?.value).sort((a, b) => (b[1].gdp?.value || 0) - (a[1].gdp?.value || 0));
  const index = ranked.findIndex(([key]) => key === code);
  return index < 0 ? null : { rank: index + 1, total: ranked.length };
}

export function getMetrics(code: string): CountryMetrics {
  return (metricsData as Record<string, CountryMetrics>)[code] || {
    population: null, lifeExpectancy: null, gdp: null, gdpPerCapita: null, gdpGrowth: null,
  };
}

export function flagUrl(code: string) {
  if (code === "GB-NIR") return "https://flagcdn.com/gb.svg";
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}
export function formatNumber(value?: number | null) {
  if (value == null) return "Not published";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
export function formatMoney(value?: number | null) {
  if (value == null) return "Not published";
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
export function formatArea(value?: number | null) {
  if (value == null) return "Not published";
  return `${new Intl.NumberFormat("en").format(value)} km²`;
}
export function displayRegion(country: CountryRecord) {
  return country.region === "Americas" ? country.subregion : country.region;
}
