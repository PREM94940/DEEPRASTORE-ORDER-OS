'use client';

import { useState, useTransition } from 'react';
import { OrderCard } from './order-card';
import { moveOrderAction, dispatchOrderAction } from '@/app/(staff)/actions/command-center';

interface Order {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  dueDate: string;
  masterJi: string;
  productionStatus: string;
  dispatchStatus: string;
  paymentStatus: string;
  photoUrl: string;
  statusUpdatedAt: string;
}

interface CommandCenterBoardProps {
  initialOrders: Order[];
}

const COLUMNS = [
  { id: 'HOLD', label: 'Hold', color: 'bg-red-100 border-red-200', limit: 999 },
  { id: 'MEASUREMENTS_PENDING', label: 'Measurements', color: 'bg-orange-100 border-orange-200', limit: 10 },
  { id: 'CUTTING', label: 'Cutting', color: 'bg-yellow-100 border-yellow-200', limit: 10 },
  { id: 'STITCHING', label: 'Stitching', color: 'bg-blue-100 border-blue-200', limit: 10 },
  { id: 'FINISHING', label: 'Finishing', color: 'bg-indigo-100 border-indigo-200', limit: 10 },
  { id: 'QC_PENDING', label: 'QC Pending', color: 'bg-purple-100 border-purple-200', limit: 8 },
  { id: 'READY', label: 'Ready', color: 'bg-green-100 border-green-200', limit: 20 },
  { id: 'PACKING', label: 'Packing', color: 'bg-teal-100 border-teal-200', limit: 10 },
  { id: 'DISPATCHED', label: 'Dispatched', color: 'bg-slate-200 border-slate-300', limit: 999 }
];

const HOLD_REASONS = [
  'Customer Delay',
  'Measurement Issue',
  'Fabric Issue',
  'Master Ji Capacity',
  'Payment Pending',
  'Quality Issue',
  'Other'
];

export function CommandCenterBoard({ initialOrders }: CommandCenterBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [holdModalData, setHoldModalData] = useState<{ orderId: string } | null>(null);
  const [holdReason, setHoldReason] = useState('');

  const [dispatchModalData, setDispatchModalData] = useState<{ orderId: string } | null>(null);
  const [dispatchDetails, setDispatchDetails] = useState({ courierName: '', trackingId: '' });

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    const order = orders.find(o => o.id === orderId);
    if (!order || order.productionStatus === targetStatus) return;

    if (targetStatus === 'HOLD') {
      setHoldModalData({ orderId });
      return;
    }

    if (targetStatus === 'DISPATCHED') {
      setDispatchModalData({ orderId });
      return;
    }

    await performMove(orderId, targetStatus, 'Drag and Drop');
  };

  const performMove = async (orderId: string, targetStatus: string, reason: string) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, productionStatus: targetStatus } : o));
    
    startTransition(async () => {
      const result = await moveOrderAction(orderId, targetStatus, reason);
      if (!result.success) {
        alert(`Transition Failed: ${result.error}`);
        // Revert Optimistic Update (real app would refetch)
        setOrders(initialOrders);
      }
    });
  };

  const handleHoldSubmit = () => {
    if (!holdModalData || !holdReason) return;
    performMove(holdModalData.orderId, 'HOLD', holdReason);
    setHoldModalData(null);
    setHoldReason('');
  };

  const handleDispatchSubmit = async () => {
    if (!dispatchModalData || !dispatchDetails.courierName || !dispatchDetails.trackingId) return;
    
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === dispatchModalData.orderId ? { ...o, dispatchStatus: 'DISPATCHED' } : o));
    
    startTransition(async () => {
      const result = await dispatchOrderAction(dispatchModalData.orderId, dispatchDetails.courierName, dispatchDetails.trackingId);
      if (!result.success) {
        alert(`Dispatch Failed: ${result.error}`);
        setOrders(initialOrders);
      }
    });

    setDispatchModalData(null);
    setDispatchDetails({ courierName: '', trackingId: '' });
  };

  return (
    <>
      <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => {
            if (col.id === 'PACKING') return o.dispatchStatus === 'PACKING';
            if (col.id === 'DISPATCHED') return o.dispatchStatus === 'DISPATCHED';
            if (col.id === 'READY') return o.productionStatus === 'READY' && o.dispatchStatus === 'NOT_STARTED';
            return o.productionStatus === col.id;
          });

          const isOverLimit = columnOrders.length > col.limit;

          return (
            <div 
              key={col.id} 
              className="flex h-full min-w-[320px] max-w-[320px] flex-col rounded-xl border bg-slate-50/50 shadow-sm"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`flex items-center justify-between border-b px-4 py-3 font-medium ${col.color} rounded-t-xl ${isOverLimit ? 'border-red-500 shadow-[inset_0_0_0_2px_rgba(239,68,68,0.5)]' : ''}`}>
                <span className="text-sm font-semibold tracking-tight">{col.label}</span>
                <span className={`flex h-6 w-auto px-2 items-center justify-center rounded-full bg-white/80 text-xs font-bold shadow-sm ${isOverLimit ? 'text-red-600 border border-red-300' : 'text-slate-700'}`}>
                  {columnOrders.length}{col.limit !== 999 ? `/${col.limit}` : ''}
                  {isOverLimit && <span className="ml-1">🔴</span>}
                </span>
              </div>
              
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 custom-scrollbar">
                {columnOrders.map((order) => (
                  <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id)} className="cursor-grab active:cursor-grabbing">
                    <OrderCard order={order} />
                  </div>
                ))}
                {columnOrders.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg border-slate-200">
                    Drop orders here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {holdModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[400px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-red-600">Send to Hold</h3>
            <p className="text-sm text-slate-600 mb-4">Please specify the reason for putting this order on hold.</p>
            <div className="flex flex-col gap-2 mb-6">
              {HOLD_REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200">
                  <input type="radio" name="reason" value={r} onChange={(e) => setHoldReason(e.target.value)} />
                  <span className="text-sm font-medium">{r}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setHoldModalData(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleHoldSubmit}
                disabled={!holdReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {dispatchModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[400px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Dispatch Details</h3>
            <p className="text-sm text-slate-600 mb-4">Courier Name and Tracking ID are mandatory for dispatching.</p>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Courier Name</label>
                <input 
                  type="text" 
                  value={dispatchDetails.courierName}
                  onChange={(e) => setDispatchDetails(prev => ({ ...prev, courierName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g. BlueDart, Delhivery"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tracking ID</label>
                <input 
                  type="text" 
                  value={dispatchDetails.trackingId}
                  onChange={(e) => setDispatchDetails(prev => ({ ...prev, trackingId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="e.g. 1234567890"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDispatchModalData(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleDispatchSubmit}
                disabled={!dispatchDetails.courierName || !dispatchDetails.trackingId}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
