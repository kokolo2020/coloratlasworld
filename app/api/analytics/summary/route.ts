import { getCloudflareEnv } from "@/lib/cloudflare-bindings";
import { ensureAnalyticsSchema } from "@/lib/analytics-schema";

function hasAnalyticsAccess(request: Request, token?: string) {
  if (!token) return false;
  const header = request.headers.get("x-analytics-token") || "";
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7) : "";
  return header === token || bearer === token;
}

export async function GET(request: Request) {
  try {
    const env = await getCloudflareEnv();
    if (!hasAnalyticsAccess(request, env?.ANALYTICS_TOKEN)) {
      return Response.json({ error: "Analytics access code required" }, { status: 401 });
    }
    if (!env?.DB) {
      return Response.json({
        totals: { totalVisits: 0, uniqueVisitors: 0, countries: 0, today: 0, totalSearches: 0, matchedSearches: 0, averageDurationSeconds: 0, sponsorClicks: 0 },
        countries: [],
        pages: [],
        daily: [],
        keywords: [],
        recentSearches: [],
        sessions: [],
        sponsorClicks: [],
        preview: true,
      });
    }
    await ensureAnalyticsSchema(env.DB);

    const [totals, countries, pages, daily, keywords, recentSearches, sessions, sponsorClicks] = await Promise.all([
      env.DB.prepare(`
        SELECT COUNT(*) AS totalVisits,
               COUNT(DISTINCT visitor_id) AS uniqueVisitors,
               COUNT(DISTINCT CASE WHEN country_code != 'XX' THEN country_code END) AS countries,
               COALESCE(SUM(CASE WHEN date(visited_at) = date('now') THEN 1 ELSE 0 END), 0) AS today,
               (SELECT COUNT(*) FROM search_events) AS totalSearches,
               (SELECT COUNT(*) FROM search_events WHERE matched = 1) AS matchedSearches,
               (SELECT COUNT(*) FROM sponsor_click_events) AS sponsorClicks,
               COALESCE(ROUND(AVG(duration_seconds)), 0) AS averageDurationSeconds
        FROM visits
      `).first(),
      env.DB.prepare(`
        SELECT country_code AS code, country_name AS name, COUNT(*) AS visits
        FROM visits
        GROUP BY country_code, country_name
        ORDER BY visits DESC, country_name ASC
        LIMIT 20
      `).all(),
      env.DB.prepare(`
        SELECT path, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS visitors
        FROM visits
        GROUP BY path
        ORDER BY visits DESC, path ASC
        LIMIT 10
      `).all(),
      env.DB.prepare(`
        SELECT date(visited_at) AS date, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS visitors
        FROM visits
        WHERE date(visited_at) >= date('now', '-6 days')
        GROUP BY date(visited_at)
        ORDER BY date(visited_at) ASC
      `).all(),
      env.DB.prepare(`
        SELECT normalized_query AS query,
               COUNT(*) AS searches,
               COALESCE(SUM(matched), 0) AS matches,
               MAX(result_name) AS topResult
        FROM search_events
        GROUP BY normalized_query
        ORDER BY searches DESC, query ASC
        LIMIT 15
      `).all(),
      env.DB.prepare(`
        SELECT query, matched, result_name AS resultName, path, searched_at AS searchedAt
        FROM search_events
        ORDER BY datetime(searched_at) DESC
        LIMIT 20
      `).all(),
      env.DB.prepare(`
        SELECT country_name AS countryName,
               path,
               visited_at AS startedAt,
               last_seen_at AS lastSeenAt,
               duration_seconds AS durationSeconds
        FROM visits
        ORDER BY datetime(visited_at) DESC
        LIMIT 12
      `).all(),
      env.DB.prepare(`
        SELECT country_slug AS countrySlug,
               country_name AS countryName,
               partner,
               placement,
               COUNT(*) AS clicks,
               MAX(clicked_at) AS lastClickedAt
        FROM sponsor_click_events
        GROUP BY country_slug, country_name, partner, placement
        ORDER BY clicks DESC, datetime(lastClickedAt) DESC
        LIMIT 20
      `).all(),
    ]);

    return Response.json({
      totals,
      countries: countries.results,
      pages: pages.results,
      daily: daily.results,
      keywords: keywords.results,
      recentSearches: recentSearches.results,
      sessions: sessions.results,
      sponsorClicks: sponsorClicks.results,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load analytics" }, { status: 500 });
  }
}
