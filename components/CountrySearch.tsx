"use client";

import { FormEvent, useState } from "react";
import countriesData from "@/data/countries.json";
import { getAnalyticsSession } from "@/lib/client-analytics";

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

  function recordSearch(term: string, result?: { slug: string; name: string }) {
    const session = getAnalyticsSession();
    if (!session) return;
    void fetch("/api/analytics/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...session,
        query: term,
        matched: Boolean(result),
        resultSlug: result?.slug,
        resultName: result?.name,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return setMessage("Type a profile name or code.");
    const result = COUNTRY_SEARCH_INDEX.find((item) => item.name.toLowerCase() === term || item.terms.split(" ").includes(term))
      || COUNTRY_SEARCH_INDEX.find((item) => item.name.toLowerCase().startsWith(term))
      || COUNTRY_SEARCH_INDEX.find((item) => item.terms.includes(term));
    recordSearch(query.trim(), result);
    if (!result) return setMessage("Profile not found. Try a full name, alias, or code.");
    setMessage("");
    window.location.href = `/?country=${result.slug}`;
  }

  return (
    <div className={`country-search-wrap ${variant}`}>
      <form className="country-search" onSubmit={submit} role="search">
        <span aria-hidden="true">⌕</span>
        <label className="sr-only" htmlFor={`country-search-${variant}`}>Search world profiles</label>
        <input id={`country-search-${variant}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any country, nation, or code…" autoComplete="off" />
        <button type="submit">Explore</button>
      </form>
      {message && <p className="search-message" role="status">{message}</p>}
    </div>
  );
}
