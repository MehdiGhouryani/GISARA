// Unit-style check of the expiry sweeper against the real db module (disposable dev DB).
// Run: rm -f server/data/db.json && npx tsx scripts/test-order-expiry.ts
import { initDb, db } from '../server/db';
import { expireStaleOrders } from '../server/orderLifecycle';

initDb();
const product: any = db.products[0];
const before = product.stock;
let failures = 0;
const check = (name: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; };

product.stock -= 3;
const stale: any = {
  id: 'order-test-expired', orderNumber: 'T-1', status: 'PENDING_PAYMENT',
  items: [{ type: 'PHYSICAL_PRODUCT', productId: product.id, quantity: 3, priceToman: 1, title: 't', id: 'l', image: '' }],
  paymentExpiresAt: new Date(Date.now() - 1000).toISOString(),
};
const fresh: any = { ...stale, id: 'order-test-fresh', paymentExpiresAt: new Date(Date.now() + 600000).toISOString() };
const paid: any = { ...stale, id: 'order-test-paid', status: 'PAID' };
db.orders = [stale, fresh, paid, ...db.orders];
db.paymentIntents = [{ id: 'pi-x', orderId: stale.id, amountToman: 1, provider: 'simulated', providerAuthority: 'A', status: 'PENDING', createdAt: '', expiresAt: '' }, ...db.paymentIntents];

const n = expireStaleOrders();
check('exactly one order expired', n === 1);
check('stale order marked EXPIRED', (db.orders.find((o: any) => o.id === stale.id) as any).status === 'EXPIRED');
check('unexpired pending order untouched', (db.orders.find((o: any) => o.id === fresh.id) as any).status === 'PENDING_PAYMENT');
check('paid order never expired', (db.orders.find((o: any) => o.id === paid.id) as any).status === 'PAID');
check('reserved stock returned', product.stock === before);
check('pending payment intent closed', db.paymentIntents.find((p: any) => p.id === 'pi-x')!.status === 'EXPIRED');
expireStaleOrders();
check('second sweep does not double-restore', product.stock === before);
process.exit(failures ? 1 : 0);
