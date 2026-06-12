'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

// Mock data reflecting the Unified Order Record
const MOCK_ORDERS = [
  { id: 'DR-9921', customer: 'Priya Sharma', phone: '9876543210', source: 'WhatsApp', type: 'READY', payment: 'VERIFIED', status: 'PACKING', expectedDelivery: new Date(Date.now() + 86400000 * 2) },
  { id: 'DR-9922', customer: 'Swathi Reddy', phone: '9123456789', source: 'Shopify', type: 'CUSTOM', payment: 'VERIFIED', status: 'STITCHING', expectedDelivery: new Date(Date.now() + 86400000 * 8) },
  { id: 'DR-9923', customer: 'Kavya N', phone: '9988776655', source: 'Store', type: 'READY', payment: 'VERIFICATION_PENDING', status: 'DRAFT', expectedDelivery: new Date() },
  { id: 'DR-9924', customer: 'Anjali V', phone: '9876543211', source: 'WhatsApp', type: 'READY', payment: 'VERIFIED', status: 'CONFIRMED', expectedDelivery: new Date(Date.now() - 86400000) },
];

export default function OrderDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Calculate Delay Flag and visual indicator
  const getDelayIndicator = (expectedDate: Date, status: string) => {
    if (status === 'DELIVERED') return { label: 'Delivered', color: 'bg-zinc-800 text-zinc-300', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(expectedDate);
    target.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `Delayed by ${Math.abs(diffDays)}d`, color: 'bg-red-950 text-red-400 border border-red-900', icon: <AlertCircle className="w-3 h-3 mr-1" /> };
    if (diffDays === 0) return { label: 'Due Today', color: 'bg-yellow-950 text-yellow-400 border border-yellow-900', icon: <Clock className="w-3 h-3 mr-1" /> };
    return { label: 'On Time', color: 'bg-emerald-950 text-emerald-400 border border-emerald-900', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
  };

  const filteredOrders = MOCK_ORDERS.filter(o => {
    const matchesSearch = o.phone.includes(searchTerm) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === 'PENDING_PAYMENT') return o.payment === 'VERIFICATION_PENDING' || o.payment === 'PENDING';
    if (activeFilter === 'READY') return o.type === 'READY';
    if (activeFilter === 'CUSTOM') return o.type === 'CUSTOM';
    if (activeFilter === 'DELAYED') {
      const today = new Date();
      today.setHours(0,0,0,0);
      return o.expectedDelivery < today && o.status !== 'DELIVERED';
    }
    if (activeFilter === 'DELIVERED') return o.status === 'DELIVERED';
    // 'TODAY' filter logic would go here
    return true;
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Visibility Dashboard</h1>
          <p className="text-zinc-400 mt-2">Centralized view of all orders across WhatsApp, Shopify, and Walk-ins.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search by Phone Number or Order ID..." 
            className="pl-9 bg-zinc-900 border-zinc-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeFilter === 'ALL' ? 'default' : 'secondary'} onClick={() => setActiveFilter('ALL')} className="bg-zinc-800 text-white hover:bg-zinc-700">All</Button>
          <Button variant={activeFilter === 'PENDING_PAYMENT' ? 'default' : 'secondary'} onClick={() => setActiveFilter('PENDING_PAYMENT')} className="bg-zinc-800 text-white hover:bg-zinc-700">Pending Payment</Button>
          <Button variant={activeFilter === 'READY' ? 'default' : 'secondary'} onClick={() => setActiveFilter('READY')} className="bg-zinc-800 text-white hover:bg-zinc-700">Ready Orders</Button>
          <Button variant={activeFilter === 'CUSTOM' ? 'default' : 'secondary'} onClick={() => setActiveFilter('CUSTOM')} className="bg-zinc-800 text-white hover:bg-zinc-700">Custom Orders</Button>
          <Button variant={activeFilter === 'DELAYED' ? 'default' : 'secondary'} onClick={() => setActiveFilter('DELAYED')} className="bg-red-950 text-red-400 hover:bg-red-900 border border-red-900">Delayed</Button>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Delay Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const indicator = getDelayIndicator(order.expectedDelivery, order.status);
                return (
                  <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-mono text-zinc-300">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{order.customer}</div>
                      <div className="text-xs text-zinc-500">{order.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-zinc-950 text-zinc-400 border-zinc-800">{order.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={order.type === 'READY' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900' : 'bg-fuchsia-950/30 text-fuchsia-400 border-fuchsia-900'}>
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${order.payment === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400' : 'bg-yellow-950 text-yellow-400'}`}>
                        {order.payment}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">{order.status}</TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {order.expectedDelivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${indicator.color}`}>
                        {indicator.icon}
                        {indicator.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              No orders found matching the current filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
