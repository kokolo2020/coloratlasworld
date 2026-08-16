"use client";

import { useCallback, useEffect, useState } from "react";

type CountryRow = { code: string; name: string; visits: number };
type PageRow = { path: string; visits: number; visitors: number };
type DailyRow = { date: string; visits: number; visitors: number };
type KeywordRow = { query: string; searches: number; matches: number; topResult: string | null };
type RecentSearchRow = { query: string; matched: number; resultName: string | null; path: string; searchedAt: string };
type SessionRow = { countryName: string; path: string; startedAt: string; lastSeenAt: string; durationSeconds: number };
type SponsorClickRow = { countrySlug: string; countryName: string; partner: string; placement: string; clicks: number; lastClickedAt: string };
type Summary = {
  totals: { totalVisits: number; uniqueVisitors: number; countries: number; today: number; totalSearches: number; matchedSearches: number; averageDurationSeconds: number; sponsorClicks: number };
  countries: CountryRow[];
  pages: PageRow[];
  daily: DailyRow[];
  keywords: KeywordRow[];
  recentSearches: RecentSearchRow[];
  sessions: SessionRow[];
  sponsorClicks: SponsorClickRow[];
};

function flagEmoji(code: string) {
  if (!/^[A-Z]{2}$/.test(code) || code === "XX") return "🌐";
  return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
}

function fillLastSevenDays(rows: DailyRow[]) {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today - (6 - index) * 86_400_000);
    const date = day.toISOString().slice(0, 10);
    return byDate.get(date) ?? { date, visits: 0, visitors: 0 };
  });
}

