// automation.ts

export type OrderStatus = 'Received' | 'Cutting' | 'Stitching' | 'Finishing' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface TimelineEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string;
  timestamp: string;
}

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  'Received': ['Cutting', 'Cancelled'],
  'Cutting': ['Stitching', 'Cancelled'],
  'Stitching': ['Finishing', 'Cancelled'],
  'Finishing': ['Dispatched', 'Cancelled'],
  'Dispatched': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};

import { logSystemAlert } from './monitoring';

export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return validTransitions[currentStatus].includes(newStatus);
}

export async function transitionOrderStatus(orderId: string, currentStatus: OrderStatus, newStatus: OrderStatus, notes?: string): Promise<TimelineEvent> {
  if (!canTransitionTo(currentStatus, newStatus)) {
    await logSystemAlert('WARNING', 'JOB', `Invalid status transition for order ${orderId}: ${currentStatus} -> ${newStatus}`);
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }

  // Record timeline history event
  const timelineEvent: TimelineEvent = {
    id: crypto.randomUUID(),
    orderId,
    status: newStatus,
    notes,
    timestamp: new Date().toISOString()
  };

  await syncTimelineEvent(timelineEvent);

  return timelineEvent;
}

export async function syncTimelineEvent(event: TimelineEvent): Promise<void> {
  console.log(`Timeline sync for order ${event.orderId}: Status updated to ${event.status} at ${event.timestamp}`);
}
