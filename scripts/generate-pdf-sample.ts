import { mkdir, readFile, writeFile } from "node:fs/promises";
import specialReports from "../data/special-reports.json";
import { generateCountryPdf, type CountryPdfData, type CountryPdfTrendSeries } from "../lib/country-pdf";

const report = (specialReports as Record<string, {
  source: { name: string; url: string };
  retrievedAt: string;
  narrative: { thesis: string; projectionNote: string; insights: string[] };
  series: CountryPdfTrendSeries[];
}>).USA;

const data: CountryPdfData = {
  slug: "united-states",
  name: "United States",
  officialName: "United States of America",
  code: "US / USA",
  status: "Sovereign country profile",
  region: "North America",
  subregion: "North America",
  capital: "Washington D.C.",
  summary: "The United States is a federal republic spanning North America between Canada and Mexico, with Atlantic, Pacific, Arctic and Gulf coastlines. Its large, diverse population and advanced economy give it substantial influence in technology, culture, finance, science and international affairs.",
  flagPngUrl: "https://flagcdn.com/w640/us.png",
  generatedDate: "16 Aug 2026",
  overview: [
    { label: "Population", value: "349M", note: "UN DESA - 2026 medium projection" },
    { label: "Capital", value: "Washington D.C.", note: "United States of America" },
    { label: "Currency", value: "USD", note: "United States dollar" },
    { label: "Area", value: "9,372,610 km2", note: "Atlantic, Pacific, Gulf and Arctic access" },
    { label: "Life expectancy", value: "79.8 years", note: "UN DESA - 2026 medium projection" },
    { label: "GDP", value: "$30.8T", note: "World Bank - 2025" },
    { label: "GDP per person", value: "$90K", note: "World Bank - 2025" },
    { label: "Median age", value: "38.7 years", note: "UN DESA 2026" },
  ],
  people: [
    { label: "Population", value: "349M - UN DESA 2026 medium projection" },
    { label: "Life expectancy", value: "79.8 years - UN DESA 2026" },
    { label: "Median age", value: "38.7 years" },
    { label: "Population growth", value: "0.49% annually" },
    { label: "Fertility", value: "1.62 births per woman" },
    { label: "Gender", value: "49.7% female / 50.3% male" },
    { label: "Languages", value: "English; Spanish and many other languages are widely spoken" },
    { label: "Largest cities", value: "New York, Los Angeles, Chicago, Houston, Phoenix" },
  ],
  geography: [
    { label: "Region", value: "North America" },
    { label: "Subregion", value: "North America" },
    { label: "Area", value: "9,372,610 km2" },
    { label: "Coordinates", value: "38.0 N, 97.0 W" },
    { label: "Climate", value: "Highly varied, from Arctic and continental to subtropical and desert zones" },
    { label: "Highest point", value: "Denali" },
    { label: "Major rivers", value: "Mississippi-Missouri, Colorado, Columbia, Rio Grande" },
    { label: "Resources", value: "Energy resources, minerals, timber and extensive agricultural land" },
  ],
  practical: [
    { label: "Calling code", value: "+1" },
    { label: "Time zones", value: "UTC-4 to UTC-10 in the states" },
    { label: "Driving side", value: "Right" },
    { label: "Plug types", value: "Type A / B" },
    { label: "Emergency", value: "911" },
    { label: "Tipping", value: "Common in table service and personal services" },
  ],
  economy: [
    { label: "Nominal GDP", value: "$30.8T", note: "World Bank - 2025" },
    { label: "GDP per person", value: "$90K", note: "World Bank - 2025" },
    { label: "GDP growth", value: "2.16%", note: "World Bank - 2025" },
    { label: "Global GDP rank", value: "#1", note: "Comparable profiles" },
    { label: "Currency", value: "United States dollar", note: "USD" },
    { label: "Urban population", value: "83.1%", note: "World Bank" },
  ],
  government: [
    { label: "Government type", value: "Federal presidential constitutional republic" },
    { label: "Head of state", value: "President" },
    { label: "Head of government", value: "President" },
    { label: "Constitution", value: "17 September 1787" },
    { label: "Current state since", value: "1776" },
    { label: "Country codes", value: "US / USA" },
  ],
  history: "The United States declared independence in 1776 and adopted its present Constitution in 1787. Territorial expansion, industrialization, immigration, civil conflict and major social movements shaped the modern federal republic. The country became a leading global economic and military power during the twentieth century.",
  facts: [
    "The federal union consists of 50 states and one federal district.",
    "The country has coastlines on the Atlantic, Pacific and Arctic oceans and the Gulf of Mexico.",
    "The United States is one of the world's largest economies and a major center for science and technology.",
  ],
  neighbors: ["Canada", "Mexico"],
  sources: [
    "UN DESA World Population Prospects 2024 Revision - 2026 medium projection",
    "World Bank Open Data - population, GDP, GDP per capita and growth indicators",
    "National and international statistical references listed on Color Atlas World",
    "Country profile retrieved from coloratlasworld.com",
  ],
  specialReport: {
    sourceName: report.source.name,
    sourceUrl: report.source.url,
    retrievedAt: report.retrievedAt,
    thesis: report.narrative.thesis,
    projectionNote: report.narrative.projectionNote,
    insights: report.narrative.insights,
    series: report.series,
  },
};

const flagPng = await readFile(new URL("../tmp/us.png", import.meta.url))
  .then((buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
  .catch(() => fetch(data.flagPngUrl)
    .then((response) => response.ok ? response.arrayBuffer() : null)
    .catch(() => null));

const [regularFont, boldFont] = await Promise.all([
  readFile(new URL("../public/fonts/NotoSans-Regular.ttf", import.meta.url)),
  readFile(new URL("../public/fonts/NotoSans-Bold.ttf", import.meta.url)),
]);

const bytes = await generateCountryPdf(data, {
  regularFont: regularFont.buffer.slice(regularFont.byteOffset, regularFont.byteOffset + regularFont.byteLength),
  boldFont: boldFont.buffer.slice(boldFont.byteOffset, boldFont.byteOffset + boldFont.byteLength),
  flagPng,
});
const outputDirectory = new URL("../output/pdf/", import.meta.url);
await mkdir(outputDirectory, { recursive: true });
const output = new URL("color-atlas-world-united-states-report.pdf", outputDirectory);
await writeFile(output, bytes);
console.log(output.pathname);
