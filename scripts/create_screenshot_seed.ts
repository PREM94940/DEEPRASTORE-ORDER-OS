import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { orders } from '../packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log("=== UPDATING ORDER DP261006 FOR SCREENSHOTS ===");

  await db.update(orders).set({
    totalAmount: "9500.00",
    advanceAmount: "5000.00",
    balanceAmount: "4500.00",
    paymentStatus: "VERIFIED",
    status: "READY_TO_SHIP",
    productionStatus: "READY",
    dispatchStatus: "NOT_STARTED",
  }).where(eq(orders.businessId, "DP261006"));

  console.log(`Updated order DP261006 to: Total = 9500, Advance = 5000, Balance = 4500, status = READY_TO_SHIP`);
}

seed().catch(console.error).finally(() => process.exit(0));
