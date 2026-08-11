ALTER TABLE `visits` ADD COLUMN `last_seen_at` text;
--> statement-breakpoint
UPDATE `visits` SET `last_seen_at` = COALESCE(`last_seen_at`, `visited_at`, CURRENT_TIMESTAMP);
--> statement-breakpoint
ALTER TABLE `visits` ADD COLUMN `duration_seconds` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `search_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text NOT NULL,
	`session_id` text NOT NULL,
	`query` text NOT NULL,
	`normalized_query` text NOT NULL,
	`matched` integer DEFAULT 0 NOT NULL,
	`result_slug` text,
	`result_name` text,
	`path` text DEFAULT '/' NOT NULL,
	`searched_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `search_events_query_idx` ON `search_events` (`normalized_query`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `search_events_session_idx` ON `search_events` (`session_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `search_events_searched_at_idx` ON `search_events` (`searched_at`);
