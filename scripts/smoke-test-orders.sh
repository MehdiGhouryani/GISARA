#!/bin/bash
# Order integrity smoke test. Run on a disposable DB:
#   rm -f server/data/db.json && bash scripts/smoke-test-orders.sh
cd "$(dirname "$0")/.."
SHIP='{"recipientName":"گیرنده آزمایشی","recipientMobile":"09121234567","province":"تهران","city":"تهران","addressLine":"خیابان آزمایش، پلاک ۱۰، واحد ۲","postalCode":"1234567890"}'
# Make suites order-independent: stop any leftover server and wait until its ports are free.
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
for i in $(seq 1 20); do
  curl -s -m 1 http://localhost:3000/api/health >/dev/null 2>&1 || curl -s -m 1 http://localhost:3100/api/health >/dev/null 2>&1 || break
  sleep 0.5
done
BASE=http://localhost:3000/api
PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log($1)})"; }
post() { curl -s -m 5 -b $JAR -X POST $BASE/orders -H 'Content-Type: application/json' -d "$1"; }

(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/ord_server.log 2>&1 &)
for i in $(seq 1 20); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done
JAR=/tmp/ord_jar.txt; rm -f $JAR; AJAR=/tmp/ord_ajar.txt; rm -f $AJAR

R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H 'Content-Type: application/json' -d '{"mobile":"09123334444"}')
CODE=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
curl -s -m 5 -c $JAR -X POST $BASE/auth/otp/verify -H 'Content-Type: application/json' -d "{\"mobile\":\"09123334444\",\"code\":\"$CODE\"}" >/dev/null
curl -s -m 5 -c $AJAR -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}' >/dev/null

PID=$(curl -s -m 5 $BASE/products | js "j.data[0].id")
stock() { curl -s -m 5 $BASE/products/$PID | js "(j.data||j).stock"; }
CID=$(curl -s -m 5 $BASE/courses | js "j.data[0].id")
CPRICE=$(curl -s -m 5 $BASE/courses | js "j.data[0].priceToman")
S0=$(stock)

# 1. quantity validation
for Q in -5 0 1.5 21 '"abc"'; do
  C=$(post "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":$Q}]}" | js "j.success")
  [ "$C" = "false" ]; check "quantity $Q rejected" $?
done
[ "$(stock)" = "$S0" ]; check "stock unchanged after rejected quantities" $?

# 2. all-or-nothing: valid line + unknown product => 400, no partial decrement
R=$(post "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":1},{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"does-not-exist\",\"quantity\":1}]}" | js "j.success")
[ "$R" = "false" ]; check "mixed valid+invalid order rejected" $?
[ "$(stock)" = "$S0" ]; check "no partial stock decrement on rejected order" $?

# 3. duplicate lines are aggregated against stock (enough 20-unit lines to exceed any stock level)
LINES=$(node -e "const s=$S0;const n=Math.ceil(s/20)+1;const l=[];for(let i=0;i<n;i++)l.push({type:'PHYSICAL_PRODUCT',productId:'$PID',quantity:20});console.log(JSON.stringify({cartItems:l}))")
R=$(post "$LINES" | js "j.success")
[ "$R" = "false" ]; check "duplicate lines cannot exceed stock together" $?
[ "$(stock)" = "$S0" ]; check "stock unchanged after over-demand order rejected" $?

# 4. course line priced by the server, quantity forced to 1
R=$(post "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1,\"priceToman\":1}]}")
echo "$R" | js "j.order.items[0].priceToman" | grep -q "^$CPRICE$"; check "course priced from server (ignores client price)" $?
echo "$R" | js "j.order.status" | grep -q PENDING_PAYMENT; check "course order is PENDING_PAYMENT" $?
R=$(post "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":2}]}" | js "j.success")
[ "$R" = "false" ]; check "course quantity >1 rejected" $?
R=$(post "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"nope\",\"quantity\":1}]}" | js "j.success")
[ "$R" = "false" ]; check "unknown course rejected" $?

# 5. stock reserved on create, restored on admin cancel, released only once
O=$(post "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":2}]}")
OID=$(echo "$O" | js "j.order.id")
[ "$(stock)" = "$((S0-2))" ]; check "stock reserved (-2) at order creation" $?
curl -s -m 5 -b $AJAR -X PUT $BASE/orders/$OID/status -H 'Content-Type: application/json' -d '{"status":"CANCELLED"}' | js "j.success" | grep -q true; check "admin can cancel pending order" $?
[ "$(stock)" = "$S0" ]; check "stock restored after cancel" $?
curl -s -m 5 -b $AJAR -X PUT $BASE/orders/$OID/status -H 'Content-Type: application/json' -d '{"status":"CANCELLED"}' >/dev/null
[ "$(stock)" = "$S0" ]; check "repeat cancel does not double-restore stock" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
