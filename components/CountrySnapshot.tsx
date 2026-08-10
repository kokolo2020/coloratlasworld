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

  const summary = "The United States spans North America between Canada and Mexico, with coastlines on the Atlantic Ocean, Pacific Ocean, Arctic Ocean, and Gulf of Mexico. It is a federal republic of 50 states and one federal district.";
  const stats = [
    ["population", "Population", data.population, "2024 est."],
    ["currency", "Currency", "U.S. dollar", "USD"],
    ["capital", "Capital", data.capital, ""],
    ["area", "Area", "9.83M km²", "3.80M mi²"],
    ["coast", "Coastline", "19,924 km", ""],
    ["age", "Median age", "38.9", "years"],
  ];

  return (
    <div className="snapshot-backdrop usa-poster-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog usa-poster-shell" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <button className="usa-poster-close" onClick={close} aria-label="Close country snapshot">X</button>
        <div className="usa-poster">
          <header className="poster-title">
            <h2 id="snapshot-title"><span>UNITED STATES</span> Country Profile</h2>
            <p className="poster-official">* {data.officialName} *</p>
            <p className="poster-lede">A federal republic in North America known for its diverse people, dynamic economy, and global influence in innovation, culture, and leadership.</p>
          </header>

          <figure className="poster-flag-ribbon">
            <img src={data.flagUrl} alt="" />
          </figure>

          <section className="poster-map-block" aria-label="United States map">
            <div className="poster-skyline" aria-hidden="true" />
            <div className="poster-map-outline" style={{ WebkitMaskImage: `url(${data.silhouetteUrl})`, maskImage: `url(${data.silhouetteUrl})` }} />
            <div className="poster-usa-shape" style={{ WebkitMaskImage: `url(${data.silhouetteUrl})`, maskImage: `url(${data.silhouetteUrl})` }} />
            <img className="poster-state-lines" src={data.silhouetteUrl} alt="" />
            <div className="city-callout los-angeles"><i />Los Angeles</div>
            <div className="city-callout chicago"><i />Chicago</div>
            <div className="city-callout new-york"><i />New York</div>
            <div className="city-callout washington"><i />Washington, D.C.<span>Capital</span></div>
            <div className="city-callout houston"><i />Houston</div>
            <div className="city-callout miami"><i />Miami</div>
            <div className="poster-inset-map alaska" style={{ WebkitMaskImage: `url(${data.silhouetteUrl})`, maskImage: `url(${data.silhouetteUrl})` }} />
            <div className="poster-inset-map hawaii"><span /><span /><span /></div>
          </section>

          <section className="poster-region-card" aria-label="Regional locator">
            <strong>{data.region}</strong>
            <div className="north-america-map">
              <span className="canada-shape" />
              <span className="usa-highlight" style={{ WebkitMaskImage: `url(${data.silhouetteUrl})`, maskImage: `url(${data.silhouetteUrl})` }} />
              <span className="mexico-shape" />
            </div>
          </section>

          <section className="poster-card poster-gender">
            <h3><i className="pi gender" />Gender</h3>
            <div className="gender-visual"><span className="human red" /><div className="donut gender-donut"><b>50.5%</b><b>49.5%</b></div><span className="human blue" /></div>
            <div className="life-box"><span>Life expectancy</span><strong>79 <em>years</em></strong></div>
          </section>

          <section className="poster-card poster-age">
            <h3><i className="pi age" />Age distribution</h3>
            <div className="poster-bars">
              {["18", "20", "19", "20", "15", "8"].map((value, index) => (
                <div key={index}><b>{value}%</b><span style={{ height: `${Number(value) * 2.7}px` }} /><small>{["0-14", "15-29", "30-44", "45-59", "60-74", "75+"][index]}</small></div>
              ))}
            </div>
            <div className="life-box"><span>Median age</span><strong>38.9 <em>years</em></strong></div>
          </section>

          <section className="poster-card poster-economy">
            <h3><i className="pi economy" />Economy / income</h3>
            <div className="economy-panel"><div className="donut economy-pie"><b>↗</b></div><div><strong>High-income country</strong><span>GDP (Nominal)</span><b>$30.8T</b><small>2024 est.</small></div></div>
          </section>

          <section className="poster-card poster-living">
            <h3><i className="pi living" />Place of living</h3>
            <div className="pie-row"><div className="donut living-ring"><b>83%</b></div><ul><li>Urban 83%</li><li>Rural 17%</li></ul></div>
          </section>

          <section className="poster-card poster-education">
            <h3><i className="pi education" />Education attainment</h3>
            <div className="pie-row"><div className="donut edu-pie"><b>62%</b></div><ul><li>Tertiary 62%</li><li>Secondary 28%</li><li>Primary 10%</li></ul></div>
          </section>

          <section className="poster-card poster-language">
            <h3><i className="pi language" />Languages & religion</h3>
            <div className="language-grid"><div><b>English</b><span>Primary</span><b>Spanish</b><span>Widely spoken</span></div><div className="religion-pie"><b>63%</b></div></div>
            <small>Christianity 63% · Unaffiliated 29% · Other 8%</small>
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
            <article className="poster-about"><i>US</i><div><strong>About the United States</strong><p>{summary}</p></div></article>
            <article className="poster-neighbors"><strong>Neighbors</strong><div><a href="/countries/canada"><img src="https://flagcdn.com/ca.svg" alt="" /><span>Canada<small>North</small></span></a><a href="/countries/mexico"><img src="https://flagcdn.com/mx.svg" alt="" /><span>Mexico<small>South</small></span></a><span className="neighbor-chip"><span className="ocean-icon" />Atlantic Ocean<small>East</small></span><span className="neighbor-chip"><span className="ocean-icon" />Pacific Ocean<small>West</small></span></div></article>
            <article className="poster-transport"><i /><div><strong>3 Major International Airports</strong><p>Atlanta (ATL), Chicago (ORD), Los Angeles (LAX)</p><strong>10 Major Seaports</strong><p>Los Angeles, Long Beach, New York/New Jersey, Houston, Savannah, Seattle, Miami, etc.</p></div></article>
          </footer>
        </div>
      </section>
    </div>
  );
}
