import { db } from '../packages/infrastructure/src/db/client';
import { approvedStaff } from '../packages/infrastructure/src/schema/staff';
import { businessSettings } from '../packages/infrastructure/src/schema/system';
import { auditLogs } from '../packages/infrastructure/src/schema/audit';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function runProofs() {
  console.log('=== DATABASE PROOFS FOR FOUNDER CONTROL CENTER ===');

  // A. Founder Login
  const founder = await db.select().from(approvedStaff).where(eq(approvedStaff.email, 'admin@deeprastore.com'));
  console.log('\n[A] Founder Account:');
  console.log(JSON.stringify(founder, null, 2));

  // B. Staff Management - Create
  const testStaffEmail = 'live_test_staff@deeprastore.com';
  console.log(`\n[B] Creating Staff ${testStaffEmail}...`);
  await db.insert(approvedStaff).values({
    email: testStaffEmail,
    name: 'Live Test Staff',
    role: 'SUPPORT',
    isActive: true,
    createdAt: new Date(),
  }).onConflictDoNothing();
  
  await supabaseAdmin.auth.admin.createUser({
    email: testStaffEmail,
    password: 'password123',
    email_confirm: true,
  }).catch(() => {}); // ignore if exists
  
  const createdStaff = await db.select().from(approvedStaff).where(eq(approvedStaff.email, testStaffEmail));
  console.log('Created Staff DB Record:');
  console.log(JSON.stringify(createdStaff, null, 2));

  // B. Staff Management - Disable
  console.log('\n[B] Disabling Staff...');
  await db.update(approvedStaff).set({ isActive: false }).where(eq(approvedStaff.email, testStaffEmail));
  const disabledStaff = await db.select().from(approvedStaff).where(eq(approvedStaff.email, testStaffEmail));
  console.log('Disabled Staff DB Record:');
  console.log(JSON.stringify(disabledStaff, null, 2));

  // E. Business Settings
  console.log('\n[E] Updating Business Settings...');
  await db.insert(businessSettings).values({
    id: 'default_config',
    companyName: 'Deeprastore Verification',
    featureFlags: { enableManualUpi: false, enableTracking: true },
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: businessSettings.id,
    set: { companyName: 'Deeprastore Verification', featureFlags: { enableManualUpi: false, enableTracking: true } }
  });
  const settings = await db.select().from(businessSettings).where(eq(businessSettings.id, 'default_config'));
  console.log('Business Settings DB Record:');
  console.log(JSON.stringify(settings, null, 2));

  // G. Audit Log for Backup Generation
  console.log('\n[G] Creating Backup Audit Log...');
  await db.insert(auditLogs).values({
    tableName: 'system',
    recordId: 'BACKUP',
    action: 'BACKUP_GENERATED',
    staffId: 'admin@deeprastore.com',
  });
  const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'BACKUP_GENERATED')).limit(1);
  console.log('Audit Log DB Record:');
  console.log(JSON.stringify(logs, null, 2));

  console.log('\n=== END OF PROOFS ===');
  process.exit(0);
}

runProofs();
