import 'dotenv/config';
import { db } from './packages/infrastructure/src/db/client';
import { enquiries } from './packages/infrastructure/src/schema/enquiry';
import { orders } from './packages/infrastructure/src/schema/order';
import { desc, eq } from 'drizzle-orm';

async function verify() {
  console.log('--- DB VERIFICATION START ---');
  
  const latestOrderResult = await db.select().from(orders).where(eq(orders.customerName, 'Test Founder 3566'));
  console.log('Orders found with name:', latestOrderResult.length);
  
  if (latestOrderResult.length > 0) {
     console.log('First order:', latestOrderResult[0]);
  } else {
     console.log('No order was created for this test founder!');
  }
}
verify();
