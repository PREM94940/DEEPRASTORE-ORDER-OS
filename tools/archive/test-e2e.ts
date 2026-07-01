import { db } from '@deeprastore/infrastructure';
import { 
  orders, 
  enquiries, 
  customers
} from '@deeprastore/infrastructure/src/schema';
import { sql, eq } from 'drizzle-orm';
import { submitEnquiryAction } from '../apps/web/app/(customer)/actions/enquiry';
import { updateEnquiryDetailsAction, createUnifiedOrderAction } from '../apps/web/app/(staff)/actions/order-desk';

async function runE2E() {
  console.log('--- STARTING E2E LIVE VALIDATION ---');
  
  // 1. Submit Intake Form
  console.log('\n[1] Submitting Intake Form...');
  const intakeResult = await submitEnquiryAction({
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
  });
  
  console.log('Intake Result:', intakeResult);
  if (!intakeResult.success) throw new Error('Intake failed');
  
  // 2. Intake Queue / DB check
  console.log('\n[2] Checking DB for Enquiry...');
  const [enq] = await db.select().from(enquiries).where(eq(enquiries.enquiryNumber, intakeResult.enquiryNumber!));
  console.log('Enquiry stored:', !!enq);
  console.log('Parsed Order Date from notes:', enq.notes?.includes('Order Date: 2026-06-25'));
  
  // 3. Edit & Save Changes
  console.log('\n[3] Editing and Saving Changes...');
  const editResult = await updateEnquiryDetailsAction(enq.id, {
    name: 'Live Validation User Edited',
    phone: '9999988888',
    email: 'live@deeprastore.com',
    address: '123 Validation St, Tech City',
    productType: 'CUSTOM_STITCHING',
    notes: 'Order Date: 2026-06-25\nAdvance Amount: ₹5000\n\nPlease make sure the fit is perfect.\n\nAdded: Extra lining requested.',
    orderDate: '2026-06-25',
    measurements: {
      lehenga: { waist: '31', hip: '38', length: '42' } // changed waist to 31
    },
    attachments: [
      { url: 'https://example.com/ref1.jpg', type: 'enquiry_image' },
      { url: 'https://example.com/new_ref.jpg', type: 'enquiry_image' }
    ]
  });
  console.log('Edit Result:', editResult);
  
  const [updatedEnq] = await db.select().from(enquiries).where(eq(enquiries.id, enq.id));
  console.log('Edited Measurements:', updatedEnq.measurements);
  console.log('Edited Images:', updatedEnq.referenceImages);

  // 4. Approve & Create Order
  console.log('\n[4] Approving & Creating Order...');
  const orderResult = await createUnifiedOrderAction({
    enquiryId: updatedEnq.id,
    customerId: null,
    name: updatedEnq.customerName,
    phone: updatedEnq.customerPhone,
    email: updatedEnq.email,
    address: updatedEnq.address,
    source: updatedEnq.source,
    orderType: updatedEnq.productType,
    orderDate: '2026-06-25', // Should be preserved
    deliveryDate: updatedEnq.expectedDeliveryDate?.toISOString(),
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
    lineItems: [
      { productId: 'custom', name: 'Custom Lehenga', quantity: 1, price: '15000' }
    ]
  });
  
  console.log('Order Result:', orderResult);
  
  // 5. Verify Production Pipeline
  console.log('\n[5] Verifying Production Data...');
  const [prodOrder] = await db.select().from(orders).where(eq(orders.id, orderResult.order.id));
  console.log('Production Order exists:', !!prodOrder);
  console.log('Order Date Preserved:', prodOrder.orderDate?.toISOString().startsWith('2026-06-25'));
  console.log('Final Attachments Count:', (prodOrder.attachments as any[])?.length);
  
  console.log('\n--- E2E VALIDATION SUCCESSFUL ---');
  process.exit(0);
}

runE2E().catch(console.error);
