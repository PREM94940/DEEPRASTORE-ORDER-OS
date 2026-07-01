require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function checkDB() {
  const enq = await sql`SELECT id, status, tracking_token FROM enquiries ORDER BY id DESC LIMIT 5`;
  console.log("Enquiries:", enq);
  const ord = await sql`SELECT id, status, tracking_token FROM orders ORDER BY id DESC LIMIT 5`;
  console.log("Orders:", ord);
  process.exit(0);
}
checkDB();
