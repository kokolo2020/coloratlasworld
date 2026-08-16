import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb } from "pdf-lib";

export type CountryPdfValue = {
  label: string;
  value: string;
  note?: string;
};

export type CountryPdfTrendPoint = {
  year: number;
  value: number;
};

export type CountryPdfTrendSeries = {
  key: string;
  label: string;
  unit: string;
  kind: "money" | "count" | "percent" | "years" | "rate";
  latest: CountryPdfTrendPoint | null;
  history: CountryPdfTrendPoint[];
  forecast: CountryPdfTrendPoint[];
  scenarios?: {
    low: CountryPdfTrendPoint | null;
    base: CountryPdfTrendPoint | null;
    high: CountryPdfTrendPoint | null;
  };
  confidence: "Low" | "Medium" | "High";
};

export type CountryPdfData = {
  slug: string;
  name: string;
  officialName: string;
  code: string;
  status: string;
  region: string;
  subregion: string;
  capital: string;
  summary: string;
  flagPngUrl: string;
  generatedDate: string;
  overview: CountryPdfValue[];
  people: CountryPdfValue[];
  geography: CountryPdfValue[];
  practical: CountryPdfValue[];
  economy: CountryPdfValue[];
  government: CountryPdfValue[];
  history: string;
  facts: string[];
  neighbors: string[];
  sources: string[];
  specialReport: {
    sourceName: string;
    sourceUrl: string;
    retrievedAt: string;
    thesis: string;
    projectionNote: string;
    insights: string[];
    series: CountryPdfTrendSeries[];
  };
};

export type CountryPdfAssets = {
  regularFont: ArrayBuffer;
  boldFont: ArrayBuffer;
  flagPng?: ArrayBuffer | null;
};

const W = 595.28;
const H = 841.89;
const M = 42;

const colors = {
  ink: rgb(0.032, 0.184, 0.208),
  inkSoft: rgb(0.09, 0.29, 0.31),
  cream: rgb(0.965, 0.941, 0.898),
  paper: rgb(1, 0.985, 0.949),
  white: rgb(1, 1, 1),
  red: rgb(0.929, 0.318, 0.298),
  redSoft: rgb(0.992, 0.902, 0.875),
  teal: rgb(0.306, 0.722, 0.667),
  tealSoft: rgb(0.87, 0.95, 0.925),
  gold: rgb(0.847, 0.624, 0.212),
  muted: rgb(0.39, 0.47, 0.46),
  line: rgb(0.82, 0.82, 0.76),
  darkLine: rgb(0.16, 0.34, 0.35),
};

type Fonts = { regular: PDFFont; bold: PDFFont };

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number) {
  const chunks: string[] = [];
  let current = "";
  for (const character of word) {
    const candidate = current + character;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = String(text || "").replace(/\s+/g, " ").trim().split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ").flatMap((word) => font.widthOfTextAtSize(word, size) > maxWidth
      ? splitLongWord(word, font, size, maxWidth)
      : [word]);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawTextBlock(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  color = colors.ink,
  lineHeight = size * 1.35,
  maxLines?: number,
) {
  const lines = wrapText(text, font, size, maxWidth);
  const visible = typeof maxLines === "number" ? lines.slice(0, maxLines) : lines;
  if (typeof maxLines === "number" && lines.length > maxLines && visible.length) {
    const last = visible.length - 1;
    let clipped = visible[last];
    while (clipped && font.widthOfTextAtSize(`${clipped}...`, size) > maxWidth) clipped = clipped.slice(0, -1);
    visible[last] = `${clipped.trim()}...`;
  }
  visible.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - visible.length * lineHeight;
}

function drawLabel(page: PDFPage, text: string, x: number, y: number, fonts: Fonts, color = colors.red) {
  page.drawText(text.toUpperCase(), { x, y, size: 8, font: fonts.bold, color });
}

function drawPageChrome(page: PDFPage, data: CountryPdfData, fonts: Fonts, pageNumber: number, dark = false) {
  const foreground = dark ? colors.paper : colors.ink;
  const muted = dark ? rgb(0.65, 0.78, 0.76) : colors.muted;
  page.drawText("COLOR ATLAS WORLD", { x: M, y: H - 31, size: 9, font: fonts.bold, color: foreground });
  page.drawCircle({ x: M - 10, y: H - 27, size: 3.1, color: colors.red });
  page.drawLine({ start: { x: M, y: 34 }, end: { x: W - M, y: 34 }, thickness: 0.6, color: dark ? colors.darkLine : colors.line });
  page.drawText(`coloratlasworld.com/countries/${data.slug}`, { x: M, y: 19, size: 7, font: fonts.regular, color: muted });
  const pageText = `${data.generatedDate}  |  ${pageNumber} / 4`;
  page.drawText(pageText, { x: W - M - fonts.regular.widthOfTextAtSize(pageText, 7), y: 19, size: 7, font: fonts.regular, color: muted });
}

function drawCard(page: PDFPage, x: number, y: number, width: number, height: number, fill = colors.paper, border = colors.line) {
  page.drawRectangle({ x, y, width, height, color: fill, borderColor: border, borderWidth: 0.7 });
}

function drawMetricGrid(page: PDFPage, items: CountryPdfValue[], x: number, yTop: number, width: number, columns: number, fonts: Fonts, dark = false) {
  const gap = 9;
  const rows = Math.ceil(items.length / columns);
  const cardWidth = (width - gap * (columns - 1)) / columns;
  const cardHeight = 84;
  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cardX = x + column * (cardWidth + gap);
    const cardY = yTop - cardHeight - row * (cardHeight + gap);
    drawCard(page, cardX, cardY, cardWidth, cardHeight, dark ? colors.inkSoft : colors.paper, dark ? colors.darkLine : colors.line);
    drawLabel(page, item.label, cardX + 12, cardY + 61, fonts, dark ? colors.teal : colors.red);
    drawTextBlock(page, item.value, cardX + 12, cardY + 39, cardWidth - 24, fonts.bold, item.value.length > 18 ? 12 : 15, dark ? colors.white : colors.ink, 16, 2);
    if (item.note) drawTextBlock(page, item.note, cardX + 12, cardY + 13, cardWidth - 24, fonts.regular, 6.8, dark ? rgb(0.72, 0.82, 0.80) : colors.muted, 8, 2);
  });
  return yTop - rows * (cardHeight + gap);
}

