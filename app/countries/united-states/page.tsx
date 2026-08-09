import type { Metadata } from "next";
import Link from "next/link";
import CountrySearch from "../../../components/CountrySearch";

export const metadata: Metadata = {
  title: "United States Country Profile",
  description: "Explore the United States: flag, capital, population, economy, geography, people, and defining facts.",
};

const quickStats = [
  { label: "Population", value: "341.8M", note: "2025 estimate" },
  { label: "Capital", value: "Washington, D.C.", note: "Federal district" },
  { label: "Currency", value: "U.S. dollar", note: "USD · $" },
  { label: "Life expectancy", value: "79.0 years", note: "2024 final data" },
];

const milestones = [
  ["1776", "Declaration of Independence"],
  ["1787", "Constitution signed"],
  ["1959", "Hawaii becomes the 50th state"],
  ["1969", "Apollo 11 reaches the Moon"],
];

export default function UnitedStatesPage() {
  return (
    <main className="country-page">
      <nav className="site-nav country-nav" aria-label="Primary navigation">
        <Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link>
        <CountrySearch />
        <Link className="back-link" href="/">← Back to atlas</Link>
      </nav>

      <header className="country-hero">
        <div className="country-hero-copy">
          <p className="breadcrumb"><Link href="/">World</Link><span>/</span><span>North America</span><span>/</span><strong>United States</strong></p>
          <div className="country-kicker"><span>US</span> United States of America</div>
          <h1>United<br /><em>States</em></h1>
          <p>A continental nation of 50 states—shaped by migration, invention, dramatic landscapes, and one of the world’s largest economies.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#overview">Explore the profile <span>↓</span></a>
            <a className="secondary-button" href="#sources">View sources</a>
          </div>
        </div>
        <div className="country-flag-stage">
          <div className="flag-label"><span>National flag</span><span>50 stars · 13 stripes</span></div>
          <img src="/flags/us.svg" alt="Flag of the United States" />
          <p>The 50 stars represent the states. The 13 stripes honor the original colonies.</p>
        </div>
      </header>

      <section className="quick-stat-grid" id="overview">
        {quickStats.map((stat, index) => (
          <div className="quick-stat" key={stat.label}>
            <span>0{index + 1}</span><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="profile-grid">
        <article className="profile-story">
          <p className="eyebrow"><span /> At a glance</p>
          <h2>One country.<br /><em>Many Americas.</em></h2>
          <p className="large-copy">The United States stretches from the Atlantic to the Pacific and includes Arctic Alaska and tropical Hawaii. Its scale creates extraordinary environmental and cultural variety.</p>
          <div className="fact-columns">
            <div><small>Government</small><strong>Federal presidential republic</strong></div>
            <div><small>Largest city</small><strong>New York City</strong></div>
            <div><small>Area</small><strong>9.8 million km²</strong></div>
            <div><small>Calling code</small><strong>+1</strong></div>
          </div>
        </article>
        <aside className="map-card">
          <div className="map-card-head"><span>50 states</span><span>Washington, D.C. ●</span></div>
          <img src="/maps/us-states.svg" alt="Map showing the 50 states of the United States" />
          <p>Third-largest country by total area, spanning six main time zones across the 50 states.</p>
        </aside>
      </section>

      <section className="economy-band">
        <div className="economy-intro"><p className="eyebrow light"><span /> Economy</p><h2>A global economic heavyweight.</h2><p>Services, technology, manufacturing, finance, agriculture, and energy all contribute to a deeply varied economy.</p></div>
        <div className="economy-stat"><small>GDP · 2024</small><strong>$28.75T</strong><span>Current U.S. dollars</span></div>
        <div className="economy-stat"><small>GDP per person · 2024</small><strong>$84.5K</strong><span>Current U.S. dollars</span></div>
        <div className="economy-stat"><small>GDP growth · 2024</small><strong>2.8%</strong><span>Annual growth</span></div>
      </section>

      <section className="detail-section">
        <div className="detail-title"><p className="eyebrow"><span /> People & culture</p><h2>A nation built from<br /><em>many stories.</em></h2></div>
        <div className="detail-cards">
          <article><span>Languages</span><h3>English is most widely used</h3><p>The country has no official language at the federal level. Spanish is the second most widely spoken language at home.</p></article>
          <article><span>Places</span><h3>From megacities to open country</h3><p>More than four in five residents live in urban areas, yet the country also contains vast farms, forests, deserts, and protected lands.</p></article>
          <article><span>Innovation</span><h3>Ideas with global reach</h3><p>American universities, laboratories, businesses, and creative industries have influenced science, technology, media, and popular culture.</p></article>
        </div>
      </section>

      <section className="timeline-section">
        <div><p className="eyebrow"><span /> Four moments</p><h2>A brief timeline</h2></div>
        <div className="timeline-list">
          {milestones.map(([year, title]) => <div key={year}><strong>{year}</strong><span>{title}</span></div>)}
        </div>
      </section>

      <section className="sources" id="sources">
        <div><p className="eyebrow"><span /> Sources & notes</p><h2>Numbers you can trace.</h2><p>Statistics show their reference year because country data changes. The headline data on this profile was checked against primary public sources.</p></div>
        <ul>
          <li><a href="https://www.census.gov/quickfacts/fact/table/US/PST045225" target="_blank" rel="noreferrer">U.S. Census Bureau — 2025 population estimate ↗</a></li>
          <li><a href="https://www.cdc.gov/nchs/products/databriefs/db548.htm" target="_blank" rel="noreferrer">CDC/NCHS — 2024 life expectancy ↗</a></li>
          <li><a href="https://data.worldbank.org/country/US" target="_blank" rel="noreferrer">World Bank — GDP and economic indicators ↗</a></li>
        </ul>
      </section>

      <section className="next-country">
        <span>Color Atlas World · Profile 001</span><h2>Where should we go next?</h2><p>More country profiles are being prepared. Search the atlas and help shape the order.</p><CountrySearch variant="hero" />
      </section>

      <footer className="site-footer country-footer">
        <Link className="brand" href="/"><span className="brand-mark">✦</span><span>Color Atlas World</span></Link>
        <p>Explore the world, one country at a time.</p><span>© 2026 Color Atlas World</span>
      </footer>
    </main>
  );
}
