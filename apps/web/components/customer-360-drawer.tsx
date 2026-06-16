"use client";

import * as React from "react";
import { 
  X, User, ShoppingBag, CreditCard, Ruler, LifeBuoy, FileText, Image as ImageIcon, Link2, 
  AlertTriangle, Star, RefreshCcw, Clock, PlusCircle
} from "lucide-react";
import { createOrderAction, addPaymentAction } from "@/app/(staff)/actions/command-center";
import { updateMeasurementsAction } from "@/app/(staff)/actions/customer";

export interface CustomerProfilePayload {
  metrics: { ltv: number; totalOrders: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    category: string;
    productionStatus: string;
    dispatchStatus: string;
    status: string;
  }>;
  measurements?: {
    bust?: string;
    waist?: string;
    hip?: string;
    height?: string;
    updatedAt?: string;
  };
  leads?: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export function Customer360Drawer({
  phone,
  customerName,
  payload,
  isOpen,
  onClose,
}: {
  phone: string | null;
  customerName?: string | null;
  payload?: CustomerProfilePayload;
  isOpen: boolean;
  onClose: () => void;
}) {
  const activePayload = payload || {
    metrics: { ltv: 145000, totalOrders: 4 },
    recentOrders: [{
      id: "f6f44c42-8f5b-4d2b-aae0-090effd5843e",
      orderNumber: "DP-2026-000018",
      category: "CUSTOM_STITCHING",
      productionStatus: "NOT_STARTED",
      dispatchStatus: "NOT_STARTED",
      status: "ACTIVE"
    }],
    measurements: undefined,
    leads: []
  };

  const [activeTab, setActiveTab] = React.useState("profile");
  const [activeModal, setActiveModal] = React.useState<'order' | 'payment' | 'measurement' | 'complaint' | null>(null);

  // Form States
  const [orderForm, setOrderForm] = React.useState({ category: 'CUSTOM_STITCHING', totalAmount: '', advanceAmount: '', expectedDeliveryDate: '', primaryImageUrl: '' });
  const [paymentForm, setPaymentForm] = React.useState({ amount: '', utr: '' });
  const [measureForm, setMeasureForm] = React.useState({ bust: '', waist: '', hip: '', height: '' });
  const [complaintForm, setComplaintForm] = React.useState({ category: 'GENERAL', title: '', description: '' });

  const handleCreateTicket = async () => {
    if (!phone || !complaintForm.title || !complaintForm.description) return;
    
    // Dynamically importing to avoid circular dep issues in some setups, but direct import is fine too.
    const { createTicket } = await import('@/app/(staff)/actions/support');
    const res = await createTicket({
      customerPhone: phone,
      orderId: activePayload?.recentOrders?.[0]?.id,
      category: complaintForm.category,
      priority: 'NORMAL',
      title: complaintForm.title,
      description: complaintForm.description,
      staffId: 'Staff01',
    });
    
    if (res.success) {
      setActiveModal(null);
      setComplaintForm({ category: 'GENERAL', title: '', description: '' });
      alert('Support Ticket Created');
    } else alert('Error: ' + res.error);
  };

  const handleCreateOrder = async () => {
    if (!phone || !orderForm.category || !orderForm.totalAmount || !orderForm.expectedDeliveryDate || !orderForm.primaryImageUrl) return;
    const res = await createOrderAction({
      customerPhone: phone,
      customerName: customerName || undefined,
      category: orderForm.category,
      totalAmount: parseFloat(orderForm.totalAmount),
      advanceAmount: parseFloat(orderForm.advanceAmount || '0'),
      expectedDeliveryDate: orderForm.expectedDeliveryDate,
      primaryImageUrl: orderForm.primaryImageUrl
    });
    if (res.success) {
      setActiveModal(null);
      alert('Order Created Successfully');
    } else alert('Error: ' + res.error);
  };

  const handleRecordPayment = async () => {
    // In a real app we'd select which order this payment applies to if there are multiple. 
    // For this reality test, we'll apply it to the most recent active order if we had that context, 
    // but the backend addPaymentAction requires orderId. We'll add an orderId field to the payment form.
    if (!paymentForm.amount || !paymentForm.utr || !activePayload?.recentOrders?.length) return;
    const res = await addPaymentAction(activePayload.recentOrders[0].id, parseFloat(paymentForm.amount), paymentForm.utr);
    if (res.success) {
      setActiveModal(null);
      alert('Payment Recorded');
    } else alert('Error: ' + res.error);
  };

  const handleAddMeasurements = async () => {
    if (!phone || !measureForm.bust || !measureForm.waist) return;
    const res = await updateMeasurementsAction({ customerPhone: phone, ...measureForm });
    if (res.success) {
      setActiveModal(null);
      alert('Measurements Saved');
    } else alert('Error: ' + res.error);
  };

  if (!isOpen || !phone) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[70] transform transition-transform flex flex-col font-sans text-sm text-zinc-300">
        
        {/* Header - Customer Master */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-start">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center w-full">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{customerName || "Customer Profile"}</h2>
                <p className="text-sm font-mono text-zinc-400">{phone}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors self-start">
                <X size={18} />
              </button>
            </div>
            
            {/* Flags */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-900/30 text-amber-500 border border-amber-900/50">
                <Star size={12} /> VIP
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-900/30 text-emerald-500 border border-emerald-900/50">
                <RefreshCcw size={12} /> Repeat Customer
              </span>
              {/* <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-900/30 text-red-500 border border-red-900/50">
                <AlertTriangle size={12} /> Blacklisted
              </span> */}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-900/30 text-blue-500 border border-blue-900/50">
                <LifeBuoy size={12} /> 1 Open Ticket
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                <Clock size={12} /> Refund History
              </span>
            </div>

            {/* Measurement Snapshot */}
            {activePayload?.measurements ? (
            <div className="bg-zinc-900/60 rounded-md border border-zinc-800 p-3 mt-2 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Bust</span><span className="font-mono text-zinc-200">{activePayload.measurements.bust || '-'}</span></div>
                <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Waist</span><span className="font-mono text-zinc-200">{activePayload.measurements.waist || '-'}</span></div>
                <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Hip</span><span className="font-mono text-zinc-200">{activePayload.measurements.hip || '-'}</span></div>
                <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Height</span><span className="font-mono text-zinc-200">{activePayload.measurements.height || '-'}</span></div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-zinc-500">Updated: {activePayload.measurements.updatedAt || 'Unknown'}</span>
                <button className="text-xs text-blue-400 hover:underline">View History</button>
              </div>
            </div>
            ) : (
            <div className="bg-zinc-900/60 rounded-md border border-zinc-800 p-3 mt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-500">No measurements recorded.</span>
              <button onClick={() => setActiveModal('measurement')} className="text-xs text-blue-400 hover:underline">Add Now</button>
            </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-2">
              <button onClick={() => setActiveModal('order')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors shadow-sm">
                <PlusCircle size={14} /> Order
              </button>
              <button className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors border border-zinc-700">
                <Ruler size={14} /> Alteration
              </button>
              <button onClick={() => setActiveModal('complaint')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors border border-zinc-700">
                <LifeBuoy size={14} /> Complaint
              </button>
              <button className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors border border-zinc-700">
                <FileText size={14} /> Note
              </button>
              <button onClick={() => setActiveModal('payment')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 rounded text-xs font-medium transition-colors border border-emerald-900/50">
                <CreditCard size={14} /> Record Payment
              </button>
            </div>
          </div>
        </div>

        {/* 8 Mandatory Panels Navigation */}
        <div className="border-b border-zinc-800 bg-zinc-950 px-2 flex overflow-x-auto scrollbar-hide">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'payments', icon: CreditCard, label: 'Payments' },
            { id: 'measurements', icon: Ruler, label: 'Measure' },
            { id: 'tickets', icon: LifeBuoy, label: 'Tickets' },
            { id: 'images', icon: ImageIcon, label: 'Ref Images' },
            { id: 'notes', icon: FileText, label: 'Notes' },
            { id: 'leads', icon: Link2, label: 'Lead Flow' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400 bg-zinc-900/20' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 rounded-md p-3 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Lifetime Value</div>
                    <div className="text-2xl font-bold text-white font-mono" suppressHydrationWarning>₹{activePayload?.metrics?.ltv?.toLocaleString('en-IN') || "0"}</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
                    <div className="text-xs text-zinc-400 mb-1">Total Orders</div>
                    <div className="text-2xl font-bold text-zinc-100">{activePayload?.metrics?.totalOrders || "0"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {activePayload?.recentOrders?.map(order => (
                <div key={order.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 cursor-pointer transition-colors mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-zinc-200 font-medium">{order.orderNumber}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-900/30 text-blue-400 border border-blue-900/50">{order.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div>
                      <span className="block text-zinc-500 mb-0.5">Category</span>
                      <span className="text-zinc-300">{order.category}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 mb-0.5">Production</span>
                      <span className="text-amber-400">{order.productionStatus}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 mb-0.5">Dispatch</span>
                      <span className="text-zinc-400">{order.dispatchStatus}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!activePayload?.recentOrders?.length && (
                <div className="text-zinc-500 text-sm py-4 text-center">No recent orders found.</div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Customer Reference Images</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="aspect-square bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <ImageIcon size={24} />
                </div>
                <div className="aspect-square bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <ImageIcon size={24} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Content Attribution</h3>
              <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 relative">
                <div className="absolute left-6 top-6 bottom-6 w-px bg-zinc-800"></div>
                
                {activePayload?.leads?.map((lead, idx) => (
                <div key={idx} className="relative flex items-start gap-4 mb-6">
                  <div className={`w-5 h-5 rounded-full ${idx === activePayload.leads!.length - 1 ? 'bg-blue-900 border-blue-700' : 'bg-zinc-800 border-zinc-700'} border flex items-center justify-center z-10 mt-0.5`}>
                    <div className={`w-2 h-2 rounded-full ${idx === activePayload.leads!.length - 1 ? 'bg-blue-400' : 'bg-zinc-500'}`}></div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${idx === activePayload.leads!.length - 1 ? 'text-blue-400' : 'text-zinc-200'}`}>{lead.type}</div>
                    <div className="text-xs text-zinc-500 mt-1">{lead.date} • {lead.description}</div>
                  </div>
                </div>
                ))}
                {!activePayload?.leads?.length && <div className="text-zinc-500 text-sm pl-8">No lead data available.</div>}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Support Tickets</h3>
              <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
                <div className="text-zinc-500 text-sm py-4 text-center">No active tickets found.</div>
              </div>
            </div>
          )}

          {/* Fallback for empty tabs */}
          {['payments', 'measurements', 'notes'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-3">
              <Clock size={32} />
              <span className="text-sm">History loading...</span>
            </div>
          )}

        </div>
      </div>

      {/* MODALS */}
      {activeModal === 'order' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm font-sans">
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
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Advance Amount (₹) *</label>
                  <input type="number" value={orderForm.advanceAmount} onChange={e => setOrderForm({...orderForm, advanceAmount: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 3000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Expected Delivery Date *</label>
                <input type="date" value={orderForm.expectedDeliveryDate} onChange={e => setOrderForm({...orderForm, expectedDeliveryDate: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Reference Image URL *</label>
                <input type="text" value={orderForm.primaryImageUrl} onChange={e => setOrderForm({...orderForm, primaryImageUrl: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md">Cancel</button>
              <button onClick={handleCreateOrder} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm">Create Order</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'payment' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm font-sans">
          <div className="w-[400px] rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-200">
            <h3 className="text-xl font-bold mb-4 text-white">Record Balance Payment</h3>
            <p className="text-xs text-amber-500 mb-4 bg-amber-900/20 p-2 rounded border border-amber-900/50">Applies to the most recent active order.</p>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Amount Paid (₹) *</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-emerald-500" placeholder="e.g. 7000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">UTR / Transaction ID *</label>
                <input type="text" value={paymentForm.utr} onChange={e => setPaymentForm({...paymentForm, utr: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-emerald-500" placeholder="e.g. UTR1234567890" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md">Cancel</button>
              <button onClick={handleRecordPayment} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-sm">Verify Payment</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'measurement' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm font-sans">
          <div className="w-[400px] rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-200">
            <h3 className="text-xl font-bold mb-4 text-white">Record Measurements</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Bust (inches) *</label>
                <input type="text" value={measureForm.bust} onChange={e => setMeasureForm({...measureForm, bust: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 34" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Waist (inches) *</label>
                <input type="text" value={measureForm.waist} onChange={e => setMeasureForm({...measureForm, waist: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 28" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Hip (inches)</label>
                <input type="text" value={measureForm.hip} onChange={e => setMeasureForm({...measureForm, hip: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 36" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Height</label>
                <input type="text" value={measureForm.height} onChange={e => setMeasureForm({...measureForm, height: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. 5'4" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md">Cancel</button>
              <button onClick={handleAddMeasurements} className="px-4 py-2 text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-200 rounded-md shadow-sm">Save Measurements</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'complaint' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm font-sans">
          <div className="w-[450px] rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-200">
            <h3 className="text-xl font-bold mb-4 text-white">Raise Support Ticket</h3>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Category *</label>
                <select value={complaintForm.category} onChange={e => setComplaintForm({...complaintForm, category: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-red-500">
                  <option value="GENERAL">General Inquiry</option>
                  <option value="DELAY">Delay</option>
                  <option value="ALTERATION">Alteration</option>
                  <option value="PAYMENT_ISSUE">Payment Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Title *</label>
                <input type="text" value={complaintForm.title} onChange={e => setComplaintForm({...complaintForm, title: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-red-500" placeholder="Brief summary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description *</label>
                <textarea rows={3} value={complaintForm.description} onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none focus:border-red-500" placeholder="Detailed explanation..."></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md">Cancel</button>
              <button onClick={handleCreateTicket} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm">Raise Ticket</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
