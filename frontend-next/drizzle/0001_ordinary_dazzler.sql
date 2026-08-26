CREATE TABLE `guess_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` text NOT NULL,
	`asker_id` text NOT NULL,
	`answerer_id` text NOT NULL,
	`question_text` text NOT NULL,
	`guess_value` integer NOT NULL,
	`actual_value` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`answered_at` text,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asker_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`answerer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_guess_rounds_match` ON `guess_rounds` (`match_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_guess_rounds_answerer_pending` ON `guess_rounds` (`answerer_id`,`answered_at`);--> statement-breakpoint
DROP TABLE `messages`;