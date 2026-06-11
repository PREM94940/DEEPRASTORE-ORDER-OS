import { EventBus, DomainEvent } from '../../../../event-bus/src/contracts/EventBus';
import { OutboxRepository } from '../../contracts/OutboxRepository';
import { Customer } from '../domain/Customer';

export class CreateCustomerUseCase {
  constructor(
    private eventBus: EventBus,
    private outboxRepo: OutboxRepository
  ) {}

  async execute(leadEvent: DomainEvent): Promise<Customer> {
    const { leadId, phone, tenantId } = leadEvent.data;
    const customer = Customer.create(tenantId || 'default-tenant', phone, leadId);

    const customerCreatedEvent: DomainEvent = {
      id: crypto.randomUUID(),
      name: 'customer.created',
      timestamp: new Date().toISOString(),
      actorId: 'system',
      correlationId: leadEvent.correlationId,
      data: { customerId: customer.id, phone: customer.phone, tenantId: customer.tenantId }
    };

    const mockDbTx = {}; 
    await this.outboxRepo.save(customerCreatedEvent, mockDbTx);
    await this.eventBus.publish(customerCreatedEvent);

    return customer;
  }
}
