import { describe, it, expect } from 'vitest';
import { InMemoryEventBus } from '../../../event-bus/src/memory/InMemoryEventBus';
import { CreateLeadUseCase } from '../crm/application/CreateLeadUseCase';
import { CreateCustomerUseCase } from '../customer/application/CreateCustomerUseCase';
import { POST as WhatsAppWebhook } from '../../../../apps/webhooks/app/api/whatsapp/route';

describe('Wave 2: CRM + Webhooks', () => {
  it('should process webhook and trigger lead and customer creation via OutboxRepo', async () => {
    const eventBus = new InMemoryEventBus();
    const mockOutboxRepo = { save: async () => {} };

    const createLeadUseCase = new CreateLeadUseCase(eventBus, mockOutboxRepo);
    const createCustomerUseCase = new CreateCustomerUseCase(eventBus, mockOutboxRepo);

    eventBus.subscribe('whatsapp.message.received', async (event) => {
      await createLeadUseCase.execute(event.data.phone, event.correlationId);
    });

    eventBus.subscribe('crm.lead.created', async (event) => {
      await createCustomerUseCase.execute(event);
    });

    const mockRequest = { body: { message: "Hi", from: "919999999999" } };
    const response = await WhatsAppWebhook(mockRequest, eventBus);
    
    expect(response.status).toBe(200);
    
    const events = eventBus.publishedEvents.map(e => e.name);
    expect(events).toContain('whatsapp.message.received');
    expect(events).toContain('crm.lead.created');
    expect(events).toContain('customer.created');
  });
});
