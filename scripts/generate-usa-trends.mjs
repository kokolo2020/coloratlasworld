import { writeFile } from "node:fs/promises";

const indicators = [
  { key: "population", label: "Population", code: "SP.POP.TOTL", unit: "people", kind: "count", method: "cagr", min: 0 },
  { key: "gdp", label: "GDP", code: "NY.GDP.MKTP.CD", unit: "current US$", kind: "money", method: "cagr", min: 0 },
  { key: "gdpPerCapita", label: "GDP per capita", code: "NY.GDP.PCAP.CD", unit: "current US$", kind: "money", method: "cagr", min: 0 },
  { key: "populationGrowth", label: "Population growth", code: "SP.POP.GROW", unit: "% annual", kind: "percent", method: "linear" },
  { key: "birthRate", label: "Birth rate", code: "SP.DYN.CBRT.IN", unit: "per 1,000 people", kind: "rate", method: "linear", min: 0 },
  { key: "deathRate", label: "Death rate", code: "SP.DYN.CDRT.IN", unit: "per 1,000 people", kind: "rate", method: "linear", min: 0 },
  { key: "lifeExpectancy", label: "Life expectancy", code: "SP.DYN.LE00.IN", unit: "years", kind: "years", method: "linear", min: 0, max: 100 },
  { key: "urbanization", label: "Urban population", code: "SP.URB.TOTL.IN.ZS", unit: "% of total", kind: "percent", method: "linear", min: 0, max: 100 },
  { key: "inflation", label: "Inflation", code: "FP.CPI.TOTL.ZG", unit: "% annual", kind: "percent", method: "average" },
  { key: "unemployment", label: "Unemployment", code: "SL.UEM.TOTL.ZS", unit: "% labor force", kind: "percent", method: "average", min: 0, max: 100 },
  { key: "co2PerCapita", label: "CO2 emissions per person", code: "EN.GHG.CO2.PC.CE.AR5", unit: "t CO2e/capita", kind: "rate", method: "linear", min: 0 },
  { key: "internetUse", label: "Internet access", code: "IT.NET.USER.ZS", unit: "% of people", kind: "percent", method: "linear", min: 0, max: 100 },
];

function clamp(value, indicator) {
  let next = value;
  if (typeof indicator.min === "number") next = Math.max(indicator.min, next);
  if (typeof indicator.max === "number") next = Math.min(indicator.max, next);
  return next;
}

function linearForecast(points, indicator, years) {
  const recent = points.slice(-10);
  const n = recent.length;
  const xMean = recent.reduce((sum, point) => sum + point.year, 0) / n;
  const yMean = recent.reduce((sum, point) => sum + point.value, 0) / n;
  const numerator = recent.reduce((sum, point) => sum + (point.year - xMean) * (point.value - yMean), 0);
  const denominator = recent.reduce((sum, point) => sum + (point.year - xMean) ** 2, 0);
  const slope = denominator ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  return years.map((year) => ({ year, value: clamp(intercept + slope * year, indicator) }));
}

function cagrForecast(points, indicator, years) {
  const latest = points.at(-1);
  const earlier = points.find((point) => point.year >= latest.year - 10) ?? points[0];
  if (!latest || !earlier || latest.value <= 0 || earlier.value <= 0 || latest.year === earlier.year) {
    return linearForecast(points, indicator, years);
  }
  const rate = (latest.value / earlier.value) ** (1 / (latest.year - earlier.year)) - 1;
  return years.map((year) => ({ year, value: clamp(latest.value * (1 + rate) ** (year - latest.year), indicator) }));
}

function averageForecast(points, indicator, years) {
  const recent = points.slice(-10);
  const average = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
  return years.map((year) => ({ year, value: clamp(average, indicator) }));
}

function forecast(points, indicator) {
  const latest = points.at(-1);
  if (!latest) return [];
  const years = Array.from({ length: 2035 - latest.year }, (_, index) => latest.year + index + 1);
  if (years.length === 0 || points.length < 3) return [];
  if (indicator.method === "cagr") return cagrForecast(points, indicator, years);
  if (indicator.method === "average") return averageForecast(points, indicator, years);
  return linearForecast(points, indicator, years);
}

function confidence(points, forecastPoints) {
  if (points.length < 20 || forecastPoints.length > 10) return "Low";
  const latest = points.at(-1);
  const previous = points.at(-2);
  if (!latest || !previous) return "Low";
  const gap = latest.year - previous.year;
  return gap <= 2 ? "Medium" : "Low";
}

async function fetchIndicator(indicator) {
  const url = `https://api.worldbank.org/v2/country/USA/indicator/${indicator.code}?format=json&per_page=20000`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`World Bank request failed for ${indicator.code}: ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
  const history = rows
    .map((row) => ({ year: Number(row.date), value: row.value == null ? null : Number(row.value) }))
    .filter((row) => Number.isFinite(row.year) && row.value != null && Number.isFinite(row.value) && row.year >= 1990)
    .sort((a, b) => a.year - b.year);
  const forecastPoints = forecast(history, indicator);
  return {
    key: indicator.key,
    label: indicator.label,
    code: indicator.code,
    unit: indicator.unit,
    kind: indicator.kind,
    method: indicator.method,
    latest: history.at(-1) ?? null,
    history,
    forecast: forecastPoints,
    confidence: confidence(history, forecastPoints),
  };
}

const series = [];
for (const indicator of indicators) {
  series.push(await fetchIndicator(indicator));
}

const output = {
  countryCode: "USA",
  countryName: "United States",
  retrievedAt: "2026-08-12",
  source: {
    name: "World Bank Open Data API",
    url: "https://api.worldbank.org/v2/country/USA/indicator",
  },
  note: "Forecasts are educational trend projections generated from recent historical World Bank observations. They are not official forecasts.",
  series,
};

await writeFile("data/usa-trends.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated ${series.length} USA trend series.`);
