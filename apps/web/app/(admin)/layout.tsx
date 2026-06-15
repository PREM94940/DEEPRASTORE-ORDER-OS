import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { approvedStaff } from '@deeprastore/infrastructure/src/schema/staff';
import { eq } from 'drizzle-orm';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    redirect('/login');
  }

  // RBAC logic
  const staffRecords = await db.select().from(approvedStaff).where(eq(approvedStaff.email, user.email));
  const staff = staffRecords[0];

  if (!staff || !staff.isActive) {
    // Return unauthorized or redirect to an unauthorized page
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
          <p className="text-zinc-400">Your email ({user.email}) is not approved for admin access.</p>
        </div>
      </div>
    );
  }

  // The staff object can be passed down via context if needed, 
  // but for now, just granting access is enough.
  return <>{children}</>;
}
