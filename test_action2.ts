import 'dotenv/config';
import { db } from './packages/infrastructure/src/db/client';
import { orders, orderLineItems, enquiries, customers, payments, customerAddresses, measurementsHistory } from './packages/infrastructure/src/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

async function testCreateOrder(data: any) {
  try {
    let orderResult: any;
    
    await db.transaction(async (tx) => {
      let customerId = data.customerId;
      
      if (!customerId) {
        const existing = await tx.select().from(customers).where(eq(customers.phone, data.phone));
        if (existing.length > 0) {
          customerId = existing[0].id;
        } else {
          const [newCust] = await tx.insert(customers).values({
            tenantId: MOCK_TENANT_ID,
            name: data.name,
            phone: data.phone,
          }).returning();
          customerId = newCust.id;
        }
      }

      if (data.email) {
        await tx.update(customers).set({ email: data.email }).where(eq(customers.id, customerId));
      }

      if (data.address) {
        const existingAddr = await tx.select().from(customerAddresses).where(eq(customerAddresses.customerPhone, data.phone));
        if (existingAddr.length > 0) {
          await tx.update(customerAddresses)
            .set({ addressLine1: data.address, updatedAt: new Date() })
            .where(eq(customerAddresses.customerPhone, data.phone));
        } else {
          await tx.insert(customerAddresses).values({
            id: uuidv4(),
            tenantId: MOCK_TENANT_ID,
            customerPhone: data.phone,
            fullName: data.name,
            addressLine1: data.address,
            city: 'Not Set',
            state: 'Not Set',
            postalCode: '000000',
            country: 'India',
          });
        }
      }

      let trackingToken = uuidv4();
      
      if (data.enquiryId) {
        const [enquiry] = await tx.select().from(enquiries).where(eq(enquiries.id, data.enquiryId));
        if (enquiry) {
          if (enquiry.trackingToken) trackingToken = enquiry.trackingToken;
        }
      }

      const orderNumber = `DP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const hasPayment = data.advanceAmount && Number(data.advanceAmount) > 0;
      const initialStatus = hasPayment ? 'PENDING_VERIFICATION' : 'DRAFT';
      const initialPaymentStatus = hasPayment ? 'VERIFICATION_PENDING' : 'UNPAID';

      const [newOrder] = await tx.insert(orders).values({
        tenantId: MOCK_TENANT_ID,
        customerId: customerId,
        customerPhone: data.phone,
        customerName: data.name,
        source: data.source,
        orderCategory: data.orderType,
        primaryImageUrl: data.attachments?.[0]?.url || '',
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        measurementStatus: data.measurementStatus,
        fabricSource: data.fabricSource,
        fabricDetails: data.fabricDetails,
        attachments: data.attachments,
        totalAmount: data.totalAmount?.toString() || '0',
        advanceAmount: data.advanceAmount?.toString() || '0',
        balanceAmount: data.balanceAmount?.toString() || '0',
        paymentMethod: data.paymentMethod,
        utrNumber: data.utrNumber || null,
        paymentProofUrl: data.attachments?.[0]?.url || data.paymentProofUrl || null,
        notes: data.notes,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        orderNumber,
        trackingToken,
      }).returning();
      
      orderResult = newOrder;

      if (data.lineItems && data.lineItems.length > 0) {
        await tx.insert(orderLineItems).values(
          data.lineItems.map((item: any) => ({
            tenantId: MOCK_TENANT_ID,
            orderId: newOrder.id,
            productId: item.productId || item.name,
            quantity: item.quantity,
            price: item.price.toString() || '0',
            status: 'PENDING'
          }))
        );
      }

      if (data.enquiryId) {
        await tx.update(enquiries)
          .set({ status: 'CONVERTED', orderId: newOrder.id })
          .where(eq(enquiries.id, data.enquiryId));
      }

      if (hasPayment) {
        await tx.insert(payments).values({
          orderId: newOrder.id,
          amount: data.advanceAmount.toString(),
          utr: data.utrNumber || null,
          screenshotUrl: data.attachments?.[0]?.url || data.paymentProofUrl || null,
          status: 'PENDING',
        });
      }
    });
    
    return { success: true, order: orderResult };
  } catch (error: any) {
    console.error('TRANSACTION ERROR:', error);
    return { success: false, error: error.message };
  }
}

async function run() {
  const latestEnquiry = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(1);
  const enquiry = latestEnquiry[0];
  
  if (!enquiry) {
    console.log('No enquiry');
    return;
  }
  
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

  const res = await testCreateOrder(formData);
  console.log('Result:', res);
  process.exit(0);
}

run().catch(console.error);
