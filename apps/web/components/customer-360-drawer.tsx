"use client";

import * as React from "react";
import { 
  X, User, ShoppingBag, CreditCard, Ruler, FileText, PlusCircle, MessageCircle 
} from "lucide-react";
import { createOrderAction } from "@/app/(staff)/actions/command-center";
import { updateMeasurementsAction, addCustomerNoteAction } from "@/app/(staff)/actions/customer";

export interface CustomerProfilePayload {
  id: string | null;
  name: string | null;
  phone: string;
  city: string;
  metrics: { ltv: number; totalOrders: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    category: string;
    productionStatus: string;
    dispatchStatus: string;
    status: string;
    totalAmount: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    utr: string | null;
    status: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
  }>;
  measurements?: {
    bust?: string | null;
    waist?: string | null;
    hip?: string | null;
    height?: string | null;
    customFields?: {
      lehenga?: { waist?: string; hip?: string; length?: string };
      blouse?: { bust?: string; underbust?: string; waist?: string; sleeve?: string; armhole?: string; backNeck?: string };
      kurta?: { shoulder?: string; chest?: string; waist?: string; hip?: string; sleeve?: string; length?: string };
    };
    updatedAt?: string;
  };
}

export function Customer360Drawer({
  phone,
  customerName,
  payload,
  isOpen,
  onClose,
  onUpdate,
}: {
  phone: string | null;
  customerName?: string | null;
  payload?: CustomerProfilePayload | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState("profile");
  const [activeModal, setActiveModal] = React.useState<'order' | 'measurement' | null>(null);
  const [newNote, setNewNote] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  // Order Form State
  const [orderForm, setOrderForm] = React.useState({ 
    category: 'CUSTOM_STITCHING', 
    totalAmount: '', 
    advanceAmount: '', 
    expectedDeliveryDate: '', 
    primaryImageUrl: '' 
  });

  // Category Measurements Form State
  const [lehengaForm, setLehengaForm] = React.useState({ waist: '', hip: '', length: '' });
  const [blouseForm, setBlouseForm] = React.useState({ bust: '', underbust: '', waist: '', sleeve: '', armhole: '', backNeck: '' });
  const [kurtaForm, setKurtaForm] = React.useState({ shoulder: '', chest: '', waist: '', hip: '', sleeve: '', length: '' });

  // Load existing measurements when payload changes
  React.useEffect(() => {
    if (payload?.measurements?.customFields) {
      const cf = payload.measurements.customFields;
      if (cf.lehenga) setLehengaForm({ waist: cf.lehenga.waist || '', hip: cf.lehenga.hip || '', length: cf.lehenga.length || '' });
      if (cf.blouse) setBlouseForm({
        bust: cf.blouse.bust || '',
        underbust: cf.blouse.underbust || '',
        waist: cf.blouse.waist || '',
        sleeve: cf.blouse.sleeve || '',
        armhole: cf.blouse.armhole || '',
        backNeck: cf.blouse.backNeck || '',
      });
      if (cf.kurta) setKurtaForm({
        shoulder: cf.kurta.shoulder || '',
        chest: cf.kurta.chest || '',
        waist: cf.kurta.waist || '',
        hip: cf.kurta.hip || '',
        sleeve: cf.kurta.sleeve || '',
        length: cf.kurta.length || '',
      });
    } else {
      // Clear forms
      setLehengaForm({ waist: '', hip: '', length: '' });
      setBlouseForm({ bust: '', underbust: '', waist: '', sleeve: '', armhole: '', backNeck: '' });
      setKurtaForm({ shoulder: '', chest: '', waist: '', hip: '', sleeve: '', length: '' });
    }
  }, [payload]);

  if (!isOpen || !phone) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    startTransition(async () => {
      const res = await addCustomerNoteAction(phone, newNote);
      if (res.success) {
        setNewNote("");
        if (onUpdate) onUpdate();
      } else {
        alert("Failed to add note: " + res.error);
      }
    });
  };

  const handleCreateOrder = async () => {
    if (!phone || !orderForm.category || !orderForm.totalAmount) return;

    startTransition(async () => {
      const res = await createOrderAction({
        customerPhone: phone,
        customerName: payload?.name || customerName || undefined,
        category: orderForm.category,
        totalAmount: parseFloat(orderForm.totalAmount),
        advanceAmount: parseFloat(orderForm.advanceAmount || '0'),
        expectedDeliveryDate: orderForm.expectedDeliveryDate,
        primaryImageUrl: orderForm.primaryImageUrl
      });
      if (res.success) {
        setActiveModal(null);
        alert('Order Created Successfully');
        if (onUpdate) onUpdate();
      } else {
        alert('Error: ' + res.error);
      }
    });
  };

  const handleSaveMeasurements = async () => {
    startTransition(async () => {
      const res = await updateMeasurementsAction({
        customerPhone: phone,
        customFields: {
          lehenga: lehengaForm,
          blouse: blouseForm,
          kurta: kurtaForm,
        }
      });
      if (res.success) {
        setActiveModal(null);
        alert('Measurements saved successfully');
        if (onUpdate) onUpdate();
      } else {
        alert('Failed to save measurements: ' + res.error);
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[550px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[70] transform transition-transform flex flex-col font-sans text-sm text-zinc-300">
        
        {/* Header - Customer Info */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-start">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center w-full">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{payload?.name || customerName || "Customer Profile"}</h2>
                <p className="text-sm font-mono text-zinc-400">{phone}</p>
                {payload?.city && <p className="text-xs text-zinc-500 mt-0.5">Location: {payload.city}</p>}
              </div>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors self-start">
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setActiveModal('order')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors shadow-sm">
                <PlusCircle size={14} /> New Order
              </button>
              <button onClick={() => setActiveModal('measurement')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-semibold transition-colors border border-zinc-700">
                <Ruler size={14} /> Edit Measurements
              </button>
              <a 
                href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded text-xs font-semibold transition-colors border border-[#25D366]/20"
              >
                <MessageCircle size={14} /> WhatsApp Chat
              </a>
            </div>
          </div>
        </div>

        {/* Tabbed Nav */}
        <div className="border-b border-zinc-800 bg-zinc-950 px-2 flex overflow-x-auto scrollbar-hide">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'measurements', icon: Ruler, label: 'Measurements' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'payments', icon: CreditCard, label: 'Payments' },
            { id: 'notes', icon: FileText, label: 'Notes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 rounded-md p-4 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Lifetime Value</div>
                    <div className="text-2xl font-bold text-white font-mono">₹{payload?.metrics?.ltv?.toFixed(2) || "0.00"}</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-md p-4 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Total Orders</div>
                    <div className="text-2xl font-bold text-white font-mono">{payload?.metrics?.totalOrders || "0"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Basic Information</h3>
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Name</span>
                    <span className="font-semibold text-zinc-200">{payload?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Phone</span>
                    <span className="font-semibold text-zinc-200 font-mono">{payload?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">City</span>
                    <span className="font-semibold text-zinc-200">{payload?.city || 'Not Set'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MEASUREMENTS TAB */}
          {activeTab === 'measurements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Customer Fit Profile</h3>
                {payload?.measurements?.updatedAt && (
                  <span className="text-xs text-zinc-500">Updated: {payload.measurements.updatedAt}</span>
                )}
              </div>

              {/* Lehenga Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-1">
                  📐 Lehenga
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs font-mono text-center">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Waist</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{lehengaForm.waist || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Hip</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{lehengaForm.hip || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Length</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{lehengaForm.length || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Blouse Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-1">
                  📐 Blouse
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Bust</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{blouseForm.bust || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Underbust</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{blouseForm.underbust || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Waist</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{blouseForm.waist || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Sleeve</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{blouseForm.sleeve || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Armhole</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{blouseForm.armhole || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Back Neck</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{blouseForm.backNeck || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Kurta Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-1">
                  📐 Kurta
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Shoulder</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{kurtaForm.shoulder || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Chest</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{kurtaForm.chest || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Waist</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{kurtaForm.waist || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Hip</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{kurtaForm.hip || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Sleeve</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{kurtaForm.sleeve || '-'}</div>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Length</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1">{kurtaForm.length || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Order History</h3>
              {payload?.recentOrders?.length ? payload.recentOrders.map(order => (
                <div key={order.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-2 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="font-mono text-zinc-200 font-semibold">{order.orderNumber}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-900/30 text-blue-400 border border-blue-900/30">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 mt-2">
                    <span>Category: {order.category}</span>
                    <span className="font-mono font-semibold text-zinc-200">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-zinc-500 text-sm py-4 text-center">No orders found.</div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Payment Logs</h3>
              {payload?.payments?.length ? payload.payments.map(pmt => (
                <div key={pmt.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-zinc-200">₹{pmt.amount.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-1">UTR: {pmt.utr || 'N/A'}</div>
                    <div className="text-[10px] text-zinc-650 mt-0.5">{new Date(pmt.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${pmt.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/30' : 'bg-amber-900/30 text-amber-500 border border-amber-900/30'}`}>
                    {pmt.status}
                  </span>
                </div>
              )) : (
                <div className="text-zinc-500 text-sm py-4 text-center">No payment history found.</div>
              )}
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  required
                  placeholder="Type a new operational note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 p-3 rounded-lg text-sm text-zinc-100 outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  disabled={isPending || !newNote.trim()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-semibold text-zinc-200 transition-colors disabled:opacity-50"
                >
                  Save Note
                </button>
              </form>

              {/* List */}
              <div className="space-y-3">
                {payload?.notes?.length ? payload.notes.map(note => (
                  <div key={note.id} className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 space-y-2">
                    <p className="text-zinc-350 text-sm leading-relaxed">{note.note}</p>
                    <p className="text-[10px] text-zinc-550">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                )) : (
                  <p className="text-center text-zinc-650 py-10 text-xs italic">No notes recorded yet</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {activeModal === 'order' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-[500px] rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-200">
            <h3 className="text-xl font-bold mb-4 text-white">Create New Order</h3>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Category *</label>
                <select value={orderForm.category} onChange={e => setOrderForm({...orderForm, category: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500">
                  <option value="CUSTOM_STITCHING">Custom Stitching</option>
                  <option value="READY_MADE">Ready Made</option>
                  <option value="ALTERATION">Alteration</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Total Amount (₹) *</label>
                  <input type="number" value={orderForm.totalAmount} onChange={e => setOrderForm({...orderForm, totalAmount: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 10000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Advance Amount (₹)</label>
                  <input type="number" value={orderForm.advanceAmount} onChange={e => setOrderForm({...orderForm, advanceAmount: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 3000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Expected Delivery Date</label>
                <input type="date" value={orderForm.expectedDeliveryDate} onChange={e => setOrderForm({...orderForm, expectedDeliveryDate: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Reference Image URL</label>
                <input type="text" value={orderForm.primaryImageUrl} onChange={e => setOrderForm({...orderForm, primaryImageUrl: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white rounded-md">Cancel</button>
              <button onClick={handleCreateOrder} disabled={isPending} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm disabled:opacity-50">Create Order</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEASUREMENTS MODAL */}
      {activeModal === 'measurement' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-[500px] max-h-[85vh] overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-200">
            <h3 className="text-xl font-bold mb-4 text-white">Edit Fit Measurements</h3>
            
            <div className="space-y-6 mb-6">
              {/* Lehenga form */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-855 space-y-3">
                <h4 className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1">📐 Lehenga</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Waist</label>
                    <input type="text" value={lehengaForm.waist} onChange={e => setLehengaForm({...lehengaForm, waist: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Hip</label>
                    <input type="text" value={lehengaForm.hip} onChange={e => setLehengaForm({...lehengaForm, hip: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Length</label>
                    <input type="text" value={lehengaForm.length} onChange={e => setLehengaForm({...lehengaForm, length: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                </div>
              </div>

              {/* Blouse form */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-855 space-y-3">
                <h4 className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1">📐 Blouse</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Bust</label>
                    <input type="text" value={blouseForm.bust} onChange={e => setBlouseForm({...blouseForm, bust: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Underbust</label>
                    <input type="text" value={blouseForm.underbust} onChange={e => setBlouseForm({...blouseForm, underbust: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Waist</label>
                    <input type="text" value={blouseForm.waist} onChange={e => setBlouseForm({...blouseForm, waist: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Sleeve</label>
                    <input type="text" value={blouseForm.sleeve} onChange={e => setBlouseForm({...blouseForm, sleeve: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Armhole</label>
                    <input type="text" value={blouseForm.armhole} onChange={e => setBlouseForm({...blouseForm, armhole: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Back Neck</label>
                    <input type="text" value={blouseForm.backNeck} onChange={e => setBlouseForm({...blouseForm, backNeck: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                </div>
              </div>

              {/* Kurta form */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-855 space-y-3">
                <h4 className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1">📐 Kurta</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Shoulder</label>
                    <input type="text" value={kurtaForm.shoulder} onChange={e => setKurtaForm({...kurtaForm, shoulder: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Chest</label>
                    <input type="text" value={kurtaForm.chest} onChange={e => setKurtaForm({...kurtaForm, chest: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Waist</label>
                    <input type="text" value={kurtaForm.waist} onChange={e => setKurtaForm({...kurtaForm, waist: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Hip</label>
                    <input type="text" value={kurtaForm.hip} onChange={e => setKurtaForm({...kurtaForm, hip: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Sleeve</label>
                    <input type="text" value={kurtaForm.sleeve} onChange={e => setKurtaForm({...kurtaForm, sleeve: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Length</label>
                    <input type="text" value={kurtaForm.length} onChange={e => setKurtaForm({...kurtaForm, length: e.target.value})} className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-200 font-mono" placeholder="inches" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white rounded-md">Cancel</button>
              <button onClick={handleSaveMeasurements} disabled={isPending} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
