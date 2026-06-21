import { redirect } from 'next/navigation';
import { requireStaffAuth } from '@/app/(staff)/actions/auth';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { approvedStaff } from '@deeprastore/infrastructure/src/schema/staff';
import { eq } from 'drizzle-orm';
import FounderDashboard from '@/components/founder/founder-dashboard';
import { getPilotMetrics } from '@/app/(staff)/actions/pilot';

export default async function FounderControlCenter() {
  const staffSession = await requireStaffAuth();

  const [staff] = await db.select().from(approvedStaff).where(eq(approvedStaff.email, staffSession.user.email as string));
  const metrics = await getPilotMetrics();

  if (!staff || staff.role !== 'FOUNDER') {
    // Hard redirect if not founder
    redirect('/pilot/order-desk');
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Founder Control Center
          </h1>
          <p className="text-zinc-400 mt-1">Manage infrastructure, personnel, and business operations.</p>
        </div>

        <FounderDashboard initialMetrics={metrics} />
      </div>
    </div>
  );
}
