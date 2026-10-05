# GISARA — Audit Decision Log

Format per §109 of the master plan: Decision / Reason / Alternatives / Trade-offs / Implemented
files / Validation evidence.

---

## D1 — Password hashing: scrypt instead of bcrypt/Argon2id

**Decision:** Use Node's built-in `crypto.scryptSync` for the admin passcode hash instead of
adding `bcrypt` or `argon2` as a dependency.

**Reason:** The plan's own Rule J says every added dependency needs a reason. There is currently
exactly one password-like credential in the system (the single admin passcode) — no per-user
passwords exist (users authenticate via OTP, not passwords). scrypt is a memory-hard KDF built
into Node's `crypto` module, so it meets the "no plaintext, no fast-hash" requirement in P0.1
without a new dependency.

**Alternatives considered:** `bcrypt` (native bindings can complicate some deploy targets),
`argon2` (best current default, but another native-binding dependency for a single credential).

**Trade-offs:** If GISARA later adds real per-user password accounts (not just admin), Argon2id
is the better long-term default and worth the dependency at that point. This decision should be
revisited then, not before.

**Implemented files:** `server/auth.ts` (`scryptHash`, `verifyAdminPasscode`), `scripts/hash-admin-password.js`.

**Validation evidence:** `tsc --noEmit` clean; `NODE_ENV=production npx tsx server.ts` fails
fast with a clear message when `ADMIN_PASSWORD_HASH` is unset; dev boot works with fallback
passcode `gisara2026` and a logged warning.

---

## D2 — JWT secret: fail-fast in production, ephemeral random secret in dev

**Decision:** No fixed fallback JWT secret ships in source, in dev or production. Production
throws at boot if `JWT_SECRET` is missing or under 32 characters. Development generates a fresh
random secret every process start (`crypto.randomBytes(32)`), logged as a warning.

