import { EventBus, DomainEvent } from '../../../../event-bus/src/contracts/EventBus';
import { OutboxRepository } from '../../contracts/OutboxRepository';
import { Lead } from '../domain/Lead';

export class CreateLeadUseCase {
  constructor(
    private eventBus: EventBus,
    private outboxRepo: OutboxRepository
  ) {}

  async execute(phone: string, correlationId: string): Promise<Lead> {
    const lead = Lead.create(phone);
    const leadCreatedEvent: DomainEvent = {
      id: crypto.randomUUID(),
      name: 'crm.lead.created',
      timestamp: new Date().toISOString(),
      actorId: 'system',
      correlationId,
      data: { leadId: lead.id, phone: lead.phone }
    };

    const mockDbTx = {}; 
    await this.outboxRepo.save(leadCreatedEvent, mockDbTx);
    await this.eventBus.publish(leadCreatedEvent);

    return lead;
  }
}
