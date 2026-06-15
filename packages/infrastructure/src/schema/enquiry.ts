import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
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
  status: varchar('status', { length: 50 }).notNull().default('NEW_ENQUIRY'), // NEW_ENQUIRY, CONVERTED, REJECTED
  orderId: uuid('order_id').references(() => orders.id), // Link back to created order
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
