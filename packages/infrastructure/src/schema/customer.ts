import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { leads } from './crm';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  leadId: uuid('lead_id').references(() => leads.id),
  phone: varchar('phone', { length: 255 }),
  alternatePhone: varchar('alternate_phone', { length: 255 }), // For WhatsApp Number Merge
  tier: varchar('tier', { length: 50 }).notNull().default('REGULAR'), // VIP, REGULAR, WHOLESALE, INFLUENCER
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
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