function drawValueList(page: PDFPage, title: string, items: CountryPdfValue[], x: number, yTop: number, width: number, fonts: Fonts, accent = colors.red) {
  drawLabel(page, title, x, yTop, fonts, accent);
  let y = yTop - 22;
  items.forEach((item) => {
    page.drawLine({ start: { x, y: y + 7 }, end: { x: x + width, y: y + 7 }, thickness: 0.45, color: colors.line });
    page.drawText(item.label.toUpperCase(), { x, y: y - 5, size: 6.6, font: fonts.bold, color: colors.muted });
    const valueX = x + width * 0.38;
    y = drawTextBlock(page, item.value, valueX, y - 5, width * 0.62, fonts.bold, 8.8, colors.ink, 11, 3) - 10;
  });
  return y;
}

function drawFlag(page: PDFPage, flag: PDFImage | null, x: number, y: number, width: number, height: number) {
  drawCard(page, x, y, width, height, colors.ink, colors.ink);
  if (!flag) {
    page.drawRectangle({ x: x + 12, y: y + 12, width: width - 24, height: height - 24, color: colors.paper });
    return;
  }
  const ratio = Math.min((width - 24) / flag.width, (height - 24) / flag.height);
  const flagWidth = flag.width * ratio;
  const flagHeight = flag.height * ratio;
  page.drawImage(flag, {
    x: x + (width - flagWidth) / 2,
    y: y + (height - flagHeight) / 2,
    width: flagWidth,
    height: flagHeight,
  });
}

function formatTrendValue(series: CountryPdfTrendSeries, value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "Not available";
  if (series.kind === "money") return new Intl.NumberFormat("en", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
  if (series.kind === "count") return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  if (series.kind === "percent") return `${value.toFixed(Math.abs(value) >= 10 ? 1 : 2)}%`;
  if (series.kind === "years") return `${value.toFixed(1)} years`;
  return `${value.toFixed(Math.abs(value) >= 10 ? 1 : 2)} ${series.unit}`.trim();
}

function drawDashedLine(page: PDFPage, points: Array<{ x: number; y: number }>, color = colors.teal) {
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const segmentLength = 5;
    const segments = Math.max(1, Math.floor(distance / segmentLength));
    for (let part = 0; part < segments; part += 2) {
      const startRatio = part / segments;
      const endRatio = Math.min(1, (part + 1) / segments);
      page.drawLine({
        start: { x: from.x + dx * startRatio, y: from.y + dy * startRatio },
        end: { x: from.x + dx * endRatio, y: from.y + dy * endRatio },
        thickness: 1.8,
        color,
      });
    }
  }
}

