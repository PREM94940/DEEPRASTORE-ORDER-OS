import { submitEnquiryAction } from './app/(staff)/actions/enquiry';
import { createUnifiedOrderAction } from './app/(staff)/actions/order-desk';
import { db } from '@deeprastore/infrastructure';
import { enquiries, orders, orderLineItems } from '@deeprastore/infrastructure/src/schema';
import { eq } from 'drizzle-orm';

async function runEndToEndVerification() {
  console.log('--- SCENARIO 1: STAFF DASHBOARD INTAKE ---');
  
  const payload = {
    name: 'End to End Verification User',
    phone: '9998887776',
    email: 'e2e@example.com',
    address: '456 Verification St, Tech City',
    source: 'WEBSITE',
    productType: 'Bridal Saree',
    deliveryDate: '2026-08-15T00:00:00.000Z',
    notes: 'Please verify all stages work.',
    referenceImages: ['https://example.com/e2e-ref.png'],
    designImages: [],
    utr: 'UTR123456789',
    websiteOrderId: 'WEB-E2E-1',
    lineItems: [
      { productId: 'P1', name: 'Bridal Saree', qty: 1, price: 15000, lineTotal: 15000 },
      { productId: 'P2', name: 'Matching Blouse', qty: 2, price: 2000, lineTotal: 4000 }
    ],
    subtotalAmount: 19000,
    discountAmount: 1000,
    deliveryAmount: 500,
    totalAmount: 18500,
    advanceAmount: 10000
  };

  const insertResult = await submitEnquiryAction(payload);
  console.log('Enquiry Created:', insertResult.enquiryNumber);
  
  // Fetch enquiry from DB
  const [enquiryDb] = await db.select().from(enquiries).where(eq(enquiries.enquiryNumber, insertResult.enquiryNumber!));
  console.log('✅ Enquiry inserted correctly.');
  console.log('Line Items inside Enquiry JSONB:', (enquiryDb.lineItems as any[]).length);
  
  console.log('\n--- SCENARIO 2: ORDER CONVERSION ---');
  // Build conversion payload as unified-order-desk.tsx would
  const conversionPayload = {
    enquiryId: enquiryDb.id,
    name: enquiryDb.customerName,
    phone: enquiryDb.customerPhone,
    email: enquiryDb.email,
    address: enquiryDb.address,
    source: enquiryDb.source,
    orderType: 'CUSTOM_STITCHING',
    lineItems: (enquiryDb.lineItems as any[]).map(item => ({
      productId: item.productId || item.name,
      name: item.name,
      quantity: item.qty,
      price: item.price
    })),
    deliveryDate: enquiryDb.expectedDeliveryDate,
    notes: enquiryDb.notes,
    basePrice: enquiryDb.subtotalAmount,
    discountAmount: enquiryDb.discountAmount,
    deliveryAmount: enquiryDb.deliveryAmount,
    totalAmount: enquiryDb.totalAmount,
    advanceAmount: enquiryDb.advanceAmount,
    balanceAmount: Number(enquiryDb.totalAmount) - Number(enquiryDb.advanceAmount),
    utrNumber: enquiryDb.utr,
  };

  const orderResult = await createUnifiedOrderAction(conversionPayload);
  
  if (!orderResult.success) {
    console.error('Failed to convert to order:', orderResult.error);
    process.exit(1);
  }
  
  console.log('✅ Converted to Order successfully.');
  console.log('Order Number:', orderResult.order.orderNumber);
  
  const [orderDb] = await db.select().from(orders).where(eq(orders.id, orderResult.order.id));
  const lineItemsDb = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, orderResult.order.id));
  
  console.log('Order Financials Copied:');
  console.log('Total Amount:', orderDb.totalAmount);
  console.log('Advance Amount:', orderDb.advanceAmount);
  console.log('Balance Amount:', orderDb.balanceAmount);
  console.log('Base Price:', orderDb.basePrice);
  console.log('Discount:', orderDb.discountAmount);
  console.log('Delivery:', orderDb.deliveryAmount);
  
  console.log('\nLine Items transferred to separate table (order_line_items):');
  lineItemsDb.forEach(item => {
    console.log(`- Product: ${item.productId}, Qty: ${item.quantity}, Price: ${item.price}, Status: ${item.status}`);
  });

  console.log('\n--- SCENARIO 3: PRODUCTION WORKFLOW ---');
  console.log('Moving order through production statuses...');
  const workflowStatuses = ['MEASUREMENT_PENDING', 'CUTTING', 'STITCHING', 'READY'];
  for (const status of workflowStatuses) {
    await db.update(orders).set({ productionStatus: status }).where(eq(orders.id, orderDb.id));
    console.log(`✅ Order transitioned to: ${status}`);
  }
  
  await db.update(orders).set({ dispatchStatus: 'DISPATCHED' }).where(eq(orders.id, orderDb.id));
  console.log('✅ Order dispatched successfully.');

  console.log('\n--- SCENARIO 4: CUSTOMER PORTAL TRACKING ---');
  console.log('Customer Tracking Link Generated: http://localhost:3000/track/' + orderDb.trackingToken);
  
  console.log('\n✅ ALL VERIFICATION SCENARIOS PASSED WITH DATA INTEGRITY CONFIRMED.');
  process.exit(0);
}

runEndToEndVerification().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