function formatDuration(seconds?: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  if (minutes < 60) return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function localTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [locked, setLocked] = useState(false);
  const load = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/analytics/summary", {
        cache: "no-store",
        headers: token ? { "x-analytics-token": token } : undefined,
      });
      const result = await response.json() as Summary & { error?: string };
      if (response.status === 401) {
        setLocked(true);
        setData(null);
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to load dashboard");
      setData(result);
      setError("");
      setLocked(false);
      if (token) localStorage.setItem("color-atlas-analytics-token", token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load dashboard");
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("color-atlas-analytics-token") || "";
    setAccessCode(saved);
    if (saved) void load(saved);
    else setLocked(true);
    const timer = window.setInterval(() => {
      const token = localStorage.getItem("color-atlas-analytics-token") || "";
      if (token) void load(token);
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const maximum = Math.max(1, ...(data?.countries.map((item) => item.visits) || [1]));
  const pageMaximum = Math.max(1, ...(data?.pages.map((item) => item.visits) || [1]));
  const keywordMaximum = Math.max(1, ...(data?.keywords.map((item) => item.searches) || [1]));
  const trendDays = fillLastSevenDays(data?.daily ?? []);
  const trendMaximum = Math.max(1, ...trendDays.map((item) => item.visits));
  const trendTotal = trendDays.reduce((sum, day) => sum + day.visits, 0);
  const matchRate = data?.totals.totalSearches ? Math.round(data.totals.matchedSearches / data.totals.totalSearches * 100) : 0;

  if (locked) {
    return (
      <section className="analytics-shell">
        <header className="analytics-heading">
          <div><p>Private audience intelligence</p><h1>Analytics access</h1></div>
        </header>
        <form className="analytics-login-card" onSubmit={(event) => { event.preventDefault(); void load(accessCode); }}>
          <label htmlFor="analytics-code">Access code</label>
          <input id="analytics-code" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} type="password" autoComplete="current-password" />
          <button type="submit">Open dashboard</button>
          <p>Search keywords and session details are protected because they can contain sensitive user behavior.</p>
        </form>
      </section>
    );
  }

  return (
    <section className="analytics-shell">
      <header className="analytics-heading">
        <div><p>Live audience intelligence</p><h1>Visitor dashboard</h1></div>
        <button onClick={() => void load(accessCode)}>↻ Refresh</button>
      </header>

      {error ? <div className="analytics-error">{error}</div> : null}
      <div className="analytics-kpis">
        <article><span>Total visits</span><strong>{data?.totals.totalVisits ?? "—"}</strong><small>All recorded sessions</small></article>
        <article><span>Unique visitors</span><strong>{data?.totals.uniqueVisitors ?? "—"}</strong><small>Anonymous browsers</small></article>
        <article><span>Countries reached</span><strong>{data?.totals.countries ?? "—"}</strong><small>Recognized locations</small></article>
        <article><span>Today</span><strong>{data?.totals.today ?? "—"}</strong><small>Sessions since midnight UTC</small></article>
        <article><span>Total searches</span><strong>{data?.totals.totalSearches ?? "—"}</strong><small>Submitted keywords</small></article>
        <article><span>Search match rate</span><strong>{data ? `${matchRate}%` : "—"}</strong><small>Searches that found a profile</small></article>
        <article><span>Average stay</span><strong>{data ? formatDuration(data.totals.averageDurationSeconds) : "—"}</strong><small>Tracked session duration</small></article>
        <article><span>Sponsor clicks</span><strong>{data?.totals.sponsorClicks ?? "—"}</strong><small>Outbound partner visits</small></article>
        <article><span>Last refresh</span><strong>{new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</strong><small>Your local time</small></article>
      </div>

      <div className="analytics-grid">
      <article className="country-analytics-card">
        <div className="country-analytics-title"><h2>Visits by Country</h2><span>Top 20</span></div>
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

      <article className="country-analytics-card analytics-trend-card">
        <div className="country-analytics-title"><h2>Seven-day Trend</h2><span>UTC</span></div>
        {!data ? <p className="analytics-empty">Loading visitor data…</p> : trendTotal === 0 ? (
          <p className="analytics-empty">No visits in the last seven days.</p>
        ) : (
          <div className="trend-bars" aria-label="Visits over the last seven days">
            {trendDays.map((day) => (
              <div className="trend-day" key={day.date}>
                <span className="trend-bar"><i style={{ height: `${Math.max(6, day.visits / trendMaximum * 100)}%` }} /></span>
                <strong>{day.visits}</strong>
                <small>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })}</small>
              </div>
            ))}
          </div>
        )}
      </article>
      </div>

      <div className="analytics-grid analytics-search-grid">
        <article className="country-analytics-card">
          <div className="country-analytics-title"><h2>Search Keywords</h2><span>Top 15</span></div>
          {!data ? <p className="analytics-empty">Loading keyword data…</p> : data.keywords.length === 0 ? (
            <p className="analytics-empty">No searches recorded yet.</p>
          ) : (
            <div className="keyword-bars">
              {data.keywords.map((keyword) => (
                <div className="keyword-row" key={keyword.query}>
                  <span className="keyword-text">{keyword.query}</span>
                  <span className="country-bar-track"><i style={{ width: `${Math.max(1.5, keyword.searches / keywordMaximum * 100)}%` }} /></span>
                  <strong>{keyword.searches}</strong>
                  <small>{keyword.matches} matched{keyword.topResult ? ` · ${keyword.topResult}` : ""}</small>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="country-analytics-card">
          <div className="country-analytics-title"><h2>Recent Searches</h2><span>Latest 20</span></div>
          {!data ? <p className="analytics-empty">Loading searches…</p> : data.recentSearches.length === 0 ? (
            <p className="analytics-empty">No recent search activity.</p>
          ) : (
            <div className="recent-search-list">
              {data.recentSearches.map((search, index) => (
                <div className="recent-search-row" key={`${search.searchedAt}-${search.query}-${index}`}>
                  <strong>{search.query}</strong>
                  <span>{search.matched ? search.resultName || "Matched profile" : "No match"}</span>
                  <small>{localTime(search.searchedAt)}</small>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <article className="country-analytics-card analytics-sponsor-card">
        <div className="country-analytics-title"><h2>Sponsor Engagement</h2><span>Top 20 placements</span></div>
        {!data ? <p className="analytics-empty">Loading sponsor activity…</p> : data.sponsorClicks.length === 0 ? (
          <p className="analytics-empty">No sponsor clicks recorded yet.</p>
        ) : (
          <div className="sponsor-click-list">
            {data.sponsorClicks.map((click) => (
              <div className="sponsor-click-row" key={`${click.partner}-${click.countrySlug}-${click.placement}`}>
                <span><strong>{click.countryName}</strong><small>{click.partner} · {click.placement}</small></span>
                <b>{click.clicks}</b>
                <time>{localTime(click.lastClickedAt)}</time>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="country-analytics-card analytics-sessions-card">
        <div className="country-analytics-title"><h2>Session Starts & Stay Time</h2><span>Latest 12</span></div>
        {!data ? <p className="analytics-empty">Loading sessions…</p> : data.sessions.length === 0 ? (
          <p className="analytics-empty">No tracked sessions yet.</p>
        ) : (
          <div className="session-table">
            {data.sessions.map((session, index) => (
              <div className="session-row" key={`${session.startedAt}-${index}`}>
                <span>{session.countryName}</span>
                <strong>{localTime(session.startedAt)}</strong>
                <small>{formatDuration(session.durationSeconds)}</small>
                <em>{session.path}</em>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="country-analytics-card analytics-pages-card">
        <div className="country-analytics-title"><h2>Top Pages</h2><span>Top 10</span></div>
        {!data ? <p className="analytics-empty">Loading page data…</p> : data.pages.length === 0 ? (
          <p className="analytics-empty">No page paths recorded yet.</p>
        ) : (
          <div className="page-bars">
            {data.pages.map((page) => (
              <div className="page-bar-row" key={page.path}>
                <span className="page-path">{page.path}</span>
                <span className="country-bar-track"><i style={{ width: `${Math.max(1.5, page.visits / pageMaximum * 100)}%` }} /></span>
                <strong>{page.visits}</strong>
                <small>{page.visitors} visitors</small>
              </div>
            ))}
          </div>
        )}
      </article>
      <p className="analytics-privacy">Protected analytics · Anonymous visitor/session IDs · No IP addresses stored · Updates every 30 seconds</p>
    </section>
  );
}
