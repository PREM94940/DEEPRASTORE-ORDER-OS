import sys
import re

with open('apps/web/app/(staff)/actions/command-center.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r\"await NotificationService\.queueMessage\(\{\s*channel: 'WHATSAPP',\s*recipient: 'CUSTOMER_PHONE', // Requires fetching phone, but for proof we just pass placeholder\s*messageTemplateId: 'ORDER_READY',\s*messageBody: \Your order \$\{orderId\} is READY for dispatch\.\,\s*\}\);\",
    r\"await notifyOrderReady('CUSTOMER_PHONE', orderId);\",
    content
)

content = re.sub(
    r\"await NotificationService\.queueMessage\(\{\s*channel: 'WHATSAPP',\s*recipient: 'CUSTOMER_PHONE',\s*messageTemplateId: 'ORDER_DISPATCHED',\s*messageBody: \Your order \$\{orderId\} has been DISPATCHED via \$\{courierName\}\. Tracking: \$\{trackingId\}\,\s*\}\);\",
    r\"await notifyOrderDispatched('CUSTOMER_PHONE', orderId, courierName, trackingId);\",
    content
)

content = re.sub(
    r\"await NotificationService\.queueMessage\(\{\s*channel: 'WHATSAPP',\s*recipient: 'CUSTOMER_PHONE',\s*messageTemplateId: 'PAYMENT_RECEIVED',\s*messageBody: \Payment of \$\{amount\} received for order \$\{orderId\}\.\,\s*\}\);\",
    r\"await notifyPaymentReceived('CUSTOMER_PHONE', orderId, amount);\",
    content
)

with open('apps/web/app/(staff)/actions/command-center.ts', 'w', encoding='utf-8') as f:
    f.write(content)

