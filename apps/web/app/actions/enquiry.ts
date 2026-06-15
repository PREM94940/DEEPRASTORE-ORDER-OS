'use server';

import { db } from '@deeprastore/infrastructure';
import { enquiries } from '@deeprastore/infrastructure/src/schema';
import { revalidatePath } from 'next/cache';

export async function submitEnquiryAction(data: any) {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111'; // Mocked tenant ID for single tenant store
    
    await db.insert(enquiries).values({
      tenantId,
      customerName: data.name,
      customerPhone: data.phone,
      source: data.source || 'WHATSAPP',
      productType: data.productType,
      notes: data.notes,
      expectedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      referenceImages: data.referenceImages || [],
      designImages: data.designImages || [],
      status: 'NEW_ENQUIRY',
    });

    revalidatePath('/pilot/order-desk');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit enquiry:', error);
    return { success: false, error: 'Failed to submit request' };
  }
}
