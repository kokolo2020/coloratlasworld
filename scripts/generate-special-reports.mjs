import { readFile, writeFile } from "node:fs/promises";

const countries = JSON.parse(await readFile("data/countries.json", "utf8"));

const worldBankCodeOverrides = {
  UNK: "XKX",
};

const customLens = {
  USA: "Scale, innovation, immigration, and a resilient consumer economy.",
  JPN: "Longevity, population aging, technology depth, and slow-growth pressure.",
  GBR: "A mature services economy navigating demographics, inflation, and post-Brexit adjustment.",
};

const indicators = [
  { key: "gdpGrowth", label: "GDP growth", code: "NY.GDP.MKTP.KD.ZG", unit: "% annual", kind: "percent", method: "average", group: "economy" },
  { key: "gdp", label: "GDP", code: "NY.GDP.MKTP.CD", unit: "current US$", kind: "money", method: "cagr", group: "economy", min: 0 },
  { key: "gdpPerCapita", label: "GDP per capita", code: "NY.GDP.PCAP.CD", unit: "current US$", kind: "money", method: "cagr", group: "economy", min: 0 },
  { key: "population", label: "Population", code: "SP.POP.TOTL", unit: "people", kind: "count", method: "cagr", group: "people", min: 0 },
  { key: "populationGrowth", label: "Population growth", code: "SP.POP.GROW", unit: "% annual", kind: "percent", method: "linear", group: "people" },
  { key: "lifeExpectancy", label: "Life expectancy", code: "SP.DYN.LE00.IN", unit: "years", kind: "years", method: "linear", group: "health", min: 0, max: 100 },
  { key: "fertilityRate", label: "Fertility rate", code: "SP.DYN.TFRT.IN", unit: "births per woman", kind: "rate", method: "linear", group: "people", min: 0, max: 8 },
  { key: "urbanization", label: "Urban population", code: "SP.URB.TOTL.IN.ZS", unit: "% of total", kind: "percent", method: "linear", group: "people", min: 0, max: 100 },
  { key: "inflation", label: "Inflation", code: "FP.CPI.TOTL.ZG", unit: "% annual", kind: "percent", method: "average", group: "economy" },
  { key: "unemployment", label: "Unemployment", code: "SL.UEM.TOTL.ZS", unit: "% labor force", kind: "percent", method: "average", group: "work", min: 0, max: 100 },
  { key: "co2PerCapita", label: "CO2 per person", code: "EN.GHG.CO2.PC.CE.AR5", unit: "t CO2e/capita", kind: "rate", method: "linear", group: "environment", min: 0 },
  { key: "internetUse", label: "Internet access", code: "IT.NET.USER.ZS", unit: "% of people", kind: "percent", method: "linear", group: "technology", min: 0, max: 100 },
];

function worldBankCode(country) {
  return worldBankCodeOverrides[country.cca3] || country.cca3;
}

function clamp(value, indicator) {
  let next = value;
  if (typeof indicator.min === "number") next = Math.max(indicator.min, next);
  if (typeof indicator.max === "number") next = Math.min(indicator.max, next);
  return next;
}

function linearForecast(points, indicator, years, multiplier = 1) {
  const recent = points.slice(-10);
  const n = recent.length;
  const xMean = recent.reduce((sum, point) => sum + point.year, 0) / n;
  const yMean = recent.reduce((sum, point) => sum + point.value, 0) / n;
  const numerator = recent.reduce((sum, point) => sum + (point.year - xMean) * (point.value - yMean), 0);
  const denominator = recent.reduce((sum, point) => sum + (point.year - xMean) ** 2, 0);
  const slope = denominator ? numerator / denominator : 0;
  const latest = points.at(-1);
  if (!latest) return [];
  return years.map((year) => ({ year, value: clamp(latest.value + slope * multiplier * (year - latest.year), indicator) }));
}

function cagrForecast(points, indicator, years, multiplier = 1) {
  const latest = points.at(-1);
  const earlier = points.find((point) => point.year >= latest.year - 10) ?? points[0];
  if (!latest || !earlier || latest.value <= 0 || earlier.value <= 0 || latest.year === earlier.year) {
    return linearForecast(points, indicator, years, multiplier);
  }
  const rate = ((latest.value / earlier.value) ** (1 / (latest.year - earlier.year)) - 1) * multiplier;
  return years.map((year) => ({ year, value: clamp(latest.value * (1 + rate) ** (year - latest.year), indicator) }));
}

function averageForecast(points, indicator, years, multiplier = 1) {
  const recent = points.slice(-10);
  const average = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
  const latest = points.at(-1);
  const adjusted = latest ? latest.value + (average - latest.value) * multiplier : average;
  return years.map((year) => ({ year, value: clamp(adjusted, indicator) }));
}

function forecast(points, indicator, multiplier = 1) {
  const latest = points.at(-1);
  if (!latest || points.length < 3) return [];
  const years = Array.from({ length: Math.max(0, 2035 - latest.year) }, (_, index) => latest.year + index + 1);
  if (!years.length) return [];
  if (indicator.method === "cagr") return cagrForecast(points, indicator, years, multiplier);
  if (indicator.method === "average") return averageForecast(points, indicator, years, multiplier);
  return linearForecast(points, indicator, years, multiplier);
}

