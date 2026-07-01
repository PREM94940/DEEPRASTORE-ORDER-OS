const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

async function run() {
  try {
    const rows = await sql`
      SELECT id, customer_name, customer_phone, source, product_type, 
             line_items, subtotal_amount, discount_amount, delivery_amount, 
             total_amount, advance_amount, enquiry_number, status, tracking_token
      FROM enquiries 
      WHERE customer_phone = '9876543210'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (rows.length === 0) {
      console.log('❌ No enquiry found for phone 9876543210');
      return;
    }
    
    const row = rows[0];
    console.log('✅ Enquiry found in database!');
    console.log('  Enquiry Number:', row.enquiry_number);
    console.log('  Customer:', row.customer_name);
    console.log('  Phone:', row.customer_phone);
    console.log('  Source:', row.source);
    console.log('  Status:', row.status);
    console.log('  Product Type:', row.product_type);
    console.log('  Subtotal:', row.subtotal_amount);
    console.log('  Discount:', row.discount_amount);
    console.log('  Delivery:', row.delivery_amount);
    console.log('  Total:', row.total_amount);
    console.log('  Advance:', row.advance_amount);
    console.log('  Tracking Token:', row.tracking_token);
    
    const lineItems = row.line_items;
    console.log('\n  Line Items (' + (Array.isArray(lineItems) ? lineItems.length : 0) + ' products):');
    if (Array.isArray(lineItems)) {
      lineItems.forEach((item, i) => {
        console.log(`    ${i+1}. ${item.name} | Qty: ${item.qty} | Price: ${item.price} | Total: ${item.lineTotal}`);
      });
    }
    
    // Verification
    console.log('\n--- VERIFICATION ---');
    const itemCount = Array.isArray(lineItems) ? lineItems.length : 0;
    console.log('Products count = 5?', itemCount === 5 ? '✅ YES' : '❌ NO (' + itemCount + ')');
    console.log('Total = 16648?', row.total_amount === '16648' || row.total_amount === '16648.00' ? '✅ YES' : '❌ NO (' + row.total_amount + ')');
    console.log('Source = WALKIN?', row.source === 'WALKIN' ? '✅ YES' : '❌ NO (' + row.source + ')');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}
run();
