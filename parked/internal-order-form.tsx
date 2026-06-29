'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitInternalOrderAction } from '@/app/(staff)/actions/order-desk';

export function InternalOrderForm() {
  const router = useRouter();
  
  // Base Details
  const [orderType, setOrderType] = useState('READY_WEAR'); // READY_WEAR or CUSTOM
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Products
  const [products, setProducts] = useState<any[]>([{
    name: '',
    color: '',
    size: '',
    bust: '',
    waist: '',
    height: '',
    sleeve: '',
    shoulder: ''
  }]);

  // Financials
  const [productsTotal, setProductsTotal] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [customizationCharge, setCustomizationCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);

  // Extras
  const [deliveryDate, setDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const grandTotal = productsTotal + deliveryCharge + customizationCharge - discount;
  const balanceDue = grandTotal - amountReceived;

  const handleAddProduct = () => setProducts([...products, { name: '', color: '', size: '', bust: '', waist: '', height: '', sleeve: '', shoulder: '' }]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          newUrls.push(data.url);
        }
      }
      setAttachments([...attachments, ...newUrls]);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await submitInternalOrderAction({
        orderType,
        customerName,
        customerPhone,
        products,
        financials: {
          productsTotal,
          deliveryCharge,
          customizationCharge,
          discount,
          grandTotal,
          amountReceived,
          balanceDue
        },
        deliveryDate,
        remarks,
        attachments
      });

      if (result.success) {
        router.refresh();
        router.push('/pilot/order-desk?tab=Intake');
      } else {
        alert(result.error || 'Failed to submit internal order');
      }
    } catch (err) {
      alert('Network error while saving order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-white">
      
      {/* 1. ORDER TYPE & CUSTOMER */}
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <input type="radio" checked={orderType === 'READY_WEAR'} onChange={() => setOrderType('READY_WEAR')} className="accent-blue-500" />
            <span className="font-bold">Ready Wear</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <input type="radio" checked={orderType === 'CUSTOM'} onChange={() => setOrderType('CUSTOM')} className="accent-blue-500" />
            <span className="font-bold">Custom Order</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-white/50 uppercase tracking-wider">Customer Name *</label>
            <input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="E.g., Prem Kumar" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50 uppercase tracking-wider">Phone Number *</label>
            <input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="E.g., 9999999999" />
          </div>
        </div>
      </div>

      {/* 2. PRODUCTS & MEASUREMENTS */}
      <div className="space-y-4">
        {products.map((p, idx) => (
          <div key={idx} className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-4 relative">
            <h3 className="font-bold text-white/80 border-b border-white/10 pb-2">Product {idx + 1}</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <input required placeholder="Product Name" value={p.name} onChange={e => { const n = [...products]; n[idx].name = e.target.value; setProducts(n); }} className="col-span-3 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              <input placeholder="Color" value={p.color} onChange={e => { const n = [...products]; n[idx].color = e.target.value; setProducts(n); }} className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
              <input placeholder="Size (e.g. M, L)" value={p.size} onChange={e => { const n = [...products]; n[idx].size = e.target.value; setProducts(n); }} className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
            </div>

            {orderType === 'CUSTOM' && (
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/10">
                <div className="space-y-1"><label className="text-[10px] text-white/50">Bust</label><input value={p.bust} onChange={e => { const n = [...products]; n[idx].bust = e.target.value; setProducts(n); }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-white/50">Waist</label><input value={p.waist} onChange={e => { const n = [...products]; n[idx].waist = e.target.value; setProducts(n); }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-white/50">Height</label><input value={p.height} onChange={e => { const n = [...products]; n[idx].height = e.target.value; setProducts(n); }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-white/50">Sleeve</label><input value={p.sleeve} onChange={e => { const n = [...products]; n[idx].sleeve = e.target.value; setProducts(n); }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-white/50">Shoulder</label><input value={p.shoulder} onChange={e => { const n = [...products]; n[idx].shoulder = e.target.value; setProducts(n); }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs" /></div>
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddProduct} className="w-full border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 py-2 rounded-xl transition-colors">
          + Add Another Product
        </button>
      </div>

      {/* 3. FINANCIAL SUMMARY */}
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-4">
        <h3 className="font-bold text-white/80 border-b border-white/10 pb-2">Financial Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center"><label className="text-white/60">Products Total (₹)</label><input type="number" value={productsTotal} onChange={e => setProductsTotal(Number(e.target.value))} className="w-24 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-right" /></div>
          <div className="flex justify-between items-center"><label className="text-white/60">Delivery Charge (₹)</label><input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(Number(e.target.value))} className="w-24 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-right" /></div>
          <div className="flex justify-between items-center"><label className="text-white/60">Customization (₹)</label><input type="number" value={customizationCharge} onChange={e => setCustomizationCharge(Number(e.target.value))} className="w-24 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-right" /></div>
          <div className="flex justify-between items-center"><label className="text-white/60">Discount (₹)</label><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-right text-red-400" /></div>
          <div className="flex justify-between items-center font-bold pt-2 border-t border-white/10"><label>Grand Total</label><span>₹{grandTotal}</span></div>
          <div className="flex justify-between items-center pt-2"><label className="text-emerald-400 font-bold">Amount Received (₹) *</label><input required type="number" value={amountReceived} onChange={e => setAmountReceived(Number(e.target.value))} className="w-24 bg-[#1a1a1a] border border-emerald-500/50 rounded px-2 py-1 text-right text-emerald-400 font-bold" /></div>
          <div className="flex justify-between items-center pt-2"><label className="text-yellow-400 font-bold">Balance Due</label><span className="text-yellow-400 font-bold">₹{balanceDue}</span></div>
        </div>
      </div>

      {/* 4. METADATA & UPLOADS */}
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-white/50 uppercase tracking-wider">Expected Delivery Date</label>
          <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/50 uppercase tracking-wider">Remarks / Design Notes</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="Special requests, urgent tags, etc." />
        </div>
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs text-white/50 uppercase tracking-wider">Reference Photos & Attachments</label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 outline-none"
          />
          {isUploading && <p className="text-xs text-blue-400 font-bold">Uploading...</p>}
          {attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {attachments.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt="upload" className="h-16 w-16 object-cover rounded border border-white/20" />
                  <button 
                    type="button" 
                    onClick={() => setAttachments(attachments.filter(a => a !== url))}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all">
        {isSubmitting ? 'Saving Order...' : 'Save & Add to Queue'}
      </button>

    </form>
  );
}
