export const dynamic = "force-dynamic";
import { getPendingEnquiries } from '@/app/(staff)/actions/order-desk';
import { UnifiedOrderDesk } from '@/components/unified-order-desk';

export default async function OrderDeskPage({ searchParams }: { searchParams: Promise<{ enquiry?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const enquiries = await getPendingEnquiries();
  
  const selectedEnquiry = resolvedSearchParams.enquiry 
    ? enquiries.find(e => e.id === resolvedSearchParams.enquiry)
    : null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0a0a] text-white">
      {/* LEFT PANEL: INTAKE QUEUE */}
      <div className="w-full md:w-1/3 border-r border-white/10 flex flex-col max-h-screen overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">Intake Queue</h2>
          <p className="text-sm text-white/50">{enquiries.length} New Enquiries</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {enquiries.length === 0 ? (
            <div className="text-center py-10 text-white/40 border border-dashed border-white/10 rounded-lg">
              Queue is empty
            </div>
          ) : (
            enquiries.map((enq) => (
              <a 
                key={enq.id} 
                href={`?tab=Intake&enquiry=${enq.id}`}
                className={`block p-4 rounded-lg border transition-colors ${
                  selectedEnquiry?.id === enq.id 
                    ? 'border-[#059669] bg-[#059669]/10' 
                    : 'border-white/10 bg-[#111] hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{enq.customerName}</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-white/50">{enq.source}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      enq.status === 'REQUEST' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                      enq.status === 'PRICE_QUOTED' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/10' :
                      enq.status === 'INVOICE_SENT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/10' :
                      enq.status === 'PAYMENT_RECEIVED' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                      enq.status === 'CUSTOMER_APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                      enq.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/10' :
                      enq.status === 'NO_RESPONSE' ? 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/10' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {enq.status.replace('_', ' ')}
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
                    {(enq.referenceImages as string[]).slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-10 h-10 object-cover rounded opacity-80" />
                    ))}
                  </div>
                )}
              </a>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ORDER DESK */}
      <div className="w-full md:w-2/3 flex flex-col max-h-screen overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {selectedEnquiry ? 'Convert Enquiry to Order' : 'New Order'}
          </h2>
          {selectedEnquiry && (
            <a href="?" className="text-sm text-white/50 hover:text-white">Clear Selection</a>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <UnifiedOrderDesk key={selectedEnquiry?.id || 'new'} initialEnquiry={selectedEnquiry} />
        </div>
      </div>
    </div>
  );
}
