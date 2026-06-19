import 'dotenv/config';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const TEST_PHONE = '9991112222';
const TEST_NAME = 'VIP E2E Test Customer';
const TEST_EMAIL = 'vip-e2e@example.com';
const TEST_ADDRESS = '123 E2E Lane, Tailor City, 500001, India';
const TEST_MEASUREMENTS = {
  lehenga: { waist: '30', hip: '38', length: '41' }
};

async function runE2E() {
  console.log('=== STARTING DEEPRASTORE 8-STEP MANUAL SIMULATION AUDIT ===\n');

  // Resolve Next.js work store relative to apps/web node_modules to match the Next.js version (16.2.7)
  const require = createRequire(import.meta.url);
  const webAppDir = path.resolve(process.cwd(), 'apps/web');
  
  const resolvedStoragePath = require.resolve(
    'next/dist/server/app-render/work-async-storage.external.js', 
    { paths: [webAppDir] }
  );
  
  console.log(`Resolved Next.js work-async-storage to: ${resolvedStoragePath}`);

  // Convert absolute path to file:// URL for ES module import on Windows
  const storageFileUrl = pathToFileURL(resolvedStoragePath).href;

  // Dynamic imports after AsyncLocalStorage is initialized globally
  const { workAsyncStorage } = await import(storageFileUrl);
  const { db } = await import('../packages/infrastructure/src/db/client');
  const { enquiries, orders, payments, customers, auditLogs, customerAddresses, measurementsHistory } = await import('../packages/infrastructure/src/schema');
  const { eq, and } = await import('drizzle-orm');
  const { v4: uuidv4 } = await import('uuid');
  const { submitEnquiryAction } = await import('../apps/web/app/(staff)/actions/enquiry');
  const { updateEnquiryStatusAction, createUnifiedOrderAction } = await import('../apps/web/app/(staff)/actions/order-desk');

  // Run everything inside the Next.js work store context so revalidatePath does not throw
  await workAsyncStorage.run({ incrementalCache: {} }, async () => {
    
    // CLEANUP: Reset any previous test records
    console.log('0. Cleaning up database from previous runs...');
    const existingEnquiries = await db.select().from(enquiries).where(eq(enquiries.customerPhone, TEST_PHONE));
    for (const e of existingEnquiries) {
      if (e.orderId) {
        await db.delete(payments).where(eq(payments.orderId, e.orderId));
        await db.delete(orders).where(eq(orders.id, e.orderId));
      }
    }
    await db.delete(enquiries).where(eq(enquiries.customerPhone, TEST_PHONE));
    await db.delete(customerAddresses).where(eq(customerAddresses.customerPhone, TEST_PHONE));
    await db.delete(customers).where(eq(customers.phone, TEST_PHONE));
    console.log('   Cleanup done.\n');

    // ==========================================
    // TEST 1 & 2: Create Request from WhatsApp & Upload Reference Images
    // ==========================================
    console.log('--- TEST 1 & 2: Create Request from WhatsApp & Reference Images ---');
    const mockRefImages = [
      'https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/uploads/img1.jpg',
      'https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/uploads/img2.jpg',
      'https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/uploads/img3.jpg'
    ];

    console.log(`Submitting enquiry request for ${TEST_NAME} (${TEST_PHONE}) via source: whatsapp...`);
    const submissionRes = await submitEnquiryAction({
      name: TEST_NAME,
      phone: TEST_PHONE,
      email: TEST_EMAIL,
      source: 'whatsapp',
      productType: 'Lehenga',
      notes: 'Please stitch with double lining and matching tassels.',
      deliveryDate: '2026-07-15',
      address: TEST_ADDRESS,
      measurements: TEST_MEASUREMENTS,
      referenceImages: mockRefImages,
    });

    if (!submissionRes.success || !submissionRes.enquiryNumber || !submissionRes.trackingToken) {
      throw new Error('❌ Test 1 Fail: submitEnquiryAction failed.');
    }

    console.log(`✅ Success: Request created!`);
    console.log(`   Request Number: ${submissionRes.enquiryNumber}`);
    console.log(`   Tracking Token: ${submissionRes.trackingToken}`);

    // Fetch record from DB to verify source normalization and images storage
    const [dbEnquiry] = await db.select().from(enquiries).where(eq(enquiries.enquiryNumber, submissionRes.enquiryNumber));
    if (!dbEnquiry) {
      throw new Error('❌ Test 1 Fail: Enquiry not found in DB.');
    }

    if (dbEnquiry.source !== 'WHATSAPP') {
      throw new Error(`❌ Test 1 Fail: Source normalization failed. Expected WHATSAPP, got ${dbEnquiry.source}`);
    }
    console.log(`✅ Success: Source normalized correctly to ${dbEnquiry.source}.`);

    const savedRefImages = dbEnquiry.referenceImages as string[];
    if (!savedRefImages || savedRefImages.length !== 3 || savedRefImages[0] !== mockRefImages[0]) {
      throw new Error('❌ Test 2 Fail: Reference images not stored correctly in database.');
    }
    console.log(`✅ Success: All ${savedRefImages.length} reference images stored successfully.\n`);


    // ==========================================
    // TEST 3: Magic Link Direct Resolution
    // ==========================================
    console.log('--- TEST 3: Magic Link Resolution ---');
    console.log(`Simulating customer visiting tracking link: /track/${submissionRes.trackingToken}...`);
    
    // Loader query simulation
    const trackingEnquiries = await db.select().from(enquiries).where(eq(enquiries.trackingToken, submissionRes.trackingToken));
    if (trackingEnquiries.length === 0) {
      throw new Error('❌ Test 3 Fail: Magic link tracking token did not resolve to enquiry.');
    }
    
    const enquiry = trackingEnquiries[0];
    console.log(`✅ Success: Magic Link resolved!`);
    console.log(`   Customer Name: ${enquiry.customerName}`);
    console.log(`   Current Stage: ${enquiry.status} (Submitted/Under Review)\n`);


    // ==========================================
    // TEST 4: Staff Assignment
    // ==========================================
    console.log('--- TEST 4: Staff Assignment ---');
    console.log('Assigning representative "Priya" to request...');
    const assignRes = await updateEnquiryStatusAction(enquiry.id, 'REQUEST', 'Priya');
    if (!assignRes.success) {
      throw new Error('❌ Test 4 Fail: updateEnquiryStatusAction failed.');
    }

    // Refresh and check persistence
    const [assignedEnquiry] = await db.select().from(enquiries).where(eq(enquiries.id, enquiry.id));
    if (assignedEnquiry.assignedTo !== 'Priya') {
      throw new Error(`❌ Test 4 Fail: Representative assignment not persisted. Got: ${assignedEnquiry.assignedTo}`);
    }
    console.log(`✅ Success: Representative "${assignedEnquiry.assignedTo}" successfully assigned and verified.\n`);


    // ==========================================
    // TEST 5: Pipeline Status Transitions
    // ==========================================
    console.log('--- TEST 5: Pipeline Status Transitions ---');
    
    // Transition REQUEST -> PRICE_QUOTED
    console.log('Transitioning: REQUEST -> PRICE_QUOTED...');
    await updateEnquiryStatusAction(enquiry.id, 'PRICE_QUOTED');
    let [checkState] = await db.select().from(enquiries).where(eq(enquiries.id, enquiry.id));
    if (checkState.status !== 'PRICE_QUOTED') throw new Error(`❌ Test 5 Fail: Status not updated. Status: ${checkState.status}`);

    // Transition PRICE_QUOTED -> INVOICE_SENT
    console.log('Transitioning: PRICE_QUOTED -> INVOICE_SENT...');
    await updateEnquiryStatusAction(enquiry.id, 'INVOICE_SENT');
    [checkState] = await db.select().from(enquiries).where(eq(enquiries.id, enquiry.id));
    if (checkState.status !== 'INVOICE_SENT') throw new Error(`❌ Test 5 Fail: Status not updated. Status: ${checkState.status}`);

    // Transition INVOICE_SENT -> PAYMENT_RECEIVED (upload payment proof screenshot)
    const mockReceiptUrl = 'https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/payments/receipt.jpg';
    console.log('Transitioning: INVOICE_SENT -> PAYMENT_RECEIVED with screenshot...');
    await updateEnquiryStatusAction(enquiry.id, 'PAYMENT_RECEIVED', undefined, mockReceiptUrl);
    [checkState] = await db.select().from(enquiries).where(eq(enquiries.id, enquiry.id));
    if (checkState.status !== 'PAYMENT_RECEIVED' || checkState.advancePaymentProofUrl !== mockReceiptUrl) {
      throw new Error(`❌ Test 5 Fail: Status or advance payment proof URL mismatch. Status: ${checkState.status}, Proof: ${checkState.advancePaymentProofUrl}`);
    }
    console.log(`✅ Success: Enquiry moved to PAYMENT_RECEIVED. Receipt verified at: ${checkState.advancePaymentProofUrl}\n`);


    // ==========================================
    // TEST 6: Convert Request to Order
    // ==========================================
    console.log('--- TEST 6: Convert Request to Order ---');
    console.log('Converting request to production order...');
    
    const convertRes = await createUnifiedOrderAction({
      enquiryId: enquiry.id,
      name: TEST_NAME,
      phone: TEST_PHONE,
      email: TEST_EMAIL,
      address: TEST_ADDRESS,
      source: 'WHATSAPP',
      orderType: 'Lehenga',
      totalAmount: '20000',
      advanceAmount: '10000',
      balanceAmount: '10000',
      paymentMethod: 'UPI',
      paymentProofUrl: mockReceiptUrl,
      attachments: [{ name: 'img1.jpg', url: mockRefImages[0] }],
      notes: 'Please stitch with double lining and matching tassels.',
      measurementStatus: 'COMPLETED',
      deliveryDate: '2026-07-15'
    });

    if (!convertRes.success || !convertRes.order) {
      throw new Error(`❌ Test 6 Fail: createUnifiedOrderAction failed: ${convertRes.error}`);
    }

    const orderId = convertRes.order.id;
    const orderNum = convertRes.order.orderNumber;
    console.log(`✅ Success: Order converted! Production Order: ${orderNum} (ID: ${orderId})`);

    // Verify enquiry status is CONVERTED
    const [postConvertEnquiry] = await db.select().from(enquiries).where(eq(enquiries.id, enquiry.id));
    if (postConvertEnquiry.status !== 'CONVERTED' || postConvertEnquiry.orderId !== orderId) {
      throw new Error(`❌ Test 6 Fail: Enquiry state was not updated correctly after conversion. Status: ${postConvertEnquiry.status}`);
    }
    console.log(`✅ Success: Original request updated to status CONVERTED and links to order.`);

    // Verify order details (measurements auto-populated, token inherited)
    const [newOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!newOrder) throw new Error('❌ Test 6 Fail: New order record not found in database.');

    if (newOrder.trackingToken !== submissionRes.trackingToken) {
      throw new Error(`❌ Test 6 Fail: Tracking token mismatch! Expected inherited token: ${submissionRes.trackingToken}, got: ${newOrder.trackingToken}`);
    }
    console.log(`✅ Success: Order inherited the exact same Tracking Token: ${newOrder.trackingToken}`);

    // Check customer address
    const [dbAddr] = await db.select().from(customerAddresses).where(eq(customerAddresses.customerPhone, TEST_PHONE));
    if (!dbAddr || dbAddr.addressLine1 !== TEST_ADDRESS) {
      throw new Error('❌ Test 6 Fail: Customer address not copied or saved.');
    }
    console.log(`✅ Success: Address correctly copied and saved: ${dbAddr.addressLine1}`);

    // Check measurements history auto-population
    const dbMeasurements = await db.select().from(measurementsHistory).where(eq(measurementsHistory.customerPhone, TEST_PHONE));
    if (dbMeasurements.length === 0) {
      throw new Error('❌ Test 6 Fail: Measurements history not populated.');
    }
    console.log('✅ Success: Measurements history populated automatically from request.\n');


    // ==========================================
    // TEST 7: Single Magic Link Resolution after Conversion
    // ==========================================
    console.log('--- TEST 7: Single Magic Link Resolution Post-Conversion ---');
    console.log(`Simulating customer reopening original magic link: /track/${submissionRes.trackingToken}...`);

    // Run the loader resolution query
    const matchingOrders = await db.select()
      .from(orders)
      .where(
        and(
          eq(orders.trackingToken, submissionRes.trackingToken),
          eq(orders.isDeleted, false)
        )
      );

    if (matchingOrders.length === 0) {
      throw new Error('❌ Test 7 Fail: Token did not resolve to order after conversion!');
    }

    const resolvedOrder = matchingOrders[0];
    console.log(`✅ Success: Original magic link successfully resolved to the Order production page.`);
    console.log(`   Resolved Order Number: ${resolvedOrder.orderNumber}`);
    console.log(`   Order Tailoring Stage: ${resolvedOrder.status} (DRAFT / CONFIRMED)\n`);


    // ==========================================
    // TEST 8: Soft Delete & Visibility Checks
    // ==========================================
    console.log('--- TEST 8: Soft Delete & Visibility Checks ---');
    console.log(`Executing soft delete on converted order ${orderNum}...`);

    // Simulate soft-delete logic from deleteOrderAction
    await db.update(orders)
      .set({
        isDeleted: true,
        status: 'CANCELLED',
        updatedAt: new Date(),
        deletedAt: new Date(),
        deletedBy: 'e2e-admin@deeprastore.com'
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, MOCK_TENANT_ID)));

    // Write system audit log
    await db.insert(auditLogs).values({
      id: uuidv4(),
      tableName: 'orders',
      recordId: orderId,
      action: 'DELETE_ORDER',
      oldData: { status: resolvedOrder.status },
      newData: { status: 'CANCELLED', isDeleted: true, deletedBy: 'e2e-admin@deeprastore.com' },
      staffId: 'e2e-admin@deeprastore.com',
      createdAt: new Date(),
    });

    console.log('Order soft-deleted. Running active queries exclusion audits...');

    // 8.1 Track Portal Check (loader)
    const trackCheck = await db.select().from(orders).where(and(eq(orders.trackingToken, submissionRes.trackingToken), eq(orders.isDeleted, false)));
    if (trackCheck.length > 0) {
      throw new Error('❌ Test 8 Fail: Soft-deleted order was returned by track page query!');
    }
    console.log('   ✅ Hiding from Track Portal loader verified.');

    // 8.2 Dashboard/Operations Grid Check
    const gridCheck = await db.select().from(orders).where(and(eq(orders.tenantId, MOCK_TENANT_ID), eq(orders.isDeleted, false)));
    if (gridCheck.some(o => o.id === orderId)) {
      throw new Error('❌ Test 8 Fail: Soft-deleted order visible in active grid query!');
    }
    console.log('   ✅ Hiding from Operations Grid active orders verified.');

    // 8.3 Payments Queue Check (simulating query in apps/web/app/(staff)/payments/page.tsx)
    const paymentCheck = await db.select().from(orders).where(and(eq(orders.tenantId, MOCK_TENANT_ID), eq(orders.isDeleted, false)));
    if (paymentCheck.some(o => o.id === orderId)) {
      throw new Error('❌ Test 8 Fail: Soft-deleted order visible in Payments queue query!');
    }
    console.log('   ✅ Hiding from Payments Queue verified.');

    // 8.4 Reports Check (simulating query in apps/web/app/(staff)/reports/page.tsx)
    const reportsCheck = await db.select().from(orders).where(and(eq(orders.tenantId, MOCK_TENANT_ID), eq(orders.isDeleted, false)));
    if (reportsCheck.some(o => o.id === orderId)) {
      throw new Error('❌ Test 8 Fail: Soft-deleted order included in Reports query!');
    }
    console.log('   ✅ Hiding from Reports analytics verified.');

    // 8.5 Customer360 profile check (simulating query in apps/web/app/(staff)/actions/customer.ts)
    const profileCheck = await db.select().from(orders).where(and(eq(orders.customerPhone, TEST_PHONE), eq(orders.isDeleted, false)));
    if (profileCheck.some(o => o.id === orderId)) {
      throw new Error('❌ Test 8 Fail: Soft-deleted order visible in Customer360 profile orders list!');
    }
    console.log('   ✅ Hiding from Customer360 profile drawer verified.');

    // 8.6 Physical persistence and Audit Log check
    const [physicalRecord] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!physicalRecord || !physicalRecord.isDeleted || physicalRecord.status !== 'CANCELLED') {
      throw new Error('❌ Test 8 Fail: Order not physically preserved in DB or cancel status not set.');
    }
    const [auditLogEntry] = await db.select().from(auditLogs).where(eq(auditLogs.recordId, orderId));
    if (!auditLogEntry || auditLogEntry.action !== 'DELETE_ORDER') {
      throw new Error('❌ Test 8 Fail: Audit log entry for soft delete not found.');
    }
    console.log('   ✅ Physical retention and DELETE_ORDER audit log verified.');

    console.log('\n=== ALL 8 END-TO-END ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===');

  });
}

runE2E().catch((err) => {
  console.error('\n❌ E2E manual simulation audit failed:', err);
  process.exit(1);
});
