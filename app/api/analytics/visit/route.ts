import { getCloudflareEnv } from "@/lib/cloudflare-bindings";

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

    const body = (await request.json()) as { visitorId?: string; sessionId?: string; path?: string };
    const visitorId = body.visitorId?.slice(0, 100);
    const sessionId = body.sessionId?.slice(0, 100);
    const path = body.path?.slice(0, 300) || "/";
    if (!visitorId || !sessionId) return Response.json({ error: "Missing visitor session" }, { status: 400 });

    const country = countryFromRequest(request);
    await env.DB.prepare(
      `INSERT OR IGNORE INTO visits (visitor_id, session_id, country_code, country_name, path)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(visitorId, sessionId, country.code, country.name, path).run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to record visit" }, { status: 500 });
  }
}
