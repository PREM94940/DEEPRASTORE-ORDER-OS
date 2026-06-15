export const dynamic = "force-dynamic";
import { getPendingEnquiries } from '@/app/actions/order-desk';
import { UnifiedOrderDesk } from '@/components/unified-order-desk';

export default async function OrderDeskPage({ searchParams }: { searchParams: { enquiry?: string } }) {
  const enquiries = await getPendingEnquiries();
  
  const selectedEnquiry = searchParams.enquiry 
    ? enquiries.find(e => e.id === searchParams.enquiry)
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
                href={`?enquiry=${enq.id}`}
                className={`block p-4 rounded-lg border transition-colors ${
                  selectedEnquiry?.id === enq.id 
                    ? 'border-[#059669] bg-[#059669]/10' 
                    : 'border-white/10 bg-[#111] hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{enq.customerName}</h3>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{enq.source}</span>
                </div>
                <p className="text-sm text-white/60 mb-2">{enq.customerPhone}</p>
                <p className="text-sm text-white/80 line-clamp-2">{enq.productType}</p>
                
                {/* Thumbnail Preview */}
                {(enq.referenceImages && (enq.referenceImages as string[]).length > 0) && (
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
          <UnifiedOrderDesk initialEnquiry={selectedEnquiry} />
        </div>
      </div>
    </div>
  );
}
