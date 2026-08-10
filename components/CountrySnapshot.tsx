"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type CountrySnapshotData = {
  name: string;
  officialName: string;
  code: string;
  region: string;
  flagUrl: string;
  capital: string;
  population: string;
  currency: string;
  gdp: string;
  lifeExpectancy: string;
  medianAge: string;
  languages: string;
  government: string;
  timeZones: string;
  drivingSide: string;
  plugTypes: string;
  mapUrl: string;
  neighbors: Array<{ name: string; slug: string; flagUrl: string }>;
  landmark?: { url: string; label: string; source: string };
  history: string;
  facts: string[];
};

function slugifyCountry(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CountrySnapshot({ data, initialOpen = false }: { data: CountrySnapshotData; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [favorite, setFavorite] = useState(false);
  const favoriteKey = `coloratlas-favorite-${data.code.toLowerCase()}`;

  useEffect(() => {
    const readUrl = () => setOpen(new URLSearchParams(window.location.search).get("country") === "united-states");
    const show = () => setOpen(true);
    readUrl();
    window.addEventListener("popstate", readUrl);
    window.addEventListener("coloratlas:open-snapshot", show);
    setFavorite(window.localStorage.getItem(favoriteKey) === "true");
    return () => {
      window.removeEventListener("popstate", readUrl);
      window.removeEventListener("coloratlas:open-snapshot", show);
    };
  }, [favoriteKey]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("country");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function chooseAnother() {
    close();
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(".country-search input");
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();
      input?.select();
    }, 80);
  }

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    window.localStorage.setItem(favoriteKey, String(next));
  }

  if (!open) return null;

  const facts = data.facts.length ? data.facts : [`${data.name} is located in ${data.region}.`];
  const primaryFact = facts[0];
  const countrySlug = slugifyCountry(data.name);
  const factList = facts.slice(0, 4);
  const profileStats = [
    { label: "Population", value: data.population },
    { label: "Capital", value: data.capital },
    { label: "Currency", value: data.currency },
    { label: "GDP", value: data.gdp },
    { label: "Life expectancy", value: data.lifeExpectancy },
    { label: "Median age", value: data.medianAge },
  ];
  const governmentRows = [
    { label: "Government", value: data.government },
    { label: "Region", value: data.region },
    { label: "Official name", value: data.officialName },
    { label: "Country code", value: data.code },
  ];
  const essentialsRows = [
    { label: "Languages", value: data.languages },
    { label: "Time zones", value: data.timeZones },
    { label: "Driving side", value: data.drivingSide },
    { label: "Plug types", value: data.plugTypes },
  ];

  return (
    <div className="snapshot-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog demographics-dashboard premium-snapshot" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <button className="snapshot-close demo-close" onClick={close} aria-label="Close country dashboard">Close</button>

        <header className="premium-snapshot-hero">
          <div className="premium-hero-copy">
            <p>Premium country dossier</p>
            <h2 id="snapshot-title">{data.name}</h2>
            <span>{data.officialName}</span>
          </div>
          <div className="premium-hero-flag" aria-label={`Flag of ${data.name}`}>
            <img src={data.flagUrl} alt="" />
            <strong>{data.code}</strong>
            <span>{data.region}</span>
          </div>
        </header>

        <section className="premium-snapshot-stage" aria-label={`${data.name} profile summary`}>
          <figure className="premium-map-panel">
            <iframe src={data.mapUrl} title={`${data.name} regional locator map`} loading="lazy" />
            <figcaption>
              <span>Regional locator</span>
              <strong>{data.region}</strong>
            </figcaption>
          </figure>

          <div className="premium-brief-panel">
            <small>Executive summary</small>
            <p>{data.history}</p>
            <div>
              <span>Capital</span>
              <strong>{data.capital}</strong>
            </div>
          </div>

          <figure className="premium-flag-panel">
            <img src={data.flagUrl} alt={`Flag of ${data.name}`} />
            <figcaption>{primaryFact}</figcaption>
          </figure>
        </section>

        <section className="premium-metric-grid" aria-label={`${data.name} key country facts`}>
          {profileStats.map((stat) => (
            <article key={stat.label}>
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <div className="premium-dossier-grid">
          <article className="premium-panel premium-panel-wide">
            <div className="premium-panel-title">
              <span>01</span>
              <strong>Key briefing</strong>
            </div>
            <ol className="premium-fact-list">
              {factList.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ol>
          </article>

          <article className="premium-panel">
            <div className="premium-panel-title">
              <span>02</span>
              <strong>Government and identity</strong>
            </div>
            <dl className="premium-data-list">
              {governmentRows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="premium-panel">
            <div className="premium-panel-title">
              <span>03</span>
              <strong>Everyday essentials</strong>
            </div>
            <dl className="premium-data-list">
              {essentialsRows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="premium-panel premium-landmark-panel">
            {data.landmark ? (
              <img src={data.landmark.url} alt={data.landmark.label} />
            ) : (
              <div className="demo-illustration-fallback" aria-hidden="true">
                <span />
                <b />
                <i />
              </div>
            )}
            <div>
              <small>Iconic place</small>
              <strong>{data.landmark?.label ?? data.name}</strong>
              <span>{primaryFact}</span>
            </div>
          </article>
        </div>

        <section className="demo-neighbors premium-neighbors">
          <small>Neighboring countries</small>
          <div>
            {data.neighbors.map((country) => (
              <Link key={country.slug} href={`/countries/${country.slug}`}>
                <img src={country.flagUrl} alt="" />
                {country.name}
              </Link>
            ))}
          </div>
        </section>

        <footer className="snapshot-actions demo-actions">
          <button className={`snapshot-favorite${favorite ? " active" : ""}`} onClick={toggleFavorite} aria-pressed={favorite}>
            <span>{favorite ? "★" : "☆"}</span>{favorite ? "Saved" : "Favorite"}
          </button>
          <button onClick={chooseAnother}>Another country</button>
          <button onClick={close}>Close snapshot</button>
          <Link href={`/countries/${countrySlug}`}>Explore full profile <span>→</span></Link>
        </footer>
      </section>
    </div>
  );
}
