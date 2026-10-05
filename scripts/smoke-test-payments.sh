#!/bin/bash
# Order + payment state machine test (asserting). Run on a disposable dev DB:
#   rm -f server/data/db.json && bash scripts/smoke-test-payments.sh
cd "$(dirname "$0")/.."
pkill -f "[t]sx server.ts" 2>/dev/null
for i in $(seq 1 20); do curl -s -m 1 http://localhost:3000/api/health >/dev/null 2>&1 || break; sleep 0.5; done
BASE=http://localhost:3000/api
PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log($1)})"; }
code() { curl -s -o /dev/null -w "%{http_code}" -m 8 "$@"; }
loc() { curl -s -m 8 -D - -o /dev/null "$@" | grep -i '^location:' | tr -d '\r'; }

(nohup npx tsx server.ts > /tmp/pay_server.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done

login() { R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H 'Content-Type: application/json' -d "{\"mobile\":\"$2\"}"); C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1); curl -s -m 5 -c $1 -X POST $BASE/auth/otp/verify -H 'Content-Type: application/json' -d "{\"mobile\":\"$2\",\"code\":\"$C\"}" >/dev/null; }
U1=/tmp/pay_u1.txt; U2=/tmp/pay_u2.txt; AD=/tmp/pay_ad.txt; rm -f $U1 $U2 $AD
login $U1 09128880001; login $U2 09128880002
curl -s -m 5 -c $AD -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}' >/dev/null

PID=$(curl -s -m 5 $BASE/products | js "j.data[0].id")
PRICE=$(curl -s -m 5 $BASE/products | js "j.data[0].priceToman")
mkorder() { curl -s -m 5 -b $1 -X POST $BASE/orders -H 'Content-Type: application/json' -d "{\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":1,\"priceToman\":1}]}" | js "j.order.id"; }
status() { curl -s -m 5 -b $1 $BASE/orders | js "j.data.find(o=>o.id==='$2').status"; }
reqpay() { curl -s -m 5 -b $1 -X POST $BASE/payments/request -H 'Content-Type: application/json' -d "{\"orderId\":\"$2\"}"; }

# --- creation
O1=$(mkorder $U1)
[ "$(status $U1 $O1)" = "PENDING_PAYMENT" ]; check "new order is PENDING_PAYMENT (never PAID)" $?
curl -s -m 5 -b $U1 $BASE/orders | js "j.data.find(o=>o.id==='$O1').payableToman-0" | grep -q "^$((PRICE+45000))$\|^$PRICE$"; check "order priced from server data, not client price (client sent 1)" $?

