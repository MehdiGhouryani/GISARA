/**
 * Single source of truth for order totals. Imported by BOTH the server
 * (authoritative price at order creation) and the client (display), so the
 * number the customer sees is always the number that will be charged.
 */
export const SHIPPING_FLAT_TOMAN = 45_000;
/** Free shipping when the physical-goods subtotal reaches this amount. */
export const FREE_SHIPPING_THRESHOLD_TOMAN = 2_000_000;

export interface PricedLine {
  type: 'PHYSICAL_PRODUCT' | 'ONLINE_COURSE';
  priceToman: number;
  quantity: number;
}

export interface CouponTerms {
  discountPercent: number;
  maxDiscountToman?: number | null;
}

export interface OrderTotals {
  subtotalToman: number;
  physicalSubtotalToman: number;
  hasPhysical: boolean;
  discountToman: number;
  shippingToman: number;
  payableToman: number;
}

export function computeShipping(physicalSubtotalToman: number, hasPhysical: boolean): number {
  if (!hasPhysical) return 0;
  return physicalSubtotalToman >= FREE_SHIPPING_THRESHOLD_TOMAN ? 0 : SHIPPING_FLAT_TOMAN;
}

export function computeDiscount(subtotalToman: number, coupon?: CouponTerms | null): number {
  if (!coupon) return 0;
  const raw = Math.round((subtotalToman * coupon.discountPercent) / 100);
  const cap = coupon.maxDiscountToman && coupon.maxDiscountToman > 0 ? coupon.maxDiscountToman : Infinity;
  return Math.max(0, Math.min(raw, cap, subtotalToman));
}

export function computeTotals(lines: PricedLine[], coupon?: CouponTerms | null): OrderTotals {
  let subtotal = 0;
  let physical = 0;
  let hasPhysical = false;
  for (const l of lines) {
    const amount = l.priceToman * l.quantity;
    subtotal += amount;
    if (l.type === 'PHYSICAL_PRODUCT') {
      physical += amount;
      hasPhysical = true;
    }
  }
  const discountToman = computeDiscount(subtotal, coupon);
  const shippingToman = computeShipping(physical, hasPhysical);
  return {
    subtotalToman: subtotal,
    physicalSubtotalToman: physical,
    hasPhysical,
    discountToman,
    shippingToman,
    payableToman: Math.max(0, subtotal - discountToman + shippingToman),
  };
}
