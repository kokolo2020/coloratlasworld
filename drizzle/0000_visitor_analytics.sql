CREATE TABLE IF NOT EXISTS `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text NOT NULL,
	`session_id` text NOT NULL,
	`country_code` text DEFAULT 'XX' NOT NULL,
	`country_name` text DEFAULT 'Unknown' NOT NULL,
	`path` text DEFAULT '/' NOT NULL,
	`visited_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `visits_session_id_unique` ON `visits` (`session_id`);
