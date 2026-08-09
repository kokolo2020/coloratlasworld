import Link from "next/link";
import CountrySearch from "../components/CountrySearch";
import { COUNTRIES, displayRegion, flagUrl } from "../lib/countries";

const highlights = [
  { value: "199", label: "complete country profiles" },
  { value: "1", label: "searchable world atlas" },
  { value: "0", label: "clutter or geography jargon" },
];

export default function Home() {
  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Color Atlas World home">
          <span className="brand-mark">✦</span>
          <span>Color Atlas World</span>
        </Link>
        <div className="nav-links">
          <a href="#explore">Explore</a>
          <a href="#about">About</a>
          <a className="nav-cta" href="#countries">Browse 199 countries</a>
        </div>
      </nav>

      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A living atlas for curious people</p>
          <h1>Every country,<br /><em>clearly explained.</em></h1>
          <p className="hero-lede">
            Search a country and discover its flag, people, economy, geography,
            culture, and defining facts in one beautiful profile.
          </p>
          <CountrySearch variant="hero" />
          <p className="search-note">Try “Canada”, “Cambodia”, “Japan”, “UK”, or “BR”</p>
        </div>

        <div className="hero-atlas" aria-label="United States profile preview">
          <div className="atlas-orbit orbit-one" />
          <div className="atlas-orbit orbit-two" />
          <div className="atlas-card atlas-card-main">
            <div className="atlas-card-topline"><span>Country 001</span><span>North America</span></div>
            <img src="/flags/us.svg" alt="Flag of the United States" />
            <div className="atlas-card-title">
              <div><small>Now exploring</small><strong>United States</strong></div>
              <span className="atlas-code">US</span>
            </div>
          </div>
          <div className="atlas-card atlas-stat-card">
            <small>Population · 2025</small>
            <strong>341.8M</strong>
            <span>50 states · 1 federal district</span>
          </div>
          <div className="atlas-pin"><span>●</span> Washington, D.C.</div>
        </div>
      </section>

      <section className="number-strip" aria-label="Color Atlas World at a glance">
        {highlights.map((item) => (
          <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
        ))}
      </section>

      <section className="feature-section" id="explore">
        <div className="section-heading">
          <p className="eyebrow"><span /> Featured country</p>
          <h2>Begin anywhere.<br /><em>Explore deeply.</em></h2>
          <p>Every country now has the same polished profile: flag, map, people, geography, economy, identity, and sources.</p>
          <Link className="text-link" href="/countries/united-states">Explore the full USA profile <span>→</span></Link>
        </div>
        <Link className="country-feature-card" href="/countries/united-states">
          <div className="feature-flag"><img src="/flags/us.svg" alt="" /></div>
          <div className="feature-card-body">
            <div className="feature-title-row">
              <div><small>North America</small><h3>United States</h3></div>
              <span>US</span>
            </div>
            <div className="mini-stats">
              <div><small>Capital</small><strong>Washington, D.C.</strong></div>
              <div><small>Population</small><strong>341.8 million</strong></div>
              <div><small>Currency</small><strong>U.S. dollar</strong></div>
            </div>
          </div>
        </Link>
      </section>

      <section className="country-directory" id="countries">
        <div className="country-directory-head">
          <div>
            <p className="eyebrow"><span /> The complete atlas</p>
            <h2>Choose from<br /><em>199 countries.</em></h2>
          </div>
          <p>Search by country name, common alias, or two- and three-letter country code—or browse the full directory below.</p>
        </div>
        <CountrySearch variant="hero" />
        <div className="country-directory-grid">
          {COUNTRIES.map((country) => (
            <Link className="country-directory-card" href={`/countries/${country.slug}`} key={country.cca3}>
              <img src={flagUrl(country.cca2)} alt="" loading="lazy" />
              <span><strong>{country.name}</strong><small>{displayRegion(country)} · {country.cca2}</small></span>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="principles" id="about">
        <div><span>01</span><h3>Trusted numbers</h3><p>Core statistics include their year and link back to authoritative sources.</p></div>
        <div><span>02</span><h3>Designed to teach</h3><p>Dense information becomes a clear visual story that works on every screen.</p></div>
        <div><span>03</span><h3>One global system</h3><p>All 199 country profiles share the same structure, navigation, sourcing, and visual language.</p></div>
      </section>

      <footer className="site-footer">
        <div className="brand"><span className="brand-mark">✦</span><span>Color Atlas World</span></div>
        <p>Explore the world, one country at a time.</p>
        <span>© 2026 Color Atlas World</span>
      </footer>
    </main>
  );
}
