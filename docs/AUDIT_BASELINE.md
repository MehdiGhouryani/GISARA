# GISARA — Audit Baseline

**Generated:** 2026-09-27
**Source:** cross-checked against actual snapshot source, not assumed from docs/README.
**Scope of this pass:** Phase 0 (inventory + baseline) and a first slice of P0 (security) fixes.
This is one phase of the Master Plan (`GISARA_AUDIT_IMPLEMENTATION_MASTER_PLAN.md`), not the
full 115-section plan — see `KNOWN_LIMITATIONS.md`-style note at the bottom.

---

## 0) Toolchain baseline

| Check | Command | Result |
|---|---|---|
| Install | `npm install` | **FAIL** with default resolver — see Finding T1 |
| Install | `npm install --legacy-peer-deps` | PASS (503 packages) |
| Typecheck | `npm run lint` (`tsc --noEmit`) | **PASS**, clean |
| Build | `npm run build` (`vite build`) | **PASS**, 1729 modules, `dist/` produced |
| Tests | — | **No test framework or test files exist in the repo.** |
| Dev boot | `npx tsx server.ts` | PASS, `/api/health` responds |
| Prod boot (no secrets) | `NODE_ENV=production npx tsx server.ts` | **FAIL by design after fix** — see P0.1 |

### Finding T1 — dependency resolution conflict
`package.json` pins `esbuild: ^0.25.0` (devDependency) while `vite: ^8.3.0` requires
`esbuild ^0.27.0 || ^0.28.0` as a peer. Plain `npm install` fails with `ERESOLVE`. CI/deploy
scripts that don't already pass `--legacy-peer-deps` (or an npm config equivalent) will fail
to install. **Not yet fixed** — needs a decision: bump the pinned `esbuild` devDependency to a
version vite 8 accepts, or pin `vite` back to a version compatible with esbuild 0.25.

### Finding T2 — no automated tests
Nothing in the Definition of Done ("Relevant tests pass") can be satisfied yet because no test
runner (vitest/jest/etc.) is configured and no test files exist anywhere in `src/` or `server/`.
This blocks a real "Done" status for every subsequent phase per the plan's own Rule B (no fake
completion). Recommend adding `vitest` (already Vite-native, minimal new dependency surface)
starting with the payment/order state machine once it exists, since that's the highest-risk
untested logic.

---

## 1) P0 findings — confirmed against source (not just against docs)

All five P0 items in the master plan were verified directly in the snapshot source before any
fix was written. Two additional issues were found during verification that the plan didn't
call out explicitly.

### P0.1 — Admin credential + JWT secret hardcoded — **CONFIRMED, FIXED**
- `server/auth.ts:4` — `JWT_SECRET = process.env.JWT_SECRET || 'gisara-secure-token-secret-2026-94830'`
- `server/auth.ts:5` — `DEFAULT_ADMIN_PASSCODE = 'gisara2026'`, compared with `===` (plaintext, non-constant-time)
- **Fix applied:** `JWT_SECRET` now required (≥32 chars) in production, fails fast at boot if
  missing/weak; falls back to a random ephemeral per-boot secret in dev only (logged warning).
  Admin passcode replaced with an `ADMIN_PASSWORD_HASH` env var (scrypt, salt:hash hex format),
  compared with `crypto.timingSafeEqual`; production fails fast if unset. Dev-only fallback
  passcode preserved (`gisara2026`) but unreachable in production.
  New script: `scripts/hash-admin-password.js` to generate the hash.
- **Verified:** `NODE_ENV=production npx tsx server.ts` now throws and exits immediately with a
  clear message when `JWT_SECRET`/`ADMIN_PASSWORD_HASH` are unset; dev boot still works with a
  warning; `tsc --noEmit` and `vite build` still pass after the change.
