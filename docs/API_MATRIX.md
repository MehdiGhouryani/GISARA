# GISARA — API Matrix

Generated from `server/api.ts` route definitions. Global middleware on every `/api` request: request timeout, JSON body parse, security headers, global XSS sanitizer, parameter-pollution guard, CSRF origin guard (mutating methods), cookie-session parser.

| Method | Path | Access | Rate limit | Validated by | Line | Notes |
|---|---|---|---|---|---|---|
| GET | `/api/health` | public | - | - | 83 |  |
| POST | `/api/auth/otp/request` | public | otpLimiter | - | 96 |  |
| POST | `/api/auth/otp/verify` | public | otpVerifyLimiter | - | 124 |  |
| POST | `/api/auth/admin/login` | public | loginLimiter | - | 157 |  |
| GET | `/api/auth/me` | public | - | - | 184 | reads cookie session |
| POST | `/api/auth/logout` | public | - | - | 196 | clears cookie |
| GET | `/api/cart` | public | - | - | 213 | guests get []; only signed-in carts persisted |
| POST | `/api/cart/sync` | public | - | - | 220 | guests echoed, not stored; max 100 lines |
| GET | `/api/styles` | public | - | - | 236 |  |
| GET | `/api/styles/:id` | public | - | - | 245 |  |
| POST | `/api/styles` | admin | writeLimiter | styleCreateSchema | 257 |  |
| PUT | `/api/styles/:id` | admin | writeLimiter | styleUpdateSchema | 285 |  |
| DELETE | `/api/styles/:id` | admin | - | - | 308 |  |
| GET | `/api/products` | public | - | - | 325 |  |
| GET | `/api/products/:id` | public | - | - | 334 |  |
| POST | `/api/products` | admin | writeLimiter | productCreateSchema | 342 |  |
| PUT | `/api/products/:id` | admin | writeLimiter | productUpdateSchema | 372 |  |
| DELETE | `/api/products/:id` | admin | - | - | 395 |  |
| GET | `/api/orders` | user | - | - | 411 | admins see all orders; users only their own (checked: filtered by userMobile) |
| POST | `/api/orders` | user | writeLimiter | - | 421 | server-priced from db.products/db.courses; two-pass all-or-nothing stock reservation |
| PUT | `/api/orders/:id/status` | admin | - | - | 552 |  |
| GET | `/api/requests` | admin | - | - | 626 |  |
| GET | `/api/workshops/requests` | admin | - | - | 627 |  |
| POST | `/api/requests` | public | writeLimiter | workshopRequestSchema | 629 | public form; writeLimiter only |
| POST | `/api/workshops/request` | public | writeLimiter | workshopRequestSchema | 630 | alias of /api/requests |
| GET | `/api/courses` | public | - | - | 635 |  |
| GET | `/api/me/enrollments` | user | - | - | 646 |  |
| GET | `/api/courses/:courseId/lessons/:lessonId` | public | - | - | 652 |  |
| POST | `/api/courses` | admin | writeLimiter | courseCreateSchema | 673 |  |
| PUT | `/api/courses/:id` | admin | writeLimiter | courseUpdateSchema | 700 |  |
| DELETE | `/api/courses/:id` | admin | - | - | 723 | blocked (409) if any PAID/COMPLETED order references the course; archive instead |
| GET | `/api/sessions` | public | - | - | 744 |  |
| GET | `/api/articles` | public | - | - | 748 |  |
| GET | `/api/techniques` | public | - | - | 757 |  |
| GET | `/api/coupons/validate/:code` | public | couponLimiter | - | 768 |  |
| GET | `/api/coupons` | admin | - | - | 781 |  |
| POST | `/api/coupons` | admin | writeLimiter | couponCreateSchema | 785 |  |
| PUT | `/api/coupons/:id` | admin | writeLimiter | couponUpdateSchema | 808 |  |
| DELETE | `/api/coupons/:id` | admin | - | - | 827 |  |
| GET | `/api/certificates/validate/:code` | public | - | - | 840 |  |
| POST | `/api/certificates` | admin | writeLimiter | certificateCreateSchema | 848 |  |
| POST | `/api/ai/consultation` | public | aiLimiter | aiConsultationSchema | 876 | external LLM cost; falls back to rule-engine/no key |
| GET | `/api/admin/db/export` | admin | - | - | 937 | excludes otps/paymentIntents |
| POST | `/api/admin/db/import` | admin | writeLimiter | - | 958 | validated all-or-nothing (dbImport.ts); pre-import snapshot taken |
| GET | `/api/admin/audit-logs` | admin | - | - | 1000 |  |
| GET | `/api/admin/logs` | admin | - | - | 1001 |  |
| GET | `/api/admin/analytics` | admin | - | - | 1003 |  |
| GET | `/api/admin/metrics` | admin | - | - | 1032 |  |
| GET | `/api/admin/settings` | admin | - | - | 1067 |  |
| POST | `/api/admin/settings` | admin | writeLimiter | settingsUpdateSchema | 1077 |  |
| POST | `/api/payments/request` | user | writeLimiter | - | 1113 |  |
| GET | `/api/payments/verify` | public | - | - | 1192 | bank callback: bound to stored PaymentIntent, idempotent (no session required by design) |
| POST | `/api/upload` | admin | writeLimiter | - | 1307 |  |
| GET | `/api/admin/media` | admin | - | - | 1371 |  |
| DELETE | `/api/admin/media/:filename` | admin | - | - | 1399 |  |

Total endpoints: 55.

Endpoints with real schema validation (`server/validation.ts`, zod): products, styles, courses, coupons, certificates, admin/settings create/update.
Endpoints with hand-written validation: orders (server-side pricing + stock reservation), db/import (`server/dbImport.ts`, all-or-nothing + prototype-pollution guard), auth (mobile/passcode format checks).
Every public write endpoint is now schema-validated. Body limit: 100KB default; `/api/upload` 14MB; `/api/admin/db/import` 10MB.
