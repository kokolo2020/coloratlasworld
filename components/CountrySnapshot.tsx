"use client";

import { useEffect, useState } from "react";

type SnapshotFact = { value: string; label: string };
type NeighborCard = { name: string; slug?: string; flagUrl?: string; note?: string };

export type CountrySnapshotData = {
  slug?: string;
  name: string;
  officialName: string;
  code: string;
  region: string;
  flagUrl: string;
  fullFlagUrl?: string;
  capital: string;
  population: string;
  populationNote?: string;
  currency: string;
  currencyCode?: string;
  area: string;
  areaImperial?: string;
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
  neighbors: NeighborCard[];
  landmark?: { url: string; label: string; source: string };
  history: string;
  facts: string[];
  lede?: string;
  summary?: string;
  flagFacts?: SnapshotFact[];
  flagNote?: string;
  gender?: { female: string; male: string };
  ageDistribution?: Array<{ label: string; value: number }>;
  economyLabel?: string;
  education?: { tertiary: string; secondary: string; primary: string };
  religion?: { primary: string; primaryPercent: string; secondary: string; secondaryPercent: string; other: string };
  aboutImageUrl?: string;
  aboutImageAlt?: string;
  transportFacts?: Array<{ title: string; detail: string }>;
  displayTheme?: "light" | "night";
};

