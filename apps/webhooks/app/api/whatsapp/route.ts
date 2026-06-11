import { EventBus, DomainEvent } from '../../../../packages/event-bus/src/contracts/EventBus';

// Next.js App Router syntax mock
export async function POST(req: any, eventBus: EventBus) {
  // 1. Validate
  const body = req.body; // e.g. { message: "Hello", from: "919999999999" }
  if (!body.from) return { status: 400 };

  // 2. Translate (Anti-Corruption Layer)
  const correlationId = crypto.randomUUID();
  const whatsappEvent: DomainEvent = {
    id: crypto.randomUUID(),
    name: 'whatsapp.message.received',
    timestamp: new Date().toISOString(),
    actorId: 'whatsapp-webhook',
    correlationId,
    data: { phone: body.from, rawText: body.message }
  };

  // 3. Publish Event (NO DATABASE CALLS - Rule 2 & 3)
  await eventBus.publish(whatsappEvent);

  // 4. Return 200
  return { status: 200, body: 'OK' };
}
