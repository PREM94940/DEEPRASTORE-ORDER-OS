"use client";

import * as React from "react";
import { X, FileEdit, AlertTriangle } from "lucide-react";
import { raiseChangeRequest } from "@/app/(staff)/actions/command-center";
import { useRouter } from "next/navigation";

export function ChangeRequestDrawer({
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
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  
  const [changeType, setChangeType] = React.useState("DESIGN_CHANGE");
  const [reason, setReason] = React.useState("");
  const [costImpact, setCostImpact] = React.useState("");
  const [deliveryImpactDays, setDeliveryImpactDays] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setChangeType("DESIGN_CHANGE");
      setReason("");
      setCostImpact("");
      setDeliveryImpactDays("");
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Notes are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await raiseChangeRequest({
        orderId: order.id,
        changeType: changeType,
        reason: reason.trim(),
        costImpact: costImpact ? Number(costImpact) : 0,
        deliveryImpactDays: deliveryImpactDays ? Number(deliveryImpactDays) : 0,
      });

      if (res.success) {
        if (onOptimisticUpdate) onOptimisticUpdate({ id: order.id, status: 'HOLD' });
        router.refresh();
        onClose();
      } else {
        alert(res.error || "Failed to raise change request");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 transform transition-transform flex flex-col h-full font-sans text-sm text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-blue-950/20">
          <h2 className="text-base font-semibold text-blue-500 flex items-center gap-2">
            <FileEdit size={18} /> Change Request
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 ml-2">
              {order.orderNumber || order.businessId || order.id.slice(0, 8)}
            </span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Change Type *</label>
              <select 
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DESIGN_CHANGE">Design Change</option>
                <option value="MEASUREMENT_CHANGE">Measurement Change</option>
                <option value="FABRIC_CHANGE">Fabric Change</option>
                <option value="ADDRESS_CHANGE">Address Change</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Details & Reason *</label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe what needs to change and why..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 outline-none focus:border-blue-500/50 transition-colors resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Cost & Delivery Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Cost Impact (₹)</label>
                <input
                  type="number"
                  value={costImpact}
                  onChange={(e) => setCostImpact(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Delay (Days)</label>
                <input
                  type="number"
                  value={deliveryImpactDays}
                  onChange={(e) => setDeliveryImpactDays(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4 flex gap-3 text-amber-500/90 text-xs">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>
                Submitting a change request will pause production and move this order to <strong className="text-amber-400">HOLD</strong> status until the change is approved by the founder.
              </p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="flex gap-3 font-semibold text-sm">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Change Request'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