# --- request authorisation
[ "$(code -X POST $BASE/payments/request -H 'Content-Type: application/json' -d "{\"orderId\":\"$O1\"}")" = "401" ]; check "payment request requires login" $?
[ "$(code -b $U2 -X POST $BASE/payments/request -H 'Content-Type: application/json' -d "{\"orderId\":\"$O1\"}")" = "403" ]; check "another user cannot start payment for my order (403)" $?

# --- callback abuse BEFORE a legitimate intent exists
[ -n "$(loc "$BASE/payments/verify?Authority=SIM-1-1&Status=OK&orderId=$O1" | grep -i 'paymentStatus=failed')" ]; check "forged authority (no intent) -> failed redirect" $?
[ "$(status $U1 $O1)" = "PENDING_PAYMENT" ]; check "forged callback did not mark order paid" $?

# --- legitimate intent
A1=$(reqpay $U1 $O1 | js "j.authority")
[ -n "$A1" ]; check "payment request returns an authority (dev simulator)" $?

# --- binding: valid authority for O1 presented against a DIFFERENT real order
O2=$(mkorder $U1)
[ -n "$(loc "$BASE/payments/verify?Authority=$A1&Status=OK&orderId=$O2" | grep -i 'paymentStatus=failed')" ]; check "authority of order A cannot pay order B (binding)" $?
[ "$(status $U1 $O2)" = "PENDING_PAYMENT" ]; check "order B still unpaid after cross-order attempt" $?
[ "$(status $U1 $O1)" = "PENDING_PAYMENT" ]; check "order A untouched by cross-order attempt" $?

# --- happy path
[ -n "$(loc "$BASE/payments/verify?Authority=$A1&Status=OK&orderId=$O1" | grep -i 'paymentStatus=success')" ]; check "correct callback -> success redirect" $?
[ "$(status $U1 $O1)" = "PAID" ]; check "order becomes PAID only via verified callback" $?
PAIDAT=$(curl -s -m 5 -b $U1 $BASE/orders | js "j.data.find(o=>o.id==='$O1').paidAt")
# --- idempotent replay
[ -n "$(loc "$BASE/payments/verify?Authority=$A1&Status=OK&orderId=$O1" | grep -i 'paymentStatus=success')" ]; check "replayed callback is idempotent (success again, no reprocessing)" $?
[ "$(curl -s -m 5 -b $U1 $BASE/orders | js "j.data.find(o=>o.id==='$O1').paidAt")" = "$PAIDAT" ]; check "replay did not change paidAt" $?
[ "$(code -b $U1 -X POST $BASE/payments/request -H 'Content-Type: application/json' -d "{\"orderId\":\"$O1\"}")" = "409" ]; check "cannot start a new payment for an already PAID order (409)" $?

# --- declined payment then retry within the window
O3=$(mkorder $U1); A3=$(reqpay $U1 $O3 | js "j.authority")
loc "$BASE/payments/verify?Authority=$A3&Status=NOK&orderId=$O3" >/dev/null
[ "$(status $U1 $O3)" = "PAYMENT_FAILED" ]; check "declined payment -> PAYMENT_FAILED" $?
A3B=$(reqpay $U1 $O3 | js "j.authority")
[ -n "$A3B" ] && [ "$A3B" != "$A3" ]; check "failed payment can be retried with a fresh authority" $?
loc "$BASE/payments/verify?Authority=$A3B&Status=OK&orderId=$O3" >/dev/null
[ "$(status $U1 $O3)" = "PAID" ]; check "retry succeeds -> PAID" $?
[ -n "$(loc "$BASE/payments/verify?Authority=$A3&Status=OK&orderId=$O3" | grep -i 'paymentStatus=failed')" ]; check "old (declined) authority cannot be reused" $?

# --- admin cannot force PAID; allowed transitions work
[ "$(code -b $AD -X PUT $BASE/orders/$O2/status -H 'Content-Type: application/json' -d '{"status":"PAID"}')" = "409" ]; check "admin cannot set PENDING_PAYMENT -> PAID (409)" $?
[ "$(status $U1 $O2)" = "PENDING_PAYMENT" ]; check "order still unpaid after admin attempt" $?
[ "$(code -b $U1 -X PUT $BASE/orders/$O2/status -H 'Content-Type: application/json' -d '{"status":"CANCELLED"}')" = "403" ]; check "non-admin cannot change order status (403)" $?
[ "$(code -b $AD -X PUT $BASE/orders/$O1/status -H 'Content-Type: application/json' -d '{"status":"COMPLETED"}')" = "200" ]; check "admin PAID -> COMPLETED allowed" $?
[ "$(code -b $AD -X PUT $BASE/orders/$O1/status -H 'Content-Type: application/json' -d '{"status":"PAID"}')" = "409" ]; check "terminal COMPLETED cannot go back to PAID (409)" $?
[ "$(code -b $AD -X PUT $BASE/orders/$O2/status -H 'Content-Type: application/json' -d '{"status":"NOT_A_STATUS"}')" = "409" ]; check "unknown status value rejected" $?

# --- visibility
curl -s -m 5 -b $U2 $BASE/orders | js "j.data.some(o=>o.id==='$O1')?'leak':'ok'" | grep -q ok; check "user cannot see another user's orders" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
