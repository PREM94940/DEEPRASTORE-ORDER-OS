import { db } from './packages/infrastructure/src/db/client';
import { orders } from './packages/infrastructure/src/schema/order';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the environment variables to connect to Supabase
dotenv.config({ path: path.join(__dirname, 'apps/admin-portal/.env') });

const tenantId = '11111111-1111-1111-1111-111111111111';

async function createTestOrder() {
  try {
    const id = uuidv4();
    await db.insert(orders).values({
      id,
      tenantId,
      customerId: null,
      customerName: 'Test Pilot User',
      customerPhone: '9999999999',
      source: 'STOREFRONT_TEST',
      orderType: 'READY',
      paymentMethod: 'CASH',
      status: 'PENDING',
      totalAmount: '1999.00',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3), // 3 days
    });
    
    console.log('Order created successfully:', id);
  } catch (error) {
    console.error('Error creating order:', error);
  }
}

createTestOrder().then(() => process.exit(0));
