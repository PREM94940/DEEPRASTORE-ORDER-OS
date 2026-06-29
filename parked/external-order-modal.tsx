'use client';

import { useState } from 'react';

export function ExternalOrderModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [token] = useState(() => `INT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [copied, setCopied] = useState(false);
  
  // In production, this would use the actual domain. For localhost testing:
  const intakeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/order?token=${token}`
    : `https://deeprastore.com/order?token=${token}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(intakeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi! Please fill out your order details and measurements securely here: ${intakeUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleOpenForm = () => {
    window.open(intakeUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-[#25D366]/10">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#25D366]">📱</span> External Order Link
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm text-white/60">
              Share this secure link with the customer. The queue will automatically update when they submit.
            </p>
          </div>

          {/* URL Box */}
          <div className="flex bg-[#1a1a1a] border border-white/20 rounded-xl overflow-hidden p-1">
            <input 
              readOnly 
              value={intakeUrl}
              className="flex-1 bg-transparent px-3 text-sm text-blue-400 outline-none select-all"
            />
            <button 
              onClick={handleCopy}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <button 
              onClick={handleWhatsApp}
              className="col-span-2 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold transition-colors"
            >
              Share on WhatsApp
            </button>
            <button 
              onClick={handleOpenForm}
              className="col-span-2 flex items-center justify-center gap-2 py-3 border border-white/20 hover:bg-white/5 text-white rounded-xl font-bold transition-colors"
            >
              Open Form (Test)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
