import { pgTable, uuid, varchar, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { customers } from './customer';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  source: varchar('source', { length: 50 }).notNull().default('WHATSAPP'), // WHATSAPP, STORE, SHOPIFY
  orderType: varchar('order_type', { length: 50 }).notNull().default('READY'), // READY, CUSTOM
  status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
  paymentMethod: varchar('payment_method', { length: 50 }), // RAZORPAY, UPI
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('PENDING'), // PENDING, VERIFICATION_PENDING, VERIFIED
  utrNumber: varchar('utr_number', { length: 100 }),
  paymentProofUrl: varchar('payment_proof_url', { length: 1024 }),
  verificationStaff: varchar('verification_staff', { length: 255 }),
  verificationTime: timestamp('verification_time'),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  
  // Operational Control Fields
  assignedStaff: varchar('assigned_staff', { length: 255 }),
  lastUpdatedBy: varchar('last_updated_by', { length: 255 }),
  lastCustomerContactDate: timestamp('last_customer_contact_date'),
  customerInformed: varchar('customer_informed', { length: 10 }).notNull().default('YES'), // YES/NO
  lastStatusMessageSent: varchar('last_status_message_sent', { length: 1024 }),
  nextFollowupDate: timestamp('next_followup_date'),
  delayReason: varchar('delay_reason', { length: 255 }), // Fabric Delay, Tailoring Delay, QA Rework, Courier Delay, Customer Change Request
  
  // Exception Tracking
  exceptionReason: varchar('exception_reason', { length: 255 }), // Issue Type
  exceptionDescription: varchar('exception_description', { length: 2048 }), // User Description
  exceptionEvidenceUrl: varchar('exception_evidence_url', { length: 1024 }), // Uploaded Image
  exceptionRaisedDate: timestamp('exception_raised_date'),
  exceptionStatus: varchar('exception_status', { length: 50 }).notNull().default('NONE'), // NONE, OPEN, RESOLVED

  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderLineItems = pgTable('order_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  productId: varchar('product_id', { length: 255 }),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, STITCHING, READY, SHIPPED, DELIVERED
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  delayReason: varchar('delay_reason', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderAddresses = pgTable('order_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 50 }).notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