function slugFor(item: CountrySnapshotData) {
  return item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function numberOnly(value: string) {
  return value.replace(/\s*years?$/i, "").replace(/^Not published$/i, "n/a");
}

function firstLanguage(value: string) {
  return value.split(",")[0]?.trim() || "Languages";
}

function secondLanguage(value: string) {
  const language = value.split(",")[1]?.trim();
  return language || "Other languages";
}

export default function CountrySnapshot({
  data,
  initialOpen = false,
  initialCountry,
}: {
  data: CountrySnapshotData | CountrySnapshotData[];
  initialOpen?: boolean;
  initialCountry?: string;
}) {
  const snapshotList = Array.isArray(data) ? data : [data];
  const firstSlug = snapshotList[0] ? slugFor(snapshotList[0]) : "";
  const [open, setOpen] = useState(initialOpen);
  const [activeSlug, setActiveSlug] = useState(initialCountry || firstSlug);

  function findSnapshot(country?: string | null) {
    if (!country) return null;
    const key = country.toLowerCase();
    return snapshotList.find((item) => slugFor(item) === key || item.code.toLowerCase() === key || item.name.toLowerCase() === key) || null;
  }

  useEffect(() => {
    const readUrl = () => {
      const match = findSnapshot(new URLSearchParams(window.location.search).get("country"));
      setOpen(Boolean(match));
      if (match) setActiveSlug(slugFor(match));
    };
    const show = () => readUrl();
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
    const slug = activeSlug || firstSlug;
    window.location.href = slug ? `/countries/${slug}` : "/";
  }

  const selected = findSnapshot(activeSlug) || snapshotList[0];
  if (!open || !selected) return null;

  const summary = selected.summary || selected.history || `${selected.name} is located in ${selected.region}, with ${selected.capital} as its capital.`;
  const currencyLabel = selected.currency.replace(/\s*\([^)]*\)/g, "");
  const stats = [
    ["population", "Population", selected.population, selected.populationNote || "2024 est."],
    ["currency", "Currency", currencyLabel, selected.currencyCode || ""],
    ["capital", "Capital", selected.capital, ""],
    ["area", "Area", selected.area, selected.areaImperial || ""],
    ["coast", "Coastline", selected.coastline, ""],
    ["age", "Median age", numberOnly(selected.medianAge), selected.medianAge === "Not published" ? "" : "years"],
  ];
  const fullFlagUrl = selected.fullFlagUrl || selected.flagUrl;
  const aboutImageUrl = selected.aboutImageUrl || selected.landmark?.url || selected.flagUrl;
  const aboutImageAlt = selected.aboutImageAlt || selected.landmark?.label || `View of ${selected.name}`;
  const flagFacts = selected.flagFacts || [
    { value: selected.region, label: "Region" },
    { value: selected.capital, label: "Capital" },
    { value: selected.currencyCode || currencyLabel, label: "Currency" },
    { value: selected.coastline, label: "Access" },
  ];
  const ageDistribution = selected.ageDistribution || [
    { label: "0-14", value: 18 },
    { label: "15-29", value: 20 },
    { label: "30-44", value: 19 },
    { label: "45-59", value: 20 },
    { label: "60-74", value: 15 },
    { label: "75+", value: 8 },
  ];
  const gender = selected.gender || { female: "50.5%", male: "49.5%" };
  const education = selected.education || { tertiary: "62%", secondary: "28%", primary: "10%" };
  const religion = selected.religion || { primary: "Major tradition", primaryPercent: "60%", secondary: "Unaffiliated", secondaryPercent: "25%", other: "Other 15%" };
  const transportFacts = selected.transportFacts || [
    { title: "Major International Airports", detail: `${selected.capital} gateway and other national hubs` },
    { title: selected.coastline === "Landlocked" ? "Land Transport Links" : "Major Ports", detail: selected.coastline === "Landlocked" ? "Regional road, rail, and airport corridors" : "Main coastal ports and container terminals" },
  ];
  const posterClass = [
    "usa-poster",
    selected.displayTheme === "night" ? "night-display" : "",
    selected.name.length > 18 ? "long-country-name" : "",
    selected.name.length > 28 ? "extra-long-country-name" : "",
  ].filter(Boolean).join(" ");
  const neighbors = selected.neighbors.length ? selected.neighbors : [
    { name: "Coastal access", note: selected.coastline },
    { name: selected.region, note: "Region" },
  ];

  return (
    <div className="snapshot-backdrop usa-poster-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog usa-poster-shell" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <button className="usa-poster-close" onClick={close} aria-label="Close country snapshot">X</button>
        <div className={posterClass}>
          <header className="poster-title">
            <h2 id="snapshot-title"><span>{selected.name.toUpperCase()}</span> Country Profile</h2>
            <p className="poster-official">* {selected.officialName} *</p>
            <p className="poster-lede">{selected.lede || `${selected.name} is a ${selected.region} country with a distinctive culture, economy, and place in world affairs.`}</p>
          </header>

          <section className={`poster-flag-block ${selected.displayTheme === "night" ? "night-flag-display" : ""}`} aria-label={`${selected.name} flag profile`}>
            <div className="poster-flag-stage">
              <img src={fullFlagUrl} alt={`Flag of ${selected.name}`} />
            </div>
            <div className="poster-flag-facts">
              {flagFacts.slice(0, 4).map((fact) => (
                <article key={`${fact.value}-${fact.label}`}><strong className={fact.value.length > 4 ? "compact" : undefined}>{fact.value}</strong><span>{fact.label}</span></article>
              ))}
            </div>
            <p>{selected.flagNote || `${selected.government || "Country"} in ${selected.region}, with ${selected.capital} as the capital.`}</p>
          </section>

          <section className="poster-card poster-gender">
            <h3><i className="pi gender" />Gender</h3>
            <div className="gender-visual premium-gender">
              <figure className="gender-person female">
                <span className="human female" />
                <figcaption>Female</figcaption>
              </figure>
              <div className="donut gender-donut" style={{ background: `conic-gradient(#f20013 0 ${gender.female}, #0066ad ${gender.female} 100%)` }}><b>{gender.female}</b><b>{gender.male}</b></div>
              <figure className="gender-person male">
                <span className="human male" />
                <figcaption>Male</figcaption>
              </figure>
            </div>
            <div className="life-box"><span>Life expectancy</span><strong>{numberOnly(selected.lifeExpectancy)} <em>years</em></strong></div>
          </section>

          <section className="poster-card poster-age">
            <h3><i className="pi age" />Age distribution</h3>
            <div className="poster-bars">
              {ageDistribution.map((item) => (
                <div key={item.label}><b>{item.value}%</b><span style={{ height: `${item.value * 2.7}px` }} /><small>{item.label}</small></div>
              ))}
            </div>
            <div className="life-box"><span>Median age</span><strong>{numberOnly(selected.medianAge)} <em>years</em></strong></div>
          </section>

          <section className="poster-card poster-economy">
            <h3><i className="pi economy" />Economy / income</h3>
            <div className="economy-panel"><div className="donut economy-pie"><b>↗</b></div><div><strong>{selected.economyLabel || "National economy"}</strong><span>GDP (Nominal)</span><b>{selected.gdp}</b><small>latest est.</small></div></div>
          </section>

          <section className="poster-card poster-living">
            <h3><i className="pi living" />Place of living</h3>
            <div className="pie-row"><div className="donut living-ring"><b>{selected.urbanPercent}</b></div><ul><li>Urban {selected.urbanPercent}</li><li>Rural {selected.ruralPercent}</li></ul></div>
          </section>

          <section className="poster-card poster-education">
            <h3><i className="pi education" />Education attainment</h3>
            <div className="pie-row"><div className="donut edu-pie"><b>{education.tertiary}</b></div><ul><li>Tertiary {education.tertiary}</li><li>Secondary {education.secondary}</li><li>Primary {education.primary}</li></ul></div>
          </section>

          <section className="poster-card poster-language">
            <h3><i className="pi language" />Languages & religion</h3>
            <div className="language-grid"><div><b>{firstLanguage(selected.languages)}</b><span>Primary</span><b>{secondLanguage(selected.languages)}</b><span>Also spoken</span></div><div className="religion-pie"><b>{religion.primaryPercent}</b></div></div>
            <small>{religion.primary} {religion.primaryPercent} · {religion.secondary} {religion.secondaryPercent} · {religion.other}</small>
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
            <article className="poster-about"><img className="poster-about-photo" src={aboutImageUrl} alt={aboutImageAlt} /><div><strong>About {selected.name}</strong><p>{summary}</p></div></article>
            <article className="poster-neighbors"><strong>Neighbors</strong><div>{neighbors.slice(0, 4).map((neighbor) => neighbor.slug ? <a href={`/countries/${neighbor.slug}`} key={neighbor.name}><img src={neighbor.flagUrl || selected.flagUrl} alt="" /><span>{neighbor.name}<small>{neighbor.note || "Border"}</small></span></a> : <span className="neighbor-chip" key={neighbor.name}><span className="ocean-icon" />{neighbor.name}<small>{neighbor.note || "Nearby"}</small></span>)}</div></article>
            <article className="poster-transport"><i /><div>{transportFacts.slice(0, 2).map((fact) => <span className="transport-line" key={fact.title}><strong>{fact.title}</strong><p>{fact.detail}</p></span>)}</div></article>
          </footer>
        </div>
      </section>
    </div>
  );
}
