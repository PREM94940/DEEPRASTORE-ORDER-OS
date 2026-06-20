"use client";

import * as React from "react";
import { X, AlertTriangle, Camera } from "lucide-react";
import { raiseException } from "@/app/(staff)/actions/exceptions";
import { useRouter } from "next/navigation";

export function ExceptionDrawer({
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
  
  const [type, setType] = React.useState("Quality");
  const [severity, setSeverity] = React.useState("NORMAL");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setType("Quality");
      setSeverity("NORMAL");
      setDescription("");
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Notes are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await raiseException({
        orderId: order.id,
        type: type === "Founder" ? "FOUNDER_APPROVAL" : type.toUpperCase(),
        severity: severity.toUpperCase(),
        description: description.trim(),
        // photoUrl: ... // future photo upload integration
      });

      if (res.success) {
        if (onOptimisticUpdate) onOptimisticUpdate({ id: order.id, status: 'HOLD' });
        router.refresh();
        onClose();
      } else {
        alert(res.error || "Failed to raise exception");
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
      
      {/* Bottom Sheet for Mobile, Drawer for Desktop */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] bg-zinc-950 border-t md:border-l md:border-t-0 border-zinc-800 shadow-2xl z-50 transform transition-transform flex flex-col max-h-[90vh] md:max-h-full font-sans text-sm text-zinc-300 rounded-t-xl md:rounded-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-amber-950/20">
          <h2 className="text-base font-semibold text-amber-500 flex items-center gap-2">
            <AlertTriangle size={18} /> Raise Exception
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
          <form id="exception-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Type *</label>
              <div className="flex flex-wrap gap-2">
                {["Quality", "Material", "Measurement", "Payment", "Founder"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${type === t ? 'bg-amber-600/20 border-amber-500/50 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                  >
                    {t === "Founder" ? "Founder Approval" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Severity</label>
              <div className="flex flex-wrap gap-2">
                {["Normal", "Urgent", "Critical"].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${severity === s ? 'bg-zinc-100 border-zinc-100 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Notes / Description *</label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tap to type issue..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-zinc-100 outline-none focus:border-amber-500/50 min-h-[100px] resize-y"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Attachments</label>
              <button type="button" className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 border-dashed rounded-md py-4 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
                <Camera size={18} />
                <span>Take / Upload Photo</span>
              </button>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <button
            type="submit"
            form="exception-form"
            disabled={submitting}
            className="w-full py-3 rounded-md font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-lg shadow-amber-900/20"
          >
            {submitting ? "Submitting..." : "Submit Exception"}
          </button>
        </div>

      </div>
    </>
  );
}
