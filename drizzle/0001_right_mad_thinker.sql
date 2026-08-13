CREATE TABLE `attachment_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attachmentId` varchar(128) NOT NULL,
	`recordType` varchar(32) NOT NULL,
	`recordId` varchar(128) NOT NULL,
	`objectKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`byteSize` int NOT NULL,
	`uploadStatus` enum('pending','uploaded','failed') NOT NULL DEFAULT 'pending',
	`deletedAt` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attachment_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `attachment_assets_owner_attachment_unique` UNIQUE(`userId`,`attachmentId`)
);
--> statement-breakpoint
CREATE TABLE `sync_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(32) NOT NULL,
	`entityId` varchar(128) NOT NULL,
	`operation` enum('upsert','delete') NOT NULL,
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `synced_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(32) NOT NULL,
	`entityId` varchar(128) NOT NULL,
	`payload` text NOT NULL,
	`updatedAt` varchar(40) NOT NULL,
	`deletedAt` varchar(40),
	`revision` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `synced_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `synced_entities_owner_entity_unique` UNIQUE(`userId`,`entityType`,`entityId`)
);
--> statement-breakpoint
ALTER TABLE `attachment_assets` ADD CONSTRAINT `attachment_assets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sync_changes` ADD CONSTRAINT `sync_changes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `synced_entities` ADD CONSTRAINT `synced_entities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attachment_assets_owner_record` ON `attachment_assets` (`userId`,`recordType`,`recordId`);--> statement-breakpoint
CREATE INDEX `sync_changes_owner_cursor` ON `sync_changes` (`userId`,`id`);--> statement-breakpoint
CREATE INDEX `synced_entities_owner_updated` ON `synced_entities` (`userId`,`updatedAt`);