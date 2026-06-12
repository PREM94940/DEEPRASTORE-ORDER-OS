export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If the number starts with the India country code 91 and has 12 digits, strip the 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  }
  
  // Return the last 10 digits as the canonical format
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  
  return digits;
}
