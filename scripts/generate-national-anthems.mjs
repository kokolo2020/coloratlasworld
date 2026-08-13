import { readFile, writeFile } from "node:fs/promises";

const countries = JSON.parse(await readFile("data/countries.json", "utf8"));
const countryCodes = new Set(countries.map((country) => country.cca3));
const countryNames = new Map(countries.map((country) => [country.cca3, country.name]));
const MAX_DURATION_SECONDS = 180;
const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT = "ColorAtlasWorld/1.0 (educational site; https://coloratlasworld.com)";
const STOP_WORDS = new Set(["anthem", "audio", "band", "file", "instrumental", "national", "navy", "official", "performed", "states", "the", "united", "version"]);

const manualAnthems = {
  CAN: {
    title: "O Canada",
    type: "Instrumental version",
    credit: "Toronto Symphony Orchestra · conducted by Peter Oundjian",
    audioUrl: "https://www.canada.ca/content/dam/pch/audios/services/anthems-canada/O-Canada.mp3",
    sourceUrl: "https://www.canada.ca/en/canadian-heritage/services/anthem-canada.html",
    durationSeconds: 95,
  },
  SGP: {
    title: "Majulah Singapura",
    type: "Instrumental version",
    credit: "Singapore Armed Forces Band · National Heritage Board",
    audioUrl: "https://assets.app.optical.gov.sg/nhb/production/published/collections/nhb_pages/%252Fwhat-we-do%252Four-work%252Fcommunity-engagement%252Feducation%252Fresources%252Fnational-symbols%252Fnational-anthem/836a7a60-1a96-4d8f-8398-bfa49d3cb01f.wav",
    sourceUrl: "https://www.nhb.gov.sg/what-we-do/our-work/community-engagement/education/resources/national-symbols/national-anthem",
    durationSeconds: 94,
  },
  PRT: {
    title: "A Portuguesa",
    type: "National anthem audio",
    credit: "Wikimedia Commons",
    audioUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/A%20Portuguesa.ogg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:A_Portuguesa.ogg",
    durationSeconds: 70,
  },
  AUS: {
    title: "Advance Australia Fair",
    type: "Instrumental audio",
    credit: "Wikimedia Commons · U.S. Navy Band",
    audioUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/U.S.%20Navy%20Band%2C%20Advance%20Australia%20Fair%20%28instrumental%29.ogg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:U.S._Navy_Band,_Advance_Australia_Fair_(instrumental).ogg",
    durationSeconds: 54,
  },
};

function isLikelyInstrumentalAudio(url) {
  return /instrumental|orchestral|orchestra|band|navy|military|brass|ceremonial/i.test(decodeURIComponent(url));
}

function normalizeAudioUrl(url) {
  return url.replace(/^http:/, "https:");
}

function isAudioLike(fileTitle, mime) {
  return String(mime || "").startsWith("audio/") || /\.(oga|ogg|mp3|wav|flac|opus)$/i.test(fileTitle);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function toCommonsFileTitle(url) {
  const normalized = normalizeAudioUrl(url);
  const marker = "/Special:FilePath/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return null;
  const rawFileName = normalized.slice(markerIndex + marker.length).split(/[?#]/)[0];
  if (!rawFileName) return null;
  return `File:${decodeURIComponent(rawFileName).replace(/_/g, " ")}`;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null) return null;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  if (/^(\d+:)?\d+:\d+(\.\d+)?$/.test(text)) {
    return text.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  }
  const hours = Number(text.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1] || 0);
  const minutes = Number(text.match(/(\d+(?:\.\d+)?)\s*m/i)?.[1] || 0);
  const seconds = Number(text.match(/(\d+(?:\.\d+)?)\s*s/i)?.[1] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

function durationFromImageInfo(info) {
  const direct = parseDuration(info?.duration);
  if (direct) return direct;
  const metadataLength = info?.metadata?.find((item) => item.name === "length")?.value;
  return parseDuration(metadataLength);
}

async function fetchCommonsImageInfo(fileTitles) {
  const infoByTitle = new Map();
  for (const group of chunk(fileTitles, 45)) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "imageinfo",
      iiprop: "metadata|url|mime|size",
      titles: group.join("|"),
    });
    const payload = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
    for (const page of Object.values(payload.query?.pages || {})) {
      const info = page.imageinfo?.[0];
      const duration = durationFromImageInfo(info);
      if (duration) {
        infoByTitle.set(page.title, {
          duration,
          mime: info.mime,
          url: info.url,
        });
      }
    }
  }
  return infoByTitle;
}

async function searchCommonsFileTitles(searchTerm) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    list: "search",
    srnamespace: "6",
    srlimit: "8",
    srsearch: searchTerm,
  });
  const payload = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  return (payload.query?.search || []).map((result) => result.title);
}

function tokensFor(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

function hasMeaningfulOverlap(fileTitle, ...texts) {
  const fileTokens = new Set(tokensFor(fileTitle));
  return texts.some((text) => tokensFor(text).some((token) => fileTokens.has(token)));
}

function specialFilePathForTitle(fileTitle) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle.replace(/^File:/, ""))}`;
}

function commonsPageUrlForTitle(fileTitle) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle).replace(/%20/g, "_")}`;
}

