import type { Metadata } from "next";
import Link from "next/link";
import CountrySearch from "@/components/CountrySearch";
import { COUNTRIES, flagUrl, formatArea, formatMoney, formatNumber, getDemographics, getEnrichment, getMetrics, metricSourceLabel } from "@/lib/countries";

type AtlasCountry = {
  slug: string;
  profileNumber: number;
  name: string;
  officialName: string;
  cca2: string;
  cca3: string;
  status?: string | null;
  region: string;
  subregion: string;
  capital?: string | null;
  currencies: Record<string, { name: string; symbol?: string }>;
  languages: Record<string, string>;
  population?: number | null;
  area?: number | null;
};
const ATLAS_COUNTRIES = COUNTRIES as AtlasCountry[];
const COUNTRY_OPTIONS = ATLAS_COUNTRIES.map((country) => ({ slug: country.slug, name: country.name }));
type CompareMetric = { value: number | null; label: string; note?: string };
type CompareCountry = {
  slug: string;
  name: string;
  officialName: string;
  code: string;
  region: string;
  subregion: string;
  flagUrl: string;
  capital: string;
  currency: string;
  languages: string;
  status: string;
  summary: string;
  facts: string[];
  metrics: {
    population: CompareMetric;
    gdp: CompareMetric;
    gdpPerCapita: CompareMetric;
    gdpGrowth: CompareMetric;
    lifeExpectancy: CompareMetric;
    area: CompareMetric;
    medianAge: CompareMetric;
    urbanShare: CompareMetric;
  };
  dailyLife: {
    timeZones: string;
    drivingSide: string;
    plugTypes: string;
    emergencyNumbers: string;
  };
};

export const metadata: Metadata = {
  title: "Compare Countries",
  description: "Compare population, GDP, life expectancy, geography, languages, daily-life details, and country profiles side by side.",
};

const DEFAULT_COMPARE = ["united-states", "japan", "singapore"];
const PRESETS = [
  { label: "USA · China · India", countries: ["united-states", "china", "india"] },
  { label: "Canada · Mexico · USA", countries: ["canada", "mexico", "united-states"] },
  { label: "Japan · Singapore · South Korea", countries: ["japan", "singapore", "south-korea"] },
  { label: "France · Italy · UK", countries: ["france", "italy", "united-kingdom"] },
  { label: "Brazil · South Africa · India", countries: ["brazil", "south-africa", "india"] },
];
const METRIC_ROWS: { key: keyof CompareCountry["metrics"]; label: string; higherIsBetter?: boolean }[] = [
  { key: "population", label: "Population" },
  { key: "gdp", label: "GDP" },
  { key: "gdpPerCapita", label: "GDP per person", higherIsBetter: true },
  { key: "gdpGrowth", label: "GDP growth", higherIsBetter: true },
  { key: "lifeExpectancy", label: "Life expectancy", higherIsBetter: true },
  { key: "area", label: "Area" },
  { key: "medianAge", label: "Median age" },
  { key: "urbanShare", label: "Urban share" },
];
const SORTABLE_METRICS: { key: keyof CompareCountry["metrics"]; label: string }[] = [
  { key: "population", label: "Population" },
  { key: "gdp", label: "GDP" },
  { key: "area", label: "Land area" },
  { key: "lifeExpectancy", label: "Life expectancy" },
];

function parseSelectedCountries(params?: { countries?: string; a?: string; b?: string; c?: string; d?: string }) {
  const selected = params?.countries
    ? params.countries.split(",")
    : [params?.a, params?.b, params?.c, params?.d];
  const slugs = [...new Set(selected.map((slug) => slug?.trim().toLowerCase()).filter((slug): slug is string => Boolean(slug)))].filter((slug) => COUNTRY_OPTIONS.some((country) => country.slug === slug));
  return slugs.length >= 2 ? slugs.slice(0, 4) : DEFAULT_COMPARE;
}

function currencyLabel(country: AtlasCountry) {
  const currencies = Object.entries(country.currencies);
  return currencies.length ? currencies.map(([code, item]) => `${item.name} (${code})`).join(", ") : "Not published";
}