function confidence(points, forecastPoints) {
  if (points.length < 18 || forecastPoints.length > 11) return "Low";
  const latest = points.at(-1);
  const previous = points.at(-2);
  if (!latest || !previous) return "Low";
  if (latest.year - previous.year <= 1 && points.length >= 24) return "High";
  return latest.year - previous.year <= 2 ? "Medium" : "Low";
}

function changeSummary(points, indicator) {
  const first = points.find((point) => point.year >= 2000) ?? points[0];
  const latest = points.at(-1);
  if (!first || !latest) return null;
  const delta = latest.value - first.value;
  const percent = first.value ? (delta / Math.abs(first.value)) * 100 : null;
  return {
    fromYear: first.year,
    toYear: latest.year,
    absolute: delta,
    percent,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    unit: indicator.unit,
  };
}

function buildSeries(indicator, history) {
  const baseForecast = forecast(history, indicator, 1);
  return {
    key: indicator.key,
    label: indicator.label,
    code: indicator.code,
    unit: indicator.unit,
    kind: indicator.kind,
    method: indicator.method,
    group: indicator.group,
    latest: history.at(-1) ?? null,
    history,
    change: changeSummary(history, indicator),
    forecast: baseForecast,
    scenarios: {
      low: forecast(history, indicator, 0.65).at(-1) ?? null,
      base: baseForecast.at(-1) ?? null,
      high: forecast(history, indicator, 1.35).at(-1) ?? null,
    },
    confidence: confidence(history, baseForecast),
  };
}

async function fetchIndicatorRows(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator.code}?format=json&per_page=20000`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`World Bank request failed for ${indicator.code}: ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
  const byCountry = new Map();
  for (const row of rows) {
    const code = row.countryiso3code;
    const year = Number(row.date);
    const value = row.value == null ? null : Number(row.value);
    if (!code || !Number.isFinite(year) || value == null || !Number.isFinite(value) || year < 2000) continue;
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code).push({ year, value });
  }
  for (const list of byCountry.values()) list.sort((a, b) => a.year - b.year);
  return byCountry;
}

function findSeries(series, key) {
  return series.find((item) => item.key === key);
}

function countryLens(country) {
  if (customLens[country.cca3]) return customLens[country.cca3];
  const geography = country.landlocked ? "landlocked geography" : "regional connectivity";
  return `${country.subregion} context, ${geography}, demographic direction, and long-run development indicators.`;
}

function buildNarrative(country, series) {
  const population = findSeries(series, "population");
  const life = findSeries(series, "lifeExpectancy");
  const gdp = findSeries(series, "gdpGrowth");
  const fertility = findSeries(series, "fertilityRate");
  const urban = findSeries(series, "urbanization");
  const story = [
    `${country.name} is profiled through long-run World Bank indicators covering the economy, population, health, work, technology, and environment.`,
    countryLens(country),
  ];
  const insights = [];
  if (population?.change) {
    insights.push(`Population has moved ${population.change.direction} since ${population.change.fromYear}, giving the report a clear demographic baseline.`);
  }
  if (life?.change) {
    insights.push(`Life expectancy is ${life.change.direction === "up" ? "higher" : "lower"} than in ${life.change.fromYear}, showing the direction of health and longevity conditions.`);
  }
  if (gdp?.history.length) {
    const recent = gdp.history.slice(-5);
    const avg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
    insights.push(`Recent GDP growth averages ${avg.toFixed(1)}% across the latest ${recent.length} available observations.`);
  }
  if (fertility?.latest && fertility.latest.value < 1.8) {
    insights.push("Low fertility is a central long-term pressure in the projection scenarios.");
  }
  if (urban?.latest && urban.latest.value > 80) {
    insights.push("The population is highly urbanized, so future growth is likely to concentrate in metro areas and service economies.");
  }
  if (!insights.length) {
    insights.push("Comparable long-run World Bank series are limited for this profile, so the report keeps the availability gap visible.");
  }
  return {
    thesis: story.join(" "),
    insights: insights.slice(0, 4),
    projectionNote: "2035 scenarios are simple educational trend projections from recent historical observations. They are not official forecasts.",
  };
}

function buildCountry(country, indicatorData) {
  const code = worldBankCode(country);
  const series = indicators
    .map((indicator) => {
      const history = indicatorData.get(indicator.key)?.get(code) || [];
      return history.length ? buildSeries(indicator, history) : null;
    })
    .filter(Boolean);

  return {
    countryCode: country.cca3,
    countryName: country.name,
    retrievedAt: new Date().toISOString().slice(0, 10),
    source: {
      name: "World Bank Open Data API",
      url: `https://api.worldbank.org/v2/country/${code}/indicator`,
    },
    narrative: buildNarrative(country, series),
    series,
  };
}

const indicatorData = new Map();
for (const indicator of indicators) {
  indicatorData.set(indicator.key, await fetchIndicatorRows(indicator));
  console.log(`Fetched ${indicator.label}.`);
}

const reports = {};
for (const country of countries) {
  reports[country.cca3] = buildCountry(country, indicatorData);
}

await writeFile("data/special-reports.json", `${JSON.stringify(reports, null, 2)}\n`);
const complete = Object.values(reports).filter((report) => report.series.length >= 6).length;
const limited = Object.values(reports).filter((report) => report.series.length < 6).length;
console.log(`Generated special reports for ${Object.keys(reports).length} profiles. ${complete} have 6+ series; ${limited} have limited data.`);