function drawTrendChart(page: PDFPage, series: CountryPdfTrendSeries, x: number, y: number, width: number, height: number, fonts: Fonts) {
  drawCard(page, x, y, width, height, colors.inkSoft, colors.darkLine);
  const base = series.scenarios?.base || series.forecast.at(-1) || null;
  page.drawText(series.label, { x: x + 14, y: y + height - 22, size: 12, font: fonts.bold, color: colors.white });
  const headline = `${formatTrendValue(series, series.latest?.value)}  ->  ${formatTrendValue(series, base?.value)}`;
  page.drawText(headline, { x: x + width - 14 - fonts.bold.widthOfTextAtSize(headline, 9), y: y + height - 20, size: 9, font: fonts.bold, color: colors.gold });

  const history = series.history;
  const forecast = series.latest ? [series.latest, ...series.forecast] : series.forecast;
  const all = [...history, ...forecast];
  if (all.length < 2) {
    page.drawText("Comparable long-run series is not available.", { x: x + 14, y: y + height / 2, size: 8, font: fonts.regular, color: rgb(0.72, 0.82, 0.80) });
    return;
  }

  const plotX = x + 16;
  const plotY = y + 27;
  const plotW = width - 32;
  const plotH = height - 61;
  const minYear = Math.min(...all.map((point) => point.year));
  const maxYear = Math.max(...all.map((point) => point.year));
  const rawMin = Math.min(...all.map((point) => point.value));
  const rawMax = Math.max(...all.map((point) => point.value));
  const valuePadding = Math.max((rawMax - rawMin) * 0.1, Math.abs(rawMax || 1) * 0.04, 0.01);
  const minValue = rawMin - valuePadding;
  const maxValue = rawMax + valuePadding;
  const point = (item: CountryPdfTrendPoint) => ({
    x: plotX + ((item.year - minYear) / Math.max(1, maxYear - minYear)) * plotW,
    y: plotY + ((item.value - minValue) / Math.max(0.0001, maxValue - minValue)) * plotH,
  });

  [0, 0.5, 1].forEach((ratio) => page.drawLine({
    start: { x: plotX, y: plotY + plotH * ratio },
    end: { x: plotX + plotW, y: plotY + plotH * ratio },
    thickness: 0.4,
    color: colors.darkLine,
  }));

  const historyPoints = history.map(point);
  for (let index = 1; index < historyPoints.length; index += 1) {
    page.drawLine({ start: historyPoints[index - 1], end: historyPoints[index], thickness: 2, color: colors.red });
  }
  drawDashedLine(page, forecast.map(point));

  if (series.latest) {
    const latestPoint = point(series.latest);
    page.drawLine({ start: { x: latestPoint.x, y: plotY }, end: { x: latestPoint.x, y: plotY + plotH }, thickness: 0.7, color: colors.gold });
    page.drawCircle({ x: latestPoint.x, y: latestPoint.y, size: 2.8, color: colors.paper, borderColor: colors.red, borderWidth: 1.3 });
    page.drawText("OBSERVED", { x: Math.max(plotX, latestPoint.x - 45), y: plotY + plotH + 5, size: 5.8, font: fonts.bold, color: colors.red });
    page.drawText("PROJECTED", { x: Math.min(plotX + plotW - 43, latestPoint.x + 7), y: plotY + plotH + 5, size: 5.8, font: fonts.bold, color: colors.teal });
  }
  page.drawText(String(minYear), { x: plotX, y: y + 10, size: 6, font: fonts.regular, color: rgb(0.65, 0.78, 0.76) });
  const maxYearLabel = String(maxYear);
  page.drawText(maxYearLabel, { x: plotX + plotW - fonts.regular.widthOfTextAtSize(maxYearLabel, 6), y: y + 10, size: 6, font: fonts.regular, color: rgb(0.65, 0.78, 0.76) });
  page.drawText(`${series.confidence} scenario confidence`, { x: x + 14, y: y + height - 35, size: 6, font: fonts.regular, color: rgb(0.65, 0.78, 0.76) });
}

function pickSeries(data: CountryPdfData) {
  const preferred = ["gdpGrowth", "population", "lifeExpectancy"];
  const selected = preferred.map((key) => data.specialReport.series.find((series) => series.key === key)).filter(Boolean) as CountryPdfTrendSeries[];
  if (selected.length >= 3) return selected.slice(0, 3);
  return [...selected, ...data.specialReport.series.filter((series) => !selected.includes(series))].slice(0, 3);
}

