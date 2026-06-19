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
    const seqRes = await db.execute(sql`SELECT nextval('enquiry_number_seq')`);
    const nextVal = ((seqRes as any).rows || seqRes)[0]?.nextval || 1;
    const enquiryNumber = `REQUEST-${String(nextVal).padStart(4, '0')}`;

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
      status: 'REQUEST',
    });

    revalidatePath('/pilot/order-desk');
    return { success: true, enquiryNumber, trackingToken };
  } catch (error) {
    console.error('Failed to submit enquiry:', error);
    return { success: false, error: 'Failed to submit request' };
  }
}
