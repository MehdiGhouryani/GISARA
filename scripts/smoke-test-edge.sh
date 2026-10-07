#!/bin/bash
# Order/payment edge cases found in the audit (stock leak, shipping rule, address validation,
# idempotency, duplicate course purchase, payment-session reuse, redirect contract).
#   rm -f server/data/db.json && bash scripts/smoke-test-edge.sh
cd "$(dirname "$0")/.."
SHIP='{"recipientName":"گیرنده آزمایشی","recipientMobile":"۰۹۱۲۱۲۳۴۵۶۷","province":"تهران","city":"تهران","addressLine":"خیابان آزمایش، پلاک ۱۰، واحد ۲","postalCode":"۱۲۳۴۵۶۷۸۹۰"}'
pkill -f "[t]sx server.ts" 2>/dev/null
for i in $(seq 1 20); do curl -s -m 1 http://localhost:3000/api/health >/dev/null 2>&1 || break; sleep 0.5; done
BASE=http://localhost:3000/api
PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log($1)})"; }
H='Content-Type: application/json'
(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/edge_server.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done

login() { R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H "$H" -d "{\"mobile\":\"$2\"}"); C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1); curl -s -m 5 -c $1 -X POST $BASE/auth/otp/verify -H "$H" -d "{\"mobile\":\"$2\",\"code\":\"$C\"}" >/dev/null; }
U=/tmp/edge_u.txt; A=/tmp/edge_a.txt; rm -f $U $A
login $U 09127770001
curl -s -m 5 -c $A -X POST $BASE/auth/admin/login -H "$H" -d '{"passcode":"gisara2026"}' >/dev/null

PID=$(curl -s -m 5 $BASE/products | js "j.data[0].id")
PRICE=$(curl -s -m 5 $BASE/products | js "j.data[0].priceToman")
stock() { curl -s -m 5 $BASE/products/$PID | js "(j.data||j).stock"; }
order() { curl -s -m 5 -b $U -X POST $BASE/orders -H "$H" "${@:2}" -d "$1"; }
phys() { echo "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":$1}]$2}"; }
CID=$(curl -s -m 5 $BASE/courses | js "j.data[0].id")
S0=$(stock)

# 1. rejected orders must not leak stock (they used to keep the reservation)
R=$(order "$(phys 2 ',"couponCode":"NOPE"')" | js "j.success"); [ "$R" = "false" ]; check "invalid coupon rejects the order" $?
[ "$(stock)" = "$S0" ]; check "invalid coupon does NOT leak reserved stock" $?
R=$(order "{\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":1}]}" | js "j.success"); [ "$R" = "false" ]; check "physical order without address rejected" $?
[ "$(stock)" = "$S0" ]; check "missing address does not leak stock" $?

# 2. address validation
BAD='{"recipientName":"x","recipientMobile":"123","province":"تهران","city":"تهران","addressLine":"کوتاه","postalCode":"12"}'
R=$(order "{\"shippingInfo\":$BAD,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":1}]}" | js "j.success"); [ "$R" = "false" ]; check "malformed address rejected (no silent defaults)" $?
O=$(order "$(phys 1)")
echo "$O" | js "j.order.shippingAddress.postalCode" | grep -q "^1234567890$"; check "persian-digit postal code stored as latin digits" $?
echo "$O" | js "j.order.shippingAddress.mobile" | grep -q "^09121234567$"; check "persian-digit recipient mobile normalised" $?
echo "$O" | js "j.order.shippingToman-0" | grep -q "^45000$"; check "420k physical order pays 45,000 shipping" $?
echo "$O" | js "j.order.orderNumber" | grep -qE '^GSR-[0-9]{8}$'; check "order number format GSR-########" $?
curl -s -m 5 -b $A -X PUT $BASE/orders/$(echo "$O" | js "j.order.id")/status -H "$H" -d '{"status":"CANCELLED"}' >/dev/null

# 3. shipping rule: free from 2,000,000 (physical subtotal), never for digital-only
Q=$(( 2000000 / PRICE + 1 )); [ $Q -le 20 ]; check "test product allows a >=2M quantity ($Q)" $?
O=$(order "$(phys $Q)")
echo "$O" | js "j.order.shippingToman-0" | grep -q "^0$"; check "physical subtotal >= 2,000,000 ships free" $?
curl -s -m 5 -b $A -X PUT $BASE/orders/$(echo "$O" | js "j.order.id")/status -H "$H" -d '{"status":"CANCELLED"}' >/dev/null
O=$(order "{\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1}]}")
echo "$O" | js "j.order.shippingToman-0" | grep -q "^0$"; check "digital-only order never pays shipping" $?
echo "$O" | js "j.order.shippingAddress===undefined" | grep -q true; check "digital-only order stores no fake address" $?
COID=$(echo "$O" | js "j.order.id")

