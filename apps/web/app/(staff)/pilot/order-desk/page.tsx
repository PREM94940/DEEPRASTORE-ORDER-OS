export const dynamic = "force-dynamic";
import { getPendingEnquiries } from '@/app/(staff)/actions/order-desk';
import { UnifiedOrderDesk } from '@/components/unified-order-desk';
import { IntakeQueueList } from '@/components/intake-queue-list';

export default async function OrderDeskPage({ searchParams }: { searchParams: Promise<{ enquiry?: string, new?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const enquiries = await getPendingEnquiries();
  
  const selectedEnquiry = resolvedSearchParams.enquiry 
    ? enquiries.find(e => e.id === resolvedSearchParams.enquiry)
    : null;

  const isCreatingNew = resolvedSearchParams.new === 'true' || enquiries.length === 0;
  const showRightPanel = !!selectedEnquiry || isCreatingNew;

  const { db } = await import('@deeprastore/infrastructure');
  const { approvedStaff } = await import('@deeprastore/infrastructure/src/schema/staff');
  const { eq } = await import('drizzle-orm');
  const staff = await db.select().from(approvedStaff).where(eq(approvedStaff.isActive, true));

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0a0a] text-white">
      {/* LEFT PANEL: INTAKE QUEUE */}
      <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex-col md:h-full overflow-hidden ${showRightPanel ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">Intake Queue</h2>
          <p className="text-sm text-white/50">{enquiries.length} New Enquiries</p>
        </div>
        <IntakeQueueList enquiries={enquiries} selectedEnquiryId={selectedEnquiry?.id} />
        <div className="p-4 border-t border-white/10 md:hidden bg-[#111]">
          <a href="?tab=Intake&new=true" className="flex items-center justify-center w-full p-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white transition-colors">
            + New Walk-in Order
          </a>
        </div>
      </div>

      {/* RIGHT PANEL: ORDER DESK */}
      <div className={`w-full md:w-2/3 flex-col h-full overflow-hidden ${!showRightPanel ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
          <div className="flex items-center gap-3">
            {showRightPanel && (
              <a href="?" className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <span className="text-xl leading-none">←</span>
              </a>
            )}
            <h2 className="text-xl font-bold">
              {selectedEnquiry ? 'Convert Enquiry' : 'New Walk-in Order'}
            </h2>
          </div>
          {selectedEnquiry && (
            <a href="?" className="text-sm text-white/50 hover:text-white hidden md:block">Clear Selection</a>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <UnifiedOrderDesk key={selectedEnquiry?.id || 'new'} initialEnquiry={selectedEnquiry} activeStaff={staff} />
        </div>
      </div>
    </div>
  );
}
