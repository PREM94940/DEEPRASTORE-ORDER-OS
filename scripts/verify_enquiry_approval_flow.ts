import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { enquiries, enquiryQuotes, enquiryComments, orders, payments } from '../packages/infrastructure/src/schema';
import { eq, sql } from 'drizzle-orm';
import { updateEnquiryStatusAction, submitCustomerResponseAction, addEnquiryCommentAction, getEnquiryCommentsAction, createUnifiedOrderAction } from '../apps/web/app/(staff)/actions/order-desk';
import { v4 as uuidv4 } from 'uuid';

// Node async local storage patch for standalone next.js server action tests
const { AsyncLocalStorage } = require('node:async_hooks');
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

async function run() {
  console.log("=== STARTING ENQUIRY QUOTE & APPROVAL FLOW VERIFICATION ===");
  const testPhone = '9999988888';
  const testName = 'Verification Test Customer';
  const trackingToken = uuidv4();
  
  try {
    // 1. Create a test enquiry
    const [enq] = await db.insert(enquiries).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      customerName: testName,
      customerPhone: testPhone,
      source: 'WHATSAPP',
      productType: 'Lehenga',
      notes: 'Need blue silk fabric',
      trackingToken,
      enquiryNumber: 'REQUEST-TEST',
      status: 'REQUEST'
    }).returning();
    
    console.log(`✅ Created test request ${enq.enquiryNumber} (ID: ${enq.id})`);

    // 2. Staff updates status to PRICE_QUOTED & adds quote details
    console.log("Simulating Staff quoting price...");
    const quoteRes = await updateEnquiryStatusAction(
      enq.id,
      'PRICE_QUOTED',
      'Prem',
      undefined,
      {
        quoteAmount: '15000.00',
        requiredAdvance: '5000.00',
        quoteNotes: 'Fabric: ₹8000, Stitching: ₹5000, Custom Zardozi: ₹2000',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    );
    
    if (!quoteRes.success) throw new Error("Failed to update status to PRICE_QUOTED");
    console.log("✅ Staff updated request status to PRICE_QUOTED.");

    // Verify quote in DB
    const [savedQuote] = await db.select().from(enquiryQuotes).where(eq(enquiryQuotes.enquiryId, enq.id));
    if (!savedQuote) throw new Error("Quote record was not created in enquiry_quotes");
    
    console.log(`✅ Quote V${savedQuote.version} saved in DB:`);
    console.log(`   - Amount: ₹${savedQuote.quoteAmount}`);
    console.log(`   - Required Advance: ₹${savedQuote.requiredAdvance}`);
    console.log(`   - Expiry: ${savedQuote.expiresAt}`);
    console.log(`   - Created From: ${savedQuote.createdFromStatus} -> Status Snapshot: ${savedQuote.statusSnapshot}`);
    
    if (savedQuote.createdFromStatus !== 'REQUEST' || savedQuote.statusSnapshot !== 'PRICE_QUOTED') {
      throw new Error("Quote audit trail mismatch");
    }

    // 3. Staff adds internal comments
    console.log("Simulating Staff leaving internal comments...");
    await addEnquiryCommentAction(enq.id, 'Prem', 'Called customer, they requested fabric sample photos');
    await addEnquiryCommentAction(enq.id, 'Priya', 'Sent fabric sample photos over WhatsApp');
    
    // Verify comments exist
    const commentsList = await getEnquiryCommentsAction(enq.id);
    console.log(`✅ Verified comments in DB (Total: ${commentsList.length})`);
    for (const c of commentsList) {
      console.log(`   - [${c.staffName}]: "${c.comment}"`);
    }
    if (commentsList.length !== 2) throw new Error("Comments count mismatch");

    // 4. Customer reviews quote and clicks Approve (uploads payment receipt screenshot)
    console.log("Simulating Customer approving quote & uploading payment screenshot...");
    const mockReceipt = 'https://supabase.co/mock-screenshot.png';
    const customerApproveRes = await submitCustomerResponseAction(
      enq.id,
      'APPROVED',
      'Looks perfect, paid advance',
      mockReceipt
    );
    
    if (!customerApproveRes.success) throw new Error("Customer response submit failed");
    
    // Verify status updated to PAYMENT_RECEIVED
    const [enqAfterResponse] = await db.select().from(enquiries).where(eq(enquiries.id, enq.id));
    console.log(`✅ Customer response processed:`);
    console.log(`   - Status: ${enqAfterResponse.status}`);
    console.log(`   - Decision: ${enqAfterResponse.customerResponse}`);
    console.log(`   - Comments: "${enqAfterResponse.customerResponseNotes}"`);
    console.log(`   - Payment Proof: ${enqAfterResponse.advancePaymentProofUrl}`);
    
    if (enqAfterResponse.status !== 'PAYMENT_RECEIVED' || enqAfterResponse.customerResponse !== 'APPROVED') {
      throw new Error("Customer approval status mismatch");
    }

    // 5. Staff verifies payment and updates status to CUSTOMER_APPROVED
    console.log("Simulating Staff verifying payment receipt...");
    const paymentVerifyRes = await updateEnquiryStatusAction(enq.id, 'CUSTOMER_APPROVED', 'Prem');
    if (!paymentVerifyRes.success) throw new Error("Failed to verify payment");
    
    const [enqApproved] = await db.select().from(enquiries).where(eq(enquiries.id, enq.id));
    console.log(`✅ Staff verified payment. Request status: ${enqApproved.status}`);
    if (enqApproved.status !== 'CUSTOMER_APPROVED') throw new Error("Enquiry status is not CUSTOMER_APPROVED");

    // 6. Convert Enquiry to Tailors Production Order
    console.log("Simulating Conversion of Enquiry to Order...");
    const convertRes = await createUnifiedOrderAction({
      enquiryId: enq.id,
      name: testName,
      phone: testPhone,
      source: 'WHATSAPP',
      orderType: 'CUSTOM_STITCHING',
      productDetails: 'Lehenga',
      fabricSource: 'DEEPRASTORE',
      totalAmount: '15000.00',
      advanceAmount: '5000.00',
      balanceAmount: 10000.00,
      paymentMethod: 'UPI_SCREENSHOT',
      utrNumber: 'UTR123456789',
      paymentProofUrl: mockReceipt
    });
    
    if (!convertRes.success) throw new Error(`Conversion to Order failed: ${convertRes.error}`);
    console.log(`✅ Order converted successfully!`);
    console.log(`   - Order ID: ${convertRes.order.id}`);
    console.log(`   - Order Number: ${convertRes.order.orderNumber}`);

    // Verify order in DB
    const [savedOrder] = await db.select().from(orders).where(eq(orders.id, convertRes.order.id));
    console.log(`✅ Verifying converted Order details:`);
    console.log(`   - Inherited Tracking Token: ${savedOrder.trackingToken}`);
    if (savedOrder.trackingToken !== trackingToken) {
      throw new Error("Tracking token was not inherited during order conversion!");
    }
    console.log("   - Inherited tracking token matched perfectly!");

    // Clean up database
    console.log("Cleaning up database test records...");
    await db.update(enquiries).set({ orderId: null }).where(eq(enquiries.id, enq.id));
    await db.delete(payments).where(eq(payments.orderId, savedOrder.id));
    await db.delete(orders).where(eq(orders.id, savedOrder.id));
    await db.delete(enquiryComments).where(eq(enquiryComments.enquiryId, enq.id));
    await db.delete(enquiryQuotes).where(eq(enquiryQuotes.enquiryId, enq.id));
    await db.delete(enquiries).where(eq(enquiries.id, enq.id));
    console.log("✅ Cleaned up test records.");

    console.log("=== ALL APPROVAL FLOW VERIFICATION TESTS PASSED ===");
  } catch (err) {
    console.error("❌ Verification tests failed:", err);
    // Cleanup attempt
    try {
      await db.execute(sql`UPDATE enquiries SET order_id = NULL WHERE customer_phone = ${testPhone};`);
      await db.execute(sql`DELETE FROM enquiry_comments WHERE enquiry_id IN (SELECT id FROM enquiries WHERE customer_phone = ${testPhone});`);
      await db.execute(sql`DELETE FROM enquiry_quotes WHERE enquiry_id IN (SELECT id FROM enquiries WHERE customer_phone = ${testPhone});`);
      await db.execute(sql`DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE customer_phone = ${testPhone});`);
      await db.execute(sql`DELETE FROM orders WHERE customer_phone = ${testPhone};`);
      await db.execute(sql`DELETE FROM enquiries WHERE customer_phone = ${testPhone};`);
    } catch (_) {}
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
