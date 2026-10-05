import { OrderStatus } from '../src/types/domain';

/**
 * Order status state machine.
 *
 *   PENDING_PAYMENT --(payment verified, SYSTEM only)--> PAID
 *   PENDING_PAYMENT --(payment declined, SYSTEM only)--> PAYMENT_FAILED
 *   PENDING_PAYMENT --(admin or system expiry)--------> EXPIRED
 *   PENDING_PAYMENT --(admin or user cancel)----------> CANCELLED
 *   PAID            --(admin, fulfillment complete)---> COMPLETED
 *   PAID            --(admin, starts a refund)--------> REFUND_PENDING
 *   REFUND_PENDING  --(admin, refund completed)-------> REFUNDED
 *
 * PENDING_PAYMENT -> PAID and PENDING_PAYMENT -> PAYMENT_FAILED may ONLY be
 * performed by the SYSTEM actor (i.e. the verified payment-gateway callback
 * in server/api.ts /payments/verify). No admin endpoint may set an order to
 * PAID directly — that would defeat the entire point of payment verification
 * (this is explicit in the master plan's P0.3).
 */

export type OrderActor = 'SYSTEM' | 'ADMIN';

const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderStatus, OrderActor[]>>> = {
  PENDING_PAYMENT: {
    PAID: ['SYSTEM'],
    PAYMENT_FAILED: ['SYSTEM'],
    EXPIRED: ['SYSTEM', 'ADMIN'],
    CANCELLED: ['ADMIN']
  },
  PAID: {
    COMPLETED: ['ADMIN'],
    REFUND_PENDING: ['ADMIN']
  },
  PAYMENT_FAILED: {
    // A failed payment attempt can be retried, which re-opens a fresh
    // payment window on the same order rather than creating a new order.
    PENDING_PAYMENT: ['SYSTEM', 'ADMIN'],
    EXPIRED: ['SYSTEM', 'ADMIN'],
    CANCELLED: ['ADMIN']
  },
  REFUND_PENDING: {
    REFUNDED: ['ADMIN']
  },
  EXPIRED: {},
  CANCELLED: {},
  COMPLETED: {},
  REFUNDED: {}
};

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks whether `from -> to` is a legal transition for the given actor.
 * Does not mutate anything — callers apply the change themselves once
 * `allowed` is true, so this stays a pure decision function.
 */
export function checkOrderTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): TransitionResult {
  if (from === to) {
    return { allowed: false, reason: 'وضعیت سفارش از قبل همین مقدار است.' };
  }
  const edge = TRANSITIONS[from]?.[to];
  if (!edge) {
    return { allowed: false, reason: `تغییر وضعیت از ${from} به ${to} مجاز نیست.` };
  }
  if (!edge.includes(actor)) {
    return { allowed: false, reason: `این تغییر وضعیت فقط توسط ${edge.join('/')} قابل انجام است، نه ${actor}.` };
  }
  return { allowed: true };
}
