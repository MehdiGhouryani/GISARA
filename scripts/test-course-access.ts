// Pure-function checks for course entitlement + catalogue sanitising.
// Run: rm -f server/data/db.json && npx tsx scripts/test-course-access.ts
import { initDb, db } from '../server/db';
import { getEntitledCourseIds, hasCourseAccess, toPublicCourse } from '../server/courseAccess';

initDb();
let failures = 0;
const check = (n: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); if (!ok) failures++; };
const line = (courseId: string) => ({ type: 'ONLINE_COURSE', courseId, quantity: 1 });
const order = (id: string, mobile: string, status: string, items: any[]) => ({ id, userMobile: mobile, status, items });

db.orders = [
  order('o1', '0912A', 'PAID', [line('c-paid')]),
  order('o2', '0912A', 'COMPLETED', [line('c-done')]),
  order('o3', '0912A', 'PENDING_PAYMENT', [line('c-pending')]),
  order('o4', '0912A', 'PAYMENT_FAILED', [line('c-failed')]),
  order('o5', '0912A', 'REFUND_PENDING', [line('c-refunding')]),
  order('o6', '0912A', 'REFUNDED', [line('c-refunded')]),
  order('o7', '0912A', 'CANCELLED', [line('c-cancelled')]),
  order('o8', '0912B', 'PAID', [line('c-other-user')]),
  order('o9', '0912A', 'PAID', [{ type: 'PHYSICAL_PRODUCT', productId: 'p1', quantity: 1 }]),
] as any;

const ids = getEntitledCourseIds('0912A').sort();
check('PAID + COMPLETED grant access', ids.includes('c-paid') && ids.includes('c-done'));
check('unpaid / failed / cancelled grant nothing', !['c-pending', 'c-failed', 'c-cancelled'].some(c => ids.includes(c)));
check('refund pending/refunded revokes access', !ids.includes('c-refunding') && !ids.includes('c-refunded'));
check("another user's purchase is not mine", !ids.includes('c-other-user'));
check('physical products never create course access', ids.length === 2);
check('no mobile => no access', getEntitledCourseIds(undefined).length === 0);
check('hasCourseAccess true for owner', hasCourseAccess({ mobile: '0912A', role: 'USER' }, 'c-paid'));
check('hasCourseAccess false for non-owner', !hasCourseAccess({ mobile: '0912B', role: 'USER' }, 'c-paid'));
check('admin has access to any course', hasCourseAccess({ mobile: '0900', role: 'ADMIN' }, 'c-paid'));
check('anonymous has no access', !hasCourseAccess(undefined, 'c-paid'));

const pub = toPublicCourse({ id: 'x', modules: [{ id: 'm', lessons: [
  { id: 'l1', isPreview: true, videoUrl: 'https://cdn/preview.mp4' },
  { id: 'l2', isPreview: false, videoUrl: 'https://cdn/SECRET.mp4' },
] }] });
check('preview lesson keeps its videoUrl', pub.modules[0].lessons[0].videoUrl === 'https://cdn/preview.mp4');
check('paid lesson videoUrl stripped from public catalogue', !('videoUrl' in pub.modules[0].lessons[1]));
check('paid lesson metadata preserved', pub.modules[0].lessons[1].id === 'l2');
process.exit(failures ? 1 : 0);
