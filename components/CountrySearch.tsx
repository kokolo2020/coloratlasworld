"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRY_SEARCH_INDEX } from "@/lib/countries";

export default function CountrySearch({ variant = "compact" }: { variant?: "hero" | "compact" }) {
  const router = useRouter();
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
    if (result.slug === "united-states") {
      window.history.pushState({}, "", "?country=united-states");
      window.dispatchEvent(new CustomEvent("coloratlas:open-snapshot"));
      return;
    }
    router.push(`/countries/${result.slug}`);
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
