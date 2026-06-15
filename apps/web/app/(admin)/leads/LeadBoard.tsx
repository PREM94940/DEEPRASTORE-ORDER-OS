'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageCircle, Phone, IndianRupee } from 'lucide-react';
import { updateLeadStatus } from '../../actions/crm';

export function LeadBoard({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);

  const columns = ['NEW_LEAD', 'INTERESTED', 'WAITING_PAYMENT', 'ORDER_LINK_SENT', 'WON', 'LOST'];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    
    // Server update
    const res = await updateLeadStatus({ leadId: id, status, staffId: 'Staff01' });
    if (!res.success) {
      alert(res.error);
      // Revert on failure
      setLeads(initialLeads);
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map(status => (
        <div 
          key={status} 
          className="flex flex-col bg-slate-100 rounded-lg p-4 min-w-[300px] w-[300px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">{status.replace(/_/g, ' ')}</h2>
            <Badge variant="secondary">{leads.filter(l => l.status === status).length}</Badge>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {leads.filter(l => l.status === status).map(lead => (
              <Card 
                key={lead.id} 
                className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{lead.customerName || lead.phone}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{lead.interestedProduct}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {lead.phone}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-slate-500">
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</span>
                    <span className="text-slate-400">{lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'Never'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {leads.filter(l => l.status === status).length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                Drop Leads Here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
