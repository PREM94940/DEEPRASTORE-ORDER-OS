CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(255) NOT NULL,
	"record_id" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"staff_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bug_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" varchar(50) NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"reported_by" varchar(255) NOT NULL,
	"source" varchar(50) NOT NULL,
	"severity" varchar(10) NOT NULL,
	"module" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"fixed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bug_registry_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"order_id" uuid,
	"staff" varchar(255) NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"content" varchar(2048),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_attribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"revenue" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"published_at" timestamp,
	"url" varchar(1024)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_name" varchar(255),
	"phone" varchar(255),
	"interested_product" varchar(255),
	"assigned_staff" varchar(255),
	"status" varchar(50) DEFAULT 'NEW_LEAD' NOT NULL,
	"last_contact_date" timestamp,
	"next_followup_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" varchar(50) NOT NULL,
	"order_id" uuid,
	"customer_phone" varchar(20),
	"category" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"assigned_staff" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "support_tickets_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(255),
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"postal_code" varchar(50) NOT NULL,
	"country" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(255) NOT NULL,
	"note" varchar(2048),
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(50) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ltv" numeric(10, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"has_open_ticket" boolean DEFAULT false,
	"has_refund_history" boolean DEFAULT false,
	"vip_customer" boolean DEFAULT false,
	"blacklist_flag" boolean DEFAULT false,
	"tenant_id" uuid,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "measurements_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"customer_phone" varchar(255) NOT NULL,
	"bust" varchar(50),
	"waist" varchar(50),
	"hip" varchar(50),
	"height" varchar(50),
	"sleeve" varchar(50),
	"blouse_pattern" varchar(255),
	"custom_fields" jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"description" text NOT NULL,
	"raised_by_staff_id" varchar(255),
	"resolved_by_staff_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "exceptions_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "business_id_seq" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(255),
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"postal_code" varchar(50) NOT NULL,
	"country" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" varchar(255),
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"expected_delivery_date" timestamp,
	"delay_reason" varchar(255),
	"measurements" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" varchar(50),
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_phone" varchar(50),
	"customer_name" varchar(255),
	"source" varchar(50) DEFAULT 'WHATSAPP' NOT NULL,
	"order_category" varchar(50) DEFAULT 'READY_MADE' NOT NULL,
	"primary_image_url" varchar(1024) NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"payment_method" varchar(50),
	"payment_status" varchar(50) DEFAULT 'UNPAID' NOT NULL,
	"production_status" varchar(50) DEFAULT 'NOT_STARTED' NOT NULL,
	"dispatch_status" varchar(50) DEFAULT 'NOT_STARTED' NOT NULL,
	"status_updated_at" timestamp DEFAULT now() NOT NULL,
	"utr_number" varchar(100),
	"payment_proof_url" varchar(1024),
	"verification_staff" varchar(255),
	"verification_time" timestamp,
	"expected_delivery_date" timestamp,
	"assigned_staff" varchar(255),
	"last_updated_by" varchar(255),
	"last_customer_contact_date" timestamp,
	"customer_informed" varchar(10) DEFAULT 'YES' NOT NULL,
	"last_status_message_sent" varchar(1024),
	"next_followup_date" timestamp,
	"delay_reason" varchar(255),
	"exception_reason" varchar(255),
	"exception_description" varchar(2048),
	"exception_evidence_url" varchar(1024),
	"exception_raised_date" timestamp,
	"exception_status" varchar(50) DEFAULT 'NONE' NOT NULL,
	"order_number" varchar(50),
	"courier_name" varchar(255),
	"tracking_id" varchar(255),
	"tracking_url" varchar(1024),
	"dispatch_date" timestamp,
	"delivery_proof_url" varchar(1024),
	"notes" varchar(2048),
	"total_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_business_id_unique" UNIQUE("business_id"),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"utr" varchar(255),
	"screenshot_url" varchar(1024),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"verified_by" varchar(255),
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"sku" varchar(255),
	"asset_type" varchar(50),
	"file_url" varchar(1024),
	"thumbnail_url" varchar(1024),
	"shoot_date" timestamp,
	"uploaded_by" varchar(255),
	"linked_content_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_products_cache" (
	"shopify_product_id" varchar(255) PRIMARY KEY NOT NULL,
	"sku" varchar(255),
	"title" varchar(255) NOT NULL,
	"price" numeric(10, 2),
	"inventory" integer,
	"image_url" varchar(1024),
	"variant_id" varchar(255),
	"status" varchar(50),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approved_staff" (
	"email" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"role" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"customer_phone" varchar(20),
	"message_template_id" varchar(100),
	"message_body" text NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"error_details" text,
	"scheduled_for" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_attribution" ADD CONSTRAINT "content_attribution_content_id_content_pieces_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_pieces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_phone_customers_phone_fk" FOREIGN KEY ("customer_phone") REFERENCES "public"."customers"("phone") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_phone_customers_phone_fk" FOREIGN KEY ("customer_phone") REFERENCES "public"."customers"("phone") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_phone_customers_phone_fk" FOREIGN KEY ("phone") REFERENCES "public"."customers"("phone") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements_history" ADD CONSTRAINT "measurements_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_raised_by_staff_id_approved_staff_email_fk" FOREIGN KEY ("raised_by_staff_id") REFERENCES "public"."approved_staff"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_resolved_by_staff_id_approved_staff_email_fk" FOREIGN KEY ("resolved_by_staff_id") REFERENCES "public"."approved_staff"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_phone_customers_phone_fk" FOREIGN KEY ("customer_phone") REFERENCES "public"."customers"("phone") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_customer_phone_customers_phone_fk" FOREIGN KEY ("customer_phone") REFERENCES "public"."customers"("phone") ON DELETE no action ON UPDATE no action;