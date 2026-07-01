/**
 * TODO: TECHNICAL DEBT - REMOVE AFTER PILOT SCHEMA MIGRATION
 * 
 * This is a temporary compatibility layer. 
 * The current `enquiries` table does not have native columns for:
 * - Product Name
 * - Product Code
 * - Advance Amount
 * 
 * The customer submission form temporarily stores these fields as text lines in the `notes` column.
 * This parser safely extracts them for the Intake UI so staff do not have to manually retype them.
 * 
 * WHEN TO REMOVE:
 * Once the database schema is migrated to include `product_name`, `product_code`, and `advance_amount`,
 * delete this file and remove its usage from `unified-order-desk.tsx`.
 */

export interface ParsedEnquiryMetadata {
  productName: string;
  productCode: string;
  advanceAmount: string;
  websiteOrderId: string;
  utr: string;
  orderDate: string;
  cleanNotes: string;
}

export function parseLegacyEnquiryNotes(enquiryId: string, rawNotes: string | null): ParsedEnquiryMetadata {
  const result: ParsedEnquiryMetadata = {
    productName: '',
    productCode: '',
    advanceAmount: '',
    websiteOrderId: '',
    utr: '',
    orderDate: '',
    cleanNotes: rawNotes || ''
  };

  if (!rawNotes) {
    console.log(`[Parser Telemetry] Enquiry: ${enquiryId} | Status: Failed (No notes) | Missing: ProductName, ProductCode, AdvanceAmount`);
    return result;
  }

  const lines = rawNotes.split('\n');
  const unparsedLines: string[] = [];
  
  let foundProductName = false;
  let foundProductCode = false;
  let foundAdvance = false;

  for (const line of lines) {
    if (line.startsWith('Product Name: ')) {
      result.productName = line.replace('Product Name: ', '').trim();
      foundProductName = true;
    } else if (line.startsWith('Product Code: ')) {
      result.productCode = line.replace('Product Code: ', '').trim();
      foundProductCode = true;
    } else if (line.startsWith('Advance Amount: ₹')) {
      result.advanceAmount = line.replace('Advance Amount: ₹', '').trim();
      foundAdvance = true;
    } else if (line.startsWith('Website Order ID: ')) {
      result.websiteOrderId = line.replace('Website Order ID: ', '').trim();
    } else if (line.startsWith('Payment UTR: ')) {
      result.utr = line.replace('Payment UTR: ', '').trim();
    } else if (line.startsWith('Order Date: ')) {
      result.orderDate = line.replace('Order Date: ', '').trim();
    } else {
      unparsedLines.push(line);
    }
  }

  result.cleanNotes = unparsedLines.join('\n').trim();

  // Telemetry
  const missing = [];
  if (!foundProductName) missing.push('ProductName');
  if (!foundProductCode) missing.push('ProductCode');
  if (!foundAdvance) missing.push('AdvanceAmount');

  const status = missing.length === 0 ? 'Success' : (missing.length === 3 ? 'Failed' : 'Partial Success');
  
  console.log(`[Parser Telemetry] Enquiry: ${enquiryId} | Status: ${status} | Missing: ${missing.length > 0 ? missing.join(', ') : 'None'}`);

  return result;
}
