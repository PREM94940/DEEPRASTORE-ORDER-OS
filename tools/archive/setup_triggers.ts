import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function setupTriggers() {
  console.log('--- SETTING UP CUSTOM TRIGGERS ---');
  
  try {
    // 1. Business ID Trigger
    console.log('Setting up Business ID Trigger on orders...');
    await client`
      CREATE OR REPLACE FUNCTION generate_business_id()
      RETURNS TRIGGER AS $$
      DECLARE
        seq_val INT;
      BEGIN
        IF NEW.business_id IS NULL THEN
          -- Note: drizzle serial creates a sequence named 'table_name_col_name_seq'
          seq_val := nextval('business_id_seq_id_seq');
          NEW.business_id := 'DP-2026-' || LPAD(seq_val::text, 6, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client`DROP TRIGGER IF EXISTS trigger_generate_business_id ON orders;`;
    
    await client`
      CREATE TRIGGER trigger_generate_business_id
      BEFORE INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION generate_business_id();
    `;
    
    // 2. Audit Log Immutability Trigger
    console.log('Setting up Audit Log Immutability Trigger...');
    await client`
      CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client`DROP TRIGGER IF EXISTS trigger_prevent_audit_update ON audit_logs;`;
    
    await client`
      CREATE TRIGGER trigger_prevent_audit_update
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_log_modification();
    `;
    
    console.log('✅ Triggers successfully configured.');
  } catch(e) {
    console.error('Error setting up triggers:', e);
  } finally {
    process.exit(0);
  }
}

setupTriggers();
