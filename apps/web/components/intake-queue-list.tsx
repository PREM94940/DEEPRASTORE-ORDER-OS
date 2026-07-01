'use client';

import { useState } from 'react';
import { QuickViewDrawer } from './quick-view-drawer';

export function IntakeQueueList({ enquiries, selectedEnquiryId }: { enquiries: any[], selectedEnquiryId?: string }) {
  const [quickViewEnquiry, setQuickViewEnquiry] = useState<any | null>(null);

  return (
    <>
      <div className="overflow-y-auto max-h-[40vh] md:max-h-none md:flex-1 p-4 space-y-4">
        {enquiries.length === 0 ? (
          <div className="text-center py-10 text-white/40 border border-dashed border-white/10 rounded-lg">
            Queue is empty
          </div>
        ) : (
          enquiries.map((enq) => (
            <div 
              key={enq.id} 
              onClick={() => setQuickViewEnquiry(enq)}
              className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedEnquiryId === enq.id 
                  ? 'border-[#059669] bg-[#059669]/10' 
                  : 'border-white/10 bg-[#111] hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{enq.customerName}</h3>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-white/50">{enq.source || 'WALK_IN'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    (enq.status || '') === 'NEW_REQUEST' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                    (enq.status || '') === 'AWAITING_QUOTE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/10' :
                    (enq.status || '') === 'AWAITING_PAYMENT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/10' :
                    (enq.status || '') === 'READY_TO_CREATE_ORDER' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                    (enq.status || '') === 'ORDER_CREATED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                    (enq.status || '') === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/10' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {(enq.status || 'NEW_REQUEST').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-white/60 mb-2">
                <span>{enq.customerPhone}</span>
                {enq.assignedTo ? (
                  <span className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">👤 {enq.assignedTo}</span>
                ) : (
                  <span className="text-white/30 italic">👤 Unassigned</span>
                )}
              </div>
              <p className="text-sm text-white/80 line-clamp-2">{enq.productType}</p>
              
              {/* Thumbnail Preview */}
              {(Array.isArray(enq.referenceImages) && enq.referenceImages.length > 0) && (
                <div className="flex gap-2 mt-3 overflow-hidden">
                  {(enq.referenceImages as string[]).slice(0, 3).map((url: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="w-10 h-10 object-cover rounded opacity-80" />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <QuickViewDrawer
        isOpen={!!quickViewEnquiry}
        onClose={() => setQuickViewEnquiry(null)}
        orderData={quickViewEnquiry ? {
          id: quickViewEnquiry.id,
          enquiryId: quickViewEnquiry.id,
          orderNumber: null, // It's an enquiry
          customerName: quickViewEnquiry.customerName,
          customerPhone: quickViewEnquiry.customerPhone,
          totalAmount: quickViewEnquiry.totalAmount,
          advanceAmount: quickViewEnquiry.advanceAmount,
          balanceAmount: quickViewEnquiry.balanceAmount,
          status: quickViewEnquiry.status,
          expectedDeliveryDate: quickViewEnquiry.expectedDeliveryDate,
          source: quickViewEnquiry.source,
          trackingToken: quickViewEnquiry.trackingToken,
          lineItems: Array.isArray(quickViewEnquiry.lineItems) ? quickViewEnquiry.lineItems : []
        } : null}
      />
    </>
  );
}
