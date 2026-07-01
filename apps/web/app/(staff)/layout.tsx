// @ts-nocheck
import "../globals.css";
import { GlobalSearch } from "@/components/global-search";
import Link from "next/link";
import { Toaster } from "sonner";

import { createClient } from "@/utils/supabase/server";
import { db } from "@deeprastore/infrastructure/src/db/client";
import { approvedStaff } from "@deeprastore/infrastructure/src/schema/staff";
import { eq } from "drizzle-orm";
import { logout } from "@/app/(staff)/actions/auth";

export const metadata = {
  title: "Deeprastore OS",
  description: "Operating System for Deeprastore",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let staffName = "Staff";
  let staffRole = "Admin";
  
  if (user && user.email) {
    const [staff] = await db.select().from(approvedStaff).where(eq(approvedStaff.email, user.email));
    if (staff) {
      staffName = staff.name;
      staffRole = staff.role;
    }
  }

  return (
    <html lang="en" className="dark">
      <body className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-zinc-950 flex-col z-20">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Deeprastore OS</h1>
            <p className="text-xs text-zinc-500 mt-1">Operations Control</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-350 hover:text-zinc-100 hover:bg-zinc-900/50 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Dashboard
            </Link>
            <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-350 hover:text-zinc-100 hover:bg-zinc-900/50 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Orders
            </Link>
            <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-350 hover:text-zinc-100 hover:bg-zinc-900/50 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
              Reports
            </Link>
            <Link href={staffRole === 'FOUNDER' ? "/pilot/founder" : "/settings"} className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-350 hover:text-zinc-100 hover:bg-zinc-900/50 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Admin
            </Link>
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                  {staffName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-zinc-100 truncate">{staffName}</p>
                  <p className="text-xs text-zinc-500 truncate">{staffRole}</p>
                </div>
              </div>
            </div>
            
            <form action={logout}>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium rounded-md transition-colors border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 flex justify-around items-center z-50 pb-safe">
          <Link href="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/orders" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span className="text-[10px] font-medium">Orders</span>
          </Link>
          <Link href="/reports" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            <span className="text-[10px] font-medium">Reports</span>
          </Link>
          <Link href={staffRole === 'FOUNDER' ? "/pilot/founder" : "/settings"} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="text-[10px] font-medium">Admin</span>
          </Link>
        </nav>

        <main className="flex-1 overflow-hidden relative flex flex-col pb-16 md:pb-0">
          <div className="h-14 md:h-16 border-b border-zinc-800 bg-zinc-950/50 flex items-center px-4 md:px-6">
            <GlobalSearch />
          </div>
          <div className="flex-1 overflow-auto relative">
            {children}
          </div>
          <Toaster theme="dark" position="top-right" />
        </main>
      </body>
    </html>
  );
}