function scoreCandidate(candidate) {
  let score = candidate.instrumental ? 100 : 0;
  const text = `${candidate.title} ${candidate.audioUrl}`.toLowerCase();
  if (/official|navy|military|band|orchestra|instrumental/.test(text)) score += 20;
  if (/vocal|sung|choir|lyrics|anthem-short|short/.test(text)) score -= 15;
  score += Math.max(0, MAX_DURATION_SECONDS - candidate.durationSeconds) / 10;
  return score;
}

async function findSearchFallback(country, anthemLabel) {
  const searchTerms = [
    anthemLabel || null,
    anthemLabel ? `${anthemLabel} instrumental` : null,
    `${country.name} national anthem instrumental`,
  ].filter(Boolean);
  const settledResults = await Promise.allSettled(searchTerms.map(searchCommonsFileTitles));
  const fileTitles = [...new Set(settledResults.flatMap((result) => result.status === "fulfilled" ? result.value : []))].slice(0, 12);
  if (!fileTitles.length) return null;
  const fileInfo = await fetchCommonsImageInfo(fileTitles);
  const candidates = fileTitles.flatMap((fileTitle, index) => {
    const info = fileInfo.get(fileTitle);
    if (!info?.duration || info.duration > MAX_DURATION_SECONDS || !isAudioLike(fileTitle, info.mime)) return [];
    if (!hasMeaningfulOverlap(fileTitle, anthemLabel || "", country.name)) return [];
    return [{
      title: anthemLabel || `${country.name} national anthem`,
      instrumental: isLikelyInstrumentalAudio(fileTitle),
      audioUrl: specialFilePathForTitle(fileTitle),
      sourceUrl: commonsPageUrlForTitle(fileTitle),
      durationSeconds: info.duration,
      rank: index,
    }];
  });
  if (!candidates.length) return null;
  const selected = candidates.sort((left, right) => {
    const scoreDelta = scoreCandidate(right) - scoreCandidate(left);
    return scoreDelta || left.rank - right.rank;
  })[0];
  return {
    title: selected.title,
    type: selected.instrumental ? "Instrumental audio" : "National anthem audio",
    credit: "Wikimedia Commons",
    audioUrl: selected.audioUrl,
    sourceUrl: selected.sourceUrl,
    durationSeconds: Math.round(selected.durationSeconds),
  };
}

const query = `
SELECT ?iso3 ?anthem ?anthemLabel ?audio WHERE {
  ?country wdt:P298 ?iso3;
    wdt:P85 ?anthem.
  OPTIONAL { ?anthem wdt:P51 ?audio. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;

const payload = await fetchJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`);
const output = { ...manualAnthems };
const candidatesByCode = new Map();
const fileTitleByAudioUrl = new Map();
const anthemLabelsByCode = new Map();

for (const row of payload.results.bindings) {
  const code = row.iso3?.value;
  const audioUrl = row.audio?.value;
  if (!countryCodes.has(code)) continue;
  if (row.anthemLabel?.value && !anthemLabelsByCode.has(code)) anthemLabelsByCode.set(code, row.anthemLabel.value);
  if (output[code] || !audioUrl) continue;
  const normalizedAudioUrl = normalizeAudioUrl(audioUrl);
  const fileTitle = toCommonsFileTitle(normalizedAudioUrl);
  if (!fileTitle) continue;
  const candidate = {
    code,
    title: row.anthemLabel?.value || "National anthem",
    instrumental: isLikelyInstrumentalAudio(normalizedAudioUrl),
    audioUrl: normalizedAudioUrl,
    sourceUrl: row.anthem?.value?.replace(/^http:/, "https:") || normalizedAudioUrl,
    fileTitle,
  };
  fileTitleByAudioUrl.set(normalizedAudioUrl, fileTitle);
  if (!candidatesByCode.has(code)) candidatesByCode.set(code, []);
  candidatesByCode.get(code).push(candidate);
}

const commonsInfo = await fetchCommonsImageInfo([...new Set(fileTitleByAudioUrl.values())]);
let skippedForDuration = 0;

for (const [code, candidates] of candidatesByCode) {
  const eligible = candidates.flatMap((candidate) => {
    const info = commonsInfo.get(candidate.fileTitle);
    if (!info?.duration || info.duration > MAX_DURATION_SECONDS || !isAudioLike(candidate.fileTitle, info.mime)) {
      skippedForDuration += 1;
      return [];
    }
    return [{ ...candidate, durationSeconds: info.duration }];
  });
  if (!eligible.length) continue;
  const selected = eligible.sort((left, right) => scoreCandidate(right) - scoreCandidate(left))[0];
  output[code] = {
    title: selected.title,
    type: selected.instrumental ? "Instrumental audio" : "National anthem audio",
    credit: "Wikidata / Wikimedia Commons",
    audioUrl: selected.audioUrl,
    sourceUrl: selected.sourceUrl,
    durationSeconds: Math.round(selected.durationSeconds),
  };
}

let addedFromSearch = 0;
for (const group of chunk(countries.filter((country) => !output[country.cca3]), 8)) {
  const settled = await Promise.allSettled(group.map((country) => findSearchFallback(country, anthemLabelsByCode.get(country.cca3))));
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled" || !result.value) return;
    output[group[index].cca3] = result.value;
    addedFromSearch += 1;
  });
}

await writeFile("data/national-anthems.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated ${Object.keys(output).length} national anthem audio entries.`);
console.log(`Added ${addedFromSearch} entries from Commons search fallback.`);
console.log(`Skipped ${skippedForDuration} candidates with missing or over-${MAX_DURATION_SECONDS}s duration metadata.`);
