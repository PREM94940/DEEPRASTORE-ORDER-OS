const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' }); // production

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function run() {
  try {
    const cols = await sql`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'enquiries' 
        AND column_name IN (
          'line_items', 
          'subtotal_amount', 
          'discount_amount', 
          'delivery_amount', 
          'total_amount', 
          'advance_amount',
          'product_type'
        )
      ORDER BY column_name
    `;
    console.log(JSON.stringify(cols, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}
run();
