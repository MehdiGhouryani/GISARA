import { db } from './db';
import { serverCache } from './cache';

/**
 * Returns a used coupon's usageCount for an order that will never complete
 * (cancelled/expired before payment). Idempotent via `couponRolledBack`, mirroring
 * `stockReleased`. Missing/deleted coupons are skipped gracefully.
 */
export function releaseCouponUsage(order: any): boolean {
  if (!order || order.couponRolledBack || !order.couponApplied) return false;
  const wanted = String(order.couponApplied).trim().toLowerCase();
  const coupon = db.coupons.find(c => String(c.code).trim().toLowerCase() === wanted);
  if (coupon && coupon.usageCount > 0) {
    coupon.usageCount--;
    db.coupons = [...db.coupons];
  }
  order.couponRolledBack = true;
  return true;
}

/**
 * Gives reserved physical stock back to inventory for an order that will never
 * be fulfilled (expired / cancelled before payment). Idempotent: the
 * `stockReleased` flag guarantees a reservation is returned at most once, even if
 * the sweeper, the payment callback and an admin action all race to expire it.
 * Synchronous on purpose (no await) so it stays atomic in the event loop.
 */
export function releaseReservedStock(order: any): boolean {
  if (!order || order.stockReleased) return false;

  let touchedProducts = false;
  for (const item of order.items || []) {
    if (item.type === 'PHYSICAL_PRODUCT' && item.productId) {
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        product.stock += Number(item.quantity) || 0;
        touchedProducts = true;
      }
    }
  }
  order.stockReleased = true;

  if (touchedProducts) {
    db.products = [...db.products];
    serverCache.invalidate('products');
  }
  return true;
}

/**
 * Expires unpaid orders whose payment window has closed, returns their stock and
 * closes any still-pending payment intents. Returns how many orders were expired.
 */
export function expireStaleOrders(now: number = Date.now()): number {
  let expired = 0;

  for (const order of db.orders as any[]) {
    const unpaid = order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_FAILED';
    if (!unpaid || !order.paymentExpiresAt) continue;
    if (Date.parse(order.paymentExpiresAt) >= now) continue;

    // A customer who is at the gateway (or whose payment is being verified right now) must not
    // have the order expired underneath them: the money would be taken for an order that no
    // longer exists. The intent's own 20-minute window bounds how long this can last.
    const hasLiveIntent = (db.paymentIntents as any[]).some(
      (pi) => pi.orderId === order.id && (pi.status === 'VERIFYING' || (pi.status === 'PENDING' && Date.parse(pi.expiresAt) > now))
    );
    if (hasLiveIntent) continue;

    order.status = 'EXPIRED';
    if (!order.systemLogs) order.systemLogs = [];
    order.systemLogs.push('مهلت پرداخت به پایان رسید؛ سفارش منقضی و موجودی رزرو‌شده آزاد شد.');
    releaseReservedStock(order);
    releaseCouponUsage(order);

    for (const intent of db.paymentIntents) {
      if (intent.orderId === order.id && intent.status === 'PENDING') {
        intent.status = 'EXPIRED';
      }
    }
    expired++;
  }

  if (expired > 0) {
    db.orders = [...db.orders];
    db.paymentIntents = [...db.paymentIntents];
  }
  return expired;
}
