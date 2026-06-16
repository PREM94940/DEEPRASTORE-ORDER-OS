require('dotenv').config({ path: '.env' });
const { db } = require('@deeprastore/infrastructure/src/db/client');
const { sql } = require('drizzle-orm');
const { OrderRepository } = require('@deeprastore/infrastructure/src/repositories/OrderRepository');

async function run() {
  try {
    const firstTenant = await db.execute(sql`SELECT id FROM tenants LIMIT 1`);
    const tenantId = (firstTenant.rows?.[0])?.id || '33333333-3333-3333-3333-333333333333';
    console.log('Tenant:', tenantId);
    
    const orderRepo = new OrderRepository();
    const rawOrders = await orderRepo.getProductionQueue(tenantId);
    console.log('Raw orders length:', rawOrders.length);
    
    const orders = rawOrders.map(o => ({
      id: o.id,
      businessId: o.businessId,
      customerName: o.customerName || 'Unknown',
      customerPhone: o.customerPhone,
      dueDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().split('T')[0] : 'Not Set',
      masterJi: o.assignedStaff || 'Unassigned',
      productionStatus: o.productionStatus,
      dispatchStatus: o.dispatchStatus,
      paymentStatus: o.paymentStatus,
      photoUrl: o.primaryImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&auto=format&fit=crop&q=60',
      statusUpdatedAt: o.statusUpdatedAt ? new Date(o.statusUpdatedAt).toISOString() : new Date().toISOString()
    }));
    console.log('Orders successfully mapped:', orders.length);
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}
run();
