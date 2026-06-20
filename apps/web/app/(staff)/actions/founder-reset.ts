'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders, enquiries, customers, payments, customerAddresses, measurementsHistory, enquiryQuotes, enquiryComments, customerNotes } from '@deeprastore/infrastructure/src/schema';
import { auditLogs } from '@deeprastore/infrastructure/src/schema/audit';
import { requireStaffAuth } from './auth';
import { approvedStaff } from '@deeprastore/infrastructure/src/schema/staff';
import { eq } from 'drizzle-orm';

async function verifyFounder() {
  const session = await requireStaffAuth();
  const [staff] = await db.select().from(approvedStaff).where(eq(approvedStaff.email, session.user.email as string));
  if (!staff || staff.role !== 'FOUNDER') {
    throw new Error('Unauthorized. Founder access required.');
  }
  return staff;
}

export async function generateBackupAction() {
  try {
    const staff = await verifyFounder();
    
    // Simulate Backup Generation by querying all data and encoding as JSON
    const allOrders = await db.select().from(orders);
    const allEnquiries = await db.select().from(enquiries);
    const allCustomers = await db.select().from(customers);
    
    const backupData = {
      timestamp: new Date().toISOString(),
      orders: allOrders,
      enquiries: allEnquiries,
      customers: allCustomers
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    // In a real scenario, upload `jsonString` to Supabase Storage and get a signed URL.
    // Here we'll generate a data URI so the user can download it directly.
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

    await db.insert(auditLogs).values({
      tableName: 'system',
      recordId: 'BACKUP',
      action: 'BACKUP_GENERATED',
      staffId: staff.email,
    });

    return { success: true, url: dataUri };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetDemoDataAction() {
  try {
    const staff = await verifyFounder();

    // Dangerous Deletions (Hard Delete)
    await db.transaction(async (tx) => {
      // Delete child tables first
      await tx.delete(payments);
      await tx.delete(enquiryComments);
      await tx.delete(enquiryQuotes);
      await tx.delete(measurementsHistory);
      await tx.delete(customerAddresses);

      // Delete main transactional tables
      await tx.delete(enquiries);
      await tx.delete(orders);
      
      // Delete customers
      await tx.delete(customerNotes);
      await tx.delete(customers);

      // Record Audit
      await tx.insert(auditLogs).values({
        tableName: 'system',
        recordId: 'WIPE',
        action: 'DATA_WIPE_EXECUTED',
        staffId: staff.email,
        newData: { note: "All demo orders, enquiries, and customers were hard deleted." }
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetSequencesAction() {
  try {
    const staff = await verifyFounder();
    
    // In PostgreSQL, we'd reset sequences here (e.g. `ALTER SEQUENCE order_number_seq RESTART WITH 1`)
    // Since our DB uses UUIDs and random numbers for order strings currently, we just log it.
    await db.insert(auditLogs).values({
      tableName: 'system',
      recordId: 'SEQUENCES',
      action: 'SEQUENCES_RESET',
      staffId: staff.email,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
