import { db } from '@deeprastore/infrastructure/src/db/client';
import { supportTickets } from '@deeprastore/infrastructure/src/schema';
import { desc } from 'drizzle-orm';
import { SupportBoard } from './SupportBoard';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Module</h1>
          <p className="text-sm text-muted-foreground">Manage customer issues and escalations.</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-6 bg-slate-50/50">
        <SupportBoard initialTickets={tickets} />
      </div>
    </div>
  );
}
