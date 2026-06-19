export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { db } from "@deeprastore/infrastructure/src/db/client";
import { approvedStaff } from "@deeprastore/infrastructure/src/schema/staff";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'nctwwfpqdlyqddjdhkrk.supabase.co';

  let isAdmin = false;
  let email = '';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      email = user.email;
      const staffRecords = await db.select().from(approvedStaff).where(eq(approvedStaff.email, user.email));
      if (staffRecords[0]?.role === 'ADMIN') {
        isAdmin = true;
      }
    }
  } catch (err) {
    console.error(err);
  }

  return (
    <div className="flex h-full flex-col p-6 bg-zinc-950 text-zinc-350 space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">System Settings</h1>
        <p className="text-sm text-zinc-400">Order OS workspace settings and configurations.</p>
      </header>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-4 max-w-2xl">
        <h3 className="font-bold text-zinc-200 border-b border-zinc-850 pb-2">Active Environment</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Workspace Directory</span>
            <span className="font-mono text-zinc-300">d:\DEEPRASTORE ORDER OS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Supabase Connection Host</span>
            <span className="font-mono text-zinc-300">{supabaseUrl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Lifecycle Engine Mode</span>
            <span className="text-emerald-400 font-semibold">STRICT LOCK</span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-4 max-w-2xl border-red-900/30">
          <h3 className="font-bold text-red-400 border-b border-zinc-850 pb-2">Admin Operations Panel</h3>
          <p className="text-sm text-zinc-400">Admin control settings for the pilot workspace. Authenticated as: <span className="font-mono text-zinc-200">{email}</span></p>
          <div className="space-y-2 text-sm pt-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Soft Delete Protection Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE (Soft-delete only)
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-zinc-500">System Logs & Auditing</span>
              <span className="text-zinc-300 font-mono">audit_logs table</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
