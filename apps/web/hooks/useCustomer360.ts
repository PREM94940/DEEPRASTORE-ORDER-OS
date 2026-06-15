import { useState, useEffect } from 'react';

export const openCustomer360Event = (phone: string) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('open-customer-360', { detail: { phone } });
    window.dispatchEvent(event);
  }
};

export function useCustomer360() {
  return {
    openCustomer360: (phone: string) => openCustomer360Event(phone)
  };
}

export function useCustomer360Listener() {
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ phone: string }>;
      setSelectedCustomerPhone(customEvent.detail.phone);
    };

    window.addEventListener('open-customer-360', handleOpen);
    return () => window.removeEventListener('open-customer-360', handleOpen);
  }, []);

  return { selectedCustomerPhone, setSelectedCustomerPhone };
}
