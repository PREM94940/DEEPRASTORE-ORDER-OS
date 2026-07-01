import 'dotenv/config';
import { db } from './packages/infrastructure/src/db/client';
import { enquiries } from './packages/infrastructure/src/schema/enquiry';
import { orders } from './packages/infrastructure/src/schema/order';
import { desc, eq } from 'drizzle-orm';

async function verify() {
  console.log('--- DB VERIFICATION START ---');
  
  // 1. Fetch latest enquiry
  const latestEnquiry = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(1);

  if (!latestEnquiry || latestEnquiry.length === 0) {
    console.log('FAIL: No enquiries found in database.');
    process.exit(1);
  }
  
  const enquiry = latestEnquiry[0];
  console.log(`Latest Enquiry Found: ${enquiry.enquiryNumber}`);
  console.log(`Customer Name: ${enquiry.customerName}`);
  console.log(`UTR: ${enquiry.utr}`);
  console.log(`Notes (containing Product/Advance): ${enquiry.notes}`);
  
  if (enquiry.customerName?.startsWith('Test Founder')) {
    console.log('✅ Enquiry matches our test submission.');
  } else {
    console.log('FAIL: Latest enquiry does not match our test submission.');
  }

  if (enquiry.status === 'APPROVED' || enquiry.status === 'CONVERTED') {
     console.log('✅ Enquiry status successfully transitioned after approval.');
  } else {
     console.log(`⚠️ Enquiry status is ${enquiry.status}, expected APPROVED/CONVERTED.`);
  }

  // 2. Fetch linked order using enquiry.orderId
  if (!enquiry.orderId) {
    console.log('FAIL: Enquiry has no orderId linked. Approval failed to link order.');
    process.exit(1);
  }

  const latestOrderResult = await db.select().from(orders).where(eq(orders.id, enquiry.orderId)).limit(1);
  
  if (!latestOrderResult || latestOrderResult.length === 0) {
    console.log('FAIL: No linked order found. Approval failed to write to orders table.');
    process.exit(1);
  }

  const linkedOrder = latestOrderResult[0];

  console.log(`Linked Order Found: ${linkedOrder.orderNumber}`);
  console.log(`Order Total Amount: ${linkedOrder.totalAmount}`);
  console.log(`Order Advance Paid: ${linkedOrder.advanceAmount}`);
  
  if (linkedOrder.customerName === enquiry.customerName) {
    console.log('✅ Customer data preserved from Enquiry to Order.');
  }

  if (linkedOrder.totalAmount !== null && linkedOrder.advanceAmount !== null) {
    console.log('✅ Payment data (Total / Advance) preserved without NULLs.');
  }

  if (enquiry.utr !== null && enquiry.utr !== '') {
    console.log('✅ UTR natively stored and preserved.');
  } else {
    console.log('FAIL: UTR was lost or NULL.');
    process.exit(1);
  }

  console.log('--- DB VERIFICATION SUCCESS ---');
  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
