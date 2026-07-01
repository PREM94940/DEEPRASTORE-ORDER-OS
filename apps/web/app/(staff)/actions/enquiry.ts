'use server';

import { db } from '@deeprastore/infrastructure';
import { enquiries } from '@deeprastore/infrastructure/src/schema';
import { revalidatePath } from 'next/cache';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function submitEnquiryAction(data: any) {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111'; // Mocked tenant ID for single tenant store
    
    // 1. Generate sequential request number
    const countRes = await db.execute(sql`SELECT COUNT(*) as count FROM enquiries WHERE tenant_id = ${tenantId}`);
    const count = parseInt(((countRes as any).rows || countRes)[0]?.count as string) || 0;
    const enquiryNumber = `REQUEST-${String(count + 1).padStart(4, '0')}`;

    // 2. Generate secure UUID tracking token
    const trackingToken = uuidv4();

    // 3. Normalize source
    const sourceMap: Record<string, string> = {
      whatsapp: 'WHATSAPP',
      instagram: 'INSTAGRAM',
      facebook: 'FACEBOOK',
      website: 'WEBSITE',
      walkin: 'WALKIN',
      referral: 'REFERRAL',
    };
    const inputSource = (data.source || 'website').toLowerCase();
    const normalizedSource = sourceMap[inputSource] || 'WEBSITE';

    await db.insert(enquiries).values({
      tenantId,
      enquiryNumber,
      trackingToken,
      customerName: data.name,
      customerPhone: data.phone,
      email: data.email || null,
      address: data.address || null,
      measurements: data.measurements || null,
      source: normalizedSource,
      productType: data.productType,
      notes: data.notes,
      expectedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      referenceImages: data.referenceImages || [],
      designImages: data.designImages || [],
      advancePaymentProofUrl: data.advancePaymentProofUrl || null,
      utr: data.utr || null,
      websiteOrderId: data.websiteOrderId || null,
      lineItems: data.lineItems || [],
      subtotalAmount: data.subtotalAmount?.toString() || '0',
      discountAmount: data.discountAmount?.toString() || '0',
      deliveryAmount: data.deliveryAmount?.toString() || '0',
      totalAmount: data.totalAmount?.toString() || '0',
      advanceAmount: data.advanceAmount?.toString() || '0',
      status: 'REQUEST',
    });

    try {
      revalidatePath('/pilot/order-desk');
    } catch (revalidateError) {
      if (!(revalidateError instanceof Error) || !revalidateError.message.includes('static generation store')) {
        console.error('Revalidation error:', revalidateError);
      }
    }
    return { success: true, enquiryNumber, trackingToken };
  } catch (error) {
    console.error("Create Order failed:", error);

    if (error instanceof Error) {
      console.error(error.stack);
    }

    throw error;
  }
}

export async function searchProductAction(query: string) {
  try {
    if (!query || query.length < 2) return { success: true, products: [] };
    const { shopifyProductsCache } = await import('@deeprastore/infrastructure/src/schema');
    const { or, ilike } = await import('drizzle-orm');
    
    const results = await db.select({
      sku: shopifyProductsCache.sku,
      title: shopifyProductsCache.title,
      price: shopifyProductsCache.price,
    })
    .from(shopifyProductsCache)
    .where(
      or(
        ilike(shopifyProductsCache.sku, `%${query}%`),
        ilike(shopifyProductsCache.title, `%${query}%`)
      )
    )
    .limit(10);
    
    return { success: true, products: results };
  } catch (error) {
    console.error('Failed to search products:', error);
    return { success: false, products: [] };
  }
}

export async function lookupCustomerAction(phone: string) {
  try {
    if (!phone || phone.length < 5) return { success: false, customer: null };
    const { customers, customerAddresses } = await import('@deeprastore/infrastructure/src/schema');
    const { eq } = await import('drizzle-orm');
    
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    if (!customer) return { success: true, customer: null };
    
    const [address] = await db.select().from(customerAddresses).where(eq(customerAddresses.customerPhone, phone)).orderBy(customerAddresses.createdAt);
    
    return { 
      success: true, 
      customer: {
        name: customer.name || 'Unknown',
        totalOrders: customer.totalOrders || 0,
        city: address?.city || 'Unknown'
      }
    };
  } catch (error) {
    console.error('Failed to lookup customer:', error);
    return { success: false, customer: null };
  }
}
