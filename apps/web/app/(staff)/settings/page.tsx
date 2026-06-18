export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'nctwwfpqdlyqddjdhkrk.supabase.co';

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
    </div>
  );
}