function metricLabel(value?: number | null, formatter = formatNumber) {
  return value == null ? "Not published" : formatter(value);
}

function percentLabel(value?: number | null) {
  return value == null ? "Not published" : `${value.toFixed(value === 100 ? 0 : 1)}%`;
}

function displayCompareRegion(country: AtlasCountry) {
  return country.region === "Americas" ? country.subregion : country.region;
}

function compareHref(slugs: string[]) {
  return `/compare?countries=${encodeURIComponent(slugs.join(","))}`;
}

function cleanCompareHref(slugs: string[]) {
  return `/compare/${slugs.join("-vs-")}`;
}

function sortableHref(slugs: string[], metric: keyof CompareCountry["metrics"]) {
  return `/compare?countries=${encodeURIComponent(slugs.join(","))}&sort=${metric}`;
}

function clampPercent(value: number) {
  return `${Math.min(100, Math.max(4, value))}%`;
}

function countryBySlug(slug: string) {
  return ATLAS_COUNTRIES.find((country) => country.slug === slug);
}

function randomPair() {
  const seed = new Date().getUTCFullYear() * 372 + new Date().getUTCMonth() * 31 + new Date().getUTCDate();
  const first = COUNTRY_OPTIONS[seed % COUNTRY_OPTIONS.length];
  const second = COUNTRY_OPTIONS[(seed * 17 + 41) % COUNTRY_OPTIONS.length];
  return first.slug === second.slug ? [first.slug, "united-states"] : [first.slug, second.slug];
}

function buildCompareCountry(country: AtlasCountry): CompareCountry {
  const metrics = getMetrics(country.cca3);
  const demographics = getDemographics(country.cca3);
  const enrichment = getEnrichment(country.cca3);
  const languages = enrichment.demographics.officialLanguages.length
    ? enrichment.demographics.officialLanguages.join(", ")
    : Object.values(country.languages).join(", ") || "Not published";
  const populationValue = metrics.population?.value ?? country.population ?? null;

  return {
    slug: country.slug,
    name: country.name,
    officialName: country.officialName,
    code: country.cca2,
    region: displayCompareRegion(country),
    subregion: country.subregion,
    flagUrl: flagUrl(country.cca2),
    capital: country.capital || "Not published",
    currency: currencyLabel(country),
    languages,
    status: country.status || "Sovereign country profile",
    summary: enrichment.snapshotAbout || enrichment.history.summary || `${country.name} is a ${displayCompareRegion(country)} profile in Color Atlas World.`,
    facts: enrichment.facts || [],
    metrics: {
      population: { value: populationValue, label: metricLabel(populationValue), note: metrics.population ? metricSourceLabel(metrics.population) : "Open country catalog" },
      gdp: { value: metrics.gdp?.value ?? null, label: metricLabel(metrics.gdp?.value, formatMoney), note: metrics.gdp ? `${metrics.gdp.year} · current USD` : "No recent value" },
      gdpPerCapita: { value: metrics.gdpPerCapita?.value ?? null, label: metricLabel(metrics.gdpPerCapita?.value, formatMoney), note: metrics.gdpPerCapita ? `${metrics.gdpPerCapita.year} · current USD` : "No recent value" },
      gdpGrowth: { value: metrics.gdpGrowth?.value ?? null, label: metrics.gdpGrowth ? `${metrics.gdpGrowth.value.toFixed(1)}%` : "Not published", note: metrics.gdpGrowth ? `${metrics.gdpGrowth.year} annual growth` : "No recent value" },
      lifeExpectancy: { value: metrics.lifeExpectancy?.value ?? null, label: metrics.lifeExpectancy ? `${metrics.lifeExpectancy.value.toFixed(1)} years` : "Not published", note: metrics.lifeExpectancy ? metricSourceLabel(metrics.lifeExpectancy) : "No recent value" },
      area: { value: country.area ?? null, label: formatArea(country.area), note: "Open country catalog" },
      medianAge: { value: demographics?.medianAge ?? enrichment.demographics.medianAge, label: demographics?.medianAge != null ? `${demographics.medianAge.toFixed(1)} years` : enrichment.demographics.medianAge != null ? `${enrichment.demographics.medianAge} years` : "Not published", note: demographics ? "UN DESA · 2026 medium projection" : "Comparable enrichment data" },
      urbanShare: { value: enrichment.demographics.urbanPercent?.value ?? null, label: percentLabel(enrichment.demographics.urbanPercent?.value), note: enrichment.demographics.urbanPercent ? `World Bank · ${enrichment.demographics.urbanPercent.year}` : "No recent value" },
    },
    dailyLife: {
      timeZones: enrichment.dailyLife.timeZones || "Profile-specific value pending",
      drivingSide: enrichment.dailyLife.drivingSide || "Not published",
      plugTypes: enrichment.dailyLife.plugTypes || "Profile-specific value pending",
      emergencyNumbers: enrichment.dailyLife.emergencyNumbers || "Check official guidance",
    },
  };
}

