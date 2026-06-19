'use server';

import { createClient } from '@/utils/supabase/server';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { approvedStaff } from '@deeprastore/infrastructure/src/schema/staff';
import { orders } from '@deeprastore/infrastructure/src/schema/order';
import { auditLogs } from '@deeprastore/infrastructure/src/schema/audit';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

async function checkAdminAccess() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Local / development bypass when Supabase is not configured
    return { isAdmin: true, email: 'local-admin@deeprastore.com' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error('Unauthorized. Not authenticated.');
  }

  const staffRecords = await db.select().from(approvedStaff).where(eq(approvedStaff.email, user.email));
  const staff = staffRecords[0];

  if (!staff || !staff.isActive || staff.role !== 'ADMIN') {
    throw new Error('Unauthorized. Admin privileges required.');
  }

  return { isAdmin: true, email: user.email };
}

export async function checkIsAdminAction() {
  try {
    await checkAdminAccess();
    return { success: true, isAdmin: true };
  } catch (err) {
    return { success: true, isAdmin: false };
  }
}

export async function deleteOrderAction(orderId: string) {
  try {
    const adminSession = await checkAdminAccess();
    const tenantId = '11111111-1111-1111-1111-111111111111';

    // 1. Fetch current order status for audit logging
    const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    // 2. Perform Soft Delete (Cancel order & set isDeleted = true)
    await db.update(orders)
      .set({
        isDeleted: true,
        status: 'CANCELLED',
        updatedAt: new Date(),
        deletedAt: new Date(),
        deletedBy: adminSession.email
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));

    // 3. Write to system audit logs table
    await db.insert(auditLogs).values({
      id: uuidv4(),
      tableName: 'orders',
      recordId: orderId,
      action: 'DELETE_ORDER',
      oldData: { status: order.status },
      newData: { status: 'CANCELLED', isDeleted: true, deletedBy: adminSession.email },
      staffId: adminSession.email,
      createdAt: new Date(),
    });

    revalidatePath('/');
    revalidatePath('/production');
    revalidatePath('/dispatch');
    revalidatePath('/payments');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