export async function generateCountryPdf(data: CountryPdfData, assets: CountryPdfAssets) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle(`${data.name} Country Report`);
  document.setAuthor("Color Atlas World");
  document.setSubject(`Country profile and projected special report for ${data.name}`);
  document.setKeywords([data.name, "country profile", "world atlas", "population", "economy", "projection"]);
  document.setProducer("Color Atlas World");
  document.setCreator("Color Atlas World");

  const fonts: Fonts = {
    regular: await document.embedFont(new Uint8Array(assets.regularFont), { subset: false }),
    bold: await document.embedFont(new Uint8Array(assets.boldFont), { subset: false }),
  };
  let flag: PDFImage | null = null;
  if (assets.flagPng) {
    try {
      flag = await document.embedPng(new Uint8Array(assets.flagPng));
    } catch {
      flag = null;
    }
  }

  // Page 1: country overview.
  const page1 = document.addPage([W, H]);
  page1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: colors.cream });
  drawPageChrome(page1, data, fonts, 1);
  drawLabel(page1, `${data.region} / ${data.code}`, M, H - 86, fonts);
  const titleSize = data.name.length > 23 ? 34 : data.name.length > 14 ? 42 : 51;
  drawTextBlock(page1, data.name, M, H - 131, 300, fonts.bold, titleSize, colors.ink, titleSize * 0.98, 3);
  drawTextBlock(page1, data.officialName, M, H - 240, 275, fonts.bold, 10.5, colors.red, 14, 3);
  drawTextBlock(page1, data.summary, M, H - 296, 276, fonts.regular, 9.2, colors.inkSoft, 13.5, 10);
  drawFlag(page1, flag, 336, H - 310, 217, 162);
  page1.drawText("COUNTRY PROFILE", { x: 349, y: H - 333, size: 7, font: fonts.bold, color: colors.muted });
  page1.drawText(data.status, { x: 349, y: H - 349, size: 7.5, font: fonts.regular, color: colors.inkSoft });
  drawLabel(page1, "At a glance", M, H - 420, fonts, colors.teal);
  drawMetricGrid(page1, data.overview.slice(0, 8), M, H - 440, W - M * 2, 4, fonts);
  drawCard(page1, M, 73, W - M * 2, 95, colors.paper, colors.line);
  drawLabel(page1, "Defining facts", M + 14, 146, fonts, colors.gold);
  data.facts.slice(0, 3).forEach((fact, index) => {
    page1.drawCircle({ x: M + 18, y: 124 - index * 20, size: 2.5, color: colors.red });
    drawTextBlock(page1, fact, M + 29, 127 - index * 20, W - M * 2 - 44, fonts.regular, 7.5, colors.inkSoft, 9.4, 2);
  });

  // Page 2: people and place.
  const page2 = document.addPage([W, H]);
  page2.drawRectangle({ x: 0, y: 0, width: W, height: H, color: colors.cream });
  drawPageChrome(page2, data, fonts, 2);
  drawLabel(page2, "People and place", M, H - 84, fonts);
  page2.drawText("How the country lives, connects and occupies its place in the world.", { x: M, y: H - 112, size: 14, font: fonts.bold, color: colors.ink });
  const columnGap = 24;
  const columnWidth = (W - M * 2 - columnGap) / 2;
  drawValueList(page2, "People", data.people, M, H - 158, columnWidth, fonts, colors.teal);
  drawValueList(page2, "Geography", data.geography, M + columnWidth + columnGap, H - 158, columnWidth, fonts, colors.gold);
  drawCard(page2, M, 200, W - M * 2, 220, colors.paper, colors.line);
  drawLabel(page2, "Practical country guide", M + 16, 396, fonts, colors.red);
  drawMetricGrid(page2, data.practical.slice(0, 6), M + 16, 380, W - M * 2 - 32, 3, fonts);
  drawCard(page2, M, 65, W - M * 2, 110, colors.tealSoft, colors.teal);
  drawLabel(page2, "Regional connections", M + 16, 151, fonts, colors.inkSoft);
  const neighborText = data.neighbors.length ? data.neighbors.join("  /  ") : "No listed land-border neighbors; sea and air connections shape outside access.";
  drawTextBlock(page2, neighborText, M + 16, 128, W - M * 2 - 32, fonts.bold, 10.5, colors.ink, 14, 3);
  drawTextBlock(page2, `Region: ${data.region}. Subregion: ${data.subregion}.`, M + 16, 85, W - M * 2 - 32, fonts.regular, 8.2, colors.inkSoft, 11, 2);

  // Page 3: economy, institutions and history.
  const page3 = document.addPage([W, H]);
  page3.drawRectangle({ x: 0, y: 0, width: W, height: H, color: colors.paper });
  drawPageChrome(page3, data, fonts, 3);
  drawLabel(page3, "Economy, identity and history", M, H - 84, fonts);
  page3.drawText("The systems and stories behind the profile.", { x: M, y: H - 112, size: 18, font: fonts.bold, color: colors.ink });
  drawMetricGrid(page3, data.economy.slice(0, 6), M, H - 145, W - M * 2, 3, fonts);
  drawCard(page3, M, 345, W - M * 2, 155, colors.cream, colors.line);
  drawLabel(page3, "Historical context", M + 16, 475, fonts, colors.gold);
  drawTextBlock(page3, data.history, M + 16, 450, W - M * 2 - 32, fonts.regular, 8.6, colors.inkSoft, 12.5, 8);
  const governmentY = drawValueList(page3, "Government and identity", data.government, M, 310, columnWidth, fonts, colors.teal);
  drawLabel(page3, "Sources and methodology", M + columnWidth + columnGap, 310, fonts, colors.red);
  let sourceY = 286;
  data.sources.slice(0, 6).forEach((source, index) => {
    page3.drawCircle({ x: M + columnWidth + columnGap + 3, y: sourceY + 2, size: 2.1, color: index % 2 ? colors.teal : colors.red });
    sourceY = drawTextBlock(page3, source, M + columnWidth + columnGap + 12, sourceY + 5, columnWidth - 12, fonts.regular, 7.2, colors.inkSoft, 9.5, 3) - 6;
  });
  if (governmentY > 62) {
    drawTextBlock(page3, "Values use the latest comparable release available for each indicator. Publication years differ because source agencies update individual series on different schedules.", M, 74, columnWidth, fonts.regular, 6.8, colors.muted, 9, 4);
  }

  // Page 4: observed trends and projected scenarios.
  const page4 = document.addPage([W, H]);
  page4.drawRectangle({ x: 0, y: 0, width: W, height: H, color: colors.ink });
  drawPageChrome(page4, data, fonts, 4, true);
  drawLabel(page4, "Special report / observed + projected", M, H - 80, fonts, colors.gold);
  page4.drawText("Evidence first.", { x: M, y: H - 115, size: 27, font: fonts.bold, color: colors.white });
  page4.drawText("Scenarios second.", { x: M, y: H - 146, size: 27, font: fonts.bold, color: colors.red });
  drawTextBlock(page4, data.specialReport.thesis, 314, H - 102, W - M - 314, fonts.regular, 7.8, rgb(0.75, 0.85, 0.83), 10.8, 6);

  drawCard(page4, M, H - 245, W - M * 2, 70, colors.redSoft, colors.red);
  page4.drawText("IMPORTANT: PROJECTED DATA IS NOT REAL OBSERVED DATA", { x: M + 14, y: H - 198, size: 9.5, font: fonts.bold, color: colors.red });
  drawTextBlock(
    page4,
    "Values after the latest verified year are model-based scenarios generated from historical trends. They are not official forecasts, confirmed outcomes or guaranteed future values. Use them only as educational estimates.",
    M + 14,
    H - 216,
    W - M * 2 - 28,
    fonts.bold,
    7.3,
    colors.ink,
    10.2,
    3,
  );

  const charts = pickSeries(data);
  const chartHeight = 142;
  const chartGap = 10;
  charts.forEach((series, index) => drawTrendChart(page4, series, M, H - 260 - chartHeight - index * (chartHeight + chartGap), W - M * 2, chartHeight, fonts));
  if (!charts.length) {
    drawCard(page4, M, 300, W - M * 2, 190, colors.inkSoft, colors.darkLine);
    page4.drawText("Long-run comparable series pending", { x: M + 18, y: 450, size: 16, font: fonts.bold, color: colors.white });
    drawTextBlock(page4, data.specialReport.projectionNote, M + 18, 420, W - M * 2 - 36, fonts.regular, 9, rgb(0.75, 0.85, 0.83), 13, 8);
  }
  drawTextBlock(page4, `Source: ${data.specialReport.sourceName}. Retrieved ${data.specialReport.retrievedAt}. ${data.specialReport.projectionNote}`, M, 58, W - M * 2, fonts.regular, 6.2, rgb(0.65, 0.78, 0.76), 8.2, 2);

  return document.save();
}