export default async function ComparePage({ searchParams }: { searchParams?: Promise<{ countries?: string; a?: string; b?: string; c?: string; d?: string; sort?: string }> }) {
  const params = await searchParams;
  const selectedSlugs = parseSelectedCountries(params);
  const selectedCountries = selectedSlugs.map(countryBySlug).filter((country): country is AtlasCountry => Boolean(country)).map(buildCompareCountry);
  const sortKey = SORTABLE_METRICS.some((metric) => metric.key === params?.sort) ? params?.sort as keyof CompareCountry["metrics"] : "population";
  const rankedCountries = [...selectedCountries].sort((left, right) => (right.metrics[sortKey].value ?? -Infinity) - (left.metrics[sortKey].value ?? -Infinity));
  const guessMetric: keyof CompareCountry["metrics"] = "population";
  const guessAnswer = [...selectedCountries].sort((left, right) => (right.metrics[guessMetric].value ?? -Infinity) - (left.metrics[guessMetric].value ?? -Infinity))[0];
  const randomSlugs = randomPair();

  return (
    <main className="compare-page">
      <nav className="site-nav country-nav" aria-label="Primary navigation">
        <Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link>
        <CountrySearch />
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link className="nav-cta" href="/#countries">Browse all</Link>
        </div>
      </nav>

      <header className="compare-hero">
        <div>
          <p className="eyebrow"><span /> Compare countries</p>
          <h1>Side-by-side<br /><em>country intelligence.</em></h1>
          <p>Compare up to four world profiles across people, economy, geography, practical details, and defining facts. Every card links deeper into the full country page.</p>
        </div>
        <aside>
          <span>Engagement loop</span>
          <strong>{ATLAS_COUNTRIES.length}</strong>
          <p>profiles can now connect through comparisons, presets, and profile links.</p>
          <Link href={cleanCompareHref(["united-states", "canada"])}>Open US vs Canada</Link>
        </aside>
      </header>

      <section className="compare-tool" aria-label="Country comparison tool">
        <div className="compare-controls">
          <div>
            <p className="eyebrow"><span /> Build a comparison</p>
            <h2>Choose up to four profiles</h2>
            <p>Each selection creates a shareable comparison page and keeps every country card one click away from the full profile.</p>
          </div>
          <form className="compare-select-grid" action="/compare" method="get">
            {["a", "b", "c", "d"].map((field, index) => (
              <label key={field}>
                <span>Country {index + 1}</span>
                <select name={field} defaultValue={selectedSlugs[index] || ""}>
                  <option value="">None</option>
                  {COUNTRY_OPTIONS.map((country) => <option key={country.slug} value={country.slug}>{country.name}</option>)}
                </select>
              </label>
            ))}
            <button type="submit">Compare selected</button>
          </form>
        </div>

        <div className="compare-presets" aria-label="Popular comparison presets">
          {PRESETS.map((preset) => <Link key={preset.label} href={compareHref(preset.countries)}>{preset.label}</Link>)}
          <Link href={compareHref(randomSlugs)}>Random comparison</Link>
          <Link href={cleanCompareHref(selectedSlugs)}>Clean URL</Link>
        </div>

        <div className="compare-country-grid">
          {selectedCountries.map((country) => (
            <article key={country.slug} className="compare-country-card">
              <div className="compare-card-flag"><img src={country.flagUrl} alt={`Flag of ${country.name}`} /></div>
              <div className="compare-card-body">
                <span>{country.code} · {country.region}</span>
                <h3>{country.name}</h3>
                <p>{country.summary}</p>
                <dl>
                  <div><dt>Capital</dt><dd>{country.capital}</dd></div>
                  <div><dt>Currency</dt><dd>{country.currency}</dd></div>
                  <div><dt>Languages</dt><dd>{country.languages}</dd></div>
                </dl>
                <Link href={`/countries/${country.slug}`}>Open profile <span>→</span></Link>
              </div>
            </article>
          ))}
        </div>

        <div className="compare-metric-board">
          <div className="compare-board-heading">
            <p className="eyebrow"><span /> Data battlecard</p>
            <h2>Scan the differences</h2>
          </div>
          {METRIC_ROWS.map((row) => {
            const values = selectedCountries.map((country) => country.metrics[row.key].value).filter((value): value is number => value != null);
            const max = values.length ? Math.max(...values) : null;
            const winner = row.higherIsBetter && max != null ? selectedCountries.find((country) => country.metrics[row.key].value === max)?.slug : null;
            return (
              <article className="compare-metric-row" key={row.key}>
                <h3>{row.label}</h3>
                <div>
                  {selectedCountries.map((country) => {
                    const metric = country.metrics[row.key];
                    const width = metric.value != null && max ? clampPercent((metric.value / max) * 100) : "0%";
                    return (
                      <section key={country.slug} className={winner === country.slug ? "metric-winner" : ""}>
                        <div className="metric-row-label"><span>{country.name}</span><strong>{metric.label}</strong></div>
                        <div className="compare-track"><i style={{ width }} /></div>
                        {metric.note && <small>{metric.note}</small>}
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        <div className="compare-engagement-grid">
          <article className="compare-rank-card">
            <div className="compare-card-heading">
              <p className="eyebrow"><span /> Sort the matchup</p>
              <h2>Rank by metric</h2>
            </div>
            <div className="compare-sort-links">
              {SORTABLE_METRICS.map((metric) => <Link className={metric.key === sortKey ? "active" : ""} key={metric.key} href={sortableHref(selectedSlugs, metric.key)}>{metric.label}</Link>)}
            </div>
            <ol className="compare-ranking-list">
              {rankedCountries.map((country) => (
                <li key={country.slug}>
                  <img src={country.flagUrl} alt="" />
                  <span>{country.name}</span>
                  <strong>{country.metrics[sortKey].label}</strong>
                </li>
              ))}
            </ol>
          </article>

          <article className="compare-quiz-card">
            <div className="compare-card-heading">
              <p className="eyebrow"><span /> Guess bigger</p>
              <h2>Which has more people?</h2>
            </div>
            <div className="guess-options">
              {selectedCountries.slice(0, 2).map((country) => (
                <div key={country.slug}>
                  <img src={country.flagUrl} alt="" />
                  <strong>{country.name}</strong>
                </div>
              ))}
            </div>
            <details>
              <summary>Reveal answer</summary>
              <p>{guessAnswer?.name || "No answer"} leads this comparison with {guessAnswer?.metrics.population.label || "no published value"} people.</p>
            </details>
          </article>
        </div>

        <div className="compare-detail-grid">
          {selectedCountries.map((country) => (
            <article key={country.slug}>
              <span>{country.status}</span>
              <h3>{country.name} essentials</h3>
              <dl>
                <div><dt>Subregion</dt><dd>{country.subregion}</dd></div>
                <div><dt>Time zones</dt><dd>{country.dailyLife.timeZones}</dd></div>
                <div><dt>Driving side</dt><dd>{country.dailyLife.drivingSide}</dd></div>
                <div><dt>Plug types</dt><dd>{country.dailyLife.plugTypes}</dd></div>
                <div><dt>Emergency</dt><dd>{country.dailyLife.emergencyNumbers}</dd></div>
              </dl>
              <ul>{country.facts.slice(0, 3).map((fact) => <li key={fact}>{fact}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer country-footer"><Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link><p>Compare, then keep exploring.</p><span>© 2026 Color Atlas World</span></footer>
    </main>
  );
}
