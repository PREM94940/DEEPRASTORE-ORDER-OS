'use client';

import { useState } from 'react';
import { uploadFilesToSupabase } from '@/lib/upload';
import { submitEnquiryAction } from '@/app/actions/enquiry';

export default function IntakePortal() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    source: 'WHATSAPP',
    productType: '',
    notes: '',
    deliveryDate: '',
  });
  
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Upload Reference Images
      const refUploads = await uploadFilesToSupabase(formData.phone, refFiles);
      const refUrls = refUploads.map(r => r.publicUrl);

      // 2. Upload Design Images
      const designUploads = await uploadFilesToSupabase(formData.phone, designFiles);
      const designUrls = designUploads.map(r => r.publicUrl);

      // 3. Submit Enquiry
      const result = await submitEnquiryAction({
        ...formData,
        referenceImages: refUrls,
        designImages: designUrls,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] p-8 rounded-xl border border-white/10 max-w-md w-full text-center space-y-6">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-white">Request Received!</h1>
          <p className="text-white/60">
            Thank you! We have received your photos and details. Our team will review them and create your order shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">New Order Request</h1>
          <p className="text-white/60">Upload your design references and details securely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-[#111] border border-white/10 rounded-xl p-6">
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">1. Your Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Full Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white" 
                  placeholder="e.g. Priya Sharma" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Phone Number *</label>
                <input 
                  required 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white" 
                  placeholder="e.g. 9876543210" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/60">Where did you chat with us?</label>
              <select 
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">2. Design & Product</h2>
            <div className="space-y-2">
              <label className="text-sm text-white/60">What do you want us to make? *</label>
              <input 
                required 
                type="text" 
                value={formData.productType}
                onChange={(e) => setFormData({...formData, productType: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white" 
                placeholder="e.g. Silk Blouse, Lehenga Set" 
              />
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <label className="text-sm font-medium text-white mb-2 block">Reference Images (MANDATORY)</label>
                <p className="text-xs text-white/40 mb-4">Upload the design you want us to copy.</p>
                <input 
                  required 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setRefFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
              </div>

              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <label className="text-sm font-medium text-white mb-2 block">Fabric/Measurement Images (Optional)</label>
                <p className="text-xs text-white/40 mb-4">If you have photos of your fabric or measurements.</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setDesignFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">3. Additional Details</h2>
            <div className="space-y-2">
              <label className="text-sm text-white/60">Expected Delivery Date (Optional)</label>
              <input 
                type="date" 
                value={formData.deliveryDate}
                onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/60">Notes for Master Ji</label>
              <textarea 
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white" 
                placeholder="e.g. Deep neck, elbow length sleeves, extra lining..." 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Uploading Images & Submitting...' : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
