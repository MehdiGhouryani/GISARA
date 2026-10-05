#!/bin/bash
# Manual security smoke test (no test runner exists yet - see T2 in docs/AUDIT_BASELINE.md).
# Run against a disposable dev DB:  rm -f server/data/db.json && bash scripts/smoke-test-security.sh
cd "$(dirname "$0")/.."
# Make suites order-independent: stop any leftover server and wait until its ports are free.
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
for i in $(seq 1 20); do
  curl -s -m 1 http://localhost:3000/api/health >/dev/null 2>&1 || curl -s -m 1 http://localhost:3100/api/health >/dev/null 2>&1 || break
  sleep 0.5
done
BASE=http://localhost:3000/api
PASS=0; FAIL=0
check() { # name, condition-result(0=ok)
  if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi
}
code() { curl -s -o /dev/null -w "%{http_code}" -m 5 "$@"; }

(nohup npx tsx server.ts > /tmp/sec_server.log 2>&1 &)
for i in $(seq 1 20); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done

JAR=/tmp/sec_jar.txt; rm -f $JAR

# 1. OTP request must not echo the code as a JSON field
R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H 'Content-Type: application/json' -d '{"mobile":"09120000001"}')
echo "$R" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.exit('code' in JSON.parse(d)?1:0))"
check "OTP request response has no 'code' field" $?
CODE=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)

# 2. Verify: cookie set HttpOnly, no token in body
HDR=$(curl -s -m 5 -D - -c $JAR -X POST $BASE/auth/otp/verify -H 'Content-Type: application/json' -d "{\"mobile\":\"09120000001\",\"code\":\"$CODE\"}")
echo "$HDR" | grep -qi "^set-cookie: gisara_token=.*HttpOnly"; check "verify sets HttpOnly cookie" $?
BODY=$(echo "$HDR" | tail -1)
echo "$BODY" | grep -q '"token"'; [ $? -ne 0 ]; check "verify response body contains no token" $?

# 3. Bearer header no longer authenticates (cookie-only)
TOKEN=$(grep gisara_token $JAR | awk '{print $7}')
[ "$(code $BASE/auth/me -H "Authorization: Bearer $TOKEN")" = "401" ]; check "Bearer token rejected" $?
[ "$(code -b $JAR $BASE/auth/me)" = "200" ]; check "cookie session accepted" $?

# 4. CSRF origin guard on state-changing requests carrying the cookie
[ "$(code -b $JAR -X POST $BASE/cart/sync -H 'Content-Type: application/json' -H 'Origin: https://evil.example' -d '{"cartItems":[]}')" = "403" ]; check "cross-origin POST rejected (403)" $?
[ "$(code -b $JAR -X POST $BASE/cart/sync -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' -d '{"cartItems":[]}')" = "200" ]; check "same-origin POST allowed" $?
[ "$(code -b $JAR -X POST $BASE/cart/sync -H 'Content-Type: application/json' -H 'Referer: https://evil.example/x' -d '{"cartItems":[]}')" = "403" ]; check "cross-site Referer POST rejected" $?
[ "$(code -b $JAR -X POST $BASE/cart/sync -H 'Content-Type: application/json' -d '{"cartItems":[]}')" = "200" ]; check "non-browser POST (no Origin) allowed" $?

# 5. Guest cart isolation
curl -s -m 5 -X POST $BASE/cart/sync -H 'Content-Type: application/json' -d '{"cartItems":[{"id":"secret"}]}' >/dev/null
curl -s -m 5 $BASE/cart | grep -q secret; [ $? -ne 0 ]; check "guest cart not shared between visitors" $?

# 6. Upload requires admin
[ "$(code -X POST $BASE/upload -H 'Content-Type: application/json' -d '{"imageBase64":"data:image/png;base64,AAAA"}')" != "200" ]; check "unauthenticated upload rejected" $?
[ "$(code -b $JAR -X POST $BASE/upload -H 'Content-Type: application/json' -d '{"imageBase64":"data:image/png;base64,AAAA"}')" = "403" ]; check "non-admin upload rejected (403)" $?

# 7. Admin login: no token in body, wrong passcode rejected
[ "$(code -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"wrong-pass"}')" = "401" ]; check "wrong admin passcode -> 401" $?
[ "$(code -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":123}')" = "400" ]; check "non-string passcode -> 400" $?
A=$(curl -s -m 5 -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}')
echo "$A" | grep -q '"token"'; [ $? -ne 0 ]; check "admin login body contains no token" $?

# 8. Rate limiters are independent: exhaust coupon limiter, OTP endpoint must still work
LAST=""
for i in $(seq 1 22); do LAST=$(code $BASE/coupons/validate/NOPE$i); done
[ "$LAST" = "429" ]; check "coupon validation rate-limited (429 after burst)" $?
[ "$(code -X POST $BASE/auth/otp/request -H 'Content-Type: application/json' -d '{"mobile":"09120000002"}')" = "200" ]; check "OTP limiter unaffected by coupon burst" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "tsx server.ts" 2>/dev/null
[ $FAIL -eq 0 ]
