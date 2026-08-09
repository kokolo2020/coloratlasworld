import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CountrySearch from "@/components/CountrySearch";
import { COUNTRIES, displayRegion, flagUrl, formatArea, formatMoney, formatNumber, getCountryBySlug, getMetrics } from "@/lib/countries";

export function generateStaticParams() { return COUNTRIES.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const country = getCountryBySlug((await params).slug);
  if (!country) return {};
  return {
    title: `${country.name} Country Profile`,
    description: `Explore ${country.name}: flag, capital, population, economy, geography, people, languages, and defining facts.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const country = getCountryBySlug((await params).slug);
  if (!country) notFound();
  const metrics = getMetrics(country.cca3);
  const region = displayRegion(country);
  const currencies = Object.entries(country.currencies);
  const currencyLabel = currencies.length ? currencies.map(([code, item]) => `${item.name} (${code})`).join(", ") : "Not published";
  const languages = Object.values(country.languages);
  const population = formatNumber(metrics.population?.value);
  const life = metrics.lifeExpectancy ? `${metrics.lifeExpectancy.value.toFixed(1)} years` : "Not published";
  const [lat, lng] = country.latlng;
  const deltaLat = country.area && country.area < 1000 ? 1.5 : 5;
  const deltaLng = country.area && country.area < 1000 ? 2.2 : 8;
  const bbox = `${lng - deltaLng},${lat - deltaLat},${lng + deltaLng},${lat + deltaLat}`;
  const next = COUNTRIES[country.profileNumber % COUNTRIES.length];

  const quickStats = [
    { label: "Population", value: population, note: metrics.population ? `World Bank · ${metrics.population.year}` : "No recent World Bank value" },
    { label: "Capital", value: country.capital || "Not published", note: country.officialName },
    { label: "Currency", value: currencies[0]?.[0] || "Not published", note: currencyLabel },
    { label: "Life expectancy", value: life, note: metrics.lifeExpectancy ? `World Bank · ${metrics.lifeExpectancy.year}` : "No recent World Bank value" },
  ];

  return (
    <main className="country-page">
      <nav className="site-nav country-nav" aria-label="Primary navigation">
        <Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link>
        <CountrySearch />
        <Link className="back-link" href="/#countries">All countries</Link>
      </nav>

      <header className="country-hero">
        <div className="country-hero-copy">
          <p className="breadcrumb"><Link href="/">World</Link><span>/</span><span>{region}</span><span>/</span><strong>{country.name}</strong></p>
          <div className="country-kicker"><span>{country.cca2}</span>{country.officialName}</div>
          <h1>{country.name}</h1>
          <p>{country.name} is in {country.subregion}. This profile brings its flag, geography, people, languages, and latest available economic indicators into one clear visual story.</p>
          <div className="hero-actions"><a className="primary-button" href="#overview">Explore the profile <span>↓</span></a><a className="secondary-button" href="#sources">View sources</a></div>
        </div>
        <div className="country-flag-stage">
          <div className="flag-label"><span>National flag</span><span>{country.cca3} · {country.profileNumber.toString().padStart(3, "0")} / 199</span></div>
          <img src={flagUrl(country.cca2)} alt={`Flag of ${country.name}`} />
          <p>{country.flag} The national flag of {country.name}. Country code: {country.cca2} / {country.cca3}.</p>
        </div>
      </header>

      <section className="quick-stat-grid" id="overview">
        {quickStats.map((stat, index) => <div className="quick-stat" key={stat.label}><span>0{index + 1}</span><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.note}</p></div>)}
      </section>

      <section className="profile-grid">
        <article className="profile-story">
          <p className="eyebrow"><span /> At a glance</p>
          <h2>Meet<br /><em>{country.name}.</em></h2>
          <p className="large-copy">{country.name} is {country.landlocked ? "a landlocked country" : "a country"} in {country.subregion}. Its official name is {country.officialName}.</p>
          <div className="fact-columns">
            <div><small>Region</small><strong>{country.subregion}</strong></div>
            <div><small>Demonym</small><strong>{country.demonym || "Not published"}</strong></div>
            <div><small>Area</small><strong>{formatArea(country.area)}</strong></div>
            <div><small>Calling code</small><strong>{country.callingCode || "Not published"}</strong></div>
          </div>
        </article>
        <aside className="map-card generic-map">
          <div className="map-card-head"><span>{country.name}</span><span>{country.capital || "Capital not listed"} ●</span></div>
          <iframe title={`Map of ${country.name}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`} loading="lazy" />
          <p>Map data © OpenStreetMap contributors. The marker shows the country’s central coordinates.</p>
        </aside>
      </section>

      <section className="economy-band">
        <div className="economy-intro"><p className="eyebrow light"><span /> Economy</p><h2>The latest available indicators.</h2><p>Economic values use the latest non-empty World Bank year from 2019–2026, shown below each figure.</p></div>
        <div className="economy-stat"><small>GDP</small><strong>{formatMoney(metrics.gdp?.value)}</strong><span>{metrics.gdp ? `${metrics.gdp.year} · current USD` : "No recent value"}</span></div>
        <div className="economy-stat"><small>GDP per person</small><strong>{formatMoney(metrics.gdpPerCapita?.value)}</strong><span>{metrics.gdpPerCapita ? `${metrics.gdpPerCapita.year} · current USD` : "No recent value"}</span></div>
        <div className="economy-stat"><small>GDP growth</small><strong>{metrics.gdpGrowth ? `${metrics.gdpGrowth.value.toFixed(1)}%` : "Not published"}</strong><span>{metrics.gdpGrowth ? `${metrics.gdpGrowth.year} annual growth` : "No recent value"}</span></div>
      </section>

      <section className="detail-section">
        <div className="detail-title"><p className="eyebrow"><span /> People & place</p><h2>Country<br /><em>essentials.</em></h2></div>
        <div className="detail-cards">
          <article><span>Languages</span><h3>{languages.length ? languages.join(", ") : "Not published"}</h3><p>Languages listed in the open country catalog for {country.name}.</p></article>
          <article><span>Neighbors</span><h3>{country.borders.length ? `${country.borders.length} land ${country.borders.length === 1 ? "border" : "borders"}` : "No listed land borders"}</h3><p>{country.landlocked ? "The country has no coastline." : "The country is not classified as landlocked."}</p></article>
          <article><span>Currency</span><h3>{currencyLabel}</h3><p>The primary currency code and name used in the country catalog.</p></article>
        </div>
      </section>

      <section className="timeline-section">
        <div><p className="eyebrow"><span /> Identity card</p><h2>Four essentials</h2></div>
        <div className="timeline-list">
          <div><strong>{country.cca2}</strong><span>Two-letter country code</span></div>
          <div><strong>{country.cca3}</strong><span>Three-letter country code</span></div>
          <div><strong>{country.capital || "—"}</strong><span>Capital city</span></div>
          <div><strong>{region}</strong><span>World region</span></div>
        </div>
      </section>

      <section className="sources" id="sources">
        <div><p className="eyebrow"><span /> Sources & notes</p><h2>Numbers you can trace.</h2><p>Statistics show their reference year because country data changes. Unavailable values are clearly marked instead of estimated.</p></div>
        <ul>
          <li><a href={`https://data.worldbank.org/country/${country.cca2.toLowerCase()}`} target="_blank" rel="noreferrer">World Bank — population and economy ↗</a></li>
          <li><a href="https://github.com/mledoze/countries" target="_blank" rel="noreferrer">Open country catalog — names, codes and geography ↗</a></li>
          <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap — map data ↗</a></li>
        </ul>
      </section>

      <section className="next-country"><span>Color Atlas World · Profile {country.profileNumber.toString().padStart(3, "0")}</span><h2>Next: {next.name}</h2><p>Continue through the atlas or search for any of 199 countries.</p><div className="next-actions"><Link className="primary-button" href={`/countries/${next.slug}`}>Open {next.name} →</Link></div><CountrySearch variant="hero" /></section>
      <footer className="site-footer country-footer"><Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link><p>Explore the world, one country at a time.</p><span>© 2026 Color Atlas World</span></footer>
    </main>
  );
}
