import { writeFile } from "node:fs/promises";

const countries = [
  {
    code: "USA",
    name: "United States",
    lens: "Scale, innovation, immigration, and a resilient consumer economy.",
  },
  {
    code: "JPN",
    name: "Japan",
    lens: "Longevity, population aging, technology depth, and slow-growth pressure.",
  },
  {
    code: "GBR",
    name: "United Kingdom",
    lens: "A mature services economy navigating demographics, inflation, and post-Brexit adjustment.",
  },
];

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
  const years = Array.from({ length: 2035 - latest.year }, (_, index) => latest.year + index + 1);
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

async function fetchIndicator(country, indicator) {
  const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${indicator.code}?format=json&per_page=20000`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`World Bank request failed for ${country.code} ${indicator.code}: ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
  const history = rows
    .map((row) => ({ year: Number(row.date), value: row.value == null ? null : Number(row.value) }))
    .filter((row) => Number.isFinite(row.year) && row.value != null && Number.isFinite(row.value) && row.year >= 2000)
    .sort((a, b) => a.year - b.year);
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

function findSeries(series, key) {
  return series.find((item) => item.key === key);
}

function buildNarrative(country, series) {
  const population = findSeries(series, "population");
  const life = findSeries(series, "lifeExpectancy");
  const gdp = findSeries(series, "gdpGrowth");
  const fertility = findSeries(series, "fertilityRate");
  const urban = findSeries(series, "urbanization");
  const story = [
    `${country.name} is profiled through long-run World Bank indicators covering the economy, population, health, work, technology, and environment.`,
    country.lens,
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
  return {
    thesis: story.join(" "),
    insights: insights.slice(0, 4),
    projectionNote: "2035 scenarios are simple educational trend projections from recent historical observations. They are not official forecasts.",
  };
}

async function buildCountry(country) {
  const series = [];
  for (const indicator of indicators) {
    series.push(await fetchIndicator(country, indicator));
  }
  return {
    countryCode: country.code,
    countryName: country.name,
    retrievedAt: new Date().toISOString().slice(0, 10),
    source: {
      name: "World Bank Open Data API",
      url: `https://api.worldbank.org/v2/country/${country.code}/indicator`,
    },
    narrative: buildNarrative(country, series),
    series,
  };
}

const reports = {};
for (const country of countries) {
  reports[country.code] = await buildCountry(country);
}

await writeFile("data/special-reports.json", `${JSON.stringify(reports, null, 2)}\n`);
console.log(`Generated special reports for ${countries.map((country) => country.code).join(", ")}.`);
