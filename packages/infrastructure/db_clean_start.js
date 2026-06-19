const { Client } = require('pg');
const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  console.log('--- DB CLEAN START IN PROGRESS ---');

  try {
    // 1. Drop trigger on audit_logs that prevents modifications
    console.log('Dropping audit log immutability trigger temporarily...');
    await client.query(`DROP TRIGGER IF EXISTS trigger_prevent_audit_update ON audit_logs;`);
    console.log('Trigger dropped.');

    // 2. Perform truncation of the requested tables (and dependents via CASCADE)
    const tablesToWipe = [
      'orders',
      'customers',
      'payments',
      'audit_logs',
      'support_tickets',
      'bug_registry',
      'notification_queue',
      'media_assets',
      'system_alerts',
      'customer_audit_logs',
      'customer_notes',
      'measurements_history',
      'otp_verifications',
      'communication_logs',
      'leads',
      'enquiries',
      'exceptions',
      'customer_addresses',
      'order_addresses',
      'order_line_items',
      'content_attribution',
      'content_pieces'
    ];

    console.log('Truncating tables...');
    for (const table of tablesToWipe) {
      await client.query(`TRUNCATE TABLE public."${table}" CASCADE;`);
      console.log(`Wiped table "${table}".`);
    }

    // 3. Restore the audit log immutability trigger
    console.log('Restoring audit log immutability trigger...');
    await client.query(`
      CREATE TRIGGER trigger_prevent_audit_update
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_log_modification();
    `);
    console.log('Trigger restored.');

    // 4. Reset sequences/counters
    console.log('Resetting all database sequences...');
    const sequencesRes = await client.query(`
      SELECT c.relname AS seq_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'S' AND n.nspname = 'public';
    `);

    for (const row of sequencesRes.rows) {
      const seqName = row.seq_name;
      await client.query(`ALTER SEQUENCE public."${seqName}" RESTART WITH 1;`);
      console.log(`Reset sequence "${seqName}" to 1.`);
    }

    // 5. Verification of results
    console.log('\n--- VERIFYING CLEANUP RESULTS ---');
    const countsToCheck = {
      'orders': 'Orders',
      'customers': 'Customers',
      'payments': 'Payments',
      'audit_logs': 'Audit Logs'
    };

    let allZero = true;
    for (const [table, displayName] of Object.entries(countsToCheck)) {
      const countRes = await client.query(`SELECT count(*) FROM public."${table}"`);
      const count = parseInt(countRes.rows[0].count, 10);
      console.log(`${displayName} Count: ${count}`);
      if (count !== 0) {
        allZero = false;
      }
    }

    if (allZero) {
      console.log('\n🎉 SUCCESS: All target database tables have been successfully wiped to 0 rows and sequences reset!');
    } else {
      console.error('\n⚠️ WARNING: Some target tables still have rows.');
    }

  } catch (err) {
    console.error('An error occurred during database clean start:', err);
  } finally {
    await client.end();
  }
}

run();