# 4. idempotency: same key -> same order, stock reserved once
S1=$(stock)
K="edge-key-$(date +%s)-$RANDOM"
O1=$(order "$(phys 1)" -H "Idempotency-Key: $K"); ID1=$(echo "$O1" | js "j.order.id")
O2=$(order "$(phys 1)" -H "Idempotency-Key: $K"); ID2=$(echo "$O2" | js "j.order.id")
[ "$ID1" = "$ID2" ]; check "same Idempotency-Key returns the same order" $?
echo "$O2" | js "j.replayed" | grep -q true; check "replay is flagged" $?
[ "$(stock)" = "$((S1-1))" ]; check "stock reserved exactly once for a retried request" $?
curl -s -m 5 -b $A -X PUT $BASE/orders/$ID1/status -H "$H" -d '{"status":"CANCELLED"}' >/dev/null

# 5. coupon: case-insensitive input, canonical storage, usage rolled back on cancel
uses() { curl -s -m 5 -b $A $BASE/coupons | js "j.data.find(c=>c.code==='SHANYOON20').usageCount"; }
U0=$(uses)
O=$(order "$(phys 2 ',"couponCode":"shanyoon20"')")
echo "$O" | js "j.order.couponApplied" | grep -q "^SHANYOON20$"; check "coupon stored with canonical code" $?
echo "$O" | js "j.order.discountToman>0" | grep -q true; check "coupon discount applied and recorded" $?
[ "$(uses)" = "$((U0+1))" ]; check "coupon usage incremented" $?
curl -s -m 5 -b $A -X PUT $BASE/orders/$(echo "$O" | js "j.order.id")/status -H "$H" -d '{"status":"CANCELLED"}' >/dev/null
[ "$(uses)" = "$U0" ]; check "coupon usage rolled back on cancel" $?

# 6. duplicate courses
R=$(order "{\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1},{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1}]}" | js "j.success"); [ "$R" = "false" ]; check "same course twice in one cart rejected" $?

# 7. payment session reuse + redirect contract + owned-course guard
P1=$(curl -s -m 5 -b $U -X POST $BASE/payments/request -H "$H" -d "{\"orderId\":\"$COID\"}")
P2=$(curl -s -m 5 -b $U -X POST $BASE/payments/request -H "$H" -d "{\"orderId\":\"$COID\"}")
A1=$(echo "$P1" | js "j.authority"); A2=$(echo "$P2" | js "j.authority")
[ -n "$A1" ] && [ "$A1" = "$A2" ]; check "repeated payment request re-uses the same gateway session" $?
echo "$P2" | js "j.reused" | grep -q true; check "reuse is flagged" $?
LOC=$(curl -s -m 8 -D - -o /dev/null "$BASE/payments/verify?Authority=$A1&orderId=$COID&Status=OK" | grep -i '^location:' | tr -d '\r')
echo "$LOC" | grep -q "/account?tab=orders&paymentStatus=success"; check "verify redirects to /account?tab=orders&paymentStatus=success" $?
curl -s -m 5 -b $U $BASE/me/enrollments | js "j.courseIds.includes('$CID')" | grep -q true; check "course unlocked only after verified payment" $?
R=$(order "{\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1}]}" -w '\n%{http_code}' | tail -1); [ "$R" = "409" ]; check "buying an already-owned course -> 409" $?
LOC=$(curl -s -m 8 -D - -o /dev/null "$BASE/payments/verify?Authority=SIM-nope&orderId=$COID&Status=OK" | grep -i '^location:' | tr -d '\r')
echo "$LOC" | grep -q "paymentStatus=failed" && echo "$LOC" | grep -q "message="; check "failure redirect carries a readable message param" $?
LOC=$(curl -s -m 8 -D - -o /dev/null "$BASE/payments/verify?Authority=$A1&orderId=$COID&Status=OK" | grep -i '^location:' | tr -d '\r')
echo "$LOC" | grep -q "paymentStatus=success"; check "replaying the same successful callback stays idempotent" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
