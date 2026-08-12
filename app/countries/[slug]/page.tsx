import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CountryProfileTabs from "@/components/CountryProfileTabs";
import CountrySearch from "@/components/CountrySearch";
import CountryTrajectory, { TrendData } from "@/components/CountryTrajectory";
import specialReports from "@/data/special-reports.json";
import { COUNTRIES, COUNTRY_AVERAGE_POPULATION, displayRegion, flagUrl, formatArea, formatMoney, formatNumber, getCountryByCca3, getCountryBySlug, getEnrichment, getGdpRank, getMetrics } from "@/lib/countries";

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
  const profileCount = COUNTRIES.length;
  const profileStatus = country.status || "Sovereign country profile";
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
  const enrichment = getEnrichment(country.cca3);
  const neighbors = enrichment.neighbors.map(getCountryByCca3).filter(Boolean);
  const gdpRank = getGdpRank(country.cca3);
  const populationRatio = metrics.population?.value ? metrics.population.value / COUNTRY_AVERAGE_POPULATION : null;
  const populationBar = populationRatio ? Math.min(100, Math.max(4, populationRatio * 34)) : 0;
  const connectionSummary = country.borders.length
    ? `${country.borders.length} listed ${country.borders.length === 1 ? "connection" : "connections"}`
    : country.landlocked
      ? "Landlocked profile"
      : "Island/coastal profile";
  const connectionNote = country.borders.length
    ? country.landlocked
      ? "This profile has land borders and no coastline."
      : "This profile has coastal access and listed land connections."
    : country.landlocked
      ? "This profile has no coastline or listed land-border neighbors."
      : "No land borders; sea and air links shape outside connections.";
  const medianAgeLabel = enrichment.demographics.medianAge != null ? `${enrichment.demographics.medianAge} years` : "Comparable value pending";
  const timeZoneLabel = enrichment.dailyLife.timeZones || "Profile-specific value pending";
  const plugTypeLabel = enrichment.dailyLife.plugTypes || "Profile-specific value pending";
  const tippingLabel = enrichment.dailyLife.tipping || "Local customs vary by setting";
  const emergencyLabel = enrichment.dailyLife.emergencyNumbers || "Emergency numbers vary; check official guidance";
  const sourceUrl = country.cca3 === "HKG"
    ? "https://data.worldbank.org/country/hong-kong-sar-china"
    : country.cca2.startsWith("GB-")
      ? "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates"
      : `https://data.worldbank.org/country/${country.cca2.toLowerCase()}`;
  const specialReport = (specialReports as Record<string, TrendData>)[country.cca3];
  const coordinateLabel = `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}° ${lng >= 0 ? "E" : "W"}`;
  const borderLabel = neighbors.length
    ? `${neighbors.slice(0, 4).map((neighbor) => neighbor?.name).join(", ")}${neighbors.length > 4 ? ` +${neighbors.length - 4} more` : ""}`
    : connectionNote;

  const quickStats = [
    { label: "Population", value: population, note: metrics.population ? `World Bank · ${metrics.population.year}` : "No recent World Bank value" },
    { label: "Capital", value: country.capital || "Not published", note: country.officialName },
    { label: "Currency", value: currencies[0]?.[0] || "Not published", note: currencyLabel },
    { label: "Life expectancy", value: life, note: metrics.lifeExpectancy ? `World Bank · ${metrics.lifeExpectancy.year}` : "No recent World Bank value" },
  ];
  const basicDataGroups = [
    {
      title: "Identity",
      items: [
        ["Official name", country.officialName],
        ["Status", profileStatus],
        ["Demonym", country.demonym || "Not published"],
        ["Codes", `${country.cca2} / ${country.cca3}`],
      ],
    },
    {
      title: "People",
      items: [
        ["Population", metrics.population ? `${population} · ${metrics.population.year}` : population],
        ["Median age", medianAgeLabel],
        ["Languages", languages.length ? languages.join(", ") : "Not published"],
        ["Largest cities", enrichment.demographics.largestCities.join(", ") || country.capital || "Not published"],
      ],
    },
    {
      title: "Place",
      items: [
        ["Region", region],
        ["Subregion", country.subregion],
        ["Area", formatArea(country.area)],
        ["Coordinates", coordinateLabel],
      ],
    },
    {
      title: "Practical",
      items: [
        ["Currency", currencyLabel],
        ["Calling code", country.callingCode || "Not published"],
        ["Time zones", timeZoneLabel],
        ["Emergency", emergencyLabel],
      ],
    },
    {
      title: "Government",
      items: [
        ["Type", enrichment.government.type || "Not published"],
        ["Head of state", enrichment.government.headOfState || "Not published"],
        ["Head of government", enrichment.government.headOfGovernment || "Not published"],
        ["Constitution", enrichment.government.constitutionDate || "Comparable date pending"],
      ],
    },
    {
      title: "Geography",
      items: [
        ["Connections", borderLabel],
        ["Climate", enrichment.environment.climate],
        ["Highest point", enrichment.environment.highestPoint || "Profile-specific value pending"],
        ["Driving side", enrichment.dailyLife.drivingSide],
      ],
    },
  ];

  return (
    <main className="country-page">
      <nav className="site-nav country-nav" aria-label="Primary navigation">
        <Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link>
        <CountrySearch />
        <Link className="back-link" href="/#countries">All profiles</Link>
      </nav>

      <CountryProfileTabs report={specialReport ? <CountryTrajectory data={specialReport} flagSrc={flagUrl(country.cca2)} /> : null}>
      <header className="country-hero">
        <div className="country-hero-copy">
          <p className="breadcrumb"><Link href="/">World</Link><span>/</span><span>{region}</span><span>/</span><strong>{country.name}</strong></p>
          <div className="country-kicker"><span>{country.cca2}</span>{country.officialName}<small>{profileStatus}</small></div>
          <h1>{country.name}</h1>
          <p>{country.name} is in {country.subregion}. This profile brings its status, flag, geography, people, languages, and latest available indicators into one clear visual story.</p>
          <div className="hero-actions"><a className="primary-button" href="#overview">Explore the profile <span>↓</span></a><a className="secondary-button" href="#sources">View sources</a></div>
        </div>
        <div className="country-flag-stage">
          <div className="flag-label"><span>Flag</span><span>{country.cca3} · {country.profileNumber.toString().padStart(3, "0")} / {profileCount}</span></div>
          <img src={flagUrl(country.cca2)} alt={`Flag of ${country.name}`} />
          <p>{country.flag} The flag shown for {country.name}. Profile code: {country.cca2} / {country.cca3}.</p>
        </div>
      </header>

      <section className="quick-stat-grid" id="overview">
        {quickStats.map((stat, index) => <div className="quick-stat" key={stat.label}><span>0{index + 1}</span><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.note}</p></div>)}
      </section>

      <section className="basic-data-board" aria-label={`${country.name} expanded basic facts`}>
        <div className="basic-data-heading">
          <p className="eyebrow"><span /> Basic info</p>
          <h2>Expanded country facts</h2>
          <p>Core identity, people, geography, government, and practical reference data in one scan-friendly board.</p>
        </div>
        <div className="basic-data-grid">
          {basicDataGroups.map((group) => (
            <article key={group.title}>
              <h3>{group.title}</h3>
              <dl>
                {group.items.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-grid">
        <article className="profile-story">
          <p className="eyebrow"><span /> At a glance</p>
          <h2>Meet<br /><em>{country.name}.</em></h2>
          <p className="large-copy">{country.name} is {country.landlocked ? "a landlocked profile" : "a world profile"} in {country.subregion}. Its status is {profileStatus.toLowerCase()}.</p>
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

        <section className="depth-section">
        <div className="depth-heading">
          <p className="eyebrow"><span /> A deeper profile</p>
          <h2>People, systems<br /><em>& everyday life.</em></h2>
          <p>Comparable facts are shown with clear dates and neutral framing. Gaps stay visible instead of being filled with guesses.</p>
        </div>

        <div className="depth-grid">
          <article className="depth-card demographics-card">
            <span className="card-number">01 · Demographics</span>
            <h3>How people live</h3>
            {enrichment.demographics.urbanPercent ? <>
              <div className="split-label"><strong>Urban {enrichment.demographics.urbanPercent.value.toFixed(1)}%</strong><strong>Rural {enrichment.demographics.ruralPercent?.value.toFixed(1)}%</strong></div>
              <div className="split-bar" aria-label="Urban and rural population share"><i style={{width:`${enrichment.demographics.urbanPercent.value}%`}} /><b /></div>
              <small>World Bank · {enrichment.demographics.urbanPercent.year}</small>
            </> : <p className="availability-note">Urban and rural shares are not available in the comparable dataset.</p>}
            <dl className="data-list">
              <div><dt>Median age</dt><dd>{medianAgeLabel}</dd></div>
              <div><dt>Languages</dt><dd>{enrichment.demographics.officialLanguages.length ? enrichment.demographics.officialLanguages.join(", ") : "Not published"}</dd></div>
              <div><dt>Capital / principal city</dt><dd>{enrichment.demographics.largestCities.join(", ") || country.capital || "Not published"}</dd></div>
            </dl>
            <p className="context-note">{enrichment.demographics.compositionNote}</p>
          </article>

          <article className="depth-card comparison-card">
            <span className="card-number">02 · Global comparison</span>
            <h3>Placed in context</h3>
            <div className="comparison-row"><div><span>Population</span><strong>{populationRatio ? `${populationRatio.toFixed(1)}× atlas average` : "Not available"}</strong></div><div className="comparison-track"><i style={{width:`${populationBar}%`}} /></div></div>
            <div className="comparison-row"><div><span>GDP</span><strong>{gdpRank ? `#${gdpRank.rank} of ${gdpRank.total}` : "Not ranked"}</strong></div><div className="comparison-track"><i style={{width:gdpRank ? `${Math.max(4,100-(gdpRank.rank/gdpRank.total)*100)}%` : "0%"}} /></div></div>
            <p className="context-note">Population compares the {profileCount} atlas profiles. GDP ranking includes profiles with a published World Bank value.</p>
          </article>

          <article className="depth-card history-card">
            <span className="card-number">03 · History & government</span>
            <h3>A concise timeline</h3>
            <p>{enrichment.history.summary}</p>
            <dl className="data-list">
              <div><dt>Government</dt><dd>{enrichment.government.type || "Not published"}</dd></div>
              <div><dt>Head of state</dt><dd>{enrichment.government.headOfState || "Not published"}</dd></div>
              <div><dt>Head of government</dt><dd>{enrichment.government.headOfGovernment || "Not published"}</dd></div>
              <div><dt>Current constitution</dt><dd>{enrichment.government.constitutionDate || "Comparable date pending"}</dd></div>
            </dl>
            <small>Wikidata snapshot · retrieved {enrichment.government.retrieved}</small>
          </article>

          <article className="depth-card environment-card">
            <span className="card-number">04 · Environment</span>
            <h3>Land and climate</h3>
            <dl className="data-list">
              <div><dt>Climate</dt><dd>{enrichment.environment.climate}</dd></div>
              <div><dt>Geography</dt><dd>{enrichment.environment.geography}</dd></div>
              <div><dt>Highest point</dt><dd>{enrichment.environment.highestPoint || "Profile-specific value pending"}</dd></div>
              <div><dt>Major rivers</dt><dd>{enrichment.environment.majorRivers || "Profile-specific value pending"}</dd></div>
              <div><dt>Natural resources</dt><dd>{enrichment.environment.naturalResources || "Profile-specific value pending"}</dd></div>
            </dl>
          </article>

          <article className="depth-card daily-card">
            <span className="card-number">05 · Daily life</span>
            <h3>Practical essentials</h3>
            <dl className="data-list compact-list">
              <div><dt>Driving side</dt><dd>{enrichment.dailyLife.drivingSide}</dd></div>
              <div><dt>Calling code</dt><dd>{enrichment.dailyLife.callingCode || "Not published"}</dd></div>
              <div><dt>Time zones</dt><dd>{timeZoneLabel}</dd></div>
              <div><dt>Plug types</dt><dd>{plugTypeLabel}</dd></div>
              <div><dt>Tipping</dt><dd>{tippingLabel}</dd></div>
              <div><dt>Emergency numbers</dt><dd>{emergencyLabel}</dd></div>
            </dl>
          </article>

          <article className="depth-card facts-card">
            <span className="card-number">06 · Defining facts</span>
            <h3>Remember {country.name}</h3>
            <ul className="fact-list">{enrichment.facts.slice(0,8).map((fact) => <li key={fact}>{fact}</li>)}</ul>
          </article>
        </div>
        </section>

        <section className="neighbors-section">
        <div><p className="eyebrow"><span /> Connected places</p><h2>Neighboring profiles</h2><p>Continue exploring across each listed land border or connected geography.</p></div>
        <div className="neighbor-chips">{neighbors.length ? neighbors.map((neighbor) => neighbor && <Link key={neighbor.cca3} href={`/countries/${neighbor.slug}`}><img src={flagUrl(neighbor.cca2)} alt="" />{neighbor.name}<span>→</span></Link>) : <p>{connectionNote}</p>}</div>
        </section>

        <section className="gallery-section">
        <div><p className="eyebrow"><span /> Visual atlas</p><h2>{country.name} in view</h2></div>
        <div className="gallery-grid">
          {enrichment.images[0] && <figure className="gallery-card gallery-photo"><img src={enrichment.images[0].url} alt={`${enrichment.images[0].label} in ${country.name}`} /><figcaption>{enrichment.images[0].label}<small>{enrichment.images[0].source}</small></figcaption></figure>}
          <figure className="gallery-card gallery-flag"><img src={flagUrl(country.cca2)} alt={`Flag of ${country.name}`} /><figcaption>National flag<small>FlagCDN</small></figcaption></figure>
          <figure className="gallery-card gallery-map"><iframe title={`Detail map of ${country.name}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`} loading="lazy" /><figcaption>Country location<small>OpenStreetMap</small></figcaption></figure>
        </div>
        </section>

        <section className="detail-section">
        <div className="detail-title"><p className="eyebrow"><span /> People & place</p><h2>Country<br /><em>essentials.</em></h2></div>
        <div className="detail-cards">
          <article><span>Languages</span><h3>{languages.length ? languages.join(", ") : "Not published"}</h3><p>Languages listed in the open country catalog for {country.name}.</p></article>
          <article><span>Connections</span><h3>{connectionSummary}</h3><p>{connectionNote}</p></article>
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
          <li><a href={sourceUrl} target="_blank" rel="noreferrer">Primary statistics source — population and economy where available ↗</a></li>
          <li><a href="https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS" target="_blank" rel="noreferrer">World Bank — urban population share ↗</a></li>
          <li><a href={enrichment.government.sourceUrl || "https://www.wikidata.org"} target="_blank" rel="noreferrer">Wikidata — government and current officeholders ↗</a></li>
          <li><a href="https://github.com/mledoze/countries" target="_blank" rel="noreferrer">Open country catalog — names, codes and geography ↗</a></li>
          <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap — map data ↗</a></li>
        </ul>
        </section>
      </CountryProfileTabs>

      <section className="next-country"><span>Color Atlas World · Profile {country.profileNumber.toString().padStart(3, "0")}</span><h2>Next: {next.name}</h2><p>Continue through the atlas or search for any of {profileCount} world profiles.</p><div className="next-actions"><Link className="primary-button" href={`/countries/${next.slug}`}>Open {next.name} →</Link></div><CountrySearch variant="hero" /></section>
      <footer className="site-footer country-footer"><Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link><p>Explore the world, one country at a time.</p><span>© 2026 Color Atlas World</span></footer>
    </main>
  );
}
