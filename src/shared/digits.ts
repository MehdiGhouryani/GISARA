/**
 * Digit normalisation shared by client and server.
 * Persian (۰-۹) and Arabic-Indic (٠-٩) digits are converted to ASCII so that
 * validation, comparison and storage always see one canonical form.
 */
const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(input: unknown): string {
  return String(input ?? '').replace(/[۰-۹٠-٩]/g, (ch) => {
    const fa = FA.indexOf(ch);
    return String(fa !== -1 ? fa : AR.indexOf(ch));
  });
}

/** Keeps only digits (after converting Persian/Arabic digits). */
export function digitsOnly(input: unknown): string {
  return toLatinDigits(input).replace(/\D/g, '');
}

/** Iranian mobile: accepts 09xxxxxxxxx, 9xxxxxxxxx, +989xxxxxxxxx, 00989xxxxxxxxx. Returns '' when invalid. */
export function normalizeMobile(input: unknown): string {
  let d = digitsOnly(input);
  if (d.startsWith('0098')) d = '0' + d.slice(4);
  else if (d.startsWith('98') && d.length === 12) d = '0' + d.slice(2);
  else if (d.length === 10 && d.startsWith('9')) d = '0' + d;
  return /^09\d{9}$/.test(d) ? d : '';
}

/** Iranian postal code: exactly 10 digits. Returns '' when invalid. */
export function normalizePostalCode(input: unknown): string {
  const d = digitsOnly(input);
  return /^\d{10}$/.test(d) ? d : '';
}

/** Coupon / OTP style codes: Latin digits, trimmed, upper-cased. */
export function normalizeCode(input: unknown): string {
  return toLatinDigits(input).trim().toUpperCase();
}
