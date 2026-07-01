CREATE TABLE "enquiry_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"staff_name" varchar(255) NOT NULL,
	"comment" varchar(2048) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiry_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"quote_amount" numeric(10, 2) NOT NULL,
	"required_advance" numeric(10, 2) NOT NULL,
	"base_price" numeric(10, 2),
	"discount_amount" numeric(10, 2),
	"delivery_amount" numeric(10, 2),
	"delivery_type" varchar(50),
	"payment_link_url" varchar(1024),
	"quote_notes" varchar(2048),
	"invoice_url" varchar(1024),
	"expires_at" timestamp,
	"created_by" varchar(255),
	"status_snapshot" varchar(50),
	"created_from_status" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"reason" varchar(2048) NOT NULL,
	"cost_impact" numeric(10, 2) DEFAULT '0',
	"delivery_impact_days" integer DEFAULT 0,
	"requested_by" varchar(255) NOT NULL,
	"approval_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"approved_by" varchar(255),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" varchar(50) PRIMARY KEY DEFAULT 'default_config' NOT NULL,
	"company_name" varchar(255),
	"company_address" varchar(1000),
	"support_number" varchar(50),
	"whatsapp_number" varchar(50),
	"instagram_url" varchar(500),
	"website_url" varchar(500),
	"logo_url" varchar(1000),
	"gst_number" varchar(50),
	"upi_id" varchar(255),
	"bank_details" jsonb,
	"invoice_prefix" varchar(20),
	"order_prefix" varchar(20),
	"terms_and_conditions" varchar(2000),
	"default_courier" varchar(100),
	"default_delivery_charge" varchar(50),
	"default_advance_percentage" varchar(10),
	"feature_flags" jsonb,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "status" SET DEFAULT 'NEW_REQUEST';--> statement-breakpoint
ALTER TABLE "exceptions" ALTER COLUMN "severity" SET DEFAULT 'NORMAL';--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "line_items" jsonb;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "subtotal_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "discount_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "delivery_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "total_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "advance_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "enquiry_number" varchar(50);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "address" varchar(1024);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "website_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "advance_payment_proof_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "utr" varchar(100);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "tracking_token" varchar(100);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "assigned_to" varchar(255);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "current_quote_id" uuid;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "customer_response" varchar(50);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "customer_response_notes" varchar(2048);--> statement-breakpoint
ALTER TABLE "exceptions" ADD COLUMN "customer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "exceptions" ADD COLUMN "customer_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "exceptions" ADD COLUMN "order_stage" varchar(50);--> statement-breakpoint
ALTER TABLE "exceptions" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "website_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_token" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "base_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_type" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "razorpay_payment_link_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "razorpay_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "enquiry_comments" ADD CONSTRAINT "enquiry_comments_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_quotes" ADD CONSTRAINT "enquiry_quotes_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_change_requests" ADD CONSTRAINT "order_change_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;