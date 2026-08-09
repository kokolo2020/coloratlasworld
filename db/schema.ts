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
}, (table) => [
  uniqueIndex("visits_session_id_unique").on(table.sessionId),
]);
