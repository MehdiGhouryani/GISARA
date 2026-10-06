// Course entitlement timeline + course publishing rules.   Run: npx tsx scripts/test-course-access-timeline.ts
import { db } from '../server/db';
import { getEntitledCourseIds } from '../server/courseAccess';
import { courseRuleIssues, courseCreateSchema, courseUpdateSchema } from '../server/validation';

let failures = 0;
const check = (name: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; };

const M = '09125550001';
const iso = (offsetMin: number) => new Date(Date.now() + offsetMin * 60000).toISOString();
const order = (courseId: string, paidAt: string, status = 'PAID'): any => ({
  id: `o-${Math.random()}`, orderNumber: 'GSR-1', userMobile: M, status, paidAt, createdAt: paidAt,
  items: [{ id: 'i', type: 'ONLINE_COURSE', courseId, title: 't', priceToman: 1, quantity: 1 }]
});

db.orders = [];
db.manualEnrollments = [];

db.orders = [order('c1', iso(-60))];
check('paid order grants access', getEntitledCourseIds(M).includes('c1'));

db.orders = [order('c1', iso(-60), 'PENDING_PAYMENT'), order('c2', iso(-60), 'PAYMENT_FAILED')];
check('unpaid / failed orders grant nothing', getEntitledCourseIds(M).length === 0);

db.orders = [order('c1', iso(-60))];
db.manualEnrollments = [{ id: 'e1', userMobile: M, courseId: 'c1', courseName: 'x', grantedAt: iso(-10), revokedAt: iso(-10), status: 'REVOKED' } as any];
check('revocation AFTER purchase removes access', !getEntitledCourseIds(M).includes('c1'));

db.orders = [order('c1', iso(-60)), order('c1', iso(-5))];
check('purchase AFTER revocation restores access (was the bug)', getEntitledCourseIds(M).includes('c1'));

db.orders = [order('c1', iso(-60))];
db.manualEnrollments = [{ id: 'e1', userMobile: M, courseId: 'c1', courseName: 'x', grantedAt: iso(-10), status: 'REVOKED' } as any];
check('revocation without revokedAt falls back to grantedAt time', !getEntitledCourseIds(M).includes('c1'));

db.orders = [];
db.manualEnrollments = [{ id: 'e1', userMobile: M, courseId: 'c9', courseName: 'x', grantedAt: iso(-1), status: 'ACTIVE' } as any];
check('manual ACTIVE grant gives access', getEntitledCourseIds(M).includes('c9'));
check('other user is unaffected', getEntitledCourseIds('09125550002').length === 0);

db.orders = [order('c1', iso(-60))];
db.manualEnrollments = [{ id: 'e1', userMobile: M, courseId: 'c1', courseName: 'x', grantedAt: 'garbage', status: 'REVOKED' } as any];
check('revocation with unreadable timestamp stays absolute (fail closed)', !getEntitledCourseIds(M).includes('c1'));

// Publishing rules
const lesson = (id: string) => ({ id, title: 'درس', durationMinutes: 5, isPreview: false });
check('PUBLISHED with no lessons is rejected', courseRuleIssues({ status: 'PUBLISHED', modules: [] }).length === 1);
check('PUBLISHED with a lesson is accepted', courseRuleIssues({ status: 'PUBLISHED', modules: [{ lessons: [lesson('a')] }] }).length === 0);
check('DRAFT with no lessons is accepted', courseRuleIssues({ status: 'DRAFT', modules: [] }).length === 0);
check('duplicate lesson ids are rejected', courseRuleIssues({ status: 'DRAFT', modules: [{ lessons: [lesson('a'), lesson('a')] }] }).length === 1);
const base = { name: 'دوره', priceToman: 1000, modules: [] as any[] };
check('create schema rejects an empty PUBLISHED course', !courseCreateSchema.safeParse({ ...base, status: 'PUBLISHED' }).success);
check('create schema accepts an empty DRAFT course', courseCreateSchema.safeParse({ ...base, status: 'DRAFT' }).success);
check('update schema accepts a status-only patch (merged rule is checked in the route)', courseUpdateSchema.safeParse({ status: 'PUBLISHED' }).success);

process.exit(failures ? 1 : 0);
