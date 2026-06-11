import { OrderService } from './packages/infrastructure/src/services/OrderService';
import { db, client } from './packages/infrastructure/src/db/client';
import { createOrderDraft } from './apps/storefront/src/app/actions/checkout';
import { submitUtrAction } from './apps/storefront/src/app/actions/payment';
import { verifyPaymentAction, rejectPaymentAction } from './apps/admin-portal/src/app/actions/paymentVerification';
import { fetchCustomerOrdersAction } from './apps/storefront/src/app/actions/portal';
import { submitSupportTicketAction } from './apps/storefront/src/app/actions/support';

async function runRetest() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  console.log('================================================');
  console.log('FINAL TECHNICAL VALIDATION RETEST');
  console.log('================================================\n');

  try {
    // 1. Quick Order Link (Create Order)
    console.log('Test 1: Quick Order Link (Create Order)');
    const order1 = await createOrderDraft({
      sku: 'TEST-SKU-1', price: 5000, name: 'Pilot User', phone: '8080808080',
      address: '123 Pilot St', city: 'Test City', pincode: '500001', paymentMethod: 'upi'
    });
    if (order1.success) {
      console.log(`[PASS] Order Created successfully: ${order1.orderId}`);
    } else {
      console.log(`[FAIL] Order creation failed`);
    }

    // 2. UTR Upload
    console.log('\nTest 2: UTR Upload');
    const utrRes = await submitUtrAction({ orderId: order1.orderId, utrNumber: 'UTR1234567890' });
    const orderAfterUtr = await service.getOrdersByPhone(tenantId, '8080808080');
    if (utrRes.success && orderAfterUtr[0].paymentStatus === 'VERIFICATION_PENDING') {
      console.log(`[PASS] UTR Submitted, Payment Status updated to VERIFICATION_PENDING`);
    } else {
      console.log(`[FAIL] UTR Upload failed or status mismatch`);
    }

    // 3. Verification
    console.log('\nTest 3: Verification (Payment Approval)');
    try {
      await verifyPaymentAction(order1.orderId, 'Prem');
    } catch(e) {
      // Ignore Next.js static generation invariant error during CLI test
    }
    const orderAfterVerify = await service.getOrdersByPhone(tenantId, '8080808080');
    if (orderAfterVerify[0].paymentStatus === 'VERIFIED') {
      console.log(`[PASS] Payment Verified, status updated to VERIFIED`);
    } else {
      console.log(`[FAIL] Payment verification failed`);
    }

    // 4. Production Queue
    console.log('\nTest 4: Production Queue Visibility');
    const prodQueue = await service.getOrdersByPhone(tenantId, '8080808080');
    if (prodQueue[0].paymentStatus === 'VERIFIED' && prodQueue[0].status === 'CONFIRMED') {
      console.log(`[PASS] Order is eligible for Production Queue (VERIFIED & CONFIRMED)`);
    } else {
      console.log(`[FAIL] Order is not eligible for Production Queue`);
    }

    // 5. Status Updates
    console.log('\nTest 5: Production Status Updates (CONFIRMED -> STITCHING -> READY)');
    await service.updateOrderProductionStatus(tenantId, order1.orderId, 'STITCHING');
    await service.updateOrderProductionStatus(tenantId, order1.orderId, 'READY');
    const orderAfterProd = await service.getOrdersByPhone(tenantId, '8080808080');
    if (orderAfterProd[0].status === 'READY') {
      console.log(`[PASS] Status updated successfully to READY`);
    } else {
      console.log(`[FAIL] Status update failed`);
    }

    // 6. Portal Tracking
    console.log('\nTest 6: Portal Tracking (Customer Visibility)');
    const portalRes = await fetchCustomerOrdersAction('8080808080');
    if (portalRes.success && portalRes.orders.some((o: any) => o.id === order1.orderId && o.status === 'READY')) {
      console.log(`[PASS] Customer Portal fetched live data: order is READY`);
    } else {
      console.log(`[FAIL] Customer Portal did not fetch correct live data`);
    }

    // 7. Support Ticket
    console.log('\nTest 7: Support Ticket (With Evidence)');
    const supportRes = await submitSupportTicketAction(order1.orderId, 'Product Damage', 'Stitching is torn', 'https://s3.com/evidence1.jpg');
    if (supportRes.success) {
      const exceptions = await service.getOpenExceptions(tenantId);
      const isVisible = exceptions.find(e => e.id === order1.orderId && e.exceptionEvidenceUrl === 'https://s3.com/evidence1.jpg');
      if (isVisible) {
        console.log(`[PASS] Support Ticket created and is visible in Admin exceptions`);
      } else {
        console.log(`[FAIL] Support Ticket created but NOT visible in Admin`);
      }
    } else {
      console.log(`[FAIL] Support Ticket creation failed`);
    }

    // 8. Invalid UTR
    console.log('\nTest 8: Invalid UTR (Payment Rejection)');
    const order2 = await createOrderDraft({
      sku: 'TEST-SKU-2', price: 1000, name: 'Scammer', phone: '1112223334',
      address: 'Fake', city: 'Fake', pincode: '000000', paymentMethod: 'upi'
    });
    await submitUtrAction({ orderId: order2.orderId, utrNumber: 'FAKE_UTR_123' });
    try {
      await rejectPaymentAction(order2.orderId, 'Admin');
    } catch(e) {
      // Ignore Next.js invariant
    }
    const order2AfterReject = await service.getOrdersByPhone(tenantId, '1112223334');
    if (order2AfterReject[0].paymentStatus === 'REJECTED') {
      console.log(`[PASS] Payment rejected successfully`);
    } else {
      console.log(`[FAIL] Payment rejection failed`);
    }

    // 9. Missing Evidence
    console.log('\nTest 9: Missing Evidence (Support Ticket Blocker)');
    const badSupportRes = await submitSupportTicketAction(order1.orderId, 'Product Damage', 'Fake issue', '');
    if (!badSupportRes.success && badSupportRes.error.includes('NO EVIDENCE')) {
      console.log(`[PASS] Blocked support ticket without evidence (NO EVIDENCE = NO TICKET)`);
    } else {
      console.log(`[FAIL] Allowed support ticket without evidence!`);
    }

  } catch (error) {
    console.error('\n[FATAL ERROR] Retest execution failed:', error);
  } finally {
    console.log('\n================================================');
    console.log('RETEST COMPLETE');
    console.log('================================================');
    await client.end();
    process.exit(0);
  }
}

runRetest();
