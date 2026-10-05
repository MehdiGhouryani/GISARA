import { useMemo } from 'react';
import { CartItem, Coupon } from '../types/domain';
import { computeTotals, FREE_SHIPPING_THRESHOLD_TOMAN, OrderTotals } from '../shared/pricing';

export interface CartTotals extends OrderTotals {
  /** Toman still missing for free shipping; 0 when already free or when nothing is shipped. */
  remainingForFreeShippingToman: number;
}

/**
 * The ONLY place the client computes order totals. It delegates to the same module the server uses
 * (src/shared/pricing.ts), so the displayed amount always equals the charged amount.
 */
export function useCartTotals(items: CartItem[], coupon?: Coupon | null): CartTotals {
  return useMemo(() => {
    const totals = computeTotals(items, coupon || null);
    const remaining =
      totals.hasPhysical && totals.physicalSubtotalToman < FREE_SHIPPING_THRESHOLD_TOMAN
        ? FREE_SHIPPING_THRESHOLD_TOMAN - totals.physicalSubtotalToman
        : 0;
    return { ...totals, remainingForFreeShippingToman: remaining };
  }, [items, coupon]);
}