- **Decision needed from you:** scrypt (Node built-in, no new dependency) was used instead of
  bcrypt/Argon2id to avoid adding a dependency for a single credential (Rule J). If you'd rather
  standardize on Argon2id (e.g. because you'll add more password-based accounts later), say so
  and I'll switch it — logged in `AUDIT_DECISIONS.md`.

### P0.2 — OTP code returned to client — **CONFIRMED, FIXED**
- `server/api.ts:83` — response body included `code, // Demo convenience`
- `server/auth.ts:144` — `Math.random()` used to generate the code (not CSPRNG)
- `server/auth.ts:154` — raw code `console.log`'d unconditionally (leaks to server logs/log aggregators)
- Gap not mentioned by name in the plan but found during review: `POST /auth/otp/verify` had
  **no rate limiter at all** (the plan explicitly requires "verify نیز rate limit مستقل داشته باشد").
- **Fix applied:** `code` removed from the response body entirely; `crypto.randomInt(100000, 1000000)`
  replaces `Math.random()`; console logging of the raw code now gated to non-production only;
  added an independent `otpVerifyLimiter` (10 attempts / 3 min per IP) on the verify route,
  separate from the existing `otpLimiter` on the request route.
- Per-mobile lockout after 3 failed attempts already existed (`server/auth.ts` `verifyOTP`) and
  was left as-is — it was already correct.

### P0.3 — Order marked `PAID` before payment — **CONFIRMED, FIXED**
- `server/api.ts:458` (original) — `status: 'PAID' as any, // Mark as paid for simulation ease`
- **Fix applied:** orders now create as `PENDING_PAYMENT` with a 30-minute `paymentExpiresAt` window;
  `PAID` is set nowhere except the verified `/payments/verify` callback. A new state-machine module,
  `server/orderStateMachine.ts`, is the single source of truth for legal transitions and who may
  perform them (`SYSTEM` vs `ADMIN`). `PENDING_PAYMENT → PAID` is `SYSTEM`-only — the admin
  `PUT /orders/:id/status` route now rejects that transition with 409 even for an authenticated
  admin. `OrderStatus` gained `PAYMENT_FAILED`, `REFUND_PENDING`, `REFUNDED` (additive; existing
  values unchanged) so declined/refund paths have somewhere real to go instead of being folded
  into `CANCELLED`.
- **Verified end-to-end**, not just by reading code: `scripts/smoke-test-payments.sh` runs a real
  server and walks the full flow — order creation → `PENDING_PAYMENT` → payment request → gateway
  callback → `PAID` → admin `PAID→COMPLETED` (allowed) → admin `PENDING_PAYMENT→PAID` on a second
  order (rejected, 409, exact message: "این تغییر وضعیت فقط توسط SYSTEM قابل انجام است، نه ADMIN").
  Re-run after every subsequent change in this phase; results identical each time.
- Inventory is still decremented synchronously at order-creation (unchanged) — see F3 below for why
  this is safe as-is and what would break that.

### P0.4 — Payment verification has no binding/persistence — **CONFIRMED, FIXED**
- `server/payment.ts` (original) — `requestPaymentGateway()`/`verifyPaymentGateway()` were stateless;
  nothing recorded `providerAuthority`, expected `amount`, or `orderId` anywhere.
- **Fix applied:** a new `db.paymentIntents` collection (`server/db.ts`) persists one record per
  payment attempt: `orderId`, `amountToman`, `provider`, `providerAuthority`, `status`
  (`PENDING`/`SUCCEEDED`/`FAILED`/`EXPIRED`), `createdAt`, `expiresAt` (20-minute gateway window).
  `POST /payments/request` now requires auth + order ownership (previously open to any caller) and
  only allows requesting payment for a `PENDING_PAYMENT` order. `GET /payments/verify` now:
  looks up the intent by the incoming `authority`, rejects if it doesn't exist or its `orderId`
  doesn't match the query param, rejects if already processed (idempotent replay — returns the
  order's real current state instead of re-running verification), rejects if expired, and only
  then calls the (unchanged) `verifyPaymentGateway()` with the *intent's* stored amount, not
  whatever the query string implies.
- **Verified:** smoke test step 7 (wrong `orderId` against a real `authority`) is rejected before
  ever reaching gateway verification; step 9 (replaying the same successful callback) is idempotent
  — order stays `PAID` with the original `paidAt`/`paymentRefId`, not reprocessed or double-SMS'd.
- `server/payment.ts`'s actual ZarinPal HTTP-calling code was left untouched (Rule A — it looked
  correct in shape; the gap was specifically the missing binding/persistence around it).

