import { createOrderDraft } from './apps/storefront/src/app/actions/checkout';
import { db, client } from './packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('Testing createOrderDraft...');
  const result = await createOrderDraft({
    sku: 'RED-LEHENGA-002',
    price: 5000,
    name: 'Priya Sharma',
    phone: '9876543210',
    address: 'House No 123, Koramangala',
    city: 'Bangalore',
    pincode: '560034',
    paymentMethod: 'upi',
  });
  
  if (result.success) {
    console.log('PASS: Order successfully created!', result.orderId);
    
    // 1. Verify customer record exists
    const customerCheck = await db.execute(sql`SELECT * FROM customers WHERE phone='9876543210'`);
    console.log('\n--- Customer Record ---');
    console.log(customerCheck);

    // 2. Verify order references valid customer
    const orderId = result.orderId;
    const orderCheck = await db.execute(sql`
      SELECT o.id as order_id, o.customer_id, c.id as c_id 
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      WHERE o.id=${orderId}
    `);
    console.log('\n--- Foreign Key Verification ---');
    console.log(orderCheck);
  } else {
    console.error('FAIL:', result.error);
  }
  
  await client.end();
  process.exit(0);
}

verify();
