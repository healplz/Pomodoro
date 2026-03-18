ALTER TABLE `user_settings` ADD `wait_duration_minutes` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `strict_wait` integer DEFAULT false NOT NULL;