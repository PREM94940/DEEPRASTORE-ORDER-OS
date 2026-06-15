'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { assignTicket, resolveTicket, escalateTicket } from '../../actions/support';

export function SupportBoard({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets);

  const handleAssign = async (id: string) => {
    const res = await assignTicket({ ticketId: id, staffId: 'Staff01', assignedTo: 'Staff02' });
    if (res.success) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'IN_PROGRESS', assignedStaff: 'Staff02' } : t));
    } else alert(res.error);
  };

  const handleResolve = async (id: string) => {
    const res = await resolveTicket({ ticketId: id, staffId: 'Staff01', resolution: 'Resolved manually' });
    if (res.success) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'RESOLVED' } : t));
    } else alert(res.error);
  };

  const handleEscalate = async (id: string) => {
    const res = await escalateTicket({ ticketId: id, staffId: 'Staff01' });
    if (res.success) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, priority: 'CRITICAL' } : t));
    } else alert(res.error);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
      {['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED'].map(status => (
        <div key={status} className="flex flex-col bg-slate-100 rounded-lg p-4">
          <h2 className="font-semibold mb-4 text-slate-700">{status.replace(/_/g, ' ')}</h2>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {tickets.filter(t => t.status === status).map(ticket => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{ticket.businessId}</CardTitle>
                    <Badge variant={ticket.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Order: {ticket.orderId?.slice(0,8) || 'N/A'}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm font-semibold truncate">{ticket.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {ticket.status === 'OPEN' && <button onClick={() => handleAssign(ticket.id)} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Assign</button>}
                    {ticket.status !== 'RESOLVED' && <button onClick={() => handleEscalate(ticket.id)} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Escalate</button>}
                    {ticket.status === 'IN_PROGRESS' && <button onClick={() => handleResolve(ticket.id)} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Resolve</button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
