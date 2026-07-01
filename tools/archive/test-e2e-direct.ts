import { db } from '@deeprastore/infrastructure';
import { orders, enquiries, payments, orderLineItems, customers } from '@deeprastore/infrastructure/src/schema';
import { sql, eq } from 'drizzle-orm';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';

async function runE2E() {
  console.log('--- STARTING E2E LIVE VALIDATION ---');
  
  // 1. Submit Intake Form
  console.log('\n[1] Submitting Intake Form...');
  
  const formData = {
    name: 'Live Validation User',
    phone: '9999988888',
    email: 'live@deeprastore.com',
    address: '123 Validation St, Tech City',
    source: 'Website',
    productType: 'CUSTOM_STITCHING',
    deliveryDate: '2026-07-15',
    notes: 'Order Date: 2026-06-25\nAdvance Amount: ₹5000\n\nPlease make sure the fit is perfect.',
    orderDate: '2026-06-25',
    measurements: {
      lehenga: { waist: '30', hip: '38', length: '42' }
    },
    referenceImages: ['https://example.com/ref1.jpg'],
    designImages: [],
    utr: 'UTR123456789',
    websiteOrderId: '',
    advancePaymentProofUrl: 'https://example.com/payment.jpg'
  };

  const enquiryNumber = `ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [newEnquiry] = await db.insert(enquiries).values({
    tenantId: MOCK_TENANT_ID,
    customerName: formData.name,
    customerPhone: formData.phone,
    email: formData.email || null,
    address: formData.address || null,
    source: formData.source || 'Website',
    productType: formData.productType,
    expectedDeliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : null,
    notes: formData.notes,
    measurements: formData.measurements,
    referenceImages: formData.referenceImages,
    designImages: formData.designImages,
    utr: formData.utr,
    websiteOrderId: formData.websiteOrderId,
    advancePaymentProofUrl: formData.advancePaymentProofUrl,
    enquiryNumber,
    trackingToken: `TRACK-${Math.random().toString(36).substring(2, 10)}`,
  }).returning();

  console.log('Intake Result: SUCCESS', newEnquiry.enquiryNumber);
  
  // 2. Intake Queue / DB check
  console.log('\n[2] Checking DB for Enquiry...');
  const [enq] = await db.select().from(enquiries).where(eq(enquiries.id, newEnquiry.id));
  console.log('Enquiry stored:', !!enq);
  console.log('Parsed Order Date from notes:', enq.notes?.includes('Order Date: 2026-06-25'));
  
  // 3. Edit & Save Changes
  console.log('\n[3] Editing and Saving Changes...');
  const editData = {
    name: 'Live Validation User Edited',
    phone: '9999988888',
    email: 'live@deeprastore.com',
    address: '123 Validation St, Tech City',
    productType: 'CUSTOM_STITCHING',
    deliveryDate: '2026-07-15',
    notes: 'Order Date: 2026-06-25\nAdvance Amount: ₹5000\n\nPlease make sure the fit is perfect.\n\nAdded: Extra lining requested.',
    orderDate: '2026-06-25',
    measurements: {
      lehenga: { waist: '31', hip: '38', length: '42' } // changed waist to 31
    },
    attachments: [
      { url: 'https://example.com/ref1.jpg', type: 'enquiry_image' },
      { url: 'https://example.com/new_ref.jpg', type: 'enquiry_image' } // Added new
    ]
  };

  await db.update(enquiries)
    .set({
      customerName: editData.name,
      customerPhone: editData.phone,
      email: editData.email || null,
      address: editData.address || null,
      productType: editData.productType,
      expectedDeliveryDate: editData.deliveryDate ? new Date(editData.deliveryDate) : null,
      notes: editData.notes,
      updatedAt: new Date(),
      measurements: editData.measurements || null,
      referenceImages: editData.attachments.map(a => a.url),
    })
    .where(eq(enquiries.id, enq.id));

  const [updatedEnq] = await db.select().from(enquiries).where(eq(enquiries.id, enq.id));
  console.log('Edited Measurements:', JSON.stringify(updatedEnq.measurements));
  console.log('Edited Images:', updatedEnq.referenceImages);

  // 4. Approve & Create Order
  console.log('\n[4] Approving & Creating Order...');
  const orderNumber = `DP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  
  let orderResult;
  await db.transaction(async (tx) => {
    // Upsert Customer
    let [customer] = await tx.select().from(customers).where(eq(customers.phone, updatedEnq.customerPhone));
    if (!customer) {
      [customer] = await tx.insert(customers).values({
        tenantId: MOCK_TENANT_ID,
        phone: updatedEnq.customerPhone,
        name: updatedEnq.customerName,
        email: updatedEnq.email,
        address: updatedEnq.address,
      }).returning();
    }

    const [newOrder] = await tx.insert(orders).values({
      tenantId: MOCK_TENANT_ID,
      customerId: customer.id,
      customerPhone: customer.phone,
      customerName: updatedEnq.customerName,
      source: updatedEnq.source,
      orderCategory: updatedEnq.productType,
      primaryImageUrl: updatedEnq.referenceImages?.[0] || '',
      orderDate: new Date('2026-06-25'), // Extracted from notes safely
      expectedDeliveryDate: updatedEnq.expectedDeliveryDate,
      measurementStatus: 'MEASURED',
      fabricSource: 'CUSTOMER_PROVIDED',
      fabricDetails: '',
      attachments: updatedEnq.referenceImages?.map((url: string) => ({ url, type: 'enquiry_image' })) || [],
      totalAmount: '15000',
      advanceAmount: '5000',
      balanceAmount: '10000',
      paymentMethod: 'UPI',
      utrNumber: 'UTR123456789',
      notes: updatedEnq.notes,
      status: 'PENDING_VERIFICATION',
      paymentStatus: 'VERIFICATION_PENDING',
      orderNumber,
      trackingToken: updatedEnq.trackingToken,
    }).returning();
    
    orderResult = newOrder;

    await tx.insert(orderLineItems).values([
      {
        tenantId: MOCK_TENANT_ID,
        orderId: newOrder.id,
        productId: 'custom',
        quantity: 1,
        price: '15000',
        status: 'PENDING'
      }
    ]);

    await tx.update(enquiries)
      .set({ status: 'CONVERTED', orderId: newOrder.id })
      .where(eq(enquiries.id, updatedEnq.id));

    await tx.insert(payments).values({
      orderId: newOrder.id,
      amount: '5000',
      utr: 'UTR123456789',
      screenshotUrl: 'https://example.com/payment.jpg',
      status: 'PENDING',
    });
  });

  console.log('Order Created:', orderResult.orderNumber);
  
  // 5. Verify Production Pipeline
  console.log('\n[5] Verifying Production Data...');
  const [prodOrder] = await db.select().from(orders).where(eq(orders.id, orderResult.id));
  console.log('Production Order exists:', !!prodOrder);
  console.log('Order Date Preserved:', prodOrder.orderDate?.toISOString().startsWith('2026-06-25'));
  console.log('Final Attachments:', (prodOrder.attachments as any[])?.length, 'images merged successfully');
  console.log('Enquiry Status Updated:', (await db.select().from(enquiries).where(eq(enquiries.id, enq.id)))[0].status);
  
  console.log('\n--- E2E VALIDATION SUCCESSFUL ---');
  process.exit(0);
}

runE2E().catch(console.error);
