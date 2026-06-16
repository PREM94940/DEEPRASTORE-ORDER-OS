'use client';

import { Customer360Drawer } from '@/components/customer-360-drawer';

export default function TestPage() {
  return (
    <Customer360Drawer
      phone="9876543210"
      isOpen={true}
      onClose={() => {}}
    />
  );
}
