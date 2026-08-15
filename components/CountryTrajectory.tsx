import type { CountryDemographics } from "@/lib/countries";

type TrendPoint = { year: number; value: number };
type TrendChange = {
  fromYear: number;
  toYear: number;
  absolute: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
  unit: string;
};
type TrendSeries = {
  key: string;
  label: string;
  code: string;
  unit: string;
  kind: "money" | "count" | "percent" | "years" | "rate";
  method: "cagr" | "average" | "linear";
  group: string;
  latest: TrendPoint | null;
  history: TrendPoint[];
  change?: TrendChange | null;
  forecast: TrendPoint[];
  scenarios?: {
    low: TrendPoint | null;
    base: TrendPoint | null;
    high: TrendPoint | null;
  };
  confidence: "Low" | "Medium" | "High";
};

export type TrendData = {
  countryCode: string;
  countryName: string;
  retrievedAt: string;
  source: { name: string; url: string };
  narrative: {
    thesis: string;
    insights: string[];
    projectionNote: string;
  };
  series: TrendSeries[];
};

const heroKeys = ["gdpGrowth", "population", "lifeExpectancy", "gdpPerCapita"];
const chartKeys = ["gdpGrowth", "populationGrowth", "population", "lifeExpectancy", "fertilityRate", "urbanization", "inflation", "unemployment", "gdpPerCapita", "co2PerCapita", "internetUse", "gdp"];

function getSeries(data: TrendData, key: string) {
  return data.series.find((series) => series.key === key) || null;
}

function formatTrendValue(series: TrendSeries, value?: number | null, compact = true) {
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
  if (series.kind === "years") return `${value.toFixed(1)} yrs`;
  return `${value.toFixed(value >= 10 ? 1 : 2)}`;
}

function methodLabel(method: string) {
  if (method === "cagr") return "compound trend";
  if (method === "average") return "recent average";
  return "linear trend";
}

function changeText(series: TrendSeries) {
  if (!series.change) return "Historical change not available";
  const change = series.change;
  if (change.percent == null || series.kind === "percent") {
    return `${change.direction === "up" ? "+" : ""}${change.absolute.toFixed(1)} ${series.unit} since ${change.fromYear}`;
  }
  return `${change.direction === "up" ? "+" : ""}${change.percent.toFixed(1)}% since ${change.fromYear}`;
}

