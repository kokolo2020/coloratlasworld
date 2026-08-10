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

type ChartItem = {
  label: string;
  value: number;
  color?: string;
};

const AGE_BANDS: ChartItem[] = [
  { label: "0-14", value: 18 },
  { label: "15-29", value: 20 },
  { label: "30-44", value: 19 },
  { label: "45-59", value: 21 },
  { label: "60-74", value: 15 },
  { label: "75+", value: 7 },
];

const INCOME_SPLIT: ChartItem[] = [
  { label: "Lower", value: 29, color: "#16c7d8" },
  { label: "Middle", value: 56, color: "#0b90a3" },
  { label: "Higher", value: 15, color: "#07566a" },
];

const LIVING_SPLIT: ChartItem[] = [
  { label: "Rural", value: 17 },
  { label: "Town / small city", value: 31 },
  { label: "Metro area", value: 52 },
];

const EDUCATION_SPLIT: ChartItem[] = [
  { label: "Primary", value: 20, color: "#86d84a" },
  { label: "Secondary", value: 37, color: "#57ae31" },
  { label: "Tertiary", value: 43, color: "#356d12" },
];

function cardTitle(icon: string, title: string) {
  return (
    <div className="demo-card-title">
      <span aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
    </div>
  );
}

function PieChart({ items, label }: { items: ChartItem[]; label: string }) {
  let cursor = 0;
  const segments = items.map((item) => {
    const start = cursor;
    const end = cursor + item.value;
    cursor = end;
    return `${item.color ?? "#0b90a3"} ${start}% ${end}%`;
  });

  return (
    <div className="demo-pie-wrap">
      <div className="demo-pie" style={{ background: `conic-gradient(${segments.join(", ")})` }}>
        <span>{items[0]?.value}%</span>
      </div>
      <ul aria-label={label}>
        {items.map((item) => (
          <li key={item.label}>
            <i style={{ background: item.color ?? "#0b90a3" }} />
            <span>{item.label}</span>
            <b>{item.value}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VerticalBars({ items }: { items: ChartItem[] }) {
  return (
    <div className="demo-vertical-bars">
      {items.map((item) => (
        <div key={item.label}>
          <b>{item.value}%</b>
          <span style={{ height: `${Math.max(24, item.value * 3)}px` }} />
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({ items }: { items: ChartItem[] }) {
  return (
    <div className="demo-horizontal-bars">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <i>
            <b style={{ width: `${item.value}%` }} />
          </i>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  );
}

function slugifyCountry(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CountrySnapshot({ data }: { data: CountrySnapshotData }) {
  const [open, setOpen] = useState(false);
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
  const factList = facts.slice(0, 5);
  const profileStats = [
    { label: "Languages", value: data.languages },
    { label: "Currency", value: data.currency },
    { label: "Population", value: data.population },
    { label: "Capital", value: data.capital },
    { label: "Median age", value: data.medianAge },
    { label: "Life expectancy", value: data.lifeExpectancy },
  ];

  return (
    <div className="snapshot-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="snapshot-dialog demographics-dashboard" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <button className="snapshot-close demo-close" onClick={close} aria-label="Close country dashboard">×</button>

        <header className="demo-titlebar">
          <div>
            <p>Country profile</p>
            <h2 id="snapshot-title">{data.name} Country Profile</h2>
            <span>{data.officialName} · {data.region} · {data.code}</span>
          </div>
          <div className="demo-flag-ribbon" aria-label={`Flag of ${data.name}`}>
            <img src={data.flagUrl} alt="" />
          </div>
        </header>

        <section className="profile-infographic-hero" aria-label={`${data.name} profile summary`}>
          <div className="profile-copy">
            <p>Country profile</p>
            <h3>{data.name}</h3>
            <em>{data.officialName}</em>
            <span>{data.history}</span>
          </div>

          <div className="profile-visuals">
            <figure className="profile-locator">
              <img src={data.mapUrl} alt={`${data.name} regional locator map`} />
              <figcaption>{data.region}</figcaption>
            </figure>
            <figure className="profile-flag-map">
              <img src={data.flagUrl} alt={`Flag of ${data.name}`} />
              <figcaption>
                <b>{data.capital}</b>
                <span>Capital city</span>
              </figcaption>
            </figure>
          </div>

          <p className="profile-thesis">
            {data.name} connects geography, culture, economy, and everyday life in one quick visual profile.
          </p>

          <div className="profile-quick-grid" aria-label={`${data.name} key country facts`}>
            {profileStats.map((stat) => (
              <article key={stat.label}>
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <div className="demo-grid demo-demographic-band">
          <article className="demo-card demo-gender">
            {cardTitle("⚥", "Gender")}
            <div className="demo-gender-body">
              <div className="demo-person female" aria-hidden="true" />
              <div className="demo-donut">
                <span>51</span>
                <strong>%</strong>
                <span>49</span>
              </div>
              <div className="demo-person male" aria-hidden="true" />
            </div>
            <div className="demo-life-row">
              <span>Life Expectancy</span>
              <strong>{data.lifeExpectancy}</strong>
              <em>Median age {data.medianAge}</em>
            </div>
          </article>

          <article className="demo-card">
            {cardTitle("⌁", "Age")}
            <VerticalBars items={AGE_BANDS} />
            <p className="demo-note">Population: <b>{data.population}</b></p>
          </article>

          <article className="demo-card">
            {cardTitle("💰", "Income")}
            <PieChart items={INCOME_SPLIT} label="Income distribution" />
            <p className="demo-note">GDP: <b>{data.gdp}</b> · Currency: <b>{data.currency}</b></p>
          </article>

          <article className="demo-card demo-illustration-card">
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

          <article className="demo-card">
            {cardTitle("⌖", "Place of Living")}
            <HorizontalBars items={LIVING_SPLIT} />
            <dl className="demo-practical">
              <div><dt>Capital</dt><dd>{data.capital}</dd></div>
              <div><dt>Time zones</dt><dd>{data.timeZones}</dd></div>
              <div><dt>Driving</dt><dd>{data.drivingSide}</dd></div>
              <div><dt>Plug</dt><dd>{data.plugTypes}</dd></div>
            </dl>
          </article>

          <article className="demo-card">
            {cardTitle("🎓", "Education")}
            <PieChart items={EDUCATION_SPLIT} label="Education distribution" />
            <div className="demo-language">
              <small>Languages</small>
              <strong>{data.languages}</strong>
            </div>
          </article>
        </div>

        <section className="demo-story">
          <div>
            <small>History timeline</small>
            <p>{data.history}</p>
          </div>
          <ol>
            {factList.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ol>
        </section>

        <section className="demo-neighbors">
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
