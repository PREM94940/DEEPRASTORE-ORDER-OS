import { db } from '@deeprastore/infrastructure/src/db/client';
import { leads } from '@deeprastore/infrastructure/src/schema/crm';
import { desc } from 'drizzle-orm';
import { LeadBoard } from './LeadBoard';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Engine</h1>
          <p className="text-sm text-muted-foreground">Manage Instagram/WhatsApp leads to conversion.</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-6 bg-slate-50/50">
        <LeadBoard initialLeads={allLeads} />
      </div>
    </div>
  );
}
