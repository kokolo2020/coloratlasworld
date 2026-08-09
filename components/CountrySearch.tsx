"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const usaAliases = new Set([
  "us", "usa", "u.s.", "u.s.a.", "america", "united states", "united states of america",
]);

export default function CountrySearch({ variant = "compact" }: { variant?: "hero" | "compact" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setMessage("Type a country name or code to begin.");
      return;
    }
    if (usaAliases.has(normalized)) {
      router.push("/countries/united-states");
      return;
    }
    setMessage(`${query.trim()} is on our roadmap. The United States profile is ready now.`);
  }

  return (
    <div className={`country-search-wrap ${variant}`}>
      <form className="country-search" onSubmit={submit}>
        <label className="sr-only" htmlFor={`country-${variant}`}>Search countries</label>
        <span aria-hidden="true">⌕</span>
        <input
          id={`country-${variant}`}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setMessage(""); }}
          placeholder="Search any country or code"
          autoComplete="off"
        />
        <button type="submit">Explore <span>→</span></button>
      </form>
      {message && <p className="search-message" role="status">{message}</p>}
    </div>
  );
}
