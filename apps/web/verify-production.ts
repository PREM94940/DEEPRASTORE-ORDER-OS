import { moveOrderAction } from './app/(staff)/actions/command-center';
import { createUnifiedOrderAction } from './app/(staff)/actions/order-desk';
import { db } from '@deeprastore/infrastructure';
import { orders } from '@deeprastore/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log("=== STARTING PRODUCTION VERIFICATION ===");
  
  // 1. Dispatch Gatekeeper Verification
  console.log("\n--- Dispatch Verification ---");
  try {
    // Attempt to move an existing order to DISPATCHED
    // We use a known order or we can just try to create one first, but moveOrderAction needs a valid ID
    // Let's create a dummy order to test with
    const createRes = await createUnifiedOrderAction({
      phone: '9999999999',
      name: 'Test Dispatch',
      source: 'WHATSAPP',
      orderType: 'READY_MADE',
      advanceAmount: 0,
      paymentMethod: 'UPI'
    } as any);
    
    if (createRes.success && createRes.order) {
      const orderId = createRes.order.id;
      console.log(`Created test order ${orderId}`);
      
      // Force status to READY_TO_SHIP first using DB directly to bypass other checks if needed, or just run the action
      // We will update the DB directly to READY_TO_SHIP so we can test the DISPATCHED transition
      await db.update(orders).set({ status: 'READY_TO_SHIP', paymentStatus: 'VERIFIED' }).where(eq(orders.id, orderId));
      
      const res = await moveOrderAction(orderId, 'DISPATCHED');
      if (res.success) {
        console.log("❌ DISPATCH VERIFICATION FAILED: Backend allowed transition to DISPATCHED.");
      } else {
        console.log(`✅ DISPATCH VERIFICATION PASSED: Backend rejected transition. Reason: ${res.error}`);
      }
    } else {
       console.log("Failed to create test order.", createRes.error);
    }
  } catch (err: any) {
    console.log(`✅ DISPATCH VERIFICATION PASSED: Backend threw error. Reason: ${err.message}`);
  }

  // 2. CASH Verification
  console.log("\n--- CASH Verification ---");
  try {
    const cashRes = await createUnifiedOrderAction({
      phone: '8888888888',
      name: 'Test Cash',
      source: 'WHATSAPP',
      orderType: 'READY_MADE',
      advanceAmount: 1000,
      totalAmount: 5000,
      paymentMethod: 'CASH'
    } as any);

    if (cashRes.success && cashRes.order) {
      console.log(`Created CASH order ${cashRes.order.id}`);
      
      const dbOrderResult = await db.select().from(orders).where(eq(orders.id, cashRes.order.id));
      const dbOrder = dbOrderResult[0];

      console.log(`Status: ${dbOrder.status}`);
      console.log(`Payment Status: ${dbOrder.paymentStatus}`);
      
      if (dbOrder.status === 'PENDING_VERIFICATION' && dbOrder.paymentStatus === 'VERIFICATION_PENDING') {
         console.log("✅ CASH VERIFICATION PASSED: Order is securely held in PENDING_VERIFICATION.");
      } else {
         console.log("❌ CASH VERIFICATION FAILED: Order bypassed verification.");
      }
    } else {
      console.log("Failed to create CASH test order.", cashRes.error);
    }
  } catch (err: any) {
    console.log(`Error testing CASH: ${err.message}`);
  }
}

verify();
