/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * safeStorage - Resilient and Tamper-Proof Local/Session Storage Utility
 * Prevents unhandled JSON.parse SyntaxErrors and browser QuotaExceededError crashes.
 */

/**
 * Safely parses and retrieves JSON data from localStorage.
 * If data is corrupted, missing, or altered maliciously, returns the fallback safely
 * and cleans up corrupted entries to prevent persistent white-screen crashes.
 */
export function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (error) {
    console.warn(`[Security & Storage] Detected invalid or corrupted JSON for key "${key}". Reverting to safe fallback.`, error);
    // Self-healing: remove corrupt key to avoid repeated parse errors
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return fallback;
  }
}

/**
 * Safely stores JSON data into localStorage with quota exhaustion protection.
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[Security & Storage] Failed to write key "${key}" to localStorage (QuotaExceeded or disabled).`, error);
    return false;
  }
}

/**
 * Safely retrieves string from sessionStorage
 */
export function safeGetSession(key: string, fallback = ''): string {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return fallback;
  }
  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely sets string in sessionStorage
 */
export function safeSetSession(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false;
  }
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely removes item from sessionStorage
 */
export function safeRemoveSession(key: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Removes keys from localStorage, ignoring storage errors (private mode, disabled storage). */
export function safeRemoveKeys(keys: string[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
