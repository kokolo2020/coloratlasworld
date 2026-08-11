"use client";

import { FormEvent, useState } from "react";
import countriesData from "@/data/countries.json";

function slugifyCountry(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const COUNTRY_SEARCH_INDEX = countriesData.map((country) => ({
  name: country.name,
  slug: slugifyCountry(country.name),
  terms: [country.name, country.officialName, country.cca2, country.cca3, ...country.aliases,
    ...(country.cca2 === "US" ? ["USA", "America"] : []),
    ...(country.cca2 === "GB" ? ["UK", "Britain", "Great Britain"] : []),
  ].join(" ").toLowerCase(),
}));

export default function CountrySearch({ variant = "compact" }: { variant?: "hero" | "compact" }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return setMessage("Type a country name or code.");
    const result = COUNTRY_SEARCH_INDEX.find((item) => item.name.toLowerCase() === term || item.terms.split(" ").includes(term))
      || COUNTRY_SEARCH_INDEX.find((item) => item.name.toLowerCase().startsWith(term))
      || COUNTRY_SEARCH_INDEX.find((item) => item.terms.includes(term));
    if (!result) return setMessage("Country not found. Try a full name or two-letter code.");
    setMessage("");
    window.location.href = `/?country=${result.slug}`;
  }

  return (
    <div className={`country-search-wrap ${variant}`}>
      <form className="country-search" onSubmit={submit} role="search">
        <span aria-hidden="true">⌕</span>
        <label className="sr-only" htmlFor={`country-search-${variant}`}>Search countries</label>
        <input id={`country-search-${variant}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any country or code…" autoComplete="off" />
        <button type="submit">Explore</button>
      </form>
      {message && <p className="search-message" role="status">{message}</p>}
    </div>
  );
}
