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

// A customer at the gateway (live intent) must not have the order expired underneath them.
const base2: any = { ...stale, status: 'PENDING_PAYMENT', stockReleased: false, systemLogs: [], paymentExpiresAt: new Date(Date.now() - 1000).toISOString() };
const atGateway: any = { ...base2, id: 'order-test-gateway' };
const verifying: any = { ...base2, id: 'order-test-verifying' };
db.orders = [atGateway, verifying, ...db.orders];
db.paymentIntents = [
  { id: 'pi-live', orderId: atGateway.id, amountToman: 1, provider: 'simulated', providerAuthority: 'B', status: 'PENDING', createdAt: '', expiresAt: new Date(Date.now() + 600000).toISOString() },
  { id: 'pi-ver', orderId: verifying.id, amountToman: 1, provider: 'simulated', providerAuthority: 'C', status: 'VERIFYING', createdAt: '', expiresAt: new Date(Date.now() - 1000).toISOString() },
  ...db.paymentIntents
];
const before2 = product.stock;
expireStaleOrders();
check('order with a live gateway session is NOT expired', (db.orders.find((o: any) => o.id === atGateway.id) as any).status === 'PENDING_PAYMENT');
check('order whose payment is being verified is NOT expired', (db.orders.find((o: any) => o.id === verifying.id) as any).status === 'PENDING_PAYMENT');
check('their reserved stock is untouched', product.stock === before2);
db.paymentIntents.find((p: any) => p.id === 'pi-live')!.expiresAt = new Date(Date.now() - 1000).toISOString();
db.paymentIntents.find((p: any) => p.id === 'pi-ver')!.status = 'FAILED';
expireStaleOrders();
check('once the gateway session lapses the order is expired normally', (db.orders.find((o: any) => o.id === atGateway.id) as any).status === 'EXPIRED');
process.exit(failures ? 1 : 0);
