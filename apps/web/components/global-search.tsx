"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { Customer360Drawer } from "./customer-360-drawer";
import { useCustomer360Listener } from "@/hooks/useCustomer360";

import { getCustomerProfileAction, globalSearchAction } from "@/app/(staff)/actions/customer";

export function GlobalSearch() {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activePayload, setActivePayload] = React.useState<any>(null);
  
  const { selectedCustomerPhone, setSelectedCustomerPhone } = useCustomer360Listener();

  // If Drawer is closed via external trigger, clear the payload
  React.useEffect(() => {
    if (!selectedCustomerPhone) setActivePayload(null);
  }, [selectedCustomerPhone]);

  // Load payload when selectedCustomerPhone changes (e.g. clicked from OperationsGrid)
  React.useEffect(() => {
    if (selectedCustomerPhone && !activePayload && !loading) {
      setLoading(true);
      getCustomerProfileAction(selectedCustomerPhone).then((res) => {
        if (res.success) setActivePayload(res.payload);
        setLoading(false);
      });
    }
  }, [selectedCustomerPhone]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    
    // Attempt to search globally (Phone, Name, Order ID, UTR)
    const res = await globalSearchAction(query);
    if (res.success && res.phone) {
      setSelectedCustomerPhone(res.phone);
    } else {
      // If not found, you could show an error or open drawer empty for new customer creation
      // For now, if it is a number, we just assume it's a new phone
      const digits = query.replace(/\D/g, '');
      if (digits.length >= 10) setSelectedCustomerPhone(query);
      else alert("Customer or Order not found.");
    }
    
    setLoading(false);
  };

  return (
    <>
      <div className="relative w-full max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-zinc-800/60 rounded-full md:rounded-md leading-5 bg-zinc-900/40 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-xs md:text-sm transition-colors"
            placeholder="Search by: Phone, Order ID, UTR"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 size={16} className="animate-spin text-zinc-500" />
            </div>
          )}
        </form>
      </div>

      <Customer360Drawer 
        phone={selectedCustomerPhone}
        payload={activePayload}
        isOpen={!!selectedCustomerPhone}
        onClose={() => setSelectedCustomerPhone(null)}
        onUpdate={() => {
          if (selectedCustomerPhone) {
            setLoading(true);
            getCustomerProfileAction(selectedCustomerPhone).then((res) => {
              if (res.success) setActivePayload(res.payload);
              setLoading(false);
            });
          }
        }}
      />
    </>
  );
}
