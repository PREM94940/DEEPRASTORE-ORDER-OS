import { pgTable, uuid, varchar, timestamp, jsonb, integer, numeric } from 'drizzle-orm/pg-core';
import { orders } from './order';

export const enquiries = pgTable('enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  source: varchar('source', { length: 50 }).notNull(), // WhatsApp, Instagram, Walk-In, Website, Referral
  productType: varchar('product_type', { length: 50 }),
  referenceImages: jsonb('reference_images'), // Array of URLs
  designImages: jsonb('design_images'), // Array of URLs
  notes: varchar('notes', { length: 2048 }),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  measurements: jsonb('measurements'),
  status: varchar('status', { length: 50 }).notNull().default('REQUEST'), // REQUEST, PRICE_QUOTED, etc.
  orderId: uuid('order_id').references(() => orders.id), // Link back to created order
  enquiryNumber: varchar('enquiry_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: varchar('address', { length: 1024 }),
  advancePaymentProofUrl: varchar('advance_payment_proof_url', { length: 1024 }),
  trackingToken: varchar('tracking_token', { length: 100 }),
  assignedTo: varchar('assigned_to', { length: 255 }),
  currentQuoteId: uuid('current_quote_id'), // Link to current active quote version
  customerResponse: varchar('customer_response', { length: 50 }), // APPROVED, REJECTED, CHANGES_REQUESTED
  customerResponseNotes: varchar('customer_response_notes', { length: 2048 }), // Feedback notes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const enquiryQuotes = pgTable('enquiry_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  quoteAmount: numeric('quote_amount', { precision: 10, scale: 2 }).notNull(),
  requiredAdvance: numeric('required_advance', { precision: 10, scale: 2 }).notNull(),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }),
  deliveryAmount: numeric('delivery_amount', { precision: 10, scale: 2 }),
  deliveryType: varchar('delivery_type', { length: 50 }), // IN_STORE_PICKUP, LOCAL_INSTANT, STANDARD_PARCEL
  paymentLinkUrl: varchar('payment_link_url', { length: 1024 }),
  quoteNotes: varchar('quote_notes', { length: 2048 }),
  invoiceUrl: varchar('invoice_url', { length: 1024 }),
  expiresAt: timestamp('expires_at'),
  createdBy: varchar('created_by', { length: 255 }),
  statusSnapshot: varchar('status_snapshot', { length: 50 }), // status of enquiry after quote action
  createdFromStatus: varchar('created_from_status', { length: 50 }), // status of enquiry before quote action
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const enquiryComments = pgTable('enquiry_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  staffName: varchar('staff_name', { length: 255 }).notNull(),
  comment: varchar('comment', { length: 2048 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


