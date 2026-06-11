import { OrderService } from './packages/infrastructure/src/services/OrderService';
import { db, client } from './packages/infrastructure/src/db/client';
import { createOrderDraft } from './apps/storefront/src/app/actions/checkout';
import { submitUtrAction } from './apps/storefront/src/app/actions/payment';
import { verifyPaymentAction, rejectPaymentAction } from './apps/admin-portal/src/app/actions/paymentVerification';

async function verify() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  console.log('--- Setting up Test Orders ---');
  
  // Test A: VERIFIED (CONFIRMED)
  const orderA = await createOrderDraft({
    sku: 'PROD-A', price: 100, name: 'Test A', phone: '3333333333',
    address: 'A', city: 'A', pincode: '1', paymentMethod: 'upi'
  });
  await submitUtrAction({ orderId: orderA.orderId, utrNumber: '333333333333' });
  await verifyPaymentAction(orderA.orderId, 'MasterAdmin');

  // Test B: VERIFICATION_PENDING (DRAFT)
  const orderB = await createOrderDraft({
    sku: 'PROD-B', price: 200, name: 'Test B', phone: '4444444444',
    address: 'B', city: 'B', pincode: '2', paymentMethod: 'upi'
  });
  await submitUtrAction({ orderId: orderB.orderId, utrNumber: '444444444444' });

  // Test C: REJECTED (CANCELLED)
  const orderC = await createOrderDraft({
    sku: 'PROD-C', price: 300, name: 'Test C', phone: '5555555555',
    address: 'C', city: 'C', pincode: '3', paymentMethod: 'upi'
  });
  await submitUtrAction({ orderId: orderC.orderId, utrNumber: '555555555555' });
  await rejectPaymentAction(orderC.orderId);

  // Test D: Missing payment verification (DRAFT)
  const orderD = await createOrderDraft({
    sku: 'PROD-D', price: 400, name: 'Test D', phone: '6666666666',
    address: 'D', city: 'D', pincode: '4', paymentMethod: 'upi'
  });
  // No UTR submitted, no verification

  console.log('\n--- Fetching Production Queue ---');
  const queue = await service.getProductionQueue(tenantId);
  
  const foundA = queue.find(o => o.id === orderA.orderId);
  const foundB = queue.find(o => o.id === orderB.orderId);
  const foundC = queue.find(o => o.id === orderC.orderId);
  const foundD = queue.find(o => o.id === orderD.orderId);

  console.log(`Test A (VERIFIED): ${foundA ? 'PASS (Appears)' : 'FAIL (Missing)'}`);
  console.log(`Test B (VERIFICATION_PENDING): ${!foundB ? 'PASS (Does NOT appear)' : 'FAIL (Appears)'}`);
  console.log(`Test C (REJECTED): ${!foundC ? 'PASS (Does NOT appear)' : 'FAIL (Appears)'}`);
  console.log(`Test D (No UTR): ${!foundD ? 'PASS (Does NOT appear)' : 'FAIL (Appears)'}`);

  await client.end();
  process.exit(0);
}

verify();
