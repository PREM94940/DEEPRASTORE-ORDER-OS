import { pgTable, varchar, timestamp, jsonb, numeric, integer } from 'drizzle-orm/pg-core';

export const shopifyProductsCache = pgTable('shopify_products_cache', {
  shopifyProductId: varchar('shopify_product_id', { length: 255 }).primaryKey(),
  sku: varchar('sku', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  inventory: integer('inventory'),
  imageUrl: varchar('image_url', { length: 1024 }),
  variantId: varchar('variant_id', { length: 255 }),
  status: varchar('status', { length: 50 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mediaAssets = pgTable('media_assets', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sku: varchar('sku', { length: 255 }),
  assetType: varchar('asset_type', { length: 50 }),
  fileUrl: varchar('file_url', { length: 1024 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 1024 }),
  shootDate: timestamp('shoot_date'),
  uploadedBy: varchar('uploaded_by', { length: 255 }),
  linkedContentId: varchar('linked_content_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
