CREATE TABLE "customer_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD COLUMN "used_at" timestamp;--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD COLUMN "attempts_count" integer DEFAULT 0 NOT NULL;