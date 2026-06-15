// @ts-nocheck
import "./globals.css";
import { GlobalSearch } from "@/components/global-search";

export const metadata = {
  title: "Deeprastore OS",
  description: "Operating System for Deeprastore",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Deeprastore OS</h1>
            <p className="text-xs text-zinc-500 mt-1">Operations Control</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-900 text-zinc-100 font-medium border border-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Operations Grid
            </a>
            <a href="/payments" className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Payment Center
            </a>
            <a href="/command-center" className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              Command Center
            </a>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pilot Operations</div>
            <a href="/pilot" className="flex items-center gap-3 px-3 py-2 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors bg-emerald-950/10 border border-emerald-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
              Pilot Dashboard
            </a>
            <a href="/bugs" className="flex items-center gap-3 px-3 py-2 rounded-md text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 transition-colors bg-orange-950/10 border border-orange-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4"/><path d="M8 14H4"/><path d="M16 14h4"/><path d="M9.7 18.3 7 21"/><path d="M14.3 18.3 17 21"/></svg>
              Bug Registry
            </a>
          </nav>
        </aside>
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <div className="h-16 border-b border-zinc-800 bg-zinc-950/50 flex items-center px-6">
            <GlobalSearch />
          </div>
          <div className="flex-1 overflow-auto relative">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
