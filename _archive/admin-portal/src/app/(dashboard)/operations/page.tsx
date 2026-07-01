'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

const MOCK_OPERATIONS = [
  { 
    id: 'ORD-1001', customer: 'Priya', phone: '9876543210', status: 'STITCHING', 
    expected: new Date(Date.now() - 86400000 * 5), delayDays: 5, 
    customerInformed: 'NO', assigned: 'Devi', exception: 'NONE'
  },
  { 
    id: 'ORD-1005', customer: 'Swathi', phone: '9123456789', status: 'CONFIRMED', 
    expected: new Date(Date.now() - 86400000 * 2), delayDays: 2, 
    customerInformed: 'YES', assigned: 'Kiran', exception: 'FABRIC'
  },
  { 
    id: 'ORD-1008', customer: 'Anjali', phone: '9988776655', status: 'PACKING', 
    expected: new Date(), delayDays: 0, 
    customerInformed: 'YES', assigned: 'Devi', exception: 'NONE'
  },
];

export default function OperationsDashboardPage() {
  // Sort priority: Delayed + CustomerInformed=NO comes first, then exceptions, then general delays
  const sortedOps = [...MOCK_OPERATIONS].sort((a, b) => {
    if (a.customerInformed === 'NO' && a.delayDays > 0) return -1;
    if (b.customerInformed === 'NO' && b.delayDays > 0) return 1;
    if (a.exception !== 'NONE') return -1;
    if (b.exception !== 'NONE') return 1;
    return b.delayDays - a.delayDays;
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8" /> Action Required (Operations)
          </h1>
          <p className="text-zinc-400 mt-2">Manage delayed orders, uninformed customers, and active exceptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-950/20 border-red-900/50">
          <CardHeader className="pb-2"><CardTitle className="text-red-400 text-sm">Uninformed & Delayed</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-red-500">1</span></CardContent>
        </Card>
        <Card className="bg-yellow-950/20 border-yellow-900/50">
          <CardHeader className="pb-2"><CardTitle className="text-yellow-400 text-sm">Total Delayed Orders</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-yellow-500">2</span></CardContent>
        </Card>
        <Card className="bg-orange-950/20 border-orange-900/50">
          <CardHeader className="pb-2"><CardTitle className="text-orange-400 text-sm">Active Exceptions</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-orange-500">1</span></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2"><CardTitle className="text-zinc-400 text-sm">Due Today</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-zinc-100">1</span></CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800">
                <TableHead>Priority</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Customer Informed?</TableHead>
                <TableHead>Exception</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOps.map((order) => {
                const isCritical = order.customerInformed === 'NO' && order.delayDays > 0;
                
                return (
                  <TableRow key={order.id} className={`border-zinc-800 ${isCritical ? 'bg-red-950/10' : 'hover:bg-zinc-800/50'}`}>
                    <TableCell>
                      {isCritical ? (
                        <Badge className="bg-red-600 text-white"><AlertTriangle className="w-3 h-3 mr-1"/> CRITICAL</Badge>
                      ) : order.exception !== 'NONE' ? (
                        <Badge className="bg-orange-600 text-white">EXCEPTION</Badge>
                      ) : (
                        <Badge className="bg-yellow-600 text-white">DELAYED</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-zinc-300 font-bold">{order.id}</div>
                      <div className="text-xs text-zinc-500">{order.customer} | {order.status}</div>
                    </TableCell>
                    <TableCell>
                      {order.delayDays > 0 ? (
                        <span className="text-red-400 font-bold">{order.delayDays} Days</span>
                      ) : (
                        <span className="text-yellow-400">Due Today</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.customerInformed === 'NO' ? (
                        <span className="text-red-400 font-bold flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> NO</span>
                      ) : (
                        <span className="text-emerald-400">YES</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.exception !== 'NONE' ? (
                        <span className="text-orange-400 font-bold">{order.exception}</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300">{order.assigned}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={isCritical ? 'destructive' : 'secondary'} className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" /> 
                        {isCritical ? 'Inform Customer Now' : 'Update Log'}
                      </Button>
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
