import { verifyPaymentAction, rejectPaymentAction } from './apps/admin-portal/src/app/actions/paymentVerification';
import { db, client } from './packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';
import { createOrderDraft } from './apps/storefront/src/app/actions/checkout';
import { submitUtrAction } from './apps/storefront/src/app/actions/payment';

async function verify() {
  console.log('--- Setting up Test Orders ---');
  // Order A: Happy Path
  const orderA = await createOrderDraft({
    sku: 'TEST-A', price: 100, name: 'Happy Path', phone: '1111111111',
    address: 'A', city: 'A', pincode: '1', paymentMethod: 'upi'
  });
  await submitUtrAction({ orderId: orderA.orderId, utrNumber: '111111111111' });

  // Order B: Failure Path
  const orderB = await createOrderDraft({
    sku: 'TEST-B', price: 200, name: 'Failure Path', phone: '2222222222',
    address: 'B', city: 'B', pincode: '2', paymentMethod: 'upi'
  });
  await submitUtrAction({ orderId: orderB.orderId, utrNumber: '222222222222' });

  console.log('\n--- Testing Payment Verification ---');
  
  // Happy Path: Approve A
  const resA = await verifyPaymentAction(orderA.orderId, 'TestAdmin');
  if (resA.success) {
    console.log(`PASS: Order A (${orderA.orderId}) verified successfully.`);
  } else {
    console.error('FAIL on A:', resA.error);
  }

  // Failure Path: Reject B
  const resB = await rejectPaymentAction(orderB.orderId);
  if (resB.success) {
    console.log(`PASS: Order B (${orderB.orderId}) rejected successfully.`);
  } else {
    console.error('FAIL on B:', resB.error);
  }

  console.log('\n--- Database State Verification ---');
  const dbCheck = await db.execute(sql`
    SELECT id, payment_status, verification_staff 
    FROM orders 
    WHERE id IN (${orderA.orderId}, ${orderB.orderId})
    ORDER BY customer_name ASC
  `);
  console.log(dbCheck);

  await client.end();
  process.exit(0);
}

verify();
