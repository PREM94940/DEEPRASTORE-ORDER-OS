import { db } from "../packages/infrastructure/src/db/client";
import { orders } from "../packages/infrastructure/src/schema";
import { isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function populateTokens() {
  console.log("Fetching orders without tracking tokens...");
  const ordersWithoutToken = await db.select().from(orders).where(isNull(orders.trackingToken));
  
  console.log(`Found ${ordersWithoutToken.length} orders.`);
  
  for (const order of ordersWithoutToken) {
    const token = uuidv4();
    await db.update(orders).set({ trackingToken: token }).where(orders.id === order.id);
  }
  
  console.log("Finished populating tracking tokens.");
}

populateTokens().catch(console.error);
