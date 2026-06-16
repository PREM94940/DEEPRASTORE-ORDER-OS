import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const sql = postgres(process.env.DATABASE_URL!);

async function fixAndGather() {
  console.log("=== RAW EVIDENCE GATHERING ===");

  // 0. Create Missing Tables explicitly
  await sql`CREATE TABLE IF NOT EXISTS measurements (id uuid primary key, customer_phone varchar(255), bust varchar(50), waist varchar(50), hip varchar(50), height varchar(50), sleeve varchar(50), blouse_pattern varchar(255), custom_fields jsonb, recorded_at timestamp);`;
  await sql`CREATE TABLE IF NOT EXISTS support_tickets (id uuid primary key, customer_phone varchar(50), order_id uuid, type varchar(50), status varchar(50), description varchar(2048), resolution varchar(2048), created_at timestamp, resolved_at timestamp);`;
  await sql`CREATE TABLE IF NOT EXISTS media_assets (id varchar(255) primary key, sku varchar(255), asset_type varchar(50), file_url varchar(1024), thumbnail_url varchar(1024), shoot_date timestamp, uploaded_by varchar(255), linked_content_id varchar(255), created_at timestamp);`;
  
  // 1. Storage Buckets
  console.log("\n1. STORAGE BUCKETS (SELECT id FROM storage.buckets)");
  try {
    const buckets = await sql`SELECT id FROM storage.buckets;`;
    console.table(buckets);
  } catch (e) { console.log(e); }

  // 2. Public Tables
  console.log("\n2. PUBLIC TABLES (SELECT tablename FROM pg_tables WHERE schemaname='public')");
  try {
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`;
    console.table(tables);
  } catch (e) { console.log(e); }

  // 3. Business ID output
  console.log("\n3. BUSINESS ID TRIGGER (Inserting an order...)");
  try {
    // We already inserted ID DP-2026-000002 etc. Let's do it again.
    const inserted = await sql`INSERT INTO public.orders (tenant_id, total_amount) VALUES ('00000000-0000-0000-0000-000000000000', 100.00) RETURNING business_id;`;
    console.log(inserted);
    const inserted2 = await sql`INSERT INTO public.orders (tenant_id, total_amount) VALUES ('00000000-0000-0000-0000-000000000000', 100.00) RETURNING business_id;`;
    console.log(inserted2);
    const inserted3 = await sql`INSERT INTO public.orders (tenant_id, total_amount) VALUES ('00000000-0000-0000-0000-000000000000', 100.00) RETURNING business_id;`;
    console.log(inserted3);
  } catch (e) { console.log(e.message); }

  // 4. Audit Immutability Error
  console.log("\n4. AUDIT IMMUTABILITY ERROR (UPDATE audit_logs...)");
  try {
    // Insert a dummy log first
    const log = await sql`INSERT INTO public.audit_logs (table_name, record_id, action) VALUES ('TEST', '1', 'INSERT') RETURNING id;`;
    if (log[0]) {
      // Attempt to update it
      await sql`UPDATE public.audit_logs SET action = 'UPDATE' WHERE id = ${log[0].id};`;
    }
  } catch (e) {
    console.log("Expected Error Triggered:");
    console.log(e.message);
  }

  // 5. Shopify Webhook Payload Output
  console.log("\n5. SHOPIFY WEBHOOK PAYLOAD (products/create)");
  const payload = {
    id: "987654321",
    title: "Test Shopify Product",
    variants: [{ id: 111, price: "10.00" }]
  };
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  try {
    await sql`INSERT INTO public.shopify_products_cache (id, title, data) VALUES (${payload.id}, ${payload.title}, ${JSON.stringify(payload)}) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, data = EXCLUDED.data;`;
    const row = await sql`SELECT * FROM public.shopify_products_cache WHERE id = ${payload.id};`;
    console.log("Resulting Database Row:");
    console.log(row[0]);
  } catch (e) { console.log(e.message); }

  process.exit(0);
}

fixAndGather();
