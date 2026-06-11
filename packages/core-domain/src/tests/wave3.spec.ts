import { describe, it, expect, vi } from 'vitest';
import { InMemoryEventBus } from '../../../event-bus/src/memory/InMemoryEventBus';
import { ConfirmOrderUseCase } from '../order/application/ConfirmOrderUseCase';
import { ReserveInventoryUseCase } from '../inventory/application/ReserveInventoryUseCase';
import { OutboxRepository } from '../contracts/OutboxRepository';
import { Order } from '../order/domain/Order';

describe('Wave 3: Operations Foundation', () => {
  it('should successfully choreograph Order Confirmation to Inventory Reservation without cross-domain joins', async () => {
    // 1. Setup Abstractions
    const eventBus = new InMemoryEventBus();
    const mockOutboxRepo: OutboxRepository = {
      save: vi.fn().mockResolvedValue(undefined)
    };

    const confirmOrder = new ConfirmOrderUseCase(eventBus, mockOutboxRepo);
    const reserveInventory = new ReserveInventoryUseCase(eventBus, mockOutboxRepo);

    // 2. Wire Choreography
    eventBus.subscribe('order.confirmed', async (event) => {
      await reserveInventory.execute(event);
    });

    // 3. Execute
    const orderObj = Order.create(
      'TENANT-123',
      'CUST-123',
      [{ productVariantId: 'PROD-123', quantity: 1, price: 100 }],
      { fullName: 'Test', addressLine1: 'Test', city: 'Test', state: 'Test', postalCode: '12345', country: 'Test' }
    );
    const order = await confirmOrder.execute(orderObj);

    // 4. Assert Domain State
    expect(order.status).toBe('CONFIRMED');

    // 5. Assert Event Flow & Outbox Pattern
    const publishedEvents = eventBus.publishedEvents.map(e => e.name);
    
    // Rule 1: Order event published
    expect(publishedEvents).toContain('order.confirmed');
    
    // Rule 2: Inventory reservation event published
    expect(publishedEvents).toContain('inventory.reserved');
    
    // Rule 3: OutboxRepository invoked exactly twice (once per use case)
    expect(mockOutboxRepo.save).toHaveBeenCalledTimes(2);
  });
});
