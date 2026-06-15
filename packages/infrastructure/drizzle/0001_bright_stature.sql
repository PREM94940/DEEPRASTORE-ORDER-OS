CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"product_type" varchar(50),
	"reference_images" jsonb,
	"design_images" jsonb,
	"notes" varchar(2048),
	"expected_delivery_date" timestamp,
	"measurements" jsonb,
	"status" varchar(50) DEFAULT 'NEW_ENQUIRY' NOT NULL,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "measurement_status" varchar(50) DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fabric_source" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fabric_details" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "advance_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "balance_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;