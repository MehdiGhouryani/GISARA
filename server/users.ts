import { db } from './db';
import { newId, newUserCode } from './ids';

export type UserRecord = (typeof db.users)[number];

const defaultName = (mobile: string) => `کاربر ${mobile.slice(-4)}`;

export function findUserByMobile(mobile: string): UserRecord | undefined {
  return db.users.find((u) => u.mobile === mobile);
}

export function findUserByCode(code: string): UserRecord | undefined {
  const wanted = String(code || '').trim().toUpperCase();
  return db.users.find((u) => u.userCode === wanted);
}

/** Returns the account for a verified mobile, creating it (with a fresh unique user code) on first login. */
export function getOrCreateUser(mobile: string, touchLogin = false): UserRecord {
  const existing = findUserByMobile(mobile);
  if (existing) {
    if (touchLogin) {
      existing.lastLoginAt = new Date().toISOString();
      db.users = [...db.users];
    }
    return existing;
  }
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: newId('user'),
    userCode: newUserCode(db.users.map((u) => u.userCode)),
    mobile,
    name: defaultName(mobile),
    createdAt: now,
    lastLoginAt: now,
  };
  db.users = [...db.users, user];
  return user;
}

export function updateUserProfile(mobile: string, patch: { name?: string; avatar?: string | null }): UserRecord | undefined {
  const user = findUserByMobile(mobile);
  if (!user) return undefined;
  if (typeof patch.name === 'string') user.name = patch.name;
  if (patch.avatar !== undefined) {
    if (patch.avatar) user.avatar = patch.avatar;
    else delete user.avatar;
  }
  db.users = [...db.users];
  return user;
}

/**
 * Customers who ordered / enrolled / requested a workshop before accounts were stored get a record
 * (and therefore a searchable user code) the first time the admin looks users up. Idempotent.
 */
export function backfillUsersFromActivity(): number {
  const mobiles = new Set<string>();
  for (const o of db.orders as any[]) if (o.userMobile) mobiles.add(o.userMobile);
  for (const e of db.manualEnrollments as any[]) if (e.userMobile) mobiles.add(e.userMobile);
  let added = 0;
  for (const m of mobiles) {
    if (!/^09\d{9}$/.test(m)) continue;
    if (!findUserByMobile(m)) {
      getOrCreateUser(m);
      added++;
    }
  }
  return added;
}
