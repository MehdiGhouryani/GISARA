// Unit checks for the shared pricing + digit helpers (used by BOTH server and client).
// Run: npx tsx scripts/test-pricing.ts
import { computeTotals, computeShipping, computeDiscount, SHIPPING_FLAT_TOMAN, FREE_SHIPPING_THRESHOLD_TOMAN } from '../src/shared/pricing';
import { toLatinDigits, normalizeMobile, normalizePostalCode, normalizeCode } from '../src/shared/digits';
import { isJalaliExpired } from '../server/jalali';

let failures = 0;
const check = (name: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; };

const phys = (p: number, q = 1) => ({ type: 'PHYSICAL_PRODUCT' as const, priceToman: p, quantity: q });
const course = (p: number) => ({ type: 'ONLINE_COURSE' as const, priceToman: p, quantity: 1 });

check('threshold is 2,000,000', FREE_SHIPPING_THRESHOLD_TOMAN === 2_000_000);
check('digital-only cart never pays shipping', computeTotals([course(500_000)]).shippingToman === 0);
check('physical under threshold pays flat shipping', computeTotals([phys(420_000)]).shippingToman === SHIPPING_FLAT_TOMAN);
check('physical at threshold ships free', computeShipping(2_000_000, true) === 0);
check('physical just below threshold pays', computeShipping(1_999_999, true) === SHIPPING_FLAT_TOMAN);
check('1.26M physical still pays shipping (old rule gave 0)', computeTotals([phys(420_000, 3)]).shippingToman === SHIPPING_FLAT_TOMAN);
check('free-shipping uses PHYSICAL subtotal only (course does not unlock it)', computeTotals([phys(100_000), course(5_000_000)]).shippingToman === SHIPPING_FLAT_TOMAN);
check('coupon percent', computeDiscount(1_000_000, { discountPercent: 20 }) === 200_000);
check('coupon cap respected', computeDiscount(5_000_000, { discountPercent: 20, maxDiscountToman: 400_000 }) === 400_000);
check('discount never exceeds subtotal', computeDiscount(1000, { discountPercent: 100, maxDiscountToman: 999_999 }) === 1000);
check('payable = subtotal - discount + shipping', computeTotals([phys(1_000_000)], { discountPercent: 10 }).payableToman === 1_000_000 - 100_000 + SHIPPING_FLAT_TOMAN);
check('payable never negative', computeTotals([course(0)], { discountPercent: 50 }).payableToman === 0);

check('persian digits -> latin', toLatinDigits('۰۹۱۲۳۴۵۶۷۸۹') === '09123456789');
check('arabic-indic digits -> latin', toLatinDigits('٠٩١٢') === '0912');
check('mobile with persian digits accepted', normalizeMobile('۰۹۱۲۱۲۳۴۵۶۷') === '09121234567');
check('mobile +98 form accepted', normalizeMobile('+989121234567') === '09121234567');
check('mobile 9xxxxxxxxx form accepted', normalizeMobile('9121234567') === '09121234567');
check('landline rejected', normalizeMobile('02112345678') === '');
check('garbage mobile rejected', normalizeMobile('abc') === '');
check('postal code 10 digits (persian)', normalizePostalCode('۱۹۳۴۸۱۲۳۴۵') === '1934812345');
check('postal code wrong length rejected', normalizePostalCode('12345') === '');
check('coupon code normalised', normalizeCode(' shanyoon۲۰ ') === 'SHANYOON20');

// Jalali expiry: legacy seed format must now work too (it used to never expire).
check('YYYY/MM/DD in the past is expired', isJalaliExpired('1400/01/01') === true);
check('YYYY/MM/DD in the far future is not expired', isJalaliExpired('1499/12/29') === false);
check('persian-digit date in the past is expired', isJalaliExpired('۱۴۰۰/۰۱/۰۱') === true);
check('legacy "۳۰ اسفند ۱۳۹۰" text date in the past is expired', isJalaliExpired('۳۰ اسفند ۱۳۹۰') === true);
check('legacy "۳۰ اسفند ۱۴۹۰" text date in the future is not expired', isJalaliExpired('۳۰ اسفند ۱۴۹۰') === false);
check('missing date = no expiry', isJalaliExpired(undefined) === false);

process.exit(failures ? 1 : 0);
