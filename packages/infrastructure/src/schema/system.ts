import { pgTable, varchar, timestamp, jsonb, text, uuid } from 'drizzle-orm/pg-core';

export const systemAlerts = pgTable('system_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  alertType: varchar('alert_type', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});
export const businessSettings = pgTable('business_settings', {
  id: varchar('id', { length: 50 }).primaryKey().default('default_config'),
  
  // Company Details
  companyName: varchar('company_name', { length: 255 }),
  companyAddress: varchar('company_address', { length: 1000 }),
  supportNumber: varchar('support_number', { length: 50 }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  instagramUrl: varchar('instagram_url', { length: 500 }),
  websiteUrl: varchar('website_url', { length: 500 }),
  logoUrl: varchar('logo_url', { length: 1000 }),
  
  // Financial & Billing
  gstNumber: varchar('gst_number', { length: 50 }),
  upiId: varchar('upi_id', { length: 255 }),
  bankDetails: jsonb('bank_details'), // { accountName, accountNumber, ifsc, bankName }
  invoicePrefix: varchar('invoice_prefix', { length: 20 }),
  orderPrefix: varchar('order_prefix', { length: 20 }),
  termsAndConditions: varchar('terms_and_conditions', { length: 2000 }),
  
  // Logistics & Pricing
  defaultCourier: varchar('default_courier', { length: 100 }),
  defaultDeliveryCharge: varchar('default_delivery_charge', { length: 50 }),
  defaultAdvancePercentage: varchar('default_advance_percentage', { length: 10 }),
  
  // Feature Flags
  featureFlags: jsonb('feature_flags'), // { enableCustomerPortal, enableTracking, enableRazorpay, enableManualUpi, enableStaffSignup, enableDispatchBoard }
  
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 })
});
