import { OrderService } from './packages/infrastructure/src/services/OrderService';
import { db, client } from './packages/infrastructure/src/db/client';
import { createOrderDraft } from './apps/storefront/src/app/actions/checkout';
import { submitUtrAction } from './apps/storefront/src/app/actions/payment';
import { verifyPaymentAction } from './apps/admin-portal/src/app/actions/paymentVerification';

async function verify() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  console.log('--- Setting up Test Order ---');
  const order = await createOrderDraft({
    sku: 'STATE-MACHINE', price: 100, name: 'State Machine Test', phone: '9999999999',
    address: 'S', city: 'S', pincode: '5', paymentMethod: 'upi'
  });
  await submitUtrAction({ orderId: order.orderId, utrNumber: '999999999999' });
  await verifyPaymentAction(order.orderId, 'Admin');

  console.log('\n--- Testing State Machine Transitions ---');
  
  // Test A: CONFIRMED -> STITCHING
  // Note: verification sets status to CONFIRMED
  try {
    await service.updateOrderProductionStatus(tenantId, order.orderId, 'STITCHING');
    console.log('Test A (CONFIRMED -> STITCHING): PASS (Allowed)');
  } catch (e: any) {
    console.log('Test A (CONFIRMED -> STITCHING): FAIL -', e.message);
  }

  // Test B: STITCHING -> READY
  try {
    await service.updateOrderProductionStatus(tenantId, order.orderId, 'READY');
    console.log('Test B (STITCHING -> READY): PASS (Allowed)');
  } catch (e: any) {
    console.log('Test B (STITCHING -> READY): FAIL -', e.message);
  }

  // Test C: READY -> STITCHING (Should Fail)
  try {
    await service.updateOrderProductionStatus(tenantId, order.orderId, 'STITCHING');
    console.log('Test C (READY -> STITCHING): FAIL (Allowed backward movement!)');
  } catch (e: any) {
    console.log('Test C (READY -> STITCHING): PASS (Blocked) -', e.message);
  }

  await client.end();
  process.exit(0);
}

verify();
