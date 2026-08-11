const ANALYTICS_SCHEMA_KEY = "__colorAtlasAnalyticsSchemaReady";

type AnalyticsGlobal = typeof globalThis & {
  __colorAtlasAnalyticsSchemaReady?: Promise<void>;
};

async function ignoreDuplicateColumn(statement: Promise<unknown>) {
  try {
    await statement;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column|already exists/i.test(message)) throw error;
  }
}

export async function ensureAnalyticsSchema(db: D1Database) {
  const scope = globalThis as AnalyticsGlobal;
  if (!scope[ANALYTICS_SCHEMA_KEY]) {
    scope[ANALYTICS_SCHEMA_KEY] = (async () => {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS visits (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          visitor_id text NOT NULL,
          session_id text NOT NULL,
          country_code text DEFAULT 'XX' NOT NULL,
          country_name text DEFAULT 'Unknown' NOT NULL,
          path text DEFAULT '/' NOT NULL,
          visited_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
          last_seen_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
          duration_seconds integer DEFAULT 0 NOT NULL
        )
      `).run();

      await ignoreDuplicateColumn(db.prepare(`ALTER TABLE visits ADD COLUMN last_seen_at text`).run());
      await ignoreDuplicateColumn(db.prepare(`ALTER TABLE visits ADD COLUMN duration_seconds integer DEFAULT 0 NOT NULL`).run());
      await db.prepare(`UPDATE visits SET last_seen_at = COALESCE(last_seen_at, visited_at, CURRENT_TIMESTAMP)`).run();

      await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS visits_session_id_unique ON visits (session_id)`).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS search_events (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          visitor_id text NOT NULL,
          session_id text NOT NULL,
          query text NOT NULL,
          normalized_query text NOT NULL,
          matched integer DEFAULT 0 NOT NULL,
          result_slug text,
          result_name text,
          path text DEFAULT '/' NOT NULL,
          searched_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `).run();

      await db.prepare(`CREATE INDEX IF NOT EXISTS search_events_query_idx ON search_events (normalized_query)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS search_events_session_idx ON search_events (session_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS search_events_searched_at_idx ON search_events (searched_at)`).run();
    })();
  }
  return scope[ANALYTICS_SCHEMA_KEY];
}
