"use client";

import * as React from "react";
import { X, ExternalLink, Image as ImageIcon, MessageCircle, Truck, AlertTriangle } from "lucide-react";
import { moveOrderAction, moveDispatchOrderAction, dispatchOrderAction } from "@/app/(staff)/actions/command-center";
import { useCustomer360 } from "@/hooks/useCustomer360";
import { getFinancialStatus, getFinancialStatusLabel, getFinancialStatusColor } from "@/lib/financials";
import { checkIsAdminAction, deleteOrderAction } from "@/app/(staff)/actions/admin";
import { useRouter } from "next/navigation";
import { ExceptionDrawer } from "./exception-drawer";

const VALID_TRANSITIONS: Record<string, string[]> = {
  'DRAFT': ['PENDING_VERIFICATION', 'CANCELLED'],
  'PENDING_VERIFICATION': ['CONFIRMED', 'PAYMENT_REJECTED', 'CANCELLED'],
  'PAYMENT_REJECTED': ['PENDING_VERIFICATION', 'CANCELLED'],
  'CONFIRMED': ['CUTTING', 'HOLD', 'CANCELLED'],
  'CUTTING': ['STITCHING', 'HOLD', 'CANCELLED'],
  'STITCHING': ['QC', 'HOLD', 'CANCELLED'],
  'QC': ['READY_TO_SHIP', 'HOLD', 'CANCELLED'],
  'READY_TO_SHIP': ['DISPATCHED', 'HOLD', 'CANCELLED'],
  'DISPATCHED': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': [],
  'HOLD': ['CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'READY_TO_SHIP', 'CANCELLED']
};

export function OrderDrawer({
  order,
  isOpen,
  onClose,
  onOptimisticUpdate,
}: {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOptimisticUpdate?: (update: any) => void;
}) {
  const { openCustomer360 } = useCustomer360();
  const [transitioning, setTransitioning] = React.useState(false);
  const [showDispatchForm, setShowDispatchForm] = React.useState(false);
  const [courierName, setCourierName] = React.useState("");
  const [trackingId, setTrackingId] = React.useState("");
  const router = useRouter();

  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showExceptionDrawer, setShowExceptionDrawer] = React.useState(false);

  React.useEffect(() => {
    setShowDispatchForm(false);
    setCourierName("");
    setTrackingId("");
    setShowDeleteConfirm(false);
    setShowExceptionDrawer(false);

    checkIsAdminAction().then(res => {
      if (res.success && res.isAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
  }, [order]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setTransitioning(true);
    try {
      const res = await deleteOrderAction(order.id);
      if (res.success) {
        setShowDeleteConfirm(false);
        onClose();
      } else {
        alert(res.error || 'Failed to delete order.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setTransitioning(false);
    }
  };

  if (!isOpen || !order) return null;

  const currentStatus = order.status || 'DRAFT';
  const nextOptions = VALID_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = async (newStatus: string) => {
    if (!newStatus) return;

    if (newStatus === 'DISPATCHED') {
      const balance = order.balanceAmount ? parseFloat(order.balanceAmount.toString()) : 0;
      if (balance > 0) {
        alert(`Cannot dispatch order with outstanding balance of ₹${balance.toFixed(2)}. Please collect the remaining payment first.`);
        return;
      }
      setShowDispatchForm(true);
      return;
    }

    // Strict Gatekeeper Rule
    if (['CUTTING', 'STITCHING', 'QC', 'READY_TO_SHIP'].includes(newStatus)) {
      if (order.paymentStatus !== 'VERIFIED') {
        alert("Payment must be verified before production can begin.");
        return;
      }
    }

    setTransitioning(true);
    try {
      let res;
      if (['DISPATCHED', 'DELIVERED'].includes(newStatus)) {
        res = await moveDispatchOrderAction(order.id, newStatus);
      } else {
        res = await moveOrderAction(order.id, newStatus, `Transitioned to ${newStatus}`);
      }

      if (res.success) {
        if (onOptimisticUpdate) onOptimisticUpdate({ id: order.id, status: newStatus });
        React.startTransition(() => {
          router.refresh();
        });
      } else {
        alert(`Failed to update status: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName || !trackingId) {
      alert("Courier Name and Tracking ID are mandatory for dispatching.");
      return;
    }

    const balance = order.balanceAmount ? parseFloat(order.balanceAmount.toString()) : 0;
    if (balance > 0) {
      alert(`Cannot dispatch order with outstanding balance of ₹${balance.toFixed(2)}. Please collect the remaining payment first.`);
      return;
    }

    setTransitioning(true);
    try {
      const res = await dispatchOrderAction(order.id, courierName, trackingId);
      if (res.success) {
        if (onOptimisticUpdate) onOptimisticUpdate({ id: order.id, status: 'DISPATCHED' });
        React.startTransition(() => {
          router.refresh();
        });
      } else {
        alert(`Failed to dispatch: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setTransitioning(false);
      setShowDispatchForm(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 transform transition-transform flex flex-col h-full font-sans text-sm text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/30">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              {order.orderNumber || order.businessId || order.id.slice(0, 8)}
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {order.source}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">{new Date(order.createdAt || order.orderDate).toLocaleString()}</p>
            {order.trackingToken && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/track/' + order.trackingToken);
                  alert('Tracking link copied to clipboard! Send this to the customer via WhatsApp.');
                }}
                className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 transition-colors w-fit"
              >
                <ExternalLink size={12} />
                Copy Public Tracking Link
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Primary Image */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Reference Image</h3>
            <div className="aspect-[4/5] w-full rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden relative group">
              {order.primaryImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.primaryImageUrl} alt="Primary Reference" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                  <ImageIcon size={32} />
                  <span>No Reference Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              Customer
              <button 
                onClick={() => {
                  onClose();
                  openCustomer360(order.customerPhone);
                }}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 normal-case tracking-normal text-xs"
              >
                View 360 <ExternalLink size={12} />
              </button>
            </h3>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Name</span>
                <span className="font-medium text-zinc-100">{order.customerName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Phone</span>
                <span className="font-medium text-zinc-100">{order.customerPhone}</span>
              </div>
              <a 
                href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 font-semibold text-center"
              >
                <MessageCircle size={16} /> Open WhatsApp Chat
              </a>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Financials</h3>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Amount</span>
                <span className="font-semibold text-zinc-100 text-base">₹{parseFloat(order.totalAmount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Advance Paid</span>
                <span className="font-medium text-zinc-300">₹{parseFloat(order.advanceAmount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Balance Due</span>
                <span className={`font-semibold ${parseFloat(order.balanceAmount || "0") > 0 ? 'text-amber-500 font-bold' : 'text-zinc-350'}`}>
                  ₹{parseFloat(order.balanceAmount || "0").toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60">
                <span className="text-zinc-400">Payment Status</span>
                {(() => {
                  const fStatus = getFinancialStatus(order);
                  const label = getFinancialStatusLabel(fStatus, order.balanceAmount ? parseFloat(order.balanceAmount) : 0);
                  const color = getFinancialStatusColor(fStatus);
                  return (
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${color}`}>
                      {label}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Lifecycle Status</h3>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Current Status</span>
                <span className="font-semibold text-blue-400">{currentStatus}</span>
              </div>

              {nextOptions.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 font-semibold block uppercase tracking-wider">Transition to</label>
                  <select 
                    disabled={transitioning || showDispatchForm}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    value=""
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  >
                    <option value="" disabled>-- Select status --</option>
                    {nextOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No further status transitions available.</p>
              )}
              
              <div className="pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowExceptionDrawer(true)}
                  className="w-full py-2 rounded-md bg-amber-950/20 text-amber-500 hover:bg-amber-950/40 transition-colors border border-amber-900/30 font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  <AlertTriangle size={16} />
                  Raise Exception
                </button>
              </div>
            </div>
          </div>

          {/* Dispatch Form Overlay (if DISPATCHED is triggered) */}
          {showDispatchForm && (
            <form onSubmit={handleDispatchSubmit} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-4">
              <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                <Truck size={16} /> Enter Dispatch Info
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Courier Name *</label>
                  <input 
                    type="text"
                    required
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. BlueDart, Delhivery"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Tracking ID *</label>
                  <input 
                    type="text"
                    required
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="e.g. AW1234567"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none text-zinc-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button 
                  type="button"
                  onClick={() => setShowDispatchForm(false)}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={transitioning}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          )}

          {/* Admin Tools Section */}
          {isAdmin && (
            <div className="pt-4 border-t border-zinc-800/80 mt-6">
              <button 
                type="button"
                disabled={transitioning}
                onClick={handleDeleteClick}
                className="w-full py-2.5 rounded-md bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-colors border border-red-900/30 font-semibold text-center text-sm disabled:opacity-50"
              >
                Delete Order
              </button>
            </div>
          )}

        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full space-y-4 shadow-xl text-left">
            <h3 className="text-lg font-bold text-zinc-100">Delete Order {order.orderNumber || order.businessId || order.id.slice(0, 8)}?</h3>
            <p className="text-sm text-zinc-400">This action cannot be undone. The order will be cancelled and marked as deleted in the system.</p>
            <div className="flex justify-end gap-3 font-semibold text-xs mt-2">
              <button
                type="button"
                disabled={transitioning}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-350"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={transitioning}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded bg-red-650 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {transitioning ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Exception Drawer */}
      <ExceptionDrawer 
        order={order}
        isOpen={showExceptionDrawer}
        onClose={() => setShowExceptionDrawer(false)}
        onOptimisticUpdate={onOptimisticUpdate}
      />
    </>
  );
}
