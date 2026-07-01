const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to PRODUCTION:', dbUrl.replace(/:[^@]*@/, ':***@'));

const sql = postgres(dbUrl, { max: 1, prepare: false });

async function run() {
  const statements = [
    `ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "subtotal_amount" numeric(10, 2)`,
    `ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(10, 2)`,
    `ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "delivery_amount" numeric(10, 2)`,
    `ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "total_amount" numeric(10, 2)`,
    `ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "advance_amount" numeric(10, 2)`,
    `ALTER TABLE "enquiries" ALTER COLUMN "product_type" TYPE varchar(500)`,
  ];

  try {
    for (const stmt of statements) {
      console.log('Executing:', stmt);
      await sql.unsafe(stmt);
      console.log('  ✅ OK');
    }
    console.log('\nAll statements applied successfully.');

    // Verify
    const cols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'enquiries' AND column_name IN ('subtotal_amount','discount_amount','delivery_amount','total_amount','advance_amount')
      ORDER BY column_name
    `;
    console.log('\nVerification - new columns present:', cols.map(c => c.column_name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}
run();
