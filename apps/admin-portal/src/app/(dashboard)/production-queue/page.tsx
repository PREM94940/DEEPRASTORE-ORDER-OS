import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, CheckSquare } from 'lucide-react';
import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';

export default async function ProductionQueuePage() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  // STRICT GATEKEEPER: Only Verified & Confirmed orders enter Master Ji's queue.
  const validProductionJobs = await service.getProductionQueue(tenantId);

  // Ordered strictly by due date (using expectedDeliveryDate if available)
  const sortedQueue = [...validProductionJobs].sort((a: any, b: any) => {
    const timeA = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : Date.now();
    const timeB = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : Date.now();
    return timeA - timeB;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Scissors className="w-8 h-8 text-indigo-500" /> Master Ji Queue
          </h1>
          <p className="text-zinc-400 mt-2">Today's ordered work list. Do not work out of sequence.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Date</p>
          <p className="font-bold text-lg">{new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedQueue.map((job: any, index: number) => {
          const due = job.expectedDeliveryDate ? new Date(job.expectedDeliveryDate) : new Date();
          const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
          
          return (
            <Card key={job.id} className="bg-zinc-900 border-zinc-800 hover:border-indigo-500/50 transition-colors">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-indigo-400 font-bold">{job.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {job.orderType}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Production Order</h3>
                    <p className="text-sm text-zinc-400 mt-1">Current Status: <span className="font-bold text-yellow-500">{job.status}</span></p>
                    <p className="text-xs text-zinc-500 mt-1">Payment: <span className="font-bold text-emerald-500">{job.paymentStatus}</span></p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                  <p className="text-sm">
                    Due in: <span className={`font-bold ${daysLeft < 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {daysLeft} Days
                    </span>
                  </p>
                  <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8">
                    <CheckSquare className="w-5 h-5 mr-2" /> Mark Completed
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {sortedQueue.length === 0 && (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-lg">
            <p className="text-zinc-500 text-lg">No active jobs in the queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