**Reason:** Directly required by P0.1 of the master plan ("در صورت عدم وجود secret، server در
production باید Fail Fast کند"). A fixed dev fallback would still be a real (if lower-severity)
risk if anyone ever ran a "dev-configured" instance reachably, so an ephemeral per-boot secret
was chosen over a fixed dev string.

**Alternatives considered:** Fixed dev-only secret string (rejected — same class of risk as the
original hardcoded value, just relabeled "dev"); requiring `JWT_SECRET` even in dev (rejected —
adds friction to local setup for no real security benefit, since dev environments aren't the
production attack surface this fix targets).

**Trade-offs:** Every dev server restart invalidates all existing sessions/tokens. Acceptable for
local development; flagged here so it isn't mistaken for a bug later.

**Implemented files:** `server/auth.ts` (`resolveJwtSecret`).

**Validation evidence:** see D1 — same boot tests cover both.

---

## D3 — SVG removed from upload allowlist rather than sanitized

**Decision:** `POST /upload` no longer accepts `image/svg+xml` at all, instead of adding an SVG
sanitizer to allow it safely.

**Reason:** The master plan states explicitly (P0.5): "SVG باید فقط در صورت sanitization معتبر و
ضرورت واقعی اجازه داشته باشد؛ در غیر این صورت حذف شود." No SVG sanitizer exists anywhere in this
codebase, and adding one (e.g. DOMPurify-on-the-server, or a dedicated SVG-sanitization library)
is its own scoped piece of work with its own testing burden — not something to bolt on silently
while fixing an unrelated authorization gap in the same endpoint.

**Alternatives considered:** Adding a sanitizer now in the same change (rejected under Rule A —
no speculative rewrites bundled into an unrelated fix); leaving SVG in with just the new
`requireAdmin` guard (rejected — admin accounts are still a script-injection target, and "admin
only" is not the same as "safe").

**Trade-offs:** If the site actually needs SVG uploads (e.g. for icon assets), this needs to come
back as a deliberate follow-up with a real sanitizer, not be silently reintroduced.

**Implemented files:** `server/api.ts` (`IMAGE_SIGNATURES`, `/upload` route).

**Validation evidence:** `tsc --noEmit` and `vite build` clean.

---

## D4 — Order/payment status model: extend the existing types rather than replace them

**Decision:** Add `PAYMENT_FAILED`, `REFUND_PENDING`, `REFUNDED` to the existing `OrderStatus`
union in `src/types/domain.ts` rather than introducing a new status model, and reuse the
already-defined-but-unused `PaymentAttemptStatus` vocabulary as inspiration for the new
`paymentIntents.status` field.

**Reason:** `src/types/domain.ts` already declared `PaymentAttemptStatus` and `RefundStatus`
types that were never referenced anywhere in the actual implementation — the intended design was
already present, just never wired up. Extending what's there (additively — no existing value
renamed or removed) keeps the fix aligned with the codebase's own prior intent and minimizes
blast radius: `OrderStatus` is read by 9 files across frontend and backend, and every one of them
already handles unknown-to-them status values gracefully (via `!== 'X'` checks or a `default:`
branch in `StatusBadge`), so purely-additive values don't break anything that wasn't explicitly
updated.

**Alternatives considered:** A fully separate `PaymentIntent`/`Refund` entity model with its own
detailed lifecycle (closer to the master plan's abstract state diagram) — rejected for this pass
as more than the current single-admin, no-real-refund-flow system needs; revisit if/when refunds
become a real operational flow rather than an admin marking a status.

**Trade-offs:** The state machine (`server/orderStateMachine.ts`) is intentionally minimal — it
whitelists exactly the transitions this system currently needs, not a general-purpose workflow
engine. Adding a genuinely new business flow later (e.g. partial refunds, split shipments) will
mean extending the whitelist, not just the type union.

**Implemented files:** `src/types/domain.ts`, `server/orderStateMachine.ts`, `server/db.ts`
(`paymentIntents`), `server/api.ts` (orders + payments routes), `src/components/common/StatusBadge.tsx`,
`src/components/admin/OrdersManager.tsx`.

**Validation evidence:** `tsc --noEmit` clean; full end-to-end smoke test
(`scripts/smoke-test-payments.sh`) covering creation, payment binding, idempotent replay, and both
the allowed and rejected admin transitions.

---

## D5 — Inventory stays a synchronous decrement-at-order-creation "reservation"

**Decision:** Did not change how/when `product.stock` is decremented (still happens synchronously
inside `POST /orders`, before payment).

**Reason:** The master plan flags "inventory decrement بدون transaction/locking" as a red line.
On inspection, `POST /orders`' entire handler body (stock check → decrement → order write) has no
`await` anywhere in it, and Node/Express handlers for distinct requests don't interleave without a
yield point — so within this specific handler, the check-then-decrement is already atomic per
request under the current single-process, single-threaded-event-loop deployment. It is not a
Postgres-style transaction, but it is not the race condition the plan's red line describes either.
Adding the payment-intent creation as an `await`-ing step happens in a *separate* route
(`/payments/request`), not inside order creation, so this invariant isn't disturbed by this phase's
changes.

**Trade-offs:** This safety is fragile — it depends entirely on the order-creation handler staying
fully synchronous. Any future change that adds an `await` between the stock check and the
decrement (e.g. calling an external inventory service) would reintroduce a real race. Flagging
this explicitly so it isn't lost. Multi-process/multi-instance deployment would also break this
invariant (the in-memory JSON-file `db` has no cross-process locking at all) — fine for a single
Node process, not fine if this is ever horizontally scaled without moving to a real database.

**Implemented files:** none (explicitly not changed) — decision recorded so it isn't rediscovered
and "fixed" unnecessarily, or silently broken by a future change.

---

## D6 — CSRF strategy: Origin/Referer verification (not synchroniser tokens)

**Decision:** Protect cookie-authenticated mutating requests with an Origin/Referer allow-check (`csrfOriginGuard`), on top of the existing `SameSite=Lax` cookie.

**Reason:** All mutating endpoints take `application/json` and are called by this app's own same-origin frontend. Browsers always send `Origin` on cross-site POST/PUT/PATCH/DELETE, so a cross-site page cannot forge a request that passes; requests without either header are not browser-driven cross-site requests. This needs no client changes, no token plumbing, and no extra state.

**Alternatives:** double-submit cookie / synchroniser token (stronger against a compromised sibling subdomain, more moving parts); revisit if the site ever serves untrusted subdomains or accepts cross-origin API clients (then set `ALLOWED_ORIGINS`).

**Validation:** `scripts/smoke-test-security.sh` — cross-origin POST → 403, cross-site Referer → 403, same-origin → 200, no-Origin (non-browser) → 200.

## D7 — Bearer tokens no longer accepted

**Decision:** `authMiddleware` reads only the HttpOnly cookie. **Reason:** the only Bearer consumer was this frontend (removed). Accepting a second credential channel would keep a replayable, script-readable path alive. **Trade-off:** future non-browser API clients need a purpose-built mechanism (scoped API keys), not the session cookie.

## D8 — Proxy trust is opt-in

**Decision:** Express `trust proxy` is off unless `TRUST_PROXY` is set (`1`, `true`, or a hop count). **Reason:** trusting `X-Forwarded-For` unconditionally lets any client pick its own IP and defeat every IP-based limit. **Ops note:** behind a reverse proxy/CDN you MUST set `TRUST_PROXY`, otherwise all users share the proxy's IP and one rate-limit bucket.

## D9 — Course entitlement is derived from orders (no enrollments table)

**Decision:** Access = the user has a `PAID` or `COMPLETED` order containing the course. No separate stored enrollment record.
**Reason:** a stored list can disagree with the money (missed revoke on refund, missed grant on a lost callback). Deriving it makes payment state the single source of truth, so refunds revoke automatically and there is nothing to migrate or reconcile.
**Alternatives:** an `enrollments` collection written on PAID (needed if access must ever outlive/differ from an order — e.g. gifted or admin-granted access, or an order being purged); revisit then.
**Trade-offs:** lookup scans the user's orders (fine at this scale; index by mobile if the order table grows). `REFUND_PENDING` revokes immediately, i.e. access is removed when a refund starts, not when it completes — chosen as the conservative reading of "refund revokes access"; change `ENTITLING_STATUSES` if the business prefers otherwise.
**Files:** `server/courseAccess.ts`, `server/api.ts`, `src/App.tsx`, `src/services/apiClient.ts`. **Evidence:** `npm run test:course-access`.

## D10 — Fail closed in production for payment and SMS

**Decision:** `requestPaymentGateway`/`verifyPaymentGateway`/`sendSMS` refuse to run their simulated fallback when `NODE_ENV=production`; they return a clear failure instead. A boot-time check logs a warning (not a hard stop — see below) if production is running without a configured provider.
**Reason:** the simulated fallback is the *default* (triggered by an empty `merchantId`/`apiKey`), so an unconfigured production deploy would silently auto-approve payments and leak OTP codes — not a misuse case, the default case.
**Why a warning and not a fail-fast crash at boot (unlike D2's JWT_SECRET):** unlike auth, a site can legitimately run in production before payment/SMS are wired up (soft-launch, catalogue-only). Refusing to boot at all would block that; refusing to *simulate money moving or send a real code* is the actual safety requirement, enforced per-request instead.
**Trade-off:** an operator who ignores the boot warning gets 503s on checkout/login instead of a crash — intentional (available-but-broken is safer to notice and fix live than a boot-time hard stop that blocks all other functionality).
**Evidence:** `npm run test:prod`.

## D11 — Payment replay idempotency keyed on the winning intent, not order status

**Decision:** `order.paymentIntentId` records which `PaymentIntent` actually paid the order; replay-idempotency checks that id, not just `order.status === 'PAID'`.
**Reason:** an order can accumulate more than one intent (declined attempt, then a retry). Checking only order status meant replaying the *old, declined* authority reported success once the order was later paid by a different attempt — found by the new asserting payments test (F17/R-32), not by code review.
**Evidence:** `npm run test:payments`, specifically "old (declined) authority cannot be reused".

## D12 — Coupon `expiresAtJalali` stays unenforced for now

**Decision:** did not add server-side enforcement of a coupon's Jalali expiry date in this pass.
**Reason:** `expiresAtJalali` is a display string in the Persian calendar (e.g. "۱۴۰۴/۰۱/۰۱"), not a machine-parseable value — comparing it against "now" needs either a Jalali↔Gregorian conversion (a new dependency) or changing the field to an ISO string (a breaking type/format change touching whatever already reads/writes it). Guessing at a conversion here risks an off-by-one-calendar bug in exactly the kind of silent, hard-to-notice way Rule A warns against.
**What I did instead:** enforced everything that's already machine-checkable and wasn't (`isActive`, `minOrderToman`, the new `usageLimit`, `discountPercent` bounds) — see F19/R-27.
**Decision needed from you:** switch the field to an ISO date (`expiresAt: string`, breaking but trivial to migrate) or accept a Jalali-parsing dependency — either unblocks real expiry enforcement.

## D13 — zod added as the schema-validation library (R-18)

**Decision:** added `zod` and a single `server/validation.ts` module (schemas + a `validateBody` middleware), applied to every product/style/course/coupon/certificate/admin-settings write route, rather than continuing with hand-written per-field checks or writing a bespoke validator.
**Reason:** by this phase there were already three different hand-rolled validation styles in the codebase (`server/dbImport.ts`'s manual walker, the ad-hoc `Number(x)||default` pattern in every CRUD route, and the orders route's own inline checks) — real, working, but inconsistent and each one a fresh place to get a bound wrong (as R-34's unbounded coupon percentage shows). A single well-known library used consistently is more auditable than a fourth bespoke style.
**Alternatives:** keep hand-writing checks per route (rejected — that's the R-18 gap in the first place); a heavier framework-level validator (rejected as more than this Express app needs).
**Not migrated:** `server/dbImport.ts`'s validator is deliberately left as its own hand-written walker rather than converted to zod — it already existed, is more about structural/security limits (nesting depth, node count, `__proto__`) than field-shape validation, and works; converting it wasn't worth the risk for this pass (Rule A).
**Evidence:** `npm run test:validation` (31 checks directly against the schemas), `npm run test:crud` (28 checks at the HTTP layer).

## D14 — Fail-fast on crash, flush-then-exit (no attempt to "keep running")

**Decision:** on `uncaughtException` the process flushes the DB and exits with code 1; on `unhandledRejection` it only logs. **Reason:** after an uncaught exception the process state is unknown, and continuing risks serving corrupted data or silently half-applied writes; the JSON file is the only store, so flushing first then letting a supervisor restart is the safest option. Rejections are logged (not fatal) because a single failed background promise (e.g. an SMS send) should not take the site down. **Ops requirement:** run under a supervisor that restarts on exit (pm2, systemd, Docker `restart: always`) — without one, a crash means downtime.

## D15 — Body limits are per-route, mounted before the default parser

**Decision:** larger `express.json` limits are mounted on the two paths that need them *before* the global 100KB parser, relying on body-parser skipping already-parsed requests. **Trade-off:** ordering matters — moving the global parser above them would silently re-impose 100KB on uploads/imports; `npm run test:server` fails if that regresses (large-body import check).

