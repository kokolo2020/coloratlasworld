"use client";

import { useCallback, useEffect, useState } from "react";

type CountryRow = { code: string; name: string; visits: number };
type Summary = {
  totals: { totalVisits: number; uniqueVisitors: number; countries: number; today: number };
  countries: CountryRow[];
};

function flagEmoji(code: string) {
  if (!/^[A-Z]{2}$/.test(code) || code === "XX") return "🌐";
  return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/summary", { cache: "no-store" });
      const result = await response.json() as Summary & { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to load dashboard");
      setData(result);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load dashboard");
    }
  }, []);

  useEffect(() => { void load(); const timer = window.setInterval(load, 30000); return () => clearInterval(timer); }, [load]);

  const maximum = Math.max(1, ...(data?.countries.map((item) => item.visits) || [1]));

  return (
    <section className="analytics-shell">
      <header className="analytics-heading">
        <div><p>Live audience intelligence</p><h1>Visitor dashboard</h1></div>
        <button onClick={() => void load()}>↻ Refresh</button>
      </header>

      {error ? <div className="analytics-error">{error}</div> : null}
      <div className="analytics-kpis">
        <article><span>Total visits</span><strong>{data?.totals.totalVisits ?? "—"}</strong><small>All recorded sessions</small></article>
        <article><span>Unique visitors</span><strong>{data?.totals.uniqueVisitors ?? "—"}</strong><small>Anonymous browsers</small></article>
        <article><span>Countries reached</span><strong>{data?.totals.countries ?? "—"}</strong><small>Recognized locations</small></article>
        <article><span>Today</span><strong>{data?.totals.today ?? "—"}</strong><small>Sessions since midnight UTC</small></article>
      </div>

      <article className="country-analytics-card">
        <div className="country-analytics-title"><h2>🌎 Visits by Country</h2><span>Top 20</span></div>
        {!data ? <p className="analytics-empty">Loading visitor data…</p> : data.countries.length === 0 ? (
          <p className="analytics-empty">No visits recorded yet. Open the public site to start tracking.</p>
        ) : (
          <div className="country-bars">
            {data.countries.map((country) => (
              <div className="country-bar-row" key={country.code}>
                <span className="country-emoji">{flagEmoji(country.code)}</span>
                <span className="country-bar-name">{country.name}</span>
                <span className="country-bar-track"><i style={{ width: `${Math.max(1.5, country.visits / maximum * 100)}%` }} /></span>
                <strong>{country.visits}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
      <p className="analytics-privacy">Aggregate analytics only · No IP addresses or personal details are stored · Updates every 30 seconds</p>
    </section>
  );
}
