import { db } from '../packages/infrastructure/src/db/client';
import { OrderRepository } from '../packages/infrastructure/src/repositories/OrderRepository';
import { orders, payments } from '../packages/infrastructure/src/schema/order';
import { customers } from '../packages/infrastructure/src/schema/customer';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const TEST_PHONE = '9876543210';

async function runTest() {
  console.log("=== STARTING OPERATIONS LIFECYCLE AUDIT ===");
  const orderRepo = new OrderRepository();

  // 1. Ensure test customer exists
  console.log("\nStep 0: Creating Test Customer...");
  let [customer] = await db.select().from(customers).where(eq(customers.phone, TEST_PHONE));
  if (!customer) {
    [customer] = await db.insert(customers).values({
      id: uuidv4(),
      phone: TEST_PHONE,
      name: "Reality Test Customer",
      tenantId: MOCK_TENANT_ID,
    }).returning();
    console.log(`Created new customer: ${customer.name} (${customer.phone})`);
  } else {
    console.log(`Using existing customer: ${customer.name} (${customer.phone})`);
  }

  // 2. Create a draft order
  console.log("\nStep 1: Inserting Draft Order...");
  const order = await orderRepo.createOrder(null, {
    tenantId: MOCK_TENANT_ID,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    orderCategory: "CUSTOM_STITCHING",
    totalAmount: 12000,
    status: "DRAFT"
  } as any);
  
  console.log(`Draft Created: ${order.orderNumber} (ID: ${order.id}), status: ${order.status}`);
  if (order.status !== 'DRAFT') throw new Error("Initial status should be DRAFT");

  // 3. Add payment screenshot
  console.log("\nStep 2: Adding Payment Screenshot (Trigger Verification Pending)...");
  await db.transaction(async (tx) => {
    await orderRepo.addPayment(tx, MOCK_TENANT_ID, order.id, 5000, 'Staff01', 'UTR_TEST_999');
    await orderRepo.updatePaymentUTR(tx, MOCK_TENANT_ID, order.id, 'UTR_TEST_999');
  });

  const orderAfterPayment = await orderRepo.getOrderById(MOCK_TENANT_ID, order.id);
  console.log(`Order status: ${orderAfterPayment?.status}, paymentStatus: ${orderAfterPayment?.paymentStatus}`);
  if (orderAfterPayment?.status !== 'PENDING_VERIFICATION') throw new Error("Status should be PENDING_VERIFICATION");

  // 4. Reject Payment
  console.log("\nStep 3: Rejecting Payment...");
  await orderRepo.rejectPayment(null, MOCK_TENANT_ID, order.id);
  
  const orderAfterRejection = await orderRepo.getOrderById(MOCK_TENANT_ID, order.id);
  console.log(`Order status: ${orderAfterRejection?.status}, paymentStatus: ${orderAfterRejection?.paymentStatus}`);
  if (orderAfterRejection?.status !== 'PAYMENT_REJECTED') throw new Error("Status should be PAYMENT_REJECTED");

  // 5. Verify Bypass Prevention (Gatekeeper block)
  console.log("\nStep 4: Attempting bypass to production (CUTTING)...");
  try {
    await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order.id, 'CUTTING');
    console.log("❌ ERROR: Bypass succeeded (it should have failed!).");
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ Success: Bypass blocked! Error thrown: "${err.message}"`);
  }

  // 6. Re-submit payment
  console.log("\nStep 5: Re-submitting payment...");
  await orderRepo.updatePaymentUTR(null, MOCK_TENANT_ID, order.id, 'UTR_TEST_999_RETRY');
  
  const orderAfterResubmit = await orderRepo.getOrderById(MOCK_TENANT_ID, order.id);
  console.log(`Order status: ${orderAfterResubmit?.status}, paymentStatus: ${orderAfterResubmit?.paymentStatus}`);
  if (orderAfterResubmit?.status !== 'PENDING_VERIFICATION') throw new Error("Status should be PENDING_VERIFICATION");

  // 7. Approve Payment
  console.log("\nStep 6: Approving Payment...");
  await orderRepo.verifyPayment(null, MOCK_TENANT_ID, order.id, 'VerifierStaff');
  
  const orderAfterApprove = await orderRepo.getOrderById(MOCK_TENANT_ID, order.id);
  console.log(`Order status: ${orderAfterApprove?.status}, paymentStatus: ${orderAfterApprove?.paymentStatus}`);
  if (orderAfterApprove?.status !== 'CONFIRMED') throw new Error("Status should be CONFIRMED");

  // 8. Transition to CUTTING (should succeed now)
  console.log("\nStep 7: Transitioning confirmed order to CUTTING...");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order.id, 'CUTTING');
  
  const finalOrder = await orderRepo.getOrderById(MOCK_TENANT_ID, order.id);
  console.log(`Final order status: ${finalOrder?.status}, paymentStatus: ${finalOrder?.paymentStatus}`);
  if (finalOrder?.status !== 'CUTTING') throw new Error("Status should be CUTTING");

  // Clean up test order
  console.log("\nCleaning up test records...");
  await db.delete(payments).where(eq(payments.orderId, order.id));
  await db.delete(orders).where(eq(orders.id, order.id));
  await db.delete(customers).where(eq(customers.id, customer.id));
  
  console.log("\n=== LIFECYCLE AUDIT COMPLETED SUCCESSFULLY ===");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
