import { db } from '@deeprastore/infrastructure';
import { 
  orders, 
  orderLineItems, 
  enquiries, 
  enquiryQuotes, 
  enquiryComments, 
  payments, 
  measurementsHistory, 
  customerAddresses,
  customers,
  auditLogs,
  notificationQueue
} from '@deeprastore/infrastructure/src/schema';
import { sql } from 'drizzle-orm';

async function runCleanup() {
  console.log('Starting Pilot Database Cleanup...');
  
  try {
    // We will clear all operational tables.
    // Drizzle ORM delete without where clause deletes all rows.
    
    console.log('Deleting Enquiry Comments...');
    await db.delete(enquiryComments);

    console.log('Deleting Enquiry Quotes...');
    await db.delete(enquiryQuotes);

    console.log('Deleting Enquiries...');
    await db.delete(enquiries);

    console.log('Deleting Order Line Items...');
    await db.delete(orderLineItems);

    console.log('Deleting Payments...');
    await db.delete(payments);

    console.log('Deleting Orders...');
    await db.delete(orders);

    console.log('Deleting Measurements History...');
    await db.delete(measurementsHistory);

    console.log('Deleting Customer Addresses...');
    await db.delete(customerAddresses);
    
    console.log('Deleting Notifications...');
    await db.delete(notificationQueue);
    
    console.log('Deleting Customers...');
    await db.delete(customers);

    console.log('✅ Pilot Cleanup Complete! The database is now ready for production operations.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

runCleanup();
