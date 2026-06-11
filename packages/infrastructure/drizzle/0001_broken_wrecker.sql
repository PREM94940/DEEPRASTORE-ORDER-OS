CREATE TYPE "public"."theme_version_state" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "theme_version_asset_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_version_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	"version_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"actor_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theme_versions" ADD COLUMN "state" "theme_version_state" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD COLUMN "is_current" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD COLUMN "parent_version_id" uuid;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD COLUMN "created_from_version_id" uuid;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_version_asset_references" ADD CONSTRAINT "theme_version_asset_references_version_id_theme_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."theme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_version_asset_references" ADD CONSTRAINT "theme_version_asset_references_asset_id_theme_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."theme_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_version_events" ADD CONSTRAINT "theme_version_events_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_version_events" ADD CONSTRAINT "theme_version_events_version_id_theme_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."theme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_version_asset_refs_version_id" ON "theme_version_asset_references" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "idx_version_asset_refs_asset_id" ON "theme_version_asset_references" USING btree ("asset_id");--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_parent_version_id_theme_versions_id_fk" FOREIGN KEY ("parent_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_created_from_version_id_theme_versions_id_fk" FOREIGN KEY ("created_from_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_theme_versions_unique_current" ON "theme_versions" USING btree ("theme_id") WHERE "theme_versions"."is_current" = true;