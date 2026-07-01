const postgres = require('postgres');
require('dotenv').config({ path: '../../.env.local' });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function run() {
  try {
    console.log('Connecting to:', process.env.DATABASE_URL.replace(/:[^@]*@/, ':***@'));
    
    // Check if subtotal_amount column exists
    const cols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enquiries' 
      ORDER BY ordinal_position
    `;
    console.log('\nColumns in enquiries table:');
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
