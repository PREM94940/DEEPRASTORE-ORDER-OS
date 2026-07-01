import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const sql = postgres(process.env.DATABASE_URL!);

async function gatherEvidence() {
  console.log("=== RAW EVIDENCE GATHERING ===");
  
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

  process.exit(0);
}

gatherEvidence();
