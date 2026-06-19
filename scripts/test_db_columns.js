const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const sql = postgres(process.env.DATABASE_URL);

async function inspect() {
  const tables = ['customer_notes', 'measurements_history', 'customers'];
  for (const t of tables) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${t}
    `;
    console.log(`\nTable: ${t}`);
    console.log(cols.map(c => `${c.column_name}: ${c.data_type}`));
  }
  process.exit(0);
}

inspect().catch(console.error);
