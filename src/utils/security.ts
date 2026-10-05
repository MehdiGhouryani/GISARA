/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * security - Application Security & Input Sanitization Utilities
 */

/**
 * Strips dangerous HTML tags and script patterns to prevent DOM-based XSS
 * when text is displayed or reflected in the application.
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // strip literal angle brackets
    .replace(/javascript:/gi, '') // strip javascript: protocol
    .replace(/on\w+=/gi, '') // strip event handler attributes
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates Iranian mobile numbers (09xx xxx xxxx or +989xx xxx xxxx)
 */
export function validateIranMobile(mobile: string): boolean {
  if (!mobile) return false;
  const cleaned = mobile.trim().replace(/^(\+98|0098)/, '0');
  return /^09[0-9]{9}$/.test(cleaned);
}

/**
 * Validates 10-digit Iranian postal code
 */
export function validatePostalCode(code: string): boolean {
  if (!code) return false;
  const cleaned = code.trim().replace(/\D/g, '');
  return /^[0-9]{10}$/.test(cleaned);
}

/**
 * Rate Limiter for sensitive actions (e.g. Admin PIN attempts)
 * Keeps track of failed attempts and locks out brute-force attacks.
 */
const ADMIN_LOCKOUT_KEY = 'gisara_admin_lockout_v1';
const ADMIN_ATTEMPTS_KEY = 'gisara_admin_attempts_v1';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes lockout

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

export function checkAdminLockout(): LockoutStatus {
  try {
    const lockoutUntil = parseInt(sessionStorage.getItem(ADMIN_LOCKOUT_KEY) || '0', 10);
    const now = Date.now();

    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
    }

    // Reset if lockout period passed
    if (lockoutUntil !== 0 && lockoutUntil <= now) {
      sessionStorage.removeItem(ADMIN_LOCKOUT_KEY);
      sessionStorage.removeItem(ADMIN_ATTEMPTS_KEY);
    }

    const currentAttempts = parseInt(sessionStorage.getItem(ADMIN_ATTEMPTS_KEY) || '0', 10);
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - currentAttempts);

    return { isLocked: false, remainingSeconds: 0, attemptsLeft };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }
}

export function recordFailedAdminAttempt(): LockoutStatus {
  try {
    const current = parseInt(sessionStorage.getItem(ADMIN_ATTEMPTS_KEY) || '0', 10) + 1;
    sessionStorage.setItem(ADMIN_ATTEMPTS_KEY, current.toString());

    if (current >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      sessionStorage.setItem(ADMIN_LOCKOUT_KEY, lockoutUntil.toString());
      return { isLocked: true, remainingSeconds: 180, attemptsLeft: 0 };
    }

    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - current };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: 3 };
  }
}

export function resetAdminAttempts(): void {
  try {
    sessionStorage.removeItem(ADMIN_ATTEMPTS_KEY);
    sessionStorage.removeItem(ADMIN_LOCKOUT_KEY);
  } catch {
    // ignore
  }
}

// NOTE: the admin passcode is verified server-side only (server/auth.ts). Never ship it in the client bundle.
export const ADMIN_SESSION_KEY = 'gisara_admin_session_auth';

export function isUserAdminAuthenticated(): boolean {
  try {
    const sessionToken = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionToken) return false;
    // Simple integrity verification
    return sessionToken.startsWith('auth_gisara_admin_');
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(): void {
  try {
    sessionStorage.setItem(
      ADMIN_SESSION_KEY,
      `auth_gisara_admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
  } catch {
    // ignore
  }
}

export function clearAdminAuthentication(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}
