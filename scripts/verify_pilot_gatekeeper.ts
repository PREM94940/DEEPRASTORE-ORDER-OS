import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { OrderRepository } from '../packages/infrastructure/src/repositories/OrderRepository';
import { orders, payments } from '../packages/infrastructure/src/schema/order';
import { customers } from '../packages/infrastructure/src/schema/customer';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const TEST_PHONE = '9876543219';

async function runTests() {
  console.log("=== STARTING PILOT GATEKEEPER VERIFICATION ===");
  const orderRepo = new OrderRepository();

  // Ensure test customer exists
  console.log("\nSetup: Ensuring Test Customer exists...");
  let [customer] = await db.select().from(customers).where(eq(customers.phone, TEST_PHONE));
  if (!customer) {
    [customer] = await db.insert(customers).values({
      id: uuidv4(),
      phone: TEST_PHONE,
      name: "Gatekeeper Test Customer",
      tenantId: MOCK_TENANT_ID,
    }).returning();
    console.log(`Created test customer: ${customer.name}`);
  } else {
    console.log(`Using existing customer: ${customer.name}`);
  }

  // Helper to delete an order's associated records
  async function cleanupOrder(orderId: string) {
    await db.delete(payments).where(eq(payments.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
  }

  // ==========================================
  // TEST CASE 1: Partial Payment Flow
  // ==========================================
  console.log("\n--- TEST CASE 1: Partial Payment Flow ---");
  const order1 = await orderRepo.createOrder(null, {
    tenantId: MOCK_TENANT_ID,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    orderCategory: "CUSTOM_STITCHING",
    totalAmount: 9500,
    status: "DRAFT"
  } as any);

  // Set amounts for partial payment
  await db.update(orders).set({
    advanceAmount: "5000",
    balanceAmount: "4500",
    paymentStatus: "VERIFICATION_PENDING"
  }).where(eq(orders.id, order1.id));

  console.log(`Order 1 Created: Total = ₹9500, Advance = ₹5000, Balance = ₹4500`);

  // Verify advance payment
  console.log("Verifying advance payment...");
  await orderRepo.verifyPayment(null, MOCK_TENANT_ID, order1.id, "Staff01");

  // Move through production steps
  console.log("Moving through production (CUTTING -> STITCHING -> QC -> READY_TO_SHIP)...");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order1.id, "CUTTING");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order1.id, "STITCHING");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order1.id, "QC");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order1.id, "READY_TO_SHIP");
  console.log("✅ Successfully moved to READY_TO_SHIP");

  // Attempt to dispatch with outstanding balance
  console.log("Attempting dispatch with balance = ₹4500...");
  try {
    await orderRepo.updateOrderDispatchStatusWithAudit(
      null, 
      MOCK_TENANT_ID, 
      order1.id, 
      "DISPATCHED", 
      "Staff01", 
      { courierName: "DHL", trackingId: "TRACK123" }
    );
    console.error("❌ Test 1 Failure: Allowed dispatching order with outstanding balance!");
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ Success: Dispatch blocked as expected. Error: "${err.message}"`);
  }

  // Clear outstanding balance
  console.log("Simulating full balance payment (balance = 0)...");
  await db.update(orders).set({
    advanceAmount: "9500",
    balanceAmount: "0",
    paymentStatus: "VERIFIED"
  }).where(eq(orders.id, order1.id));

  // Re-attempt dispatch
  console.log("Re-attempting dispatch...");
  await orderRepo.updateOrderDispatchStatusWithAudit(
    null, 
    MOCK_TENANT_ID, 
    order1.id, 
    "DISPATCHED", 
    "Staff01", 
    { courierName: "DHL", trackingId: "TRACK123" }
  );
  console.log("✅ Success: Dispatch allowed after balance cleared.");

  // Clean up order 1
  await cleanupOrder(order1.id);


  // ==========================================
  // TEST CASE 2: Zero-Payment / Unpaid
  // ==========================================
  console.log("\n--- TEST CASE 2: Zero-Payment Flow ---");
  const order2 = await orderRepo.createOrder(null, {
    tenantId: MOCK_TENANT_ID,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    orderCategory: "CUSTOM_STITCHING",
    totalAmount: 9500,
    status: "DRAFT"
  } as any);

  await db.update(orders).set({
    advanceAmount: "0",
    balanceAmount: "9500",
    paymentStatus: "UNPAID"
  }).where(eq(orders.id, order2.id));

  console.log("Order 2 Created: Total = ₹9500, Advance = ₹0, Balance = ₹9500, status = DRAFT");

  // Attempt to transition to CUTTING
  console.log("Attempting transition to CUTTING (should be blocked by production gatekeeper)...");
  try {
    await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order2.id, "CUTTING");
    console.error("❌ Test 2 Failure: Allowed production transition for unpaid/unverified order!");
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ Success: Production transition blocked. Error: "${err.message}"`);
  }

  // Clean up order 2
  await cleanupOrder(order2.id);


  // ==========================================
  // TEST CASE 3: Fully Paid Flow
  // ==========================================
  console.log("\n--- TEST CASE 3: Fully Paid Flow ---");
  const order3 = await orderRepo.createOrder(null, {
    tenantId: MOCK_TENANT_ID,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    orderCategory: "CUSTOM_STITCHING",
    totalAmount: 10000,
    status: "DRAFT"
  } as any);

  await db.update(orders).set({
    advanceAmount: "10000",
    balanceAmount: "0",
    paymentStatus: "VERIFICATION_PENDING"
  }).where(eq(orders.id, order3.id));

  console.log("Order 3 Created: Total = ₹10000, Advance = ₹10000, Balance = ₹0");

  // Verify payment
  console.log("Verifying payment...");
  await orderRepo.verifyPayment(null, MOCK_TENANT_ID, order3.id, "Staff01");

  // Progress through production & dispatch
  console.log("Moving through production steps & dispatching...");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order3.id, "CUTTING");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order3.id, "STITCHING");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order3.id, "QC");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order3.id, "READY_TO_SHIP");
  
  await orderRepo.updateOrderDispatchStatusWithAudit(
    null, 
    MOCK_TENANT_ID, 
    order3.id, 
    "DISPATCHED", 
    "Staff01", 
    { courierName: "DHL", trackingId: "TRACK456" }
  );
  console.log("✅ Success: Fully paid order transitioned through production and dispatched successfully.");

  // Clean up order 3
  await cleanupOrder(order3.id);


  // ==========================================
  // TEST CASE 4: Delivered Path
  // ==========================================
  console.log("\n--- TEST CASE 4: Delivered Path Flow ---");
  const order4 = await orderRepo.createOrder(null, {
    tenantId: MOCK_TENANT_ID,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    orderCategory: "CUSTOM_STITCHING",
    totalAmount: 10000,
    status: "DRAFT"
  } as any);

  await db.update(orders).set({
    advanceAmount: "10000",
    balanceAmount: "0",
    paymentStatus: "VERIFICATION_PENDING"
  }).where(eq(orders.id, order4.id));

  console.log("Order 4 Created: Total = ₹10000, Advance = ₹10000, Balance = ₹0");

  // Verify payment
  console.log("Verifying payment...");
  await orderRepo.verifyPayment(null, MOCK_TENANT_ID, order4.id, "Staff01");

  // Move to ready, dispatch, and then deliver
  console.log("Moving to READY_TO_SHIP...");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order4.id, "CUTTING");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order4.id, "STITCHING");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order4.id, "QC");
  await orderRepo.updateOrderProductionStatus(null, MOCK_TENANT_ID, order4.id, "READY_TO_SHIP");
  
  console.log("Dispatching order...");
  await orderRepo.updateOrderDispatchStatusWithAudit(
    null, 
    MOCK_TENANT_ID, 
    order4.id, 
    "DISPATCHED", 
    "Staff01", 
    { courierName: "DHL", trackingId: "TRACK789" }
  );

  console.log("Transitioning to DELIVERED...");
  await orderRepo.updateOrderDispatchStatusWithAudit(
    null,
    MOCK_TENANT_ID,
    order4.id,
    "DELIVERED",
    "Staff01"
  );
  console.log("✅ Success: Delivered transition permitted after dispatch.");

  // Clean up order 4
  await cleanupOrder(order4.id);

  // Clean up customer
  await db.delete(customers).where(eq(customers.id, customer.id));
  console.log("\nSetup: Cleaned up test customer.");

  console.log("\n=== ALL 4 TEST SCENARIOS PASSED SUCCESSFULLY ===");
}

runTests().catch((err) => {
  console.error("❌ Test script failed:", err);
  process.exit(1);
});
