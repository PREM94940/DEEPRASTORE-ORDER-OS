'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { measurementsHistory } from '@deeprastore/infrastructure/src/schema/customer';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}
export async function updateMeasurementsAction(data: {
  customerPhone: string;
  bust: string;
  waist: string;
  hip: string;
  height: string;
}) {
  try {
    await db.insert(measurementsHistory).values({
      id: uuidv4(),
      customerPhone: normalizePhone(data.customerPhone),
      bust: data.bust,
      waist: data.waist,
      hip: data.hip,
      height: data.height,
      recordedAt: new Date(),
    });

    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
