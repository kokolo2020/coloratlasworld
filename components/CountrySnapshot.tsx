"use client";

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

export default function CountrySnapshot({ data, initialOpen = false }: { data: CountrySnapshotData; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    const readUrl = () => setOpen(new URLSearchParams(window.location.search).get("country") === "united-states");
    const show = () => setOpen(true);
    readUrl();
    window.addEventListener("popstate", readUrl);
    window.addEventListener("coloratlas:open-snapshot", show);
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

  if (!open) return null;

  const summary = "The United States is a large North American country bordered by Canada to the north and Mexico to the south. It has a high-income economy, major global cities, and extensive coastlines on the Atlantic, Pacific, Gulf of Mexico, and Arctic.";
  const stats = [
    ["population", "Population", data.population, "2025"],
    ["currency", "Currency", "U.S. dollar", "USD"],
    ["capital", "Capital", data.capital, ""],
    ["area", "Area", data.area, ""],
    ["coast", "Coastline", data.coastline, ""],
    ["age", "Median age", data.medianAge, ""],
  ];

  return (
    <div className="snapshot-backdrop usa-poster-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog usa-poster-shell" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <button className="usa-poster-close" onClick={close} aria-label="Close country snapshot">X</button>
        <div className="usa-poster">
          <header className="poster-title">
            <h2 id="snapshot-title"><span>USA</span> Country Profile</h2>
            <p className="poster-official">* {data.officialName} *</p>
            <p className="poster-lede">A high-income country in North America with a large economy, global cultural influence, and diverse regions.</p>
          </header>

          <figure className="poster-flag-ribbon">
            <img src={data.flagUrl} alt="" />
          </figure>

          <section className="poster-map-block" aria-label="United States map">
            <div className="poster-skyline" aria-hidden="true" />
            <div className="poster-usa-shape" style={{ WebkitMaskImage: `url(${data.silhouetteUrl})`, maskImage: `url(${data.silhouetteUrl})` }} />
            <div className="poster-capital"><b>{data.capital}</b><span>Capital</span></div>
          </section>

          <section className="poster-region-card" aria-label="Regional locator">
            <strong>{data.region}</strong>
            <iframe src={data.mapUrl} title="United States regional locator map" loading="lazy" />
          </section>

          <section className="poster-card poster-gender">
            <h3><i className="pi gender" />Gender</h3>
            <div className="gender-visual"><span className="human red" /><div className="donut gender-donut"><b>50.5%</b><b>49.5%</b></div><span className="human blue" /></div>
            <div className="life-box"><span>Life expectancy</span><strong>{data.lifeExpectancy}</strong></div>
          </section>

          <section className="poster-card poster-age">
            <h3><i className="pi age" />Age distribution</h3>
            <div className="poster-bars">
              {["18", "20", "19", "21", "15", "7"].map((value, index) => (
                <div key={index}><b>{value}%</b><span style={{ height: `${Number(value) * 2.7}px` }} /><small>{["0-14", "15-29", "30-44", "45-59", "60-74", "75+"][index]}</small></div>
              ))}
            </div>
            <div className="life-box"><span>Median age</span><strong>{data.medianAge}</strong></div>
          </section>

          <section className="poster-card poster-economy">
            <h3><i className="pi economy" />Economy / income</h3>
            <div className="pie-row"><div className="donut economy-pie"><b>High</b></div><ul><li>GDP {data.gdp}</li><li>Per capita {data.gdpPerCapita}</li><li>Growth {data.gdpGrowth}</li></ul></div>
            <div className="growth-box"><b>{data.gdpGrowth}</b><span>GDP growth</span></div>
          </section>

          <section className="poster-card poster-living">
            <h3><i className="pi living" />Place of living</h3>
            <div className="pie-row"><div className="donut living-ring"><b>80%</b></div><ul><li>Urban {data.urbanPercent}</li><li>Rural {data.ruralPercent}</li><li>Largest city data varies</li></ul></div>
          </section>

          <section className="poster-card poster-education">
            <h3><i className="pi education" />Education</h3>
            <div className="pie-row"><div className="donut edu-pie"><b>Edu</b></div><ul><li>Primary</li><li>Secondary</li><li>Tertiary</li></ul></div>
            <div className="life-box"><span>Atlas note</span><strong>Shares coming soon</strong></div>
          </section>

          <section className="poster-card poster-language">
            <h3><i className="pi language" />Languages & religion</h3>
            <div className="language-grid"><div><b>{data.languages}</b><span>Listed official language</span></div><div className="religion-pie"><b>Varies</b></div></div>
            <small>Religion data is not yet standardized in this atlas.</small>
          </section>

          <section className="poster-stat-strip">
            {stats.map(([icon, label, value, note]) => (
              <article key={label}>
                <i className={`stat-symbol ${icon}`} />
                <small>{label}</small>
                <strong>{value}</strong>
                {note ? <span>{note}</span> : null}
              </article>
            ))}
          </section>

          <footer className="poster-bottom">
            <article className="poster-about"><i>USA</i><div><strong>About United States</strong><p>{summary}</p></div></article>
            <article className="poster-neighbors"><strong>Neighbors</strong><div>{data.neighbors.map((country) => <a key={country.slug} href={`/countries/${country.slug}`}><img src={country.flagUrl} alt="" /><span>{country.name}</span></a>)}</div></article>
            <article className="poster-transport"><i /><div><strong>Transport / basics</strong><p>Major airports and seaports nationwide. {data.plugTypes} plugs · {data.drivingSide} driving.</p></div></article>
          </footer>
        </div>
      </section>
    </div>
  );
}
