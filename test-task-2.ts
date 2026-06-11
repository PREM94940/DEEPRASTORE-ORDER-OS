import { submitUtrAction } from './apps/storefront/src/app/actions/payment';
import { db, client } from './packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('Testing submitUtrAction...');
  const orderId = '1abfb109-b46a-4116-b4a3-1578895097e9'; // Reusing the order from Task 1

  const result = await submitUtrAction({
    orderId,
    utrNumber: '123456789012'
  });
  
  if (result.success) {
    console.log('PASS: UTR successfully submitted!');
    
    // 1. Verify UTR and payment_status in DB
    const orderCheck = await db.execute(sql`
      SELECT id, payment_status, utr_number 
      FROM orders 
      WHERE id=${orderId}
    `);
    console.log('\n--- UTR Record ---');
    console.log(orderCheck);

  } else {
    console.error('FAIL:', result.error);
  }
  
  await client.end();
  process.exit(0);
}

verify();
