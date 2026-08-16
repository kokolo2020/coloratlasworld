import { getCloudflareEnv } from "@/lib/cloudflare-bindings";
import { ensureAnalyticsSchema } from "@/lib/analytics-schema";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const env = await getCloudflareEnv();
    if (!env?.DB) return Response.json({ ok: true, preview: true });
    await ensureAnalyticsSchema(env.DB);

    const body = (await request.json()) as Record<string, unknown>;
    const visitorId = clean(body.visitorId, 100);
    const sessionId = clean(body.sessionId, 100);
    const partner = clean(body.partner, 80);
    const placement = clean(body.placement, 40);
    const countrySlug = clean(body.countrySlug, 120);
    const countryName = clean(body.countryName, 120);
    const path = clean(body.path, 300) || "/";

    if (!visitorId || !sessionId || !partner || !countrySlug) {
      return Response.json({ error: "Missing sponsor click details" }, { status: 400 });
    }

    await env.DB.prepare(`
      INSERT INTO sponsor_click_events
        (visitor_id, session_id, partner, placement, country_slug, country_name, path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(visitorId, sessionId, partner, placement, countrySlug, countryName, path).run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to record sponsor click" }, { status: 500 });
  }
}
