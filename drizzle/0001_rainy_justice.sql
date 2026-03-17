CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`pomo_duration_minutes` integer DEFAULT 25 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
