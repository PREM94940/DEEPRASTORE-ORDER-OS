'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, MessageCircle, CalendarClock, AlertCircle } from 'lucide-react';

const MOCK_LEADS = [
  { id: 'LD-001', name: 'Neha V', phone: '9876500001', product: 'Emerald Lehenga', status: 'UNASSIGNED', lastContact: new Date(Date.now() - 3600000 * 3), nextContact: new Date(Date.now() - 3600000 * 1), owner: 'Unassigned' },
  { id: 'LD-002', name: 'Ritu K', phone: '9876500002', product: 'Burgundy Saree', status: 'ASSIGNED', lastContact: new Date(Date.now() - 3600000 * 2.5), nextContact: new Date(Date.now()), owner: 'Kiran' },
  { id: 'LD-003', name: 'Sanjana', phone: '9876500003', product: 'Custom Blouse', status: 'LOST', lastContact: new Date(Date.now() - 86400000 * 3), nextContact: new Date(Date.now() - 86400000), owner: 'Devi' },
  { id: 'LD-004', name: 'Kavya N', phone: '9876500004', product: 'Bridal Set', status: 'CONVERTED', lastContact: new Date(Date.now() - 3600000 * 0.5), nextContact: new Date(Date.now() + 86400000), owner: 'Devi' },
];

export default function LeadsDashboardPage() {
  const sortedLeads = [...MOCK_LEADS].sort((a, b) => {
    const aNeedsAttention = (a.status === 'ASSIGNED' || a.status === 'UNASSIGNED') && (Date.now() - a.lastContact.getTime() > 7200000);
    const bNeedsAttention = (b.status === 'ASSIGNED' || b.status === 'UNASSIGNED') && (Date.now() - b.lastContact.getTime() > 7200000);
    if (aNeedsAttention && !bNeedsAttention) return -1;
    if (bNeedsAttention && !aNeedsAttention) return 1;
    return b.lastContact.getTime() - a.lastContact.getTime();
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-500 flex items-center gap-2">
            <Users className="w-8 h-8" /> Lead Ownership Queue
          </h1>
          <p className="text-zinc-500 mt-1">Track pre-sales inquiries. Leads stagnant &gt; 2 hours automatically escalate.</p>
        </div>
        <div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Phone className="w-4 h-4 mr-2" /> Add Manual Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-950/20 border-red-900/50">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-red-400 mb-1 font-bold">Needs Attention (&gt;2h)</div>
            <div className="text-3xl font-bold text-red-500">
              {sortedLeads.filter(l => (l.status === 'ASSIGNED' || l.status === 'UNASSIGNED') && (Date.now() - l.lastContact.getTime() > 7200000)).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-zinc-500 mb-1">Unassigned Leads</div>
            <div className="text-3xl font-bold text-yellow-500">
              {sortedLeads.filter(l => l.status === 'UNASSIGNED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-zinc-500 mb-1">Converted (Today)</div>
            <div className="text-3xl font-bold text-emerald-500">
              {sortedLeads.filter(l => l.status === 'CONVERTED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-zinc-500 mb-1">Lost Leads</div>
            <div className="text-3xl font-bold text-zinc-500">
              {sortedLeads.filter(l => l.status === 'LOST').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800">
                <TableHead>Customer</TableHead>
                <TableHead>Interested Product</TableHead>
                <TableHead>Status / Owner</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>SLA Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.map((lead) => {
                const needsAttention = (lead.status === 'ASSIGNED' || lead.status === 'UNASSIGNED') && (Date.now() - lead.lastContact.getTime() > 7200000);
                
                return (
                  <TableRow key={lead.id} className={`border-zinc-800 ${needsAttention ? 'bg-red-950/10' : 'hover:bg-zinc-800/50'}`}>
                    <TableCell>
                      <div className="font-bold text-zinc-100">{lead.name}</div>
                      <div className="text-sm text-zinc-500">{lead.phone}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{lead.product}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={`w-fit ${lead.status === 'UNASSIGNED' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-900' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}>
                          {lead.status}
                        </Badge>
                        <span className="text-xs text-zinc-500">Owner: {lead.owner}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {Math.round((Date.now() - lead.lastContact.getTime()) / 3600000)}h ago
                    </TableCell>
                    <TableCell>
                      {needsAttention ? (
                        <span className="text-red-400 font-bold flex items-center text-xs"><AlertCircle className="w-3 h-3 mr-1"/> NEEDS ATTENTION</span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center text-xs">ON TRACK</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {lead.status === 'UNASSIGNED' && (
                          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            Claim Lead
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700">
                          <MessageCircle className="w-4 h-4 mr-2" /> Reply
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
