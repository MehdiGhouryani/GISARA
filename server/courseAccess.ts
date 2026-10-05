import { db } from './db';

/**
 * Course entitlement is DERIVED from orders, never stored separately and never
 * supplied by the client. Deriving it means it cannot drift from the money:
 *  - PAID / COMPLETED order containing the course  -> access
 *  - REFUND_PENDING / REFUNDED / anything unpaid   -> no access (refund revokes)
 */
const ENTITLING_STATUSES = new Set(['PAID', 'COMPLETED']);

export function getEntitledCourseIds(mobile: string | undefined): string[] {
  if (!mobile) return [];
  const ids = new Set<string>();
  
  // 1. Scan paid orders
  for (const order of db.orders as any[]) {
    if (order.userMobile !== mobile) continue;
    if (!ENTITLING_STATUSES.has(order.status)) continue;
    for (const item of order.items || []) {
      if (item.type === 'ONLINE_COURSE' && item.courseId) ids.add(item.courseId);
    }
  }

  // 2. Scan manual overrides (enrollment/revocation)
  const manualList = db.manualEnrollments || [];
  for (const en of manualList) {
    if (en.userMobile === mobile) {
      if (en.status === 'ACTIVE') {
        ids.add(en.courseId);
      } else if (en.status === 'REVOKED') {
        ids.delete(en.courseId); // Revocation takes absolute priority
      }
    }
  }

  return [...ids];
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
