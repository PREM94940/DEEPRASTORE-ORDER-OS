const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to (.env):', dbUrl.replace(/:[^@]*@/, ':***@'));

const sql = postgres(dbUrl, { max: 1, prepare: false });

async function run() {
  try {
    const cols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enquiries' 
      ORDER BY ordinal_position
    `;
    console.log('\nColumns in enquiries table (PRODUCTION):');
    cols.forEach(c => console.log(' -', c.column_name));
    
    const hasSubtotal = cols.some(c => c.column_name === 'subtotal_amount');
    console.log('\nsubtotal_amount exists:', hasSubtotal);
    const hasLineItems = cols.some(c => c.column_name === 'line_items');
    console.log('line_items exists:', hasLineItems);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}
run();
