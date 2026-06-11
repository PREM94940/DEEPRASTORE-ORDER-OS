CREATE TYPE "public"."asset_state" AS ENUM('UPLOADING', 'READY', 'ARCHIVED', 'DELETED', 'FAILED_UPLOAD');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('SUPABASE', 'S3');--> statement-breakpoint
CREATE TYPE "public"."theme_role" AS ENUM('MAIN', 'UNPUBLISHED', 'DEVELOPMENT');--> statement-breakpoint
CREATE TYPE "public"."theme_status" AS ENUM('ACTIVE', 'ARCHIVED', 'DELETED');--> statement-breakpoint
CREATE TABLE "theme_asset_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"actor_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_asset_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256_checksum" varchar(64) NOT NULL,
	"storage_provider" "storage_provider" NOT NULL,
	"storage_key" varchar(1024) NOT NULL,
	"state" "asset_state" DEFAULT 'UPLOADING' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "theme_assets_tenant_id_sha256_checksum_unique" UNIQUE("tenant_id","sha256_checksum")
);
--> statement-breakpoint
CREATE TABLE "theme_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"action" varchar(255) NOT NULL,
	"actor_id" uuid NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_drafts" (
	"theme_id" uuid PRIMARY KEY NOT NULL,
	"draft_name" varchar(255),
	"config" jsonb,
	"last_edited_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_preview_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_publications" (
	"theme_id" uuid PRIMARY KEY NOT NULL,
	"active_version_id" uuid,
	"rollback_version_id" uuid,
	"published_by" uuid,
	"published_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"version_name" varchar(255),
	"version_number" integer NOT NULL,
	"change_summary" text,
	"config" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "theme_role" DEFAULT 'UNPUBLISHED' NOT NULL,
	"status" "theme_status" DEFAULT 'ACTIVE' NOT NULL,
	"description" text,
	"owner_user_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theme_asset_events" ADD CONSTRAINT "theme_asset_events_asset_id_theme_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."theme_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_asset_references" ADD CONSTRAINT "theme_asset_references_asset_id_theme_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."theme_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_audit_log" ADD CONSTRAINT "theme_audit_log_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_drafts" ADD CONSTRAINT "theme_drafts_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_preview_tokens" ADD CONSTRAINT "theme_preview_tokens_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_publications" ADD CONSTRAINT "theme_publications_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_publications" ADD CONSTRAINT "theme_publications_active_version_id_theme_versions_id_fk" FOREIGN KEY ("active_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_publications" ADD CONSTRAINT "theme_publications_rollback_version_id_theme_versions_id_fk" FOREIGN KEY ("rollback_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_asset_refs_asset_id" ON "theme_asset_references" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_asset_refs_type_id" ON "theme_asset_references" USING btree ("reference_type","reference_id");