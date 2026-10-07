import { db } from './db';

/** Stock level at or below which a product is flagged "low". Override with LOW_STOCK_THRESHOLD. */
export const LOW_STOCK_THRESHOLD = Math.max(0, Number(process.env.LOW_STOCK_THRESHOLD) || 15);

const SOLD = new Set(['PAID', 'COMPLETED']);

/**
 * One definition of every dashboard number. Both /admin/analytics and /admin/metrics read from here, so the
 * two screens can no longer disagree (one used to count PAID only, the other PAID + COMPLETED).
 * Revenue is NET of refunds: refunded and refund-pending orders are not counted as sales.
 */
export function computeKpis() {
  const orders = db.orders as any[];
  const sold = orders.filter((o) => SOLD.has(o.status));
  const sum = (list: any[]) => list.reduce((acc, o) => acc + (o.payableToman || 0), 0);

  return {
    paidOrdersCount: sold.length,
    pendingOrdersCount: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
    netRevenueToman: sum(sold),
    pendingRefundToman: sum(orders.filter((o) => o.status === 'REFUND_PENDING')),
    refundedToman: sum(orders.filter((o) => o.status === 'REFUNDED')),
    openRequestsCount: db.requests.filter((r: any) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
    totalRequestsCount: db.requests.length,
    lowStockCount: db.products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    productsCount: db.products.length,
    activeStylesCount: db.styles.filter((s) => s.status !== 'ARCHIVED').length,
    totalArticlesCount: db.articles.length,
  };
}
