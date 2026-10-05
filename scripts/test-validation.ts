// Zod schema checks for server/validation.ts. Run: npx tsx scripts/test-validation.ts
import {
  productCreateSchema, styleCreateSchema, courseCreateSchema, couponCreateSchema, certificateCreateSchema
} from '../server/validation';

let failures = 0;
const check = (n: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); if (!ok) failures++; };
const ok = (s: any, v: any) => s.safeParse(v).success;

// --- products
check('valid product accepted', ok(productCreateSchema, { name: 'x', priceToman: 1000 }));
check('missing name rejected', !ok(productCreateSchema, { priceToman: 1000 }));
check('negative price rejected', !ok(productCreateSchema, { name: 'x', priceToman: -1 }));
check('NaN price rejected', !ok(productCreateSchema, { name: 'x', priceToman: NaN }));
check('Infinity price rejected', !ok(productCreateSchema, { name: 'x', priceToman: Infinity }));
check('absurdly large price rejected', !ok(productCreateSchema, { name: 'x', priceToman: 1e15 }));
check('fractional stock rejected', !ok(productCreateSchema, { name: 'x', priceToman: 1, stock: 1.5 }));
check('negative stock rejected', !ok(productCreateSchema, { name: 'x', priceToman: 1, stock: -1 }));
check('javascript: image URL rejected', !ok(productCreateSchema, { name: 'x', priceToman: 1, image: 'javascript:alert(1)' }));
check('http (non-https) image URL rejected', !ok(productCreateSchema, { name: 'x', priceToman: 1, image: 'http://evil.example/x.png' }));
check('https image URL accepted', ok(productCreateSchema, { name: 'x', priceToman: 1, image: 'https://cdn.example/x.png' }));
check('internal /uploads/ path accepted', ok(productCreateSchema, { name: 'x', priceToman: 1, image: '/uploads/x.png' }));
check('name is XSS-sanitized', (() => { const r = productCreateSchema.safeParse({ name: '<script>alert(1)</script>x', priceToman: 1 }); return r.success && !r.data.name.includes('<script>'); })());

// --- styles
check('valid style accepted', ok(styleCreateSchema, { name: 'x', slug: 'x' }));
check('style missing slug rejected', !ok(styleCreateSchema, { name: 'x' }));
check('style bad difficulty rejected', !ok(styleCreateSchema, { name: 'x', slug: 'x', difficulty: 'نامعتبر' }));
check('style approxMinutes out of range rejected', !ok(styleCreateSchema, { name: 'x', slug: 'x', approxMinutes: 10000 }));

// --- courses
const course = (extra: any = {}) => ({ name: 'c', priceToman: 1000, modules: [], ...extra });
check('valid course accepted', ok(courseCreateSchema, course()));
check('course negative price rejected', !ok(courseCreateSchema, course({ priceToman: -1 })));
check('course lesson missing id rejected', !ok(courseCreateSchema, course({ modules: [{ lessons: [{ title: 'l' }] }] })));
check('course lesson javascript: videoUrl rejected', !ok(courseCreateSchema, course({ modules: [{ lessons: [{ id: 'l1', title: 'l', videoUrl: 'javascript:alert(1)' }] }] })));
check('course lesson https videoUrl accepted', ok(courseCreateSchema, course({ modules: [{ lessons: [{ id: 'l1', title: 'l', videoUrl: 'https://cdn.example/v.mp4' }] }] })));

// --- coupons
const coupon = (extra: any = {}) => ({ code: 'SAVE10', discountPercent: 10, ...extra });
check('valid coupon accepted', ok(couponCreateSchema, coupon()));
check('coupon >100% discount rejected', !ok(couponCreateSchema, coupon({ discountPercent: 150 })));
check('coupon negative discount rejected', !ok(couponCreateSchema, coupon({ discountPercent: -5 })));
check('coupon code with spaces/symbols rejected', !ok(couponCreateSchema, coupon({ code: 'SAVE 10%!' })));
check('coupon code too short rejected', !ok(couponCreateSchema, coupon({ code: 'AB' })));
check('coupon negative minOrderToman rejected', !ok(couponCreateSchema, coupon({ minOrderToman: -1 })));
check('coupon fractional usageLimit rejected', !ok(couponCreateSchema, coupon({ usageLimit: 2.5 })));
check('coupon zero usageLimit rejected (must be >=1)', !ok(couponCreateSchema, coupon({ usageLimit: 0 })));

// --- certificates
const cert = (extra: any = {}) => ({ studentName: 'n', studentMobile: '09121234567', courseTitle: 't', ...extra });
check('valid certificate accepted', ok(certificateCreateSchema, cert()));
check('certificate bad mobile format rejected', !ok(certificateCreateSchema, cert({ studentMobile: '123' })));
check('certificate landline-looking mobile rejected', !ok(certificateCreateSchema, cert({ studentMobile: '02112345678' })));

process.exit(failures ? 1 : 0);
