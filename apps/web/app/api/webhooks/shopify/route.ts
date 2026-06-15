import { NextRequest, NextResponse } from 'next/server';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { shopifyProductsCache } from '@deeprastore/infrastructure/src/schema/product';
import { customers } from '@deeprastore/infrastructure/src/schema/customer';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const topic = req.headers.get('x-shopify-topic');
    const payload = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    if (topic === 'products/create' || topic === 'products/update') {
      await db.insert(shopifyProductsCache).values({
        shopifyProductId: payload.id.toString(),
        title: payload.title || '',
        sku: payload.variants?.[0]?.sku || null,
        price: payload.variants?.[0]?.price || null,
        inventory: payload.variants?.[0]?.inventory_quantity || 0,
        imageUrl: payload.image?.src || null,
        variantId: payload.variants?.[0]?.id?.toString() || null,
        status: payload.status || 'ACTIVE',
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: shopifyProductsCache.shopifyProductId,
        set: {
          title: payload.title || '',
          sku: payload.variants?.[0]?.sku || null,
          price: payload.variants?.[0]?.price || null,
          inventory: payload.variants?.[0]?.inventory_quantity || 0,
          imageUrl: payload.image?.src || null,
          variantId: payload.variants?.[0]?.id?.toString() || null,
          status: payload.status || 'ACTIVE',
          updatedAt: new Date()
        }
      });
    } else if (topic === 'products/delete') {
      // @ts-ignore
      await db.delete(shopifyProductsCache).where(eq(shopifyProductsCache.shopifyProductId, payload.id.toString()));
    } else if (topic === 'inventory_levels/update') {
      // Just an acknowledgment for inventory updates for now
      console.log('Inventory level updated', payload);
    } else if (topic === 'customers/create' || topic === 'customers/update') {
      const phone = payload.phone || payload.default_address?.phone || `no-phone-${payload.id}`;
      const name = `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
      
      await db.insert(customers).values({
        phone: phone,
        name: name,
        email: payload.email || '',
        createdAt: new Date(),
      }).onConflictDoUpdate({
        target: customers.phone,
        set: {
          name: name,
          email: payload.email || ''
        }
      });
    } else if (topic === 'orders/create' || topic === 'orders/updated') {
      // Order webhooks
      console.log('Order webhook received', topic);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
