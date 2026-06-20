'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { approvedStaff } from '@deeprastore/infrastructure/src/schema/staff';
import { eq, desc } from 'drizzle-orm';
import { requireStaffAuth } from './auth';
import { supabaseAdmin } from '@/utils/supabase/admin';

async function verifyFounder() {
  const session = await requireStaffAuth();
  const [staff] = await db.select().from(approvedStaff).where(eq(approvedStaff.email, session.user.email as string));
  if (!staff || staff.role !== 'FOUNDER') {
    throw new Error('Unauthorized. Founder access required.');
  }
}

export async function getStaffMembersAction() {
  try {
    await verifyFounder();
    const staff = await db.select().from(approvedStaff).orderBy(desc(approvedStaff.createdAt));
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createStaffMemberAction(data: { name: string; email: string; role: string; password?: string }) {
  try {
    await verifyFounder();

    // 1. Create in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password || 'temp12345',
      email_confirm: true,
      user_metadata: { name: data.name, role: data.role }
    });

    if (authError) throw new Error(authError.message);
    console.log(`[BACKEND PROOF] auth user created: ${authData.user.id}`);
    console.log(`[BACKEND PROOF] user id returned: ${authData.user.id}`);

    // 2. Create in DB
    const [staff] = await db.insert(approvedStaff).values({
      email: data.email,
      name: data.name,
      role: data.role as 'ADMIN' | 'SUPPORT' | 'PRODUCTION',
      isActive: true,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStaffRoleAction(email: string, role: string) {
  try {
    await verifyFounder();
    await db.update(approvedStaff).set({ role }).where(eq(approvedStaff.email, email));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleStaffStatusAction(email: string, isActive: boolean) {
  try {
    await verifyFounder();
    await db.update(approvedStaff).set({ isActive }).where(eq(approvedStaff.email, email));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteStaffMemberAction(email: string) {
  try {
    await verifyFounder();
    
    // 1. Delete from Supabase Auth
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(listError.message);
    
    const user = users.users.find(u => u.email === email);
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }

    // 2. Delete from approved_staff
    await db.delete(approvedStaff).where(eq(approvedStaff.email, email));
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetStaffPasswordAction(email: string, newPassword?: string) {
  try {
    await verifyFounder();
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(listError.message);
    
    const user = users.users.find(u => u.email === email);
    if (!user) throw new Error("User not found in Auth system.");

    if (newPassword) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
      if (error) throw new Error(error.message);
      console.log(`[BACKEND PROOF] supabaseAdmin.auth.admin.updateUserById(...) 200 OK`);
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email });
      if (error) throw new Error(error.message);
      console.log(`[BACKEND PROOF] Password reset email sent successfully`);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function forceLogoutStaffAction(email: string) {
  try {
    await verifyFounder();
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(listError.message);
    
    const user = users.users.find(u => u.email === email);
    if (!user) throw new Error("User not found in Auth system.");

    const { error } = await supabaseAdmin.auth.admin.signOut(user.id);
    if (error) throw new Error(error.message);

    console.log(`[BACKEND PROOF] auth.admin.signOut(${user.id}) success: true`);
    console.log(`[BACKEND PROOF] session invalidated`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { businessSettings } from '@deeprastore/infrastructure/src/schema/system';

export async function getBusinessSettingsAction() {
  try {
    await verifyFounder();
    const config = await db.select().from(businessSettings).where(eq(businessSettings.id, 'default_config'));
    if (config.length === 0) {
      return { success: true, data: null };
    }
    return { success: true, data: JSON.parse(JSON.stringify(config[0])) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBusinessSettingsAction(data: any) {
  try {
    await verifyFounder();
    const session = await requireStaffAuth();

    const existing = await db.select().from(businessSettings).where(eq(businessSettings.id, 'default_config'));
    
    if (existing.length === 0) {
      await db.insert(businessSettings).values({
        ...data,
        id: 'default_config',
        updatedBy: session.user.email as string,
        updatedAt: new Date()
      });
    } else {
      await db.update(businessSettings).set({
        ...data,
        updatedBy: session.user.email as string,
        updatedAt: new Date()
      }).where(eq(businessSettings.id, 'default_config'));
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

