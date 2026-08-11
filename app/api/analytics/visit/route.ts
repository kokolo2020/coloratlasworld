import { getCloudflareEnv } from "@/lib/cloudflare-bindings";
import { ensureAnalyticsSchema } from "@/lib/analytics-schema";

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryFromRequest(request: Request) {
  const raw = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "XX";
  const code = /^[A-Z]{2}$/i.test(raw) ? raw.toUpperCase() : "XX";
  return { code, name: code === "XX" || code === "T1" ? "Unknown" : displayNames.of(code) || code };
}

export async function POST(request: Request) {
  try {
    const env = await getCloudflareEnv();
    if (!env?.DB) return Response.json({ ok: true, preview: true });
    await ensureAnalyticsSchema(env.DB);

    const body = (await request.json()) as { visitorId?: string; sessionId?: string; path?: string; durationSeconds?: number };
    const visitorId = body.visitorId?.slice(0, 100);
    const sessionId = body.sessionId?.slice(0, 100);
    const path = body.path?.slice(0, 300) || "/";
    const durationSeconds = Math.max(0, Math.min(86_400, Math.round(Number(body.durationSeconds) || 0)));
    if (!visitorId || !sessionId) return Response.json({ error: "Missing visitor session" }, { status: 400 });

    const country = countryFromRequest(request);
    await env.DB.prepare(
      `INSERT INTO visits (visitor_id, session_id, country_code, country_name, path, last_seen_at, duration_seconds)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         last_seen_at = CURRENT_TIMESTAMP,
         duration_seconds = CASE
           WHEN excluded.duration_seconds > visits.duration_seconds THEN excluded.duration_seconds
           ELSE visits.duration_seconds
         END,
         path = excluded.path`
    ).bind(visitorId, sessionId, country.code, country.name, path, durationSeconds).run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to record visit" }, { status: 500 });
  }
}
