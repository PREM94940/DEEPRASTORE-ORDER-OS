export type FinancialStatus = 
  | 'PAID_IN_FULL' 
  | 'PARTIALLY_PAID' 
  | 'UNPAID' 
  | 'VERIFICATION_PENDING' 
  | 'REJECTED';

export interface FinancialStatusOrder {
  totalAmount?: any;
  advanceAmount?: any;
  balanceAmount?: any;
  paymentStatus?: string;
}

/**
 * Central state engine determining the derived financial status of an order.
 * Follows the approved matrix:
 * 
 * 1. paymentStatus = REJECTED ➔ REJECTED
 * 2. paymentStatus = VERIFICATION_PENDING ➔ VERIFICATION_PENDING
 * 3. paymentStatus = VERIFIED & balanceAmount = 0 ➔ PAID_IN_FULL
 * 4. paymentStatus = VERIFIED & balanceAmount > 0 ➔ PARTIALLY_PAID
 * 5. paymentStatus != VERIFIED & advanceAmount = 0 ➔ UNPAID
 */
export function getFinancialStatus(order: FinancialStatusOrder): FinancialStatus {
  const pStatus = order.paymentStatus || 'UNPAID';
  
  if (pStatus === 'REJECTED' || pStatus === 'REJECTED_PAYMENT') return 'REJECTED';
  if (pStatus === 'VERIFICATION_PENDING' || pStatus === 'PENDING') return 'VERIFICATION_PENDING';
  
  const balance = order.balanceAmount ? parseFloat(order.balanceAmount.toString()) : 0;
  
  if (pStatus === 'VERIFIED') {
    if (balance <= 0) {
      return 'PAID_IN_FULL';
    } else {
      return 'PARTIALLY_PAID';
    }
  }
  
  // Default fallback if not verified and advance is zero (or if general unpaid status)
  return 'UNPAID';
}

/**
 * Returns a user-friendly label for the computed financial status.
 */
export function getFinancialStatusLabel(status: FinancialStatus, balance?: number): string {
  switch (status) {
    case 'PAID_IN_FULL':
      return 'PAID IN FULL';
    case 'PARTIALLY_PAID':
      return balance !== undefined && balance > 0 
        ? `PARTIALLY PAID (Bal: ₹${balance.toFixed(2)})` 
        : 'PARTIALLY PAID';
    case 'VERIFICATION_PENDING':
      return 'VERIFICATION PENDING';
    case 'REJECTED':
      return 'PAYMENT REJECTED';
    case 'UNPAID':
    default:
      return 'UNPAID';
  }
}

/**
 * Returns the tailwind color classes for status badges.
 */
export function getFinancialStatusColor(status: FinancialStatus): string {
  switch (status) {
    case 'PAID_IN_FULL':
      return 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50';
    case 'PARTIALLY_PAID':
    case 'VERIFICATION_PENDING':
      return 'bg-amber-900/30 text-amber-500 border border-amber-900/50';
    case 'REJECTED':
      return 'bg-red-900/30 text-red-400 border border-red-900/50';
    case 'UNPAID':
    default:
      return 'bg-zinc-800/40 text-zinc-400 border border-zinc-700';
  }
}
