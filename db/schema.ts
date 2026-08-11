import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const visits = sqliteTable("visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  countryCode: text("country_code").notNull().default("XX"),
  countryName: text("country_name").notNull().default("Unknown"),
  path: text("path").notNull().default("/"),
  visitedAt: text("visited_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  durationSeconds: integer("duration_seconds").notNull().default(0),
}, (table) => [
  uniqueIndex("visits_session_id_unique").on(table.sessionId),
]);

export const searchEvents = sqliteTable("search_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  query: text("query").notNull(),
  normalizedQuery: text("normalized_query").notNull(),
  matched: integer("matched").notNull().default(0),
  resultSlug: text("result_slug"),
  resultName: text("result_name"),
  path: text("path").notNull().default("/"),
  searchedAt: text("searched_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
