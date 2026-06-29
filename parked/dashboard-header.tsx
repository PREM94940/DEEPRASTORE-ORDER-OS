'use client';

import { useState } from 'react';
import { ExternalOrderModal } from './external-order-modal';

export function DashboardHeader() {
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2 w-full md:w-auto">
        <button 
          onClick={() => setIsExternalModalOpen(true)}
          className="flex-1 md:flex-none px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-[#25D366]/20"
        >
          + External Order
        </button>
        <a href="?tab=Intake&new=true" className="flex-1 md:flex-none text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/20">
          + Internal Order
        </a>
      </div>

      <ExternalOrderModal 
        isOpen={isExternalModalOpen} 
        onClose={() => setIsExternalModalOpen(false)} 
      />
    </>
  );
}
