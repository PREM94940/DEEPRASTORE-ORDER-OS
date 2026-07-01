import 'dotenv/config';
import { createUnifiedOrderAction } from './apps/web/app/(staff)/actions/order-desk';
import { db } from './packages/infrastructure/src/db/client';
import { enquiries } from './packages/infrastructure/src/schema/enquiry';
import { desc } from 'drizzle-orm';

async function testAction() {
  const latestEnquiry = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(1);
  const enquiry = latestEnquiry[0];
  
  if (!enquiry) return;
  
  const formData = {
    enquiryId: enquiry.id,
    name: enquiry.customerName,
    phone: enquiry.customerPhone,
    email: enquiry.email,
    address: enquiry.address,
    source: enquiry.source,
    orderType: 'CUSTOM_STITCHING',
    productDetails: enquiry.productType,
    fabricSource: 'NONE',
    fabricCount: '',
    fabricCode: '',
    measurementStatus: 'PENDING',
    totalAmount: '10000',
    advanceAmount: '5000',
    balanceAmount: 5000,
    paymentMethod: 'PENDING',
    utrNumber: enquiry.utr,
    orderDate: new Date().toISOString(),
    deliveryDate: enquiry.expectedDeliveryDate?.toISOString(),
    notes: enquiry.notes,
    lineItems: [{ productId: 'Test', name: 'Test', quantity: 1, price: '10000' }]
  };

  console.log('Calling action with:', formData);
  const res = await createUnifiedOrderAction(formData);
  console.log('Result:', res);
  process.exit(0);
}

testAction().catch(e => {
  console.error(e);
  process.exit(1);
});
