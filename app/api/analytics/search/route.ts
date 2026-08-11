import { ensureAnalyticsSchema } from "@/lib/analytics-schema";
import { getCloudflareEnv } from "@/lib/cloudflare-bindings";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const env = await getCloudflareEnv();
    if (!env?.DB) return Response.json({ ok: true, preview: true });
    await ensureAnalyticsSchema(env.DB);

    const body = await request.json() as {
      visitorId?: string;
      sessionId?: string;
      query?: string;
      matched?: boolean;
      resultSlug?: string;
      resultName?: string;
      path?: string;
    };
    const visitorId = clean(body.visitorId, 100);
    const sessionId = clean(body.sessionId, 100);
    const query = clean(body.query, 160);
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, " ");
    const resultSlug = clean(body.resultSlug, 120) || null;
    const resultName = clean(body.resultName, 160) || null;
    const path = clean(body.path, 300) || "/";

    if (!visitorId || !sessionId || !query) {
      return Response.json({ error: "Missing search event" }, { status: 400 });
    }

    await env.DB.prepare(`
      INSERT INTO search_events (visitor_id, session_id, query, normalized_query, matched, result_slug, result_name, path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(visitorId, sessionId, query, normalizedQuery, body.matched ? 1 : 0, resultSlug, resultName, path).run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to record search" }, { status: 500 });
  }
}
