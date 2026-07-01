require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function testInsert() {
  try {
    const res = await sql`
      INSERT INTO public.enquiries (
        tenant_id, customer_name, customer_phone, source, status
      ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Test User',
        '1234567890',
        'WEBSITE',
        'NEW_REQUEST'
      ) RETURNING *
    `;
    console.log(res);
  } catch (e) {
    console.error('Insert failed:', e);
  } finally {
    process.exit(0);
  }
}
testInsert();
