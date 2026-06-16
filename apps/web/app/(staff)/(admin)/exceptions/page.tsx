import { db } from '@deeprastore/infrastructure/src/db/client';
import { exceptions } from '@deeprastore/infrastructure/src/schema';
import { desc } from 'drizzle-orm';
import { ExceptionBoard } from './ExceptionBoard';

export const dynamic = 'force-dynamic';

export default async function ExceptionsPage() {
  const allExceptions = await db.select().from(exceptions).orderBy(desc(exceptions.createdAt));
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600">Exception Center</h1>
          <p className="text-sm text-muted-foreground">Manage critical blockages in production and logistics.</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-6 bg-red-50/20">
        <ExceptionBoard initialExceptions={allExceptions} />
      </div>
    </div>
  );
}
