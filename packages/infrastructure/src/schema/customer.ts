import { pgTable, varchar, timestamp, boolean, numeric, integer, text, uuid, jsonb } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ltv: numeric('ltv', { precision: 10, scale: 2 }).default('0'),
  totalOrders: integer('total_orders').default(0),
  hasOpenTicket: boolean('has_open_ticket').default(false),
  hasRefundHistory: boolean('has_refund_history').default(false),
  vipCustomer: boolean('vip_customer').default(false),
  blacklistFlag: boolean('blacklist_flag').default(false),
  tenantId: uuid('tenant_id'), // Optional, for backward compat if needed
});

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull().references(() => customers.phone),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 50 }).notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customerNotes = pgTable('customer_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 255 }).notNull().references(() => customers.phone),
  note: varchar('note', { length: 2048 }),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const measurementsHistory = pgTable('measurements_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerPhone: varchar('customer_phone', { length: 255 }).notNull(),
  bust: varchar('bust', { length: 50 }),
  waist: varchar('waist', { length: 50 }),
  hip: varchar('hip', { length: 50 }),
  height: varchar('height', { length: 50 }),
  sleeve: varchar('sleeve', { length: 50 }),
  blousePattern: varchar('blouse_pattern', { length: 255 }),
  customFields: jsonb('custom_fields'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});
