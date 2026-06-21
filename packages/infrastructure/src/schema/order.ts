import { pgTable, uuid, varchar, timestamp, integer, numeric, jsonb, serial, boolean } from 'drizzle-orm/pg-core';
import { customers } from './customer';

export const businessIdSeq = pgTable('business_id_seq', {
  id: serial('id').primaryKey(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: varchar('business_id', { length: 50 }).unique(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerPhone: varchar('customer_phone', { length: 50 }).references(() => customers.phone),
  customerName: varchar('customer_name', { length: 255 }),
  source: varchar('source', { length: 50 }).notNull().default('WHATSAPP'), // WEBSITE, WHATSAPP, WALK_IN, PHONE
  orderCategory: varchar('order_category', { length: 50 }).notNull().default('READY_MADE'), // READY_MADE, CUSTOM_STITCHING, ALTERATION, FABRIC_ONLY
  primaryImageUrl: varchar('primary_image_url', { length: 1024 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, PENDING_CONFIRMATION, CONFIRMED, FULFILLED, CANCELLED
  paymentMethod: varchar('payment_method', { length: 50 }), // SHOPIFY, RAZORPAY, UPI_SCREENSHOT, BANK_TRANSFER, CARD_MACHINE, CASH
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('UNPAID'), // UNPAID, PENDING_VERIFICATION, PARTIAL, PAID, REFUNDED
  productionStatus: varchar('production_status', { length: 50 }).notNull().default('NOT_STARTED'), // NOT_STARTED, MEASUREMENT_PENDING, GARMENT_RECEIVED, INVENTORY_RESERVED, CUTTING, STITCHING, FINISHING, QC_PENDING, READY, HOLD
  dispatchStatus: varchar('dispatch_status', { length: 50 }).notNull().default('NOT_STARTED'), // NOT_STARTED, PACKING, PACKED, DISPATCHED, DELIVERED, RETURNED
  statusUpdatedAt: timestamp('status_updated_at').defaultNow().notNull(),
  utrNumber: varchar('utr_number', { length: 100 }),
  websiteOrderId: varchar('website_order_id', { length: 255 }),
  paymentProofUrl: varchar('payment_proof_url', { length: 1024 }),
  verificationStaff: varchar('verification_staff', { length: 255 }),
  verificationTime: timestamp('verification_time'),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  orderDate: timestamp('order_date').defaultNow().notNull(),
  measurementStatus: varchar('measurement_status', { length: 50 }).notNull().default('PENDING'), // USE_EXISTING, TAKE_NEW, PENDING, BOOK_PHOTO_UPLOADED
  fabricSource: varchar('fabric_source', { length: 50 }), // CUSTOMER, DEEPRASTORE
  fabricDetails: jsonb('fabric_details'),
  attachments: jsonb('attachments'),
  advanceAmount: numeric('advance_amount', { precision: 10, scale: 2 }),
  balanceAmount: numeric('balance_amount', { precision: 10, scale: 2 }),
  
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

  // V2 Enhancements
  orderNumber: varchar('order_number', { length: 50 }).unique(),
  trackingToken: varchar('tracking_token', { length: 100 }),
  
  // Tracking Metadata (DELIVERED/DISPATCHED)
  courierName: varchar('courier_name', { length: 255 }),
  trackingId: varchar('tracking_id', { length: 255 }),
  trackingUrl: varchar('tracking_url', { length: 1024 }),
  dispatchDate: timestamp('dispatch_date'),
  deliveryProofUrl: varchar('delivery_proof_url', { length: 1024 }),
  notes: varchar('notes', { length: 2048 }),

  // Advanced Pricing
  basePrice: numeric('base_price', { precision: 10, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }),
  deliveryAmount: numeric('delivery_amount', { precision: 10, scale: 2 }),
  deliveryType: varchar('delivery_type', { length: 50 }), // IN_STORE_PICKUP, LOCAL_INSTANT, STANDARD_PARCEL

  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Soft Delete Fields
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
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
  measurements: jsonb('measurements'),
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
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  utr: varchar('utr', { length: 255 }),
  screenshotUrl: varchar('screenshot_url', { length: 1024 }),
  razorpayPaymentLinkId: varchar('razorpay_payment_link_id', { length: 255 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  verifiedBy: varchar('verified_by', { length: 255 }),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderChangeRequests = pgTable('order_change_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  changeType: varchar('change_type', { length: 50 }).notNull(), // MEASUREMENT_CHANGE, DESIGN_CHANGE, FABRIC_CHANGE, ADDRESS_CHANGE, PRODUCT_ADDITION, PRODUCT_REMOVAL, OTHER
  reason: varchar('reason', { length: 2048 }).notNull(),
  costImpact: numeric('cost_impact', { precision: 10, scale: 2 }).default('0'),
  deliveryImpactDays: integer('delivery_impact_days').default(0),
  requestedBy: varchar('requested_by', { length: 255 }).notNull(),
  approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  approvedBy: varchar('approved_by', { length: 255 }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
