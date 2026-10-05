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

/**
 * Checks if a coupon is expired compared to the current Jalali date
 * @param expiresAtJalali Date in format YYYY/MM/DD
 * @returns true if expired
 */
export function isJalaliExpired(expiresAtJalali?: string): boolean {
  if (!expiresAtJalali) return false;
  const today = getTodayJalaliString();
  // Lexicographical string comparison works perfectly for fixed-format YYYY/MM/DD strings
  return today > expiresAtJalali;
}
