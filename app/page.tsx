import Link from "next/link";
import CountrySearch from "../components/CountrySearch";

const highlights = [
  { value: "199", label: "country profiles planned" },
  { value: "1", label: "clear place to explore" },
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
          <Link className="nav-cta" href="/countries/united-states">Open USA profile</Link>
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
          <p className="search-note">Try “USA”, “United States”, or “America”</p>
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
          <p className="eyebrow"><span /> Country spotlight</p>
          <h2>Start with the<br /><em>United States.</em></h2>
          <p>Our first complete profile combines trusted data with a visual, story-first experience.</p>
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

      <section className="principles" id="about">
        <div><span>01</span><h3>Trusted numbers</h3><p>Core statistics include their year and link back to authoritative sources.</p></div>
        <div><span>02</span><h3>Designed to teach</h3><p>Dense information becomes a clear visual story that works on every screen.</p></div>
        <div><span>03</span><h3>Built to grow</h3><p>The USA is first. More complete country profiles will follow in one shared atlas.</p></div>
      </section>

      <footer className="site-footer">
        <div className="brand"><span className="brand-mark">✦</span><span>Color Atlas World</span></div>
        <p>Explore the world, one country at a time.</p>
        <span>© 2026 Color Atlas World</span>
      </footer>
    </main>
  );
}
