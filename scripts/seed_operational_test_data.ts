import { db } from '../packages/infrastructure/src/db/client';
import { orders, payments } from '../packages/infrastructure/src/schema/order';
import { customers, customerNotes, measurementsHistory } from '../packages/infrastructure/src/schema/customer';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from apps/web/.env
dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

const testPhones = [
  '9876543210',
  '9876543211',
  '9876543212',
  '9876543213'
];

async function seed() {
  console.log("=== STARTING OPERATIONAL DATA SEEDING ===");

  // 1. Clean up existing test orders and payments
  console.log("Cleaning up old test data...");
  for (const phone of testPhones) {
    const existingOrders = await db.select().from(orders).where(eq(orders.customerPhone, phone));
    for (const o of existingOrders) {
      await db.delete(payments).where(eq(payments.orderId, o.id));
    }
    await db.delete(orders).where(eq(orders.customerPhone, phone));
    await db.delete(customerNotes).where(eq(customerNotes.phone, phone));
    await db.delete(measurementsHistory).where(eq(measurementsHistory.customerPhone, phone));
    await db.delete(customers).where(eq(customers.phone, phone));
  }

  // 2. Create Customers
  console.log("Creating test customers...");
  
  const c1Id = uuidv4();
  const [cust1] = await db.insert(customers).values({
    id: c1Id,
    phone: '9876543211',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    tenantId: MOCK_TENANT_ID,
    ltv: '49500.00',
    totalOrders: 3,
  }).returning();

  const c2Id = uuidv4();
  const [cust2] = await db.insert(customers).values({
    id: c2Id,
    phone: '9876543212',
    name: 'Anjali Gupta',
    email: 'anjali@example.com',
    tenantId: MOCK_TENANT_ID,
    ltv: '52000.00',
    totalOrders: 3,
  }).returning();

  const c3Id = uuidv4();
  const [cust3] = await db.insert(customers).values({
    id: c3Id,
    phone: '9876543213',
    name: 'Meera Nair',
    email: 'meera@example.com',
    tenantId: MOCK_TENANT_ID,
    ltv: '23500.00',
    totalOrders: 3,
  }).returning();

  console.log("Customers created successfully.");

  // 3. Add Customer Notes & Measurements
  console.log("Seeding customer notes and measurements...");
  await db.insert(customerNotes).values([
    {
      id: uuidv4(),
      phone: cust1.phone,
      note: 'Prefers round back neck on blouses. Requested extra margin in margins.',
      createdBy: 'Staff01'
    },
    {
      id: uuidv4(),
      phone: cust2.phone,
      note: 'Needs delivery before the wedding next month. Handle with care.',
      createdBy: 'Staff01'
    }
  ]);

  await db.insert(measurementsHistory).values([
    {
      id: uuidv4(),
      customerId: cust1.id,
      customerPhone: cust1.phone,
      waist: '30',
      hip: '38',
      bust: '34',
      height: '165',
      sleeve: '12',
      customFields: {
        category: 'Lehenga',
        length: '40',
        underbust: '28',
        armhole: '16',
        backNeck: '9'
      }
    },
    {
      id: uuidv4(),
      customerId: cust2.id,
      customerPhone: cust2.phone,
      waist: '32',
      hip: '40',
      bust: '36',
      height: '162',
      sleeve: '10',
      customFields: {
        category: 'Blouse',
        underbust: '30',
        armhole: '17',
        backNeck: '10'
      }
    }
  ]);

  // 4. Create Orders
  console.log("Seeding orders...");

  // Priya Sharma: 1 Draft
  const o1Id = uuidv4();
  await db.insert(orders).values({
    id: o1Id,
    businessId: 'DP261001',
    tenantId: MOCK_TENANT_ID,
    customerId: cust1.id,
    customerName: cust1.name,
    customerPhone: cust1.phone,
    orderCategory: 'CUSTOM_STITCHING',
    totalAmount: '15000.00',
    advanceAmount: '0.00',
    balanceAmount: '15000.00',
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    primaryImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80',
    notes: 'Draft order created during client walk-in'
  });

  // Anjali Gupta: Pending Verification
  const o2Id = uuidv4();
  await db.insert(orders).values({
    id: o2Id,
    businessId: 'DP261002',
    tenantId: MOCK_TENANT_ID,
    customerId: cust2.id,
    customerName: cust2.name,
    customerPhone: cust2.phone,
    orderCategory: 'LEHENGA',
    totalAmount: '25000.00',
    advanceAmount: '10000.00',
    balanceAmount: '15000.00',
    status: 'PENDING_VERIFICATION',
    paymentStatus: 'VERIFICATION_PENDING',
    utrNumber: 'UTR-987654321-ABC',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=80',
    primaryImageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
    notes: 'Advance receipt uploaded'
  });
  // Add payment queue item
  await db.insert(payments).values({
    id: uuidv4(),
    orderId: o2Id,
    amount: '10000.00',
    utr: 'UTR-987654321-ABC',
    screenshotUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=80',
    status: 'PENDING'
  });

  // Anjali Gupta: Payment Rejected
  const o3Id = uuidv4();
  await db.insert(orders).values({
    id: o3Id,
    businessId: 'DP261003',
    tenantId: MOCK_TENANT_ID,
    customerId: cust2.id,
    customerName: cust2.name,
    customerPhone: cust2.phone,
    orderCategory: 'BLOUSE',
    totalAmount: '5000.00',
    advanceAmount: '2500.00',
    balanceAmount: '2500.00',
    status: 'PAYMENT_REJECTED',
    paymentStatus: 'REJECTED',
    primaryImageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80',
    notes: 'Incorrect screenshot uploaded, needs re-upload.'
  });
  await db.insert(payments).values({
    id: uuidv4(),
    orderId: o3Id,
    amount: '2500.00',
    utr: 'UTR-REJECTED-001',
    screenshotUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80',
    status: 'REJECTED'
  });

  // Meera Nair: Cutting
  const o4Id = uuidv4();
  await db.insert(orders).values({
    id: o4Id,
    businessId: 'DP261004',
    tenantId: MOCK_TENANT_ID,
    customerId: cust3.id,
    customerName: cust3.name,
    customerPhone: cust3.phone,
    orderCategory: 'KURTA',
    totalAmount: '8000.00',
    advanceAmount: '8000.00',
    balanceAmount: '0.00',
    status: 'CUTTING',
    paymentStatus: 'VERIFIED',
    primaryImageUrl: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=300&auto=format&fit=crop&q=80',
    notes: 'Premium silk fabric. Pattern cut is ready.'
  });

  // Meera Nair: Stitching
  const o5Id = uuidv4();
  await db.insert(orders).values({
    id: o5Id,
    businessId: 'DP261005',
    tenantId: MOCK_TENANT_ID,
    customerId: cust3.id,
    customerName: cust3.name,
    customerPhone: cust3.phone,
    orderCategory: 'CUSTOM_STITCHING',
    totalAmount: '12000.00',
    advanceAmount: '6000.00',
    balanceAmount: '6000.00',
    status: 'STITCHING',
    paymentStatus: 'VERIFIED',
    primaryImageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=300&auto=format&fit=crop&q=80',
    notes: 'Stitching in progress by Masterji Mohan.'
  });

  // Priya Sharma: QC
  const o6Id = uuidv4();
  await db.insert(orders).values({
    id: o6Id,
    businessId: 'DP261006',
    tenantId: MOCK_TENANT_ID,
    customerId: cust1.id,
    customerName: cust1.name,
    customerPhone: cust1.phone,
    orderCategory: 'READY_MADE',
    totalAmount: '4500.00',
    advanceAmount: '4500.00',
    balanceAmount: '0.00',
    status: 'QC',
    paymentStatus: 'VERIFIED',
    primaryImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80',
    notes: 'Verify zipper alignment.'
  });

  // Priya Sharma: Ready to Ship
  const o7Id = uuidv4();
  await db.insert(orders).values({
    id: o7Id,
    businessId: 'DP261007',
    tenantId: MOCK_TENANT_ID,
    customerId: cust1.id,
    customerName: cust1.name,
    customerPhone: cust1.phone,
    orderCategory: 'LEHENGA',
    totalAmount: '30000.00',
    advanceAmount: '15000.00',
    balanceAmount: '15000.00',
    status: 'READY_TO_SHIP',
    paymentStatus: 'VERIFIED',
    primaryImageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
    notes: 'Garment packed, awaiting blue dart pickup.'
  });

  // Anjali Gupta: Dispatched
  const o8Id = uuidv4();
  await db.insert(orders).values({
    id: o8Id,
    businessId: 'DP261008',
    tenantId: MOCK_TENANT_ID,
    customerId: cust2.id,
    customerName: cust2.name,
    customerPhone: cust2.phone,
    orderCategory: 'CUSTOM_STITCHING',
    totalAmount: '22000.00',
    advanceAmount: '22000.00',
    balanceAmount: '0.00',
    status: 'DISPATCHED',
    paymentStatus: 'VERIFIED',
    courierName: 'DHL Express',
    trackingId: 'DHL-987-654-321',
    dispatchDate: new Date(),
    primaryImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80',
    notes: 'Shipped to Mumbai address'
  });

  // Meera Nair: Delivered
  const o9Id = uuidv4();
  await db.insert(orders).values({
    id: o9Id,
    businessId: 'DP261009',
    tenantId: MOCK_TENANT_ID,
    customerId: cust3.id,
    customerName: cust3.name,
    customerPhone: cust3.phone,
    orderCategory: 'READY_MADE',
    totalAmount: '3500.00',
    advanceAmount: '3500.00',
    balanceAmount: '0.00',
    status: 'DELIVERED',
    paymentStatus: 'VERIFIED',
    courierName: 'Delhivery',
    trackingId: 'DEL-999-000-111',
    dispatchDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    primaryImageUrl: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=300&auto=format&fit=crop&q=80',
    notes: 'Delivered successfully and signed by customer.'
  });

  console.log("Orders and payments seeded successfully.");
  console.log("=== OPERATIONAL DATA SEEDING COMPLETE ===");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
