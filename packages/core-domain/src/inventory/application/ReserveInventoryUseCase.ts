import { EventBus, DomainEvent } from '../../../../event-bus/src/contracts/EventBus';
import { OutboxRepository } from '../../contracts/OutboxRepository';
import { Inventory } from '../domain/Inventory';

export class ReserveInventoryUseCase {
  constructor(
    private eventBus: EventBus,
    private outboxRepo: OutboxRepository
  ) {}

  async execute(orderEvent: DomainEvent): Promise<void> {
    const mockInventory = new Inventory("SKU-123", 10);
    mockInventory.reserve(1);

    const inventoryReservedEvent: DomainEvent = {
      id: crypto.randomUUID(),
      name: 'inventory.reserved',
      timestamp: new Date().toISOString(),
      actorId: 'system',
      correlationId: orderEvent.correlationId,
      data: { orderId: orderEvent.data.orderId, sku: "SKU-123" }
    };
    
    const mockDbTx = {}; 
    await this.outboxRepo.save(inventoryReservedEvent, mockDbTx);
    await this.eventBus.publish(inventoryReservedEvent);
  }
}
