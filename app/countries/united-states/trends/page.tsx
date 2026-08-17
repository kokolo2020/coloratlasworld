import type { Metadata } from "next";
import Link from "next/link";
import CountryTrajectory, { TrendData } from "@/components/CountryTrajectory";
import specialReports from "@/data/special-reports.json";

const usaReport = (specialReports as Record<string, TrendData>).USA;

export const metadata: Metadata = {
  title: "USA Population Growth, GDP History & 2035 Forecast",
  description: "Explore United States population growth, GDP history, birthrate, life expectancy, and educational 2035 forecast charts from World Bank data.",
  alternates: { canonical: "/countries/united-states/trends" },
  openGraph: {
    title: "USA Population Growth, GDP History & 2035 Forecast",
    description: "A visual United States trend dashboard for population, GDP, birthrate, life expectancy, and educational 2035 scenarios.",
    url: "/countries/united-states/trends",
    type: "article",
  },
};

type TrendSeries = TrendData["series"][number];

const focusKeys = ["population", "gdp", "gdpPerCapita", "fertilityRate", "lifeExpectancy", "populationGrowth"];

function getSeries(key: string) {
  return usaReport.series.find((series) => series.key === key) || null;
}

function formatValue(series: TrendSeries, value?: number | null, compact = true) {
  if (value == null || !Number.isFinite(value)) return "Not available";
  if (series.kind === "money") {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 0,
    }).format(value);
  }
  if (series.kind === "count") {
    return new Intl.NumberFormat("en", { notation: compact ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
  }
  if (series.kind === "percent") return `${value.toFixed(Math.abs(value) >= 10 ? 1 : 2)}%`;
  if (series.kind === "years") return `${value.toFixed(1)} years`;
  return value.toFixed(value >= 10 ? 1 : 2);
}

function changeSentence(series: TrendSeries) {
  if (!series.change) return "Long-run change is pending.";
  const direction = series.change.direction === "down" ? "lower" : series.change.direction === "up" ? "higher" : "flat";
  if (series.change.percent == null || series.kind === "percent") {
    return `${series.label} is ${formatValue(series, series.latest?.value)} in ${series.latest?.year}, ${direction} than ${series.change.fromYear} by ${Math.abs(series.change.absolute).toFixed(1)} ${series.unit}.`;
  }
  return `${series.label} is ${formatValue(series, series.latest?.value)} in ${series.latest?.year}, ${direction} than ${series.change.fromYear} by ${Math.abs(series.change.percent).toFixed(1)}%.`;
}

function Sparkline({ series }: { series: TrendSeries }) {
  const points = [...series.history, ...series.forecast];
  if (points.length < 2) return null;
  const minYear = Math.min(...points.map((point) => point.year));
  const maxYear = Math.max(...points.map((point) => point.year));
  const minValue = Math.min(...points.map((point) => point.value));
  const maxValue = Math.max(...points.map((point) => point.value));
  const yearRange = Math.max(1, maxYear - minYear);
  const valueRange = Math.max(1, maxValue - minValue);
  const mapPoint = (point: { year: number; value: number }) => {
    const x = ((point.year - minYear) / yearRange) * 320;
    const y = 112 - ((point.value - minValue) / valueRange) * 112;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  };
  const historyPath = series.history.map(mapPoint).join(" ");
  const forecastPath = [series.history.at(-1), ...series.forecast].filter(Boolean).map((point) => mapPoint(point as { year: number; value: number })).join(" ");

  return (
    <svg className="usa-trend-line" viewBox="0 0 320 138" role="img" aria-label={`${series.label} chart from ${minYear} to 2035`}>
      <line x1="0" x2="320" y1="112" y2="112" />
      <line x1="0" x2="320" y1="56" y2="56" />
      <polyline className="history-line" points={historyPath} />
      <polyline className="forecast-line" points={forecastPath} />
      <text x="0" y="135">{minYear}</text>
      <text x="320" y="135" textAnchor="end">2035</text>
    </svg>
  );
}

export default function UnitedStatesTrendsPage() {
  const population = getSeries("population");
  const gdp = getSeries("gdp");
  const fertility = getSeries("fertilityRate");
  const life = getSeries("lifeExpectancy");
  const focusSeries = focusKeys.map(getSeries).filter(Boolean) as TrendSeries[];

  return (
    <main className="usa-trends-page">
      <nav className="site-nav country-nav" aria-label="Primary navigation">
        <Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link>
        <div className="nav-links">
          <Link href="/countries/united-states">USA profile</Link>
          <Link href="/compare/united-states-vs-china-vs-india">Compare</Link>
        </div>
      </nav>

      <header className="usa-trends-hero">
        <div>
          <p className="breadcrumb"><Link href="/">World</Link><span>/</span><Link href="/countries/united-states">United States</Link><span>/</span><strong>Trends</strong></p>
          <p className="eyebrow"><span /> USA data story</p>
          <h1>USA population growth, GDP history, birthrate & 2035 forecast</h1>
          <p>Educational trend dashboard built from World Bank observations. The goal is not to predict the future perfectly, but to make the direction of change visible.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#usa-trend-dashboard">Explore charts <span>↓</span></a>
            <a className="secondary-button" href="#method">Method & sources</a>
          </div>
        </div>
        <aside className="usa-trends-summary" aria-label="United States trend summary">
          <img src="/flags/us.svg" alt="Flag of the United States" />
          <dl>
            <div><dt>Population 2035 base</dt><dd>{population ? formatValue(population, population.scenarios?.base?.value) : "Pending"}</dd></div>
            <div><dt>GDP 2035 base</dt><dd>{gdp ? formatValue(gdp, gdp.scenarios?.base?.value) : "Pending"}</dd></div>
            <div><dt>Birthrate pressure</dt><dd>{fertility ? formatValue(fertility, fertility.scenarios?.base?.value, false) : "Pending"}</dd></div>
            <div><dt>Life expectancy</dt><dd>{life ? formatValue(life, life.scenarios?.base?.value, false) : "Pending"}</dd></div>
          </dl>
        </aside>
      </header>

      <section className="usa-query-strip" aria-label="Common USA trend questions">
        <span>Answers this page targets</span>
        <strong>USA population growth chart</strong>
        <strong>United States GDP history</strong>
        <strong>USA birthrate forecast</strong>
        <strong>USA life expectancy trend</strong>
      </section>

      <section className="usa-trend-dashboard" id="usa-trend-dashboard">
        <div className="usa-section-heading">
          <p className="eyebrow"><span /> Search-friendly charts</p>
          <h2>Six signals people actually search for.</h2>
          <p>Each card shows the latest verified observation and a transparent 2035 base scenario. Forecasts are simple trend math for education, not official government estimates.</p>
        </div>
        <div className="usa-trend-card-grid">
          {focusSeries.map((series) => {
            const projection = series.scenarios?.base || series.forecast.at(-1);
            return (
              <article className="usa-trend-card" key={series.key}>
                <div>
                  <small>{series.group} · {series.code}</small>
                  <h3>{series.label}</h3>
                </div>
                <Sparkline series={series} />
                <div className="usa-trend-values">
                  <span><small>{series.latest?.year ?? "Latest"}</small><strong>{formatValue(series, series.latest?.value)}</strong></span>
                  <span><small>2035 base</small><strong>{formatValue(series, projection?.value)}</strong></span>
                </div>
                <p>{changeSentence(series)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="usa-insight-band">
        <article>
          <span className="card-number">01</span>
          <h2>Why this can bring search traffic</h2>
          <p>People rarely search for a generic country profile. They search for a specific question: population growth, GDP history, birthrate, life expectancy, or a comparison. This page gives those searches one focused destination.</p>
        </article>
        <article>
          <span className="card-number">02</span>
          <h2>What the USA data suggests</h2>
          <ul>
            {usaReport.narrative.insights.map((insight) => <li key={insight}>{insight}</li>)}
          </ul>
        </article>
      </section>

      <CountryTrajectory data={usaReport} flagSrc="/flags/us.svg" />

      <section className="sources" id="method">
        <div>
          <p className="eyebrow"><span /> Method & sources</p>
          <h2>Educational, traceable, and honest about uncertainty.</h2>
          <p>The historical values come from World Bank observations retrieved {usaReport.retrievedAt}. The 2035 numbers use simple trend methods stored with each series: compound trend, recent average, or linear trend.</p>
        </div>
        <ul>
          <li><a href={usaReport.source.url} target="_blank" rel="noreferrer">World Bank Open Data API - United States indicators</a></li>
          <li><a href="/countries/united-states">United States full country profile</a></li>
          <li><a href="/compare/united-states-vs-china-vs-india">Compare United States, China, and India</a></li>
        </ul>
      </section>
    </main>
  );
}