### P0.5 — Upload endpoint had no authorization — **CONFIRMED, FIXED**
- `server/api.ts:964` (original) — `POST /upload` had **no** `requireAuth`/`requireAdmin` guard
  at all, while the sibling routes `GET /admin/media` and `DELETE /admin/media/:filename` both
  correctly required `requireAdmin`. Any unauthenticated caller could write files to the server.
- MIME validation was a regex over the client-declared `data:` URI prefix only — the client
  chooses what to claim, so this was not real validation. SVG was explicitly accepted with no
  sanitizer anywhere in the codebase (SVG can carry `<script>`/event-handler payloads).
- **Fix applied:** added `requireAdmin` to `POST /upload`. Removed SVG from the accepted type
  set (per the plan's own instruction: "SVG باید فقط در صورت sanitization معتبر... در غیر این
  صورت حذف شود" — no sanitizer exists, so it's removed rather than left exposed). Added real
  magic-byte signature checks for JPG/PNG/GIF/WEBP so the declared MIME type can't be spoofed.
- **Verified:** `tsc --noEmit` and `vite build` pass after the change; route now returns 403 via
  the existing `requireAdmin` middleware for unauthenticated requests (same behavior already
  proven correct on the sibling `/admin/media` routes).

---

## 2) Additional findings beyond the plan's named P0 list

### F1 — Auth token duplicated into `localStorage`/`sessionStorage` on the client — **FIXED**
This is explicitly one of the named Production red lines in the plan (§2: "token حساس در
localStorage/sessionStorage"), so it's flagged here even though it isn't one of the five P0
call-outs.
- `server/api.ts` `/auth/otp/verify` and `/auth/admin/login` responses already set a proper
  `HttpOnly` cookie (`server/auth.ts` `setAuthCookie`) **and** also return the same `token` in
  the JSON body.
- `src/services/apiClient.ts:94-99` — the frontend takes that token and stores it in
  `localStorage` (`setToken`), then re-attaches it as a Bearer header on every request
  (`src/services/apiClient.ts:83-90`).
- Net effect: the HttpOnly cookie protection that's already correctly implemented server-side is
  undermined, because the same credential is also sitting in `localStorage`, readable by any
  script (i.e. by any XSS).
- **FIXED (Phase 2 pass):** sessions are cookie-only. Login responses no longer contain the token; `ApiClient` no longer stores or sends it; the server ignores `Authorization: Bearer`; startup bootstraps from `/auth/me` only (client-side JWT parsing fallback removed); the legacy storage key is purged on load; a CSRF Origin/Referer guard protects mutating routes. Verified by `scripts/smoke-test-security.sh` (17/17). *(Original note follows.)* This is the client half of P1 §4.1 ("Cookie-first Authentication")
  in the master plan and needs to be done together with dropping the Bearer-header path and
  every `fetch` call site's `credentials: 'include'` — plus CSRF protection, since cookie-only
  auth needs it and Bearer-header auth didn't. Doing this half-way (e.g. just stopping the
  `token` field in the response) would silently break every logged-in session client-side without
  the corresponding frontend rework, which is why it's scoped as its own step rather than bundled
  into this P0 pass.

### F2 — Checkout fabricated a fake "paid" order on any API failure — **FIXED**
`src/pages/CheckoutPage.tsx`'s `handleSimulatePayment` had a catch-all fallback: if
`ApiClient.submitOrder()` threw for *any* reason (network blip, validation error, server down),
it fabricated a complete fake order client-side with `status: 'PAID'` and showed a screen titled
"تأییدیه قطعی سرور شاپرک" / "سفارش شما با موفقیت ثبت و پرداخت شد" ("Final Shaparak server
confirmation" / "your order was successfully registered and paid") — this is the exact "fallback
محلی که به کاربر موفقیت جعلی پرداخت/سفارش نشان دهد" red line named in §2 of the plan. Worse: this
fake order was passed to `onCompleteOrder`, which granted lifetime course access for any digital
items in the cart (see F3) — meaning a network error during checkout could grant free course
access with zero order or payment ever reaching the server.
**Fixed:** the fallback is removed entirely. A failed order-creation call now shows a real error
and lets the person retry; a created-but-payment-not-started order shows its real
(`PENDING_PAYMENT`) state with a retry-payment button, never a fabricated paid state.

### F3 — Course access was granted at order *creation*, not at payment confirmation — **FIXED**
`src/App.tsx`'s `handleCompleteOrder` (which grants lifetime course access via
`setEnrolledCourseIds`) was invoked directly from `CheckoutPage` immediately after
`POST /orders` succeeded — i.e. before the payment gateway redirect even happened, let alone
before payment was confirmed. Combined with F2, this meant access could be granted with no
payment at all. **Fixed:** `onCompleteOrder`/`handleCompleteOrder` is no longer called from
checkout. It's now called only from the `?paymentStatus=success` redirect handler in `App.tsx`,
which fetches the order fresh from the server and applies it — so access is only ever granted
from a server-confirmed order. `handleCompleteOrder` was also made idempotent (guards against
being applied twice) and its redundant client-side stock decrement was removed, since stock is
already reserved server-side at order creation and the client's product list is refreshed from
the server separately.

### F4 — Admin "update order status" never called the backend at all — **FIXED**
While wiring P0.3's state-machine enforcement through to the admin UI, `src/App.tsx`'s
`handleUpdateOrderStatus` turned out to be pure client-side state mutation: it updated local
React state and showed a hardcoded "وضعیت سفارش ذخیره شد" (status saved) success toast, but never
called `ApiClient.updateOrderStatus` — which existed in `apiClient.ts` but had zero callers
anywhere in the codebase. Every admin order-status/tracking-code edit was being silently
discarded on page refresh, and the admin was told it succeeded either way. This also meant the
new P0.3 server-side whitelist would have been completely bypassed from the UI, since the UI
never reached the server to begin with. **Fixed:** `handleUpdateOrderStatus` now calls
`ApiClient.updateOrderStatus`, awaits the result, and only updates local state / shows success on
a real success; on rejection (e.g. an admin trying to set `PAID` directly) it shows the server's
real error and reverts the status dropdown. `OrdersManager.tsx`'s save button and status dropdown
were updated to match (removed `PAID` as a selectable option, added `REFUND_PENDING`/`REFUNDED`,
added a save-in-progress/error state).


### F6 — Admin login modal displayed the default passcode to every visitor — **FIXED**
`AdminAuthGuardModal.tsx` rendered "کلید پیش‌فرض دمو: gisara2026" under the passcode field, and `src/utils/security.ts` shipped `DEFAULT_ADMIN_PASSCODE` in the client bundle — undoing the P0.1 fix in practice. Both removed; `grep gisara2026 dist/` now returns nothing.

### F7 — Rate limiters shared a single counter — **FIXED**
`createRateLimiter` used one module-level `Map` keyed only by IP, so the OTP, OTP-verify, admin-login and write limiters all incremented the same entry, and whichever limiter touched an IP first fixed the window/limit for all of them (e.g. normal write traffic could lock a user out of login). It also fell back to the spoofable `X-Forwarded-For` header. Each limiter now owns its store, prunes expired entries, sets `Retry-After`, and only honours proxy headers when `TRUST_PROXY` is configured.

### F8 — Guest carts shared one server-side bucket — **FIXED**
`/cart` and `/cart/sync` keyed carts by `req.user?.mobile || 'guest'`, so every anonymous visitor read and overwrote the same cart. Guest carts are no longer stored server-side (they remain in the visitor's browser); signed-in carts persist per user, capped at 100 lines.

### F9 — Unthrottled cost/enumeration endpoints — **FIXED**
`POST /ai/consultation` (external LLM quota) and `GET /coupons/validate/:code` (code enumeration) had no limiter; both now do. Malformed (non-string) `mobile`/`code`/`passcode` bodies now return 400 instead of throwing.

### F10 — Server-authoritative pricing confirmed (positive finding)
The payments smoke test submits a client-declared price of 1,000 Toman for a product; the created order is priced at the server's 420,000 Toman. Client prices are ignored, as required.

### F11 — Order creation trusted quantities and could partially reserve stock — **FIXED**
`POST /orders` never validated `quantity`: `-5` passed the stock check (`stock < -5` is false), produced a negative subtotal and *increased* stock. A failure on a later line returned 400 after earlier lines were already decremented (permanent stock leak), and repeating a product across lines bypassed the stock check. Now: integer quantity 1–20, ≤50 lines, demand aggregated per product, everything validated before any mutation, titles/prices taken from server data. Covered by `scripts/smoke-test-orders.sh` (18 checks).

### F12 — Online-course orders could not be created server-side — **FIXED**
The order route only resolved `productId`; a course line (`type: ONLINE_COURSE`, `courseId`) always returned "product not found". The client's fake-success fallback (F2) had been masking this, so removing the fallback would have turned a hidden defect into a visible broken checkout. Course lines are now priced from `db.courses` (PUBLISHED only, quantity 1).

### F13 — Reserved stock was never released — **FIXED**
Because P0.3 made orders start unpaid, abandoned checkouts would have locked stock forever. `server/orderLifecycle.ts` returns reserved stock (idempotently, via `stockReleased`) on admin cancel, expiry at the payment callback, and a 60-second sweeper that expires unpaid orders past `paymentExpiresAt` and closes their pending payment intents. A declined payment can be retried while the original window is open.

### F5 — Course access has no server-side enforcement at all — **FIXED**
`enrolledCourseIds` lived only in `localStorage` (and defaulted to `['course-1']`, so every browser got that course free); nothing in `server/` checked entitlement. Anyone could grant themselves any paid course from devtools.
**Investigation result:** there is currently *no real lesson media* in the data — no lesson has a `videoUrl`, and `LearnPlayerPage` is a simulated player. So today's exposure was the entitlement decision itself, plus a latent leak: `GET /courses` returned whole course objects, so any `videoUrl` an admin later added would have been public.
**Fix:**
- Entitlement is *derived*, not stored: a course is accessible iff the user has a `PAID`/`COMPLETED` order containing it (`server/courseAccess.ts`). `REFUND_PENDING`/`REFUNDED` revoke it, matching the agreed "refund revokes access" rule, and it cannot drift from payment state.
- `GET /me/enrollments` (auth) is the client's only source of enrollment; browser storage is no longer read or written for it (legacy key purged).
- `GET /courses/:courseId/lessons/:lessonId` returns the lesson (incl. media URL) only for free-preview lessons, entitled users, or admins: 401 anonymous / 403 not purchased / 404 unknown.
- Public `GET /courses` strips `videoUrl` from non-preview lessons.
- Client: learn route shows a "purchase required" screen without entitlement (UX only; the server is the authority); entitlements load after session bootstrap, OTP login, and payment confirmation, and clear on logout.
**Verified:** `scripts/test-course-access.ts` (13 checks) and `scripts/smoke-test-course-access.sh` (15 checks, through the real order → payment → PAID → refund flow, including a second user who gets no access).
**Not solved (R-29):** no protected media pipeline exists yet; when video is added, short-lived signed URLs should be minted from the gated lesson endpoint.

### F14 — Production CSP allowed `unsafe-inline`/`unsafe-eval` — **FIXED**
Same permissive policy (needed for Vite's dev HMR) was served in every environment. Production now gets a strict policy (`script-src 'self'` only — no inline script, no eval; `object-src 'none'`; `frame-ancestors 'self'` plus an optional `CSP_FRAME_ANCESTORS` allow-list); development keeps the permissive one, clearly commented as dev-only. Also added in production: `Strict-Transport-Security` and a restrictive `Permissions-Policy`. Verified against a real `NODE_ENV=production` server, not just by reading the header string (`npm run test:prod`).

### F15 — `/admin/db/import` had no validation; `/admin/db/export` leaked OTPs/payment intents — **FIXED**
Import applied whatever JSON the client sent, collection by collection, with no schema check — malformed data, negative prices, `__proto__` keys, or a failure partway through could corrupt the live DB with no way back. `server/dbImport.ts` validates the *entire* payload (types, ranges, referential shape, duplicate ids, nesting/size limits, prototype-pollution keys) before anything is written; a single invalid item rejects the whole import (all-or-nothing) and a full pre-import snapshot is taken first regardless. Export no longer includes `otps` or `paymentIntents`. 19 unit checks (`scripts/test-db-import.ts`) plus a real round-trip through a running server (`scripts/smoke-test-hardening.sh`) confirm: rejection changes nothing, a real export restores cleanly, and unsupported collections are reported as ignored rather than silently dropped.

### F16 — Simulated payment/SMS were reachable in production by default — **FIXED**
Both `requestPaymentGateway`/`verifyPaymentGateway` (any authority auto-approved) and `sendSMS` (OTP echoed back as the response message) fall back to a "simulated" path whenever no real provider is configured — which is the *default* state, not an edge case. Nothing prevented that default from shipping to production: an unconfigured production deploy would auto-approve any payment and hand out login codes in the response. Both now fail closed (503, no code/URL) when `NODE_ENV=production` and no real provider is set; a boot-time warning names the missing env var. Verified with `NODE_ENV=production` against the real functions and a real running server, not by reading the code (`npm run test:prod`, 6 + 4 checks).

### F17 — Payment idempotency check trusted order status alone, not which intent won — **FOUND AND FIXED IN THIS PASS**
While rewriting `scripts/smoke-test-payments.sh` into a real asserting test (it previously only printed output — R-28/R-33), a genuine bug surfaced: replaying an old **declined** payment authority for an order that was later paid through a *different* (retry) authority was reported as a successful replay, because the idempotency branch only checked `order.status === 'PAID'`, not whether this specific intent was the one that succeeded. Fixed by recording the winning intent's own id on the order (`order.paymentIntentId`) and checking that on replay. This is exactly the kind of bug an assert-based test catches and a "run it and eyeball the output" test does not — recorded here as a concrete argument for closing R-28/T2 properly rather than leaving smoke tests non-asserting.

## 3) Findings confirmed in passing (not yet actioned)

- `server/security.ts:93` — CSP includes `'unsafe-inline' 'unsafe-eval'`, exactly the
  "CSP بیش از حد permissive" red line in §2 of the plan.
- `server/security.ts:102-137` — `globalXssSanitizerMiddleware` strips `<`/`>`/`javascript:`/
  `on*=` globally as the primary input defense, which is the "sanitizer سراسری به‌عنوان جایگزین
  validation" red line — it's a blunt instrument, not schema validation.
- `src/App.tsx` — `products`, `orders`, `users`/session-derived state, `coupons`, etc. are all
  read from and written to `localStorage` as the client's working state (`STORAGE_KEYS.*`
  throughout), consistent with the plan's "localStorage به‌عنوان منبع حقیقت" concern. The backend
  has its own JSON DB (`server/db.ts`) — these two sources of truth are not obviously reconciled
  yet; needs its own investigation pass before touching it (Rule A: no speculative rewrites).

---

## 4) What this phase did and did not do

**Done, with evidence:**
- P0.1, P0.2, P0.5 (previous pass) and P0.3, P0.4 (this pass) implemented and verified —
  `tsc --noEmit` clean, `vite build` clean, and for P0.3/P0.4 specifically, a real running-server
  end-to-end test (`scripts/smoke-test-payments.sh`) covering the full order→payment→admin flow,
  including the two negative cases that matter most (wrong authority/order binding rejected;
  admin cannot directly set `PAID`).
- F2, F3, F4 (fake checkout success, premature course access, dead admin-status-update code) —
  all found while implementing P0.3/P0.4, all fixed and covered by the same smoke test / a
  rebuilt frontend.

**Confirmed but intentionally not touched:** F5 (course access has no server-side enforcement at all — needs its
own investigation into how course video content is served before a fix can be designed), T1
(esbuild/vite dependency conflict — needs a version decision from you), T2 (still no automated
test framework — `scripts/smoke-test-payments.sh` is a manual/scripted smoke test, not a
substitute).

This master plan spans security, commerce logic, frontend architecture, SEO/AEO/GEO, accessibility,
performance, and operations — 115 sections. Claiming all of that "done" in one pass would violate
the plan's own Rule B (no fake completion) and Definition of Done (§104), so this baseline reflects
real, evidence-backed phases rather than a first sweep pretending to be the whole thing.

### F18 — Coupon `discountPercent` was unbounded (real money bug) — **FIXED**
Nothing checked that a coupon's `discountPercent` stayed within 0–100 at creation. An admin typo or a corrupted `/admin/db/import` payload above 100% would produce a negative order subtotal, silently clamped to a free order by `Math.max(0, ...)` rather than rejected anywhere. Now bounded by `couponCreateSchema`/`couponUpdateSchema` (zod).

### F19 — Coupon `minOrderToman`/`usageLimit`/`isActive` were declared but never enforced — **FIXED**
`minOrderToman` existed on the type and was shown in the UI but never checked against the actual cart total; there was no usage-cap field at all; `usageCount` was incremented on every order creation regardless of whether the order was ever paid, and never decremented if the order was cancelled or expired (R-27). Fixed: `POST /orders` now rejects a coupon below its minimum order value or past its `usageLimit` (added additively to the `Coupon` type) with a clear message instead of silently granting or silently ignoring it; `server/orderLifecycle.ts`'s new `releaseCouponUsage` rolls the count back (idempotently, mirroring the existing stock-release pattern) everywhere an order is cancelled or expires. `expiresAtJalali` remains unenforced — see the note in Decisions (D12) on why.

### F20 — No admin API existed to create or edit courses at all (R-29) — **FIXED (backend only)**
There was no `POST`/`PUT`/`DELETE /courses` route whatsoever — only reads. Added, using the same lesson/module shape the entitlement system (`courseAccess.ts`) already expects, with `videoUrl` restricted to `https://` or an internal `/uploads/` path (same rule used in `dbImport.ts`, now centralized in `server/validation.ts`). Deleting a course is blocked (409) if any `PAID`/`COMPLETED` order references it — archiving (`status: 'ARCHIVED'`) is offered instead, consistent with how products/styles are usually retired. **Not fixed:** there is still no admin UI page for authoring a course, and no real video hosting/delivery pipeline — R-29 stays open for those two pieces.

### F21 — `PUT /products/:id` / `PUT /styles/:id` couldn't edit most fields — **FIXED**
Both endpoints only accepted a hardcoded subset of fields; anything else sent in the request body (e.g. a product's `summary`, `description`, `images`, `specifications`, `sku`) was silently dropped, meaning those fields were only ever settable once, at creation. Rewritten as a validated merge-patch (via the new zod `...UpdateSchema`s) so every creatable field is also editable.

### F22 — Every catalogue/commerce write route hand-rolled its own validation — **FIXED (R-18, partial)**
Products, styles, coupons, and certificates each used ad-hoc `Number(x) || fallback` coercions with no bounds checking (`NaN`, `Infinity`, and negative numbers all passed through silently) and no format checks on URLs or phone numbers — the actual substance of R-18 ("global sanitizer used instead of schema validation"), even though a couple of individual routes (orders, db-import) already had bespoke validation from earlier phases. Added `server/validation.ts`: shared zod schemas plus a `validateBody` middleware, applied to every product/style/course/coupon/certificate/admin-settings write route. Text fields are XSS-sanitized as part of schema parsing (composing with the existing `sanitizeInput`, not replacing the global middleware, which stays as defense-in-depth). **Not converted in this pass:** `/requests` (workshop intake) and `/ai/consultation` still rely on the global sanitizer only — lower risk (no money/stock/access implications) but still technically part of R-18's original scope; noted as the remainder of that item.

### F23 — Server robustness gaps — **FIXED**
- **Body size:** one global 10MB JSON limit applied to every endpoint. Now 100KB by default, with larger limits mounted first only on `/api/upload` and `/api/admin/db/import`.
- **Error handling:** the global handler echoed `err.message` for 5xx responses and mapped body-parser errors (oversized / malformed JSON) to 500. Server errors are now always generic; client-caused parser errors return 413/400 with clear messages and no parser internals.
- **Shutdown & crash safety:** no `SIGTERM`/`SIGINT` handler existed, so a restart could lose the last debounced write; no `unhandledRejection`/`uncaughtException` handling either. Added graceful shutdown with a synchronous atomic flush, process-level handlers (uncaught exception flushes then exits so the supervisor restarts a clean process), and cleanup of orphaned `.tmp` files after failed writes. (DB writes were already atomic temp-file + rename — confirmed, left as is.)
- **Unknown API paths** now return a JSON 404 instead of the SPA HTML shell.

### F24 — Public intake endpoints were unbounded — **FIXED**
`POST /requests` (unauthenticated) accepted arbitrary lengths, any string as a mobile number or enum value, any `participantCount`, and grew `db.requests` without limit. Now schema-validated, with a 10-minute duplicate guard and a row cap. `/ai/consultation` fields (interpolated into an LLM prompt) are capped at 60 characters each. This completes the R-18 conversion for every public write endpoint.

### F25 — Still open in the backend (found, deliberately not built)
- **R-44** articles / techniques / sessions have no write API at all (seed data only).
- **R-45** workshop requests can be created and listed but not updated — there is no route for an admin to change a request's status or attach a proposal, so that part of the admin UI is client-state only (same pattern as the old F4 order-status bug). Both need a product decision before building.

## 5) Verification commands (all currently green)

| Command | What it proves | Result |
|---|---|---|
| `npm run lint` | typecheck | pass |
| `npm run build` | production bundle; `grep gisara2026 dist/` = 0 files | pass |
| `npm run test:security` | cookie-only auth, no token/OTP leakage, CSRF guard, guest-cart isolation, upload auth, independent limiters | 17/17 |
| `npm run test:orders` | quantity validation, all-or-nothing reservation, course pricing, stock release on cancel | 18/18 |
| `npm run test:expiry` | sweeper expires only stale unpaid orders, restores stock once | 7/7 |
| `npm run test:course-access` | entitlement derived from PAID orders; refund revokes; lesson endpoint 401/403/200; paid media stripped from public catalogue | 28/28 |
| `npm run test:validation` | zod schema bounds/format checks (price, stock, coupon %, URLs, mobile numbers) | 31/31 |
| `npm run test:crud` | products/styles/coupons/courses CRUD, authz, coupon financial integrity + rollback, course-delete protection | 28/28 |
| `npm run test:server` | body limits, error handling, JSON 404, request intake validation/dedupe, AI input caps, graceful shutdown flush | 21/21 |
| `npm run test:import` | DB import validation: types, ranges, prototype pollution, size limits, all-or-nothing | 19/19 |
| `npm run test:prod` | production fail-closed (payment/SMS), CSP headers, prod admin login, DB import round-trip | 23/23 |
| `npm test` | full chain, all suites above | **179/179** |
| `npm run test:payments` (standalone) | order → payment → callback → PAID; admin cannot force PAID; replay idempotent | **26/26 — now a real asserting suite, see F17**. |

## 6) Phase status against the master plan (§103)
- **Phase 0** — `AUDIT_BASELINE.md`, `API_MATRIX.md`, `RISK_REGISTER.md` done. **`ROUTE_MATRIX.md` (frontend routes) and `DATA_FLOW.md` are still outstanding.**
- **Phase 2 (security)** — cookie-first auth, CSRF, OTP/admin/upload hardening, limiters, authorization checks done. **Phase 2 (security) gate: met.** Every P0 item is closed, plus R-17 (CSP), R-19 (import validation/export redaction), and R-31 (simulated payment/SMS reachable in production) — the last of these was found only while closing this gate, not part of the original list. Remaining Phase 2 items are P1/P2 housekeeping (R-16 dual client/server state, R-22 client-side admin UI flag, R-23 no encryption at rest, R-30 lesson progress in localStorage) rather than gate blockers.
- **Phase 3 (commerce)** — order/payment state machine, payment binding, idempotency, stock safety done; coupon safety (R-27) and refund path open.
- Phases 1, 4–7 and later: not started (schema validation, DB strategy, frontend architecture, SEO/AEO/GEO, performance, PWA).

