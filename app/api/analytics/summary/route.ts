import { env } from "cloudflare:workers";

export async function GET() {
  try {
    const [totals, countries] = await Promise.all([
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
    ]);

    return Response.json({ totals, countries: countries.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load analytics" }, { status: 500 });
  }
}
