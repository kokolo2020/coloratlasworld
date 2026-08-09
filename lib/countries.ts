import countriesData from "@/data/countries.json";
import metricsData from "@/data/world-bank.json";

export type CountryRecord = (typeof countriesData)[number];
type Metric = { value: number; year: string } | null;
export type CountryMetrics = {
  population: Metric;
  lifeExpectancy: Metric;
  gdp: Metric;
  gdpPerCapita: Metric;
  gdpGrowth: Metric;
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

export function getMetrics(code: string): CountryMetrics {
  return (metricsData as Record<string, CountryMetrics>)[code] || {
    population: null, lifeExpectancy: null, gdp: null, gdpPerCapita: null, gdpGrowth: null,
  };
}

export function flagUrl(code: string) { return `https://flagcdn.com/${code.toLowerCase()}.svg`; }
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
