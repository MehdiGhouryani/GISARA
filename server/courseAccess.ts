import { db } from './db';

/**
 * Course entitlement is DERIVED from orders, never stored separately and never
 * supplied by the client. Deriving it means it cannot drift from the money:
 *  - PAID / COMPLETED order containing the course  -> access
 *  - REFUND_PENDING / REFUNDED / anything unpaid   -> no access (refund revokes)
 */
const ENTITLING_STATUSES = new Set(['PAID', 'COMPLETED']);

const toMs = (iso?: string): number => {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? t : NaN;
};

/**
 * Access is decided by a TIMELINE per course, not by "revocation always wins":
 *   latest grant (paid order or manual grant)  vs  latest manual revocation.
 * A student whose access was revoked and who then buys the course again gets access again, because the new
 * purchase is later than the revocation. A revocation without a usable timestamp stays absolute (fail closed).
 */
export function getEntitledCourseIds(mobile: string | undefined): string[] {
  if (!mobile) return [];
  const lastGrant = new Map<string, number>();
  const lastRevoke = new Map<string, number>();
  const bump = (m: Map<string, number>, id: string, t: number) => m.set(id, Math.max(m.get(id) ?? -Infinity, t));

  // 1. Paid orders grant access at the time of payment.
  for (const order of db.orders as any[]) {
    if (order.userMobile !== mobile) continue;
    if (!ENTITLING_STATUSES.has(order.status)) continue;
    const at = toMs(order.paidAt) || toMs(order.createdAt) || 1;
    for (const item of order.items || []) {
      if (item.type === 'ONLINE_COURSE' && item.courseId) bump(lastGrant, item.courseId, at);
    }
  }

  // 2. Manual overrides by an administrator.
  for (const en of (db.manualEnrollments || []) as any[]) {
    if (en.userMobile !== mobile) continue;
    if (en.status === 'ACTIVE') {
      bump(lastGrant, en.courseId, toMs(en.grantedAt) || 1);
    } else if (en.status === 'REVOKED') {
      const at = toMs(en.revokedAt) || toMs(en.grantedAt);
      bump(lastRevoke, en.courseId, Number.isFinite(at) ? at : Infinity);
    }
  }

  const ids: string[] = [];
  for (const [courseId, grantAt] of lastGrant) {
    if (grantAt > (lastRevoke.get(courseId) ?? -Infinity)) ids.push(courseId);
  }
  return ids;
}

export function hasCourseAccess(user: { mobile?: string; role?: string } | undefined, courseId: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return getEntitledCourseIds(user.mobile).includes(courseId);
}

/** Public catalogue view: lesson media URLs are only exposed for free-preview lessons. */
export function toPublicCourse(course: any): any {
  return {
    ...course,
    modules: (course.modules || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).map((l: any) => {
        if (l.isPreview) return l;
        const { videoUrl, ...rest } = l;
        return rest;
      })
    }))
  };
}

export function findLesson(course: any, lessonId: string): any | undefined {
  for (const m of course.modules || []) {
    const l = (m.lessons || []).find((x: any) => x.id === lessonId);
    if (l) return l;
  }
  return undefined;
}
