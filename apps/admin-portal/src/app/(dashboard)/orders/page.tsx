'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, Loader2, PackageCheck, X, Save, FileImage } from 'lucide-react';
import { fetchAllOrdersAction, updateOrderDetailsAction } from '../../actions/orders';
import { markDelivered } from '../../actions/production';
import { BoutiqueOrderCard } from '@/components/BoutiqueOrderCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrderDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick View Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const loadOrders = () => {
    setLoading(true);
    fetchAllOrdersAction().then(res => {
      if (res.success && res.orders) {
        setLiveOrders(res.orders.map((o: any) => ({
          ...o,
          expectedDelivery: new Date(o.expectedDelivery)
        })));
      } else if (!res.success) {
        setError(res.error || "Unknown error occurred");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleEditClick = (order: any) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      expectedDelivery: order.expectedDelivery.toISOString().split('T')[0],
      trackingId: order.trackingId || '',
      trackingUrl: order.trackingUrl || '',
      courierName: order.courierName || '',
      notes: order.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const payload = {
        status: editForm.status,
        expectedDeliveryDate: new Date(editForm.expectedDelivery),
        trackingId: editForm.trackingId,
        trackingUrl: editForm.trackingUrl,
        courierName: editForm.courierName,
        notes: editForm.notes
      };
      
      const res = await updateOrderDetailsAction(selectedOrder.id, payload);
      if (res.success) {
        setSelectedOrder(null);
        loadOrders();
      } else {
        alert(res.error || 'Failed to update order');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = liveOrders.filter(o => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      o.phone.includes(searchLower) || 
      o.id.toLowerCase().includes(searchLower) || 
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchLower)) ||
      (o.customer && o.customer.toLowerCase().includes(searchLower));
      
    if (!matchesSearch) return false;
    
    if (activeFilter === 'PENDING_PAYMENT') return o.payment === 'VERIFICATION_PENDING' || o.payment === 'PENDING';
    if (activeFilter === 'READY') return o.status === 'READY';
    if (activeFilter === 'CUSTOM') return o.type === 'CUSTOM';
    if (activeFilter === 'DELAYED') {
      const today = new Date();
      today.setHours(0,0,0,0);
      return o.expectedDelivery < today && o.status !== 'DELIVERED';
    }
    if (activeFilter === 'DELIVERED') return o.status === 'DELIVERED';
    return true;
  });

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders & Dispatch</h1>
          <p className="text-zinc-400 mt-2">Visual, thumbnail-first view of all orders. Click on any card to edit details and add dispatch metadata.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search by Name, Phone, Order ID or DP Number..." 
            className="pl-9 bg-zinc-900 border-zinc-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeFilter === 'ALL' ? 'default' : 'secondary'} onClick={() => setActiveFilter('ALL')} className="bg-zinc-800 text-white hover:bg-zinc-700">All</Button>
          <Button variant={activeFilter === 'PENDING_PAYMENT' ? 'default' : 'secondary'} onClick={() => setActiveFilter('PENDING_PAYMENT')} className="bg-zinc-800 text-white hover:bg-zinc-700">Pending Payment</Button>
          <Button variant={activeFilter === 'READY' ? 'default' : 'secondary'} onClick={() => setActiveFilter('READY')} className="bg-zinc-800 text-white hover:bg-zinc-700">Ready for Dispatch</Button>
          <Button variant={activeFilter === 'DELAYED' ? 'default' : 'secondary'} onClick={() => setActiveFilter('DELAYED')} className="bg-red-950 text-red-400 hover:bg-red-900 border border-red-900">Delayed</Button>
          <Button variant={activeFilter === 'DELIVERED' ? 'default' : 'secondary'} onClick={() => setActiveFilter('DELIVERED')} className="bg-zinc-800 text-white hover:bg-zinc-700">Completed</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 font-bold p-8 border border-red-900 bg-red-950/20 rounded-lg">
          ERROR: {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-zinc-500 p-12 border border-dashed border-zinc-800 rounded-lg">
          No orders found matching the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24 max-w-7xl mx-auto w-full">
          {filteredOrders.map((order) => (
            <BoutiqueOrderCard key={order.id} order={order} onEdit={handleEditClick} />
          ))}
        </div>
      )}

      {/* Quick View Drawer */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="bg-zinc-900 border-zinc-800 text-white w-full sm:max-w-[80vw] overflow-y-auto p-6">
          <SheetHeader className="mb-6 pb-4 border-b border-zinc-800">
            <SheetTitle className="flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono">{selectedOrder?.orderNumber}</span>
                <Badge variant="outline" className="bg-zinc-950 text-zinc-400 border-zinc-800">{selectedOrder?.type}</Badge>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          {selectedOrder && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Context & Identity */}
              <div className="space-y-6 col-span-1">
                <div>
                  <h3 className="font-bold text-lg mb-1">{selectedOrder.customer}</h3>
                  <p className="text-zinc-400">{selectedOrder.phone}</p>
                  <p className="text-zinc-500 text-xs mt-2 font-mono break-all">{selectedOrder.id}</p>
                </div>

                <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2"><FileImage className="w-4 h-4" /> Images</h4>
                  <div className="aspect-square bg-zinc-900 rounded overflow-hidden flex items-center justify-center border border-zinc-800">
                     {selectedOrder.thumbnail ? (
                       <img src={selectedOrder.thumbnail} alt={selectedOrder.orderNumber} className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-zinc-600 text-sm">No Image</span>
                     )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Primary Reference Image</p>
                </div>
              </div>

              {/* Right Columns: Editing Form */}
              <div className="col-span-1 md:col-span-2 space-y-6">
                
                {/* State & Timeline Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 font-semibold">Current Status</Label>
                    <Select value={editForm.status} onValueChange={(val) => setEditForm({...editForm, status: val})}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="PENDING">PENDING</SelectItem>
                        <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                        <SelectItem value="STITCHING">STITCHING</SelectItem>
                        <SelectItem value="READY">READY</SelectItem>
                        <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 font-semibold">Expected Delivery Date</Label>
                    <Input 
                      type="date"
                      className="bg-zinc-900 border-zinc-700 h-10"
                      value={editForm.expectedDelivery}
                      onChange={(e) => setEditForm({...editForm, expectedDelivery: e.target.value})}
                    />
                  </div>
                </div>

                {/* Dispatch Section */}
                <div className="space-y-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <Label className="text-zinc-300 font-semibold text-base">Dispatch Information</Label>
                  <p className="text-xs text-zinc-500 pb-2">Enter tracking details here once the order is handed to the courier. Do not change the order status to DISPATCHED.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400">Courier Name</Label>
                      <Input 
                        placeholder="e.g. Rapido, DTDC"
                        className="bg-zinc-900 border-zinc-700"
                        value={editForm.courierName}
                        onChange={(e) => setEditForm({...editForm, courierName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400">Tracking ID</Label>
                      <Input 
                        placeholder="e.g. RAP12345"
                        className="bg-zinc-900 border-zinc-700"
                        value={editForm.trackingId}
                        onChange={(e) => setEditForm({...editForm, trackingId: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <Label className="text-zinc-400">Tracking URL</Label>
                    <Input 
                      placeholder="https://"
                      className="bg-zinc-900 border-zinc-700"
                      value={editForm.trackingUrl}
                      onChange={(e) => setEditForm({...editForm, trackingUrl: e.target.value})}
                    />
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-2 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <Label className="text-zinc-300 font-semibold text-base">Operational Notes</Label>
                  <Input 
                    placeholder="Internal notes or updates"
                    className="bg-zinc-900 border-zinc-700 h-12"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  />
                </div>

              </div>
            </div>
          )}
          
          <SheetFooter className="mt-8 pt-6 border-t border-zinc-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="border-zinc-700 text-zinc-300">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
            {selectedOrder?.status === 'READY' && (
              <form action={markDelivered.bind(null, '11111111-1111-1111-1111-111111111111', selectedOrder.id)}>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 ml-2">
                  <PackageCheck className="w-4 h-4 mr-2" /> Mark Delivered
                </Button>
              </form>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
}
