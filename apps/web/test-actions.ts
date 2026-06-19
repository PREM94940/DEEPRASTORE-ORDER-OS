import { approvePaymentAction } from './app/(staff)/actions/payments';
import { updateEnquiryStatusAction } from './app/(staff)/actions/order-desk';
import { getCustomerProfileAction } from './app/(staff)/actions/customer';

async function testActions() {
  console.log("Testing approvePaymentAction...");
  try {
    await approvePaymentAction('order-123', 'pay-123', 'Staff01');
    console.log("❌ approvePaymentAction SUCCEEDED (VULNERABILITY)");
  } catch (error: any) {
    console.log(`✅ approvePaymentAction BLOCKED: ${error.message}`);
  }

  console.log("Testing updateEnquiryStatusAction...");
  try {
    await updateEnquiryStatusAction('enq-123', 'APPROVED');
    console.log("❌ updateEnquiryStatusAction SUCCEEDED (VULNERABILITY)");
  } catch (error: any) {
    console.log(`✅ updateEnquiryStatusAction BLOCKED: ${error.message}`);
  }

  console.log("Testing getCustomerProfileAction...");
  try {
    const res = await getCustomerProfileAction('1234567890');
    if (res.success === false && res.error?.includes('Unauthorized')) {
       console.log(`✅ getCustomerProfileAction BLOCKED: ${res.error}`);
    } else {
       console.log("❌ getCustomerProfileAction SUCCEEDED (VULNERABILITY)", res);
    }
  } catch (error: any) {
    console.log(`✅ getCustomerProfileAction BLOCKED: ${error.message}`);
  }
}

testActions();