function buildPolyline(points: TrendPoint[], minYear: number, maxYear: number, minValue: number, maxValue: number) {
  const width = 320;
  const height = 118;
  const yearRange = Math.max(1, maxYear - minYear);
  const valueRange = Math.max(1, maxValue - minValue);
  return points.map((point) => {
    const x = ((point.year - minYear) / yearRange) * width;
    const y = height - ((point.value - minValue) / valueRange) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function pointPosition(point: TrendPoint, minYear: number, maxYear: number, minValue: number, maxValue: number) {
  const width = 320;
  const height = 118;
  return {
    x: ((point.year - minYear) / Math.max(1, maxYear - minYear)) * width,
    y: height - ((point.value - minValue) / Math.max(1, maxValue - minValue)) * height,
  };
}

function TrendSparkline({ series }: { series: TrendSeries }) {
  const history = series.history;
  const latest = history.at(-1);
  const forecast = latest ? [latest, ...series.forecast] : series.forecast;
  const all = [...history, ...series.forecast];
  if (all.length < 2) return <div className="trajectory-empty">Data pending.</div>;

  const minYear = Math.min(...all.map((point) => point.year));
  const maxYear = Math.max(...all.map((point) => point.year));
  const rawMin = Math.min(...all.map((point) => point.value));
  const rawMax = Math.max(...all.map((point) => point.value));
  const padding = Math.max((rawMax - rawMin) * 0.12, rawMax === rawMin ? Math.abs(rawMax) * 0.08 : 0.5);
  const minValue = rawMin - padding;
  const maxValue = rawMax + padding;
  const latestPosition = latest ? pointPosition(latest, minYear, maxYear, minValue, maxValue) : null;
  const baseScenario = series.scenarios?.base;
  const scenarioPosition = baseScenario ? pointPosition(baseScenario, minYear, maxYear, minValue, maxValue) : null;

  return (
    <svg className="trajectory-chart" viewBox="0 0 320 150" role="img" aria-label={`${series.label} historical trend and 2035 projection`}>
      <defs>
        <linearGradient id={`trajectory-gradient-${series.key}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ed514c" />
          <stop offset="100%" stopColor="#d89f36" />
        </linearGradient>
      </defs>
      <line x1="0" x2="320" y1="118" y2="118" />
      <line x1="0" x2="320" y1="59" y2="59" />
      <polyline className="history-line" points={buildPolyline(history, minYear, maxYear, minValue, maxValue)} style={{ stroke: `url(#trajectory-gradient-${series.key})` }} />
      {forecast.length > 1 && <polyline className="forecast-line" points={buildPolyline(forecast, minYear, maxYear, minValue, maxValue)} />}
      {latestPosition && <circle className="latest-dot" cx={latestPosition.x} cy={latestPosition.y} r="4" />}
      {scenarioPosition && <circle className="future-dot" cx={scenarioPosition.x} cy={scenarioPosition.y} r="4" />}
      <text x="0" y="144">{minYear}</text>
      <text x="320" y="144" textAnchor="end">2035</text>
    </svg>
  );
}

function ScenarioBand({ series }: { series: TrendSeries }) {
  const low = series.scenarios?.low;
  const base = series.scenarios?.base;
  const high = series.scenarios?.high;
  if (!low || !base || !high) return null;
  const values = [low.value, base.value, high.value];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const baseLeft = ((base.value - min) / spread) * 100;

  return (
    <div className="scenario-band" aria-label={`${series.label} low base high scenarios`}>
      <div className="scenario-track"><i style={{ left: `${Math.min(98, Math.max(2, baseLeft))}%` }} /></div>
      <div className="scenario-values">
        <span><small>Low</small>{formatTrendValue(series, low.value)}</span>
        <span><small>Base</small>{formatTrendValue(series, base.value)}</span>
        <span><small>High</small>{formatTrendValue(series, high.value)}</span>
      </div>
    </div>
  );
}

function latestYear(data: TrendData) {
  const years = data.series.map((series) => series.latest?.year).filter((year): year is number => typeof year === "number");
  return years.length ? Math.max(...years) : null;
}

export default function CountryTrajectory({ data, demographics, flagSrc }: { data: TrendData; demographics?: CountryDemographics | null; flagSrc?: string }) {
  const heroes = heroKeys.map((key) => getSeries(data, key)).filter(Boolean) as TrendSeries[];
  const chartSeries = chartKeys.map((key) => getSeries(data, key)).filter(Boolean) as TrendSeries[];
  const population = getSeries(data, "population");
  const fertility = getSeries(data, "fertilityRate");
  const life = getSeries(data, "lifeExpectancy");
  const internet = getSeries(data, "internetUse");
  const sourceYear = latestYear(data);
  const hasProjectionSeries = Boolean(population || life || fertility || internet);

  return (
    <section className="trajectory-section" id="special-report-content">
      <div className="trajectory-report-shell">
        <div className="trajectory-heading">
          <div className="trajectory-heading-copy">
            <p className="eyebrow"><span /> Verified data & AI projection</p>
            <h2>{data.countryName}<br /><em>Special Report.</em></h2>
            <p>{data.narrative.thesis}</p>
          </div>
          {flagSrc && (
            <figure className="trajectory-flag-card">
              <img src={flagSrc} alt={`Flag of ${data.countryName}`} />
              <figcaption><span>{data.countryCode}</span><strong>{data.countryName}</strong><small>National flag</small></figcaption>
            </figure>
          )}
        </div>

        <div className="trajectory-brief">
          <article>
            <span>Data window</span>
            <strong>{sourceYear ? `2000-${sourceYear}` : "Data pending"}</strong>
            <small>{data.source.name}</small>
          </article>
          <article>
            <span>Projection horizon</span>
            <strong>{data.series.length ? "2035" : "Pending"}</strong>
            <small>{data.series.length ? "Low / base / high scenarios" : "Requires long-run series"}</small>
          </article>
          <article>
            <span>Report scope</span>
            <strong>{data.series.length}</strong>
            <small>Economy, people, health, work, tech, environment</small>
          </article>
        </div>

        {demographics && (
          <section className="trajectory-un-baseline" aria-label={`${data.countryName} United Nations 2026 demographic baseline`}>
            <div className="trajectory-un-heading">
              <div><span>Current demographic baseline</span><strong>UN DESA · 2026</strong></div>
              <p>Medium projection from World Population Prospects, 2024 Revision</p>
            </div>
            <div className="trajectory-un-grid">
              <article><small>Population</small><strong>{demographics.population ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(demographics.population.value) : "Not available"}</strong><span>mid-year population</span></article>
              <article><small>Life expectancy</small><strong>{demographics.lifeExpectancy ? `${demographics.lifeExpectancy.value.toFixed(1)} yrs` : "Not available"}</strong><span>both sexes</span></article>
              <article><small>Median age</small><strong>{demographics.medianAge != null ? `${demographics.medianAge.toFixed(1)} yrs` : "Not available"}</strong><span>mid-year population</span></article>
              <article><small>Population growth</small><strong>{demographics.populationGrowth != null ? `${demographics.populationGrowth.toFixed(2)}%` : "Not available"}</strong><span>annual rate</span></article>
              <article><small>Fertility rate</small><strong>{demographics.fertilityRate != null ? demographics.fertilityRate.toFixed(2) : "Not available"}</strong><span>births per woman</span></article>
            </div>
          </section>
        )}

        <div className="trajectory-feature-grid">
          {heroes.length ? heroes.map((series) => {
            const projection = series.scenarios?.base || series.forecast.at(-1);
            return (
              <article key={series.key}>
                <small>{series.label}</small>
                <strong>{formatTrendValue(series, series.latest?.value)}</strong>
                <span>{series.latest?.year ?? "Latest"} verified · 2035 base: {formatTrendValue(series, projection?.value)}</span>
                <b>{changeText(series)}</b>
              </article>
            );
          }) : (
            <article className="trajectory-availability">
              <small>Comparable series</small>
              <strong>Limited</strong>
              <span>World Bank long-run indicator coverage is not available for this profile.</span>
              <b>The report keeps this visible instead of substituting unsupported estimates.</b>
            </article>
          )}
        </div>

        <div className="trajectory-dashboard">
          <article className="trajectory-insight-panel">
            <div>
              <span className="card-number">Executive read</span>
              <h3>What the numbers suggest</h3>
            </div>
            <ul>
              {data.narrative.insights.map((insight) => <li key={insight}>{insight}</li>)}
            </ul>
          </article>

          <article className="trajectory-projection-panel">
            <span className="card-number">2035 scenario</span>
            <h3>Human development pressure</h3>
            <div className="projection-rings">
              {population && <div><strong>{formatTrendValue(population, population.scenarios?.base?.value)}</strong><span>Population base</span></div>}
              {life && <div><strong>{formatTrendValue(life, life.scenarios?.base?.value)}</strong><span>Life expectancy</span></div>}
              {fertility && <div><strong>{formatTrendValue(fertility, fertility.scenarios?.base?.value)}</strong><span>Fertility rate</span></div>}
              {internet && <div><strong>{formatTrendValue(internet, internet.scenarios?.base?.value)}</strong><span>Internet access</span></div>}
              {!hasProjectionSeries && <div className="projection-empty"><strong>Pending</strong><span>Comparable projection data is unavailable.</span></div>}
            </div>
            <p>{data.narrative.projectionNote}</p>
          </article>
        </div>

        <div className="trajectory-grid">
          {chartSeries.length ? chartSeries.map((series) => {
            const first = series.history[0];
            const projection = series.scenarios?.base || series.forecast.at(-1);
            return (
              <article className="trajectory-card" key={series.key}>
                <div className="trajectory-card-head">
                  <div>
                    <small>{series.group} · {series.code}</small>
                    <h3>{series.label}</h3>
                  </div>
                  <span className={`confidence confidence-${series.confidence.toLowerCase()}`}>{series.confidence}</span>
                </div>
                <TrendSparkline series={series} />
                <div className="trajectory-values">
                  <div><span>{first?.year ?? "Past"}</span><strong>{formatTrendValue(series, first?.value)}</strong></div>
                  <div><span>{series.latest?.year ?? "Latest"}</span><strong>{formatTrendValue(series, series.latest?.value)}</strong></div>
                  <div><span>2035 base</span><strong>{formatTrendValue(series, projection?.value)}</strong></div>
                </div>
                <ScenarioBand series={series} />
                <p>{methodLabel(series.method)} · {series.unit}</p>
              </article>
            );
          }) : (
            <article className="trajectory-card trajectory-wide-note">
              <div className="trajectory-card-head">
                <div>
                  <small>availability · World Bank API</small>
                  <h3>Long-run series pending</h3>
                </div>
              </div>
              <p>This profile does not currently have enough comparable World Bank indicator history for charting. Basic Info remains available above, and the report tab will fill automatically when a country-level series is added to the dataset.</p>
            </article>
          )}
        </div>

        <div className="trajectory-note">
          <strong>Educational projection, not an official forecast.</strong>
          <span>Historical values are World Bank observations retrieved {data.retrievedAt}. The 2026 demographic baseline is the official UN DESA medium projection from World Population Prospects 2024. The atlas's 2035 scenarios use simple trend math.</span>
          <div><a href="https://population.un.org/wpp/downloads" target="_blank" rel="noreferrer">UN source</a><a href={data.source.url} target="_blank" rel="noreferrer">World Bank source</a></div>
        </div>
      </div>
    </section>
  );
}
