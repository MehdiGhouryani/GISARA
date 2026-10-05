/**
 * Ultra-lightweight and robust Jalali Calendar Utilities for GisAra
 * Leverages built-in high-performance Node.js Intl API
 */

export function getTodayJalaliString(): string {
  try {
    const formatted = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const match = formatted.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const [, month, day, year] = match;
      return `${year}/${month}/${day}`;
    }
  } catch (err) {
    console.error('[Jalali Utility] Failed to format via Intl:', err);
  }

  // Pure mathematical safe fallback if Intl fails or environment mismatch
  const now = new Date();
  const gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 335];
  
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let g_day_no = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  let jy = 979 + 33 * Math.floor(g_day_no / 12053) + 4 * Math.floor((g_day_no % 12053) / 1461);
  let rem = g_day_no % 12053;
  if (rem >= 1461) {
    jy += Math.floor((rem - 1) / 365);
    rem = (rem - 1) % 365;
  }
  const jm = (rem < 186) ? (1 + Math.floor(rem / 31)) : (7 + Math.floor((rem - 186) / 30));
  const jd = (rem < 186) ? (1 + (rem % 31)) : (1 + ((rem - 186) % 30));
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

import { toLatinDigits } from '../src/shared/digits';

const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/**
 * Parses a Jalali date written either as "YYYY/MM/DD" (any digit script) or in the legacy
 * human form "۳۰ اسفند ۱۴۰۵". Returns [year, month, day] or null when unrecognised.
 */
export function parseJalaliDate(input?: string): [number, number, number] | null {
  if (!input) return null;
  const t = toLatinDigits(input).replace(/[\u200c\u200f\u200e]/g, ' ').trim();

  const iso = t.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (iso) return validJalali(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const words = t.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (words) {
    const month = JALALI_MONTHS.indexOf(words[2].replace(/ي/g, 'ی').replace(/ك/g, 'ک')) + 1;
    if (month > 0) return validJalali(Number(words[3]), month, Number(words[1]));
  }
  return null;
}

function validJalali(y: number, m: number, d: number): [number, number, number] | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1300 || y > 1600) return null;
  if (m > 6 && d > 30) return null;
  return [y, m, d];
}

function cmp(a: [number, number, number], b: [number, number, number]): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/**
 * True when the coupon's last valid day is before today (Jalali). The expiry day itself is still valid.
 * No date = never expires. An unreadable date FAILS CLOSED (treated as expired) so a typo can never
 * silently give a permanent discount — which is exactly what the old string comparison did.
 */
export function isJalaliExpired(expiresAtJalali?: string): boolean {
  if (!expiresAtJalali || !String(expiresAtJalali).trim()) return false;
  const expiry = parseJalaliDate(expiresAtJalali);
  if (!expiry) {
    console.warn(`[Jalali] Unreadable coupon expiry "${expiresAtJalali}" - treating as expired.`);
    return true;
  }
  const today = parseJalaliDate(getTodayJalaliString());
  if (!today) return false;
  return cmp(today, expiry) > 0;
}
