// Validation checks for the admin DB import. Run: npx tsx scripts/test-db-import.ts
import { validateImport } from '../server/dbImport';

let failures = 0;
const check = (n: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); if (!ok) failures++; };
const product = (o: any = {}) => ({ id: 'p1', name: 'x', priceToman: 1000, stock: 3, ...o });
const order = (o: any = {}) => ({ id: 'o1', status: 'PAID', payableToman: 10, items: [], ...o });

check('valid minimal payload accepted', validateImport({ products: [product()] }).ok);
check('non-object rejected', !validateImport('nope').ok && !validateImport(null).ok && !validateImport([]).ok);
check('empty object (nothing to restore) rejected', !validateImport({}).ok);
check('unknown collections reported as ignored, not applied', (() => { const r = validateImport({ products: [product()], somethingElse: [{ id: 'x' }], settings: { payment: { merchantId: 'secret' } } }); return r.ok && r.ignored.includes('somethingElse') && r.ignored.includes('settings') && !(r.data as any)['settings']; })());
check('coupons are now restorable when valid', (() => { const r = validateImport({ coupons: [{ id: 'c1', code: 'WELCOME', discountPercent: 10 }] }); return r.ok && r.counts.coupons === 1; })());
check('a malformed coupon rejects the whole import', !validateImport({ products: [product()], coupons: [{ id: 'c' }] }).ok);
check('payment intents and manual enrollments are restorable', (() => { const r = validateImport({ paymentIntents: [{ id: 'pi1', orderId: 'o1', providerAuthority: 'A', amountToman: 1000 }], manualEnrollments: [{ id: 'm1', userMobile: '09120000000', courseId: 'c', status: 'ACTIVE' }] }); return r.ok && r.counts.paymentIntents === 1 && r.counts.manualEnrollments === 1; })());
check('a user with a bad mobile is rejected', !validateImport({ users: [{ id: 'u', mobile: '123', userCode: 'U-ABCDEFGH' }] }).ok);
check('collection must be an array', !validateImport({ products: { id: 'p1' } }).ok);
check('negative price rejected', !validateImport({ products: [product({ priceToman: -1 })] }).ok);
check('NaN/Infinity price rejected', !validateImport({ products: [product({ priceToman: Infinity })] }).ok && !validateImport({ products: [product({ priceToman: NaN })] }).ok);
check('fractional or negative stock rejected', !validateImport({ products: [product({ stock: 1.5 })] }).ok && !validateImport({ products: [product({ stock: -2 })] }).ok);
check('missing id rejected', !validateImport({ products: [{ name: 'x', priceToman: 1, stock: 1 }] }).ok);
check('duplicate ids rejected', !validateImport({ products: [product(), product()] }).ok);
check('invalid order status rejected', !validateImport({ orders: [order({ status: 'HACKED' })] }).ok);
check('valid order accepted', validateImport({ orders: [order()] }).ok);
check('course needs modules array', !validateImport({ courses: [{ id: 'c1', name: 'n', priceToman: 1 }] }).ok);
check('course lesson videoUrl must be https/internal', !validateImport({ courses: [{ id: 'c1', name: 'n', priceToman: 1, modules: [{ lessons: [{ id: 'l', videoUrl: 'javascript:alert(1)' }] }] }] }).ok);
check('course lesson https videoUrl accepted', validateImport({ courses: [{ id: 'c1', name: 'n', priceToman: 1, modules: [{ lessons: [{ id: 'l', videoUrl: 'https://cdn.example/v.mp4' }] }] }] }).ok);
check('__proto__ key rejected (prototype pollution)', !validateImport(JSON.parse('{"products":[{"id":"p","name":"x","priceToman":1,"stock":1,"__proto__":{"admin":true}}]}')).ok);
check('excessive nesting rejected', (() => { let o: any = {}; const root: any = { products: [product({ meta: o })] }; for (let i = 0; i < 20; i++) { o.n = {}; o = o.n; } return !validateImport(root).ok; })());
check('too many items rejected', !validateImport({ products: Array.from({ length: 5001 }, (_, i) => product({ id: 'p' + i })) }).ok);
check('one bad item rejects the whole payload (all-or-nothing)', !validateImport({ products: [product()], orders: [order({ status: 'X' })] }).ok);
process.exit(failures ? 1 : 0);
