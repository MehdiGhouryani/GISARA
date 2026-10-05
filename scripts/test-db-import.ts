// Validation checks for the admin DB import. Run: npx tsx scripts/test-db-import.ts
import { validateImport } from '../server/dbImport';

let failures = 0;
const check = (n: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); if (!ok) failures++; };
const product = (o: any = {}) => ({ id: 'p1', name: 'x', priceToman: 1000, stock: 3, ...o });
const order = (o: any = {}) => ({ id: 'o1', status: 'PAID', payableToman: 10, items: [], ...o });

check('valid minimal payload accepted', validateImport({ products: [product()] }).ok);
check('non-object rejected', !validateImport('nope').ok && !validateImport(null).ok && !validateImport([]).ok);
check('empty object (nothing to restore) rejected', !validateImport({}).ok);
check('unknown collections reported as ignored, not applied', (() => { const r = validateImport({ products: [product()], coupons: [{ id: 'c' }] }); return r.ok && r.ignored.includes('coupons') && !(r.data as any)['coupons']; })());
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
