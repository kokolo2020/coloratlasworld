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

export default function CountrySnapshot({ data }: { data: CountrySnapshotData }) {
  const [open, setOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const readUrl = () => setOpen(new URLSearchParams(window.location.search).get("country") === "united-states");
    const show = () => setOpen(true);
    readUrl();
    window.addEventListener("popstate", readUrl);
    window.addEventListener("coloratlas:open-snapshot", show);
    setFavorite(window.localStorage.getItem("coloratlas-favorite-us") === "true");
    return () => {
      window.removeEventListener("popstate", readUrl);
      window.removeEventListener("coloratlas:open-snapshot", show);
    };
  }, []);

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
    window.localStorage.setItem("coloratlas-favorite-us", String(next));
  }

  if (!open) return null;

  return (
    <div className="snapshot-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <header className="snapshot-topbar">
          <div><span>Color Atlas World</span><strong>Country snapshot · {data.code}</strong></div>
          <button className="snapshot-close" onClick={close} aria-label="Close country dashboard">×</button>
        </header>

        <div className="snapshot-hero">
          <img src={data.flagUrl} alt={`Flag of ${data.name}`} />
          <div>
            <p className="snapshot-eyebrow">{data.region} · {data.code}</p>
            <h2 id="snapshot-title">{data.name}</h2>
            <p>{data.officialName}</p>
          </div>
          <button className={`snapshot-favorite${favorite ? " active" : ""}`} onClick={toggleFavorite} aria-pressed={favorite}>
            <span>{favorite ? "★" : "☆"}</span>{favorite ? "Saved" : "Favorite"}
          </button>
        </div>

        <div className="snapshot-metrics">
          {[
            ["Capital", data.capital], ["Population", data.population], ["Currency", data.currency],
            ["GDP", data.gdp], ["Life expectancy", data.lifeExpectancy], ["Median age", data.medianAge],
          ].map(([label, value]) => <article key={label}><small>{label}</small><strong>{value}</strong></article>)}
        </div>

        <div className="snapshot-grid">
          <article className="snapshot-card snapshot-map-card">
            <div className="snapshot-card-head"><div><small>Location</small><h3>North American context</h3></div><span>01</span></div>
            <iframe title="Map of the United States" src={data.mapUrl} loading="lazy" />
            <div className="snapshot-neighbors"><b>Neighbors</b>{data.neighbors.map((country) => (
              <Link key={country.slug} href={`/countries/${country.slug}`}><img src={country.flagUrl} alt="" />{country.name}</Link>
            ))}</div>
          </article>

          <article className="snapshot-card snapshot-practical">
            <div className="snapshot-card-head"><div><small>At a glance</small><h3>Identity & daily life</h3></div><span>02</span></div>
            <dl>
              <div><dt>Languages</dt><dd>{data.languages}</dd></div>
              <div><dt>Government</dt><dd>{data.government}</dd></div>
              <div><dt>Time zones</dt><dd>{data.timeZones}</dd></div>
              <div><dt>Driving side</dt><dd>{data.drivingSide}</dd></div>
              <div><dt>Plug types</dt><dd>{data.plugTypes}</dd></div>
            </dl>
          </article>

          <article className="snapshot-card snapshot-landmark">
            {data.landmark && <img src={data.landmark.url} alt={data.landmark.label} />}
            <div><small>Iconic landmark</small><h3>{data.landmark?.label || "American landmark"}</h3><p>A visual gateway into the places and stories that define the country.</p></div>
          </article>

          <article className="snapshot-card snapshot-story">
            <div className="snapshot-card-head"><div><small>Country story</small><h3>History & defining facts</h3></div><span>03</span></div>
            <p>{data.history}</p>
            <ol>{data.facts.slice(0, 3).map((fact) => <li key={fact}>{fact}</li>)}</ol>
          </article>
        </div>

        <footer className="snapshot-actions">
          <button onClick={chooseAnother}>Another country</button>
          <button onClick={close}>Close snapshot</button>
          <Link href="/countries/united-states">Explore full profile <span>→</span></Link>
        </footer>
      </section>
    </div>
  );
}
