CREATE TABLE IF NOT EXISTS "system_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_type" varchar(255) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
