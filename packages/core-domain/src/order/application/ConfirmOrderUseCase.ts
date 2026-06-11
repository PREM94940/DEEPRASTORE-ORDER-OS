import { EventBus, DomainEvent } from '../../../../event-bus/src/contracts/EventBus';
import { OutboxRepository } from '../../contracts/OutboxRepository';
import { Order } from '../domain/Order';

export class ConfirmOrderUseCase {
  constructor(
    private eventBus: EventBus,
    private outboxRepo: OutboxRepository
  ) {}

  async execute(order: Order): Promise<Order> {
    order.confirm();
    
    const orderConfirmedEvent: DomainEvent = {
      id: crypto.randomUUID(),
      name: 'order.confirmed',
      timestamp: new Date().toISOString(),
      actorId: order.customerId || 'system',
      correlationId: crypto.randomUUID(),
      data: { orderId: order.id, customerId: order.customerId, tenantId: order.tenantId }
    };

    const mockDbTx = {}; 
    await this.outboxRepo.save(orderConfirmedEvent, mockDbTx);
    await this.eventBus.publish(orderConfirmedEvent);

    return order;
  }
}
