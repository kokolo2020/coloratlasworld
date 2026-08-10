import { getCloudflareEnv } from "@/lib/cloudflare-bindings";

export async function GET() {
  try {
    const env = await getCloudflareEnv();
    if (!env?.DB) {
      return Response.json({
        totals: { totalVisits: 0, uniqueVisitors: 0, countries: 0, today: 0 },
        countries: [],
        pages: [],
        daily: [],
        preview: true,
      });
    }

    const [totals, countries, pages, daily] = await Promise.all([
      env.DB.prepare(`
        SELECT COUNT(*) AS totalVisits,
               COUNT(DISTINCT visitor_id) AS uniqueVisitors,
               COUNT(DISTINCT CASE WHEN country_code != 'XX' THEN country_code END) AS countries,
               COALESCE(SUM(CASE WHEN date(visited_at) = date('now') THEN 1 ELSE 0 END), 0) AS today
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
    ]);

    return Response.json({ totals, countries: countries.results, pages: pages.results, daily: daily.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load analytics" }, { status: 500 });
  }
}
