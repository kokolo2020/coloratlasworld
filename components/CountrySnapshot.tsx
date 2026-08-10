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
  area: string;
  coastline: string;
  gdp: string;
  gdpPerCapita: string;
  gdpGrowth: string;
  lifeExpectancy: string;
  medianAge: string;
  urbanPercent: string;
  ruralPercent: string;
  languages: string;
  government: string;
  timeZones: string;
  drivingSide: string;
  plugTypes: string;
  mapUrl: string;
  silhouetteUrl: string;
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

function compactPercent(value: string) {
  return value.replace(/\.0%$/, "%");
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

  const countrySlug = slugifyCountry(data.name);
  const facts = data.facts.length ? data.facts : [`${data.name} is located in ${data.region}.`];
  const summary = facts.slice(0, 3).join(" ");
  const summaryStrip = [
    { icon: "people", label: "Population", value: data.population },
    { icon: "$", label: "Currency", value: data.currency.replace("United States dollar", "U.S. dollar") },
    { icon: "capitol", label: "Capital", value: data.capital },
    { icon: "area", label: "Area", value: data.area },
    { icon: "coast", label: "Coastline", value: data.coastline },
    { icon: "age", label: "Median age", value: data.medianAge },
  ];

  return (
    <div className="snapshot-backdrop usa-approval-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog usa-infographic" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <button className="snapshot-close usa-close" onClick={close} aria-label="Close country snapshot">Close</button>

        <header className="usa-info-header">
          <div>
            <h2 id="snapshot-title"><span>USA</span> Country Profile</h2>
            <p className="usa-official">* {data.officialName} *</p>
            <p className="usa-summary">A high-income country in North America with a large economy, global cultural influence, and 50 states.</p>
          </div>
          <figure className="usa-ribbon" aria-label="Flag banner">
            <img src={data.flagUrl} alt="" />
          </figure>
        </header>

        <div className="usa-info-layout">
          <section className="usa-left-panel" aria-label="United States map and regional location">
            <div className="usa-silhouette-card">
              <div
                className="usa-flag-silhouette"
                style={{
                  WebkitMaskImage: `url(${data.silhouetteUrl})`,
                  maskImage: `url(${data.silhouetteUrl})`,
                }}
                aria-hidden="true"
              />
              <div className="usa-capital-pin">
                <strong>{data.capital}</strong>
                <span>Capital</span>
              </div>
            </div>

            <div className="usa-region-card">
              <strong>{data.region}</strong>
              <iframe src={data.mapUrl} title="United States regional locator map" loading="lazy" />
            </div>
          </section>

          <section className="usa-card-grid" aria-label="United States infographic dashboard cards">
            <article className="usa-info-card">
              <div className="usa-card-title"><span>01</span><strong>Gender</strong></div>
              <div className="usa-donut-row">
                <span className="usa-human female" />
                <div className="usa-donut"><b>50.5%</b><b>49.5%</b></div>
                <span className="usa-human male" />
              </div>
              <div className="usa-split-note"><span>Female</span><span>Male</span></div>
              <div className="usa-small-stat"><span>Life expectancy</span><strong>{data.lifeExpectancy}</strong></div>
            </article>

            <article className="usa-info-card">
              <div className="usa-card-title"><span>02</span><strong>Age distribution</strong></div>
              <div className="usa-bars">
                {["18", "20", "19", "21", "15", "7"].map((value, index) => (
                  <div key={index}><b>{value}%</b><i style={{ height: `${Number(value) * 3}px` }} /><small>{["0-14", "15-29", "30-44", "45-59", "60-74", "75+"][index]}</small></div>
                ))}
              </div>
              <div className="usa-small-stat"><span>Median age</span><strong>{data.medianAge}</strong></div>
            </article>

            <article className="usa-info-card">
              <div className="usa-card-title"><span>03</span><strong>Economy / income</strong></div>
              <div className="usa-pie-card">
                <div className="usa-pie"><span>High<br />income</span></div>
                <ul>
                  <li><i /> GDP {data.gdp}</li>
                  <li><i /> Per capita {data.gdpPerCapita}</li>
                  <li><i /> Growth {data.gdpGrowth}</li>
                </ul>
              </div>
            </article>

            <article className="usa-info-card">
              <div className="usa-card-title"><span>04</span><strong>Place of living</strong></div>
              <div className="usa-ring-stat"><b>{compactPercent(data.urbanPercent)}</b><span>Urban population</span></div>
              <ul className="usa-mini-list">
                <li><strong>Urban</strong><span>{data.urbanPercent}</span></li>
                <li><strong>Rural</strong><span>{data.ruralPercent}</span></li>
              </ul>
            </article>

            <article className="usa-info-card">
              <div className="usa-card-title"><span>05</span><strong>Education</strong></div>
              <div className="usa-pie-card">
                <div className="usa-pie education"><span>Mixed<br />levels</span></div>
                <ul>
                  <li><i /> Primary</li>
                  <li><i /> Secondary</li>
                  <li><i /> Tertiary</li>
                </ul>
              </div>
              <div className="usa-small-stat"><span>Atlas note</span><strong>Education shares coming soon</strong></div>
            </article>

            <article className="usa-info-card">
              <div className="usa-card-title"><span>06</span><strong>Languages & religion</strong></div>
              <div className="usa-language-box"><strong>{data.languages}</strong><span>Listed official language</span></div>
              <div className="usa-religion-note">Comparable religion data is not in this atlas dataset yet.</div>
              <dl className="usa-system-list">
                <div><dt>Government</dt><dd>{data.government}</dd></div>
                <div><dt>Time zones</dt><dd>{data.timeZones}</dd></div>
              </dl>
            </article>
          </section>
        </div>

        <section className="usa-fact-strip" aria-label="United States basic information">
          {summaryStrip.map((fact) => (
            <article key={fact.label}>
              <span>{fact.icon}</span>
              <small>{fact.label}</small>
              <strong>{fact.value}</strong>
            </article>
          ))}
        </section>

        <footer className="usa-bottom-row">
          <article className="usa-about">
            <span>ABOUT</span>
            <div>
              <strong>About the United States</strong>
              <p>{summary}</p>
            </div>
          </article>

          <article className="usa-neighbor-row">
            <strong>Neighbors</strong>
            <div>
              {data.neighbors.map((country) => (
                <Link key={country.slug} href={`/countries/${country.slug}`}>
                  <img src={country.flagUrl} alt="" />
                  <span>{country.name}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="usa-utility">
            <strong>Transport / basics</strong>
            <p>Major international airports and seaports available nationwide. Atlas fields: {data.plugTypes} plugs, {data.drivingSide} driving, {data.timeZones}.</p>
          </article>
        </footer>

        <div className="usa-actions">
          <button className={`snapshot-favorite${favorite ? " active" : ""}`} onClick={toggleFavorite} aria-pressed={favorite}>
            <span>{favorite ? "★" : "☆"}</span>{favorite ? "Saved" : "Favorite"}
          </button>
          <button onClick={chooseAnother}>Another country</button>
          <Link href={`/countries/${countrySlug}`}>Explore full profile <span>→</span></Link>
        </div>
      </section>
    </div>
  );
}
