#!/bin/bash
# Admin: tracking code, settings secrecy, backup completeness/round-trip, unified KPIs + cache invalidation, dev-passcode gate.
#   rm -f server/data/db.json && bash scripts/smoke-test-admin.sh
cd "$(dirname "$0")/.."
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1; rm -f server/data/*.tmp
BASE=http://localhost:3000/api; PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{let j;try{j=JSON.parse(d)}catch(e){console.log('PARSE_ERROR');return}console.log($1)})"; }
H='Content-Type: application/json'
SHIP='{"recipientName":"گیرنده","recipientMobile":"09121234567","province":"تهران","city":"تهران","addressLine":"خیابان آزمایش، پلاک ۱۰","postalCode":"1234567890"}'
(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/admin_server.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done
U=/tmp/ad_u.txt; A=/tmp/ad_a.txt; rm -f $U $A
R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H "$H" -d '{"mobile":"09127771234"}'); C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
curl -s -m 5 -c $U -X POST $BASE/auth/otp/verify -H "$H" -d "{\"mobile\":\"09127771234\",\"code\":\"$C\"}" >/dev/null
curl -s -m 5 -c $A -X POST $BASE/auth/admin/login -H "$H" -d '{"passcode":"gisara2026"}' >/dev/null
PID=$(curl -s -m 5 $BASE/products | js "j.data[0].id")
CID=$(curl -s -m 5 $BASE/courses | js "j.data[0].id")

mkorder() { curl -s -m 5 -b $U -X POST $BASE/orders -H "$H" -d "$1" | js "j.order.id"; }
pay() { AU=$(curl -s -m 5 -b $U -X POST $BASE/payments/request -H "$H" -d "{\"orderId\":\"$1\"}" | js "j.authority"); curl -s -m 8 -o /dev/null "$BASE/payments/verify?Authority=$AU&orderId=$1&Status=OK"; }
upd() { curl -s -m 5 -b $A -X PUT $BASE/orders/$1/status -H "$H" -d "$2"; }

PHYS=$(mkorder "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":1}]}")
DIGI=$(mkorder "{\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1}]}")

# --- 1. tracking code
upd $PHYS '{"trackingCode":"RX123456789IR"}' | js "j.success" | grep -q false; check "tracking code refused while the order is unpaid" $?
pay $PHYS
upd $PHYS '{"shipmentStatus":"SHIPPED","trackingCode":"rx123456789ir"}' | js "j.data.trackingCode+':'+j.data.shipmentStatus" | grep -q "^rx123456789ir:SHIPPED$"; check "tracking code + shipment status are actually saved" $?
curl -s -m 5 -b $A -H "X-Admin-Context: 1" $BASE/orders | js "j.data.find(o=>o.id==='$PHYS').trackingCode" | grep -q "rx123456789ir"; check "saved tracking code is returned by the orders list" $?
upd $PHYS '{"trackingCode":"bad code!"}' | js "j.success" | grep -q false; check "malformed tracking code rejected" $?
upd $PHYS '{"shipmentStatus":"TELEPORTED"}' | js "j.success" | grep -q false; check "unknown shipment status rejected" $?
upd $PHYS '{"trackingCode":""}' | js "j.data.trackingCode===undefined" | grep -q true; check "empty tracking code clears it" $?
pay $DIGI
upd $DIGI '{"trackingCode":"RX123456789IR"}' | js "j.success" | grep -q false; check "digital-only order cannot get shipment data" $?

# --- 2. settings secrecy
curl -s -m 5 -b $A -X POST $BASE/admin/settings -H "$H" -d '{"payment":{"provider":"zarinpal","merchantId":"abcdefgh-1111-2222-3333-444455556666","sandbox":true},"sms":{"provider":"kavenegar","apiKey":"SECRETKEY-9876","patternCode":"otp"}}' > /tmp/ad_set.json
grep -q "abcdefgh-1111" /tmp/ad_set.json; [ $? -ne 0 ]; check "POST /admin/settings response does not echo the merchant id" $?
G=$(curl -s -m 5 -b $A $BASE/admin/settings)
echo "$G" | grep -q "SECRETKEY"; [ $? -ne 0 ]; check "GET /admin/settings never returns the SMS key" $?
echo "$G" | js "j.data.sms.apiKey" | grep -q "••••9876"; check "SMS key shown masked (last 4 only)" $?
echo "$G" | js "j.data.payment.merchantId" | grep -q "••••6666"; check "merchant id shown masked (last 4 only)" $?
curl -s -m 5 -b $A -X POST $BASE/admin/settings -H "$H" -d '{"payment":{"provider":"zarinpal","merchantId":"••••6666","sandbox":true},"sms":{"provider":"kavenegar","apiKey":"","patternCode":"otp2"}}' >/dev/null
G=$(curl -s -m 5 -b $A $BASE/admin/settings)
echo "$G" | js "j.data.sms.apiKey+':'+j.data.payment.merchantId+':'+j.data.sms.patternCode" | grep -q "^••••9876:••••6666:otp2$"; check "saving the masked placeholder / blank keeps the stored secrets" $?
curl -s -m 5 -b $A $BASE/admin/db/export > /tmp/ad_export.json
grep -q "SECRETKEY\|abcdefgh-1111" /tmp/ad_export.json; [ $? -ne 0 ]; check "backup file contains no live secrets" $?

# --- 3. backup completeness + round trip
node -e "const e=require('/tmp/ad_export.json');for(const k of ['manualEnrollments','paymentIntents','users','coupons','instructors','cities','sessions','certificates','orders'])if(!Array.isArray(e[k]))process.exit(1)"; check "backup includes payment intents, manual enrollments, users, coupons, instructors, cities" $?
N0=$(node -e "console.log(require('/tmp/ad_export.json').paymentIntents.length)")
R=$(curl -s -m 10 -b $A -X POST $BASE/admin/db/import -H "$H" --data-binary @/tmp/ad_export.json)
echo "$R" | js "j.success" | grep -q true; check "a full backup restores cleanly" $?
echo "$R" | js "j.restored.paymentIntents===$N0 && j.restored.users>0" | grep -q true; check "restore reports every collection it restored" $?
echo "$R" | js "typeof j.previousStateSnapshot" | grep -q string; check "restore reports the pre-import snapshot" $?
curl -s -m 5 -b $A $BASE/admin/db/export | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const e=JSON.parse(d);process.exit(e.paymentIntents.length===$N0?0:1)})"; check "payment intents survive the round trip" $?

# --- 4. unified KPIs + cache invalidation
AN=$(curl -s -m 5 -b $A $BASE/admin/analytics); ME=$(curl -s -m 5 -b $A $BASE/admin/metrics)
[ "$(echo "$AN" | js "j.data.ordersCount")" = "$(echo "$ME" | js "j.data.paidOrdersCount")" ]; check "analytics and metrics agree on the paid-order count" $?
[ "$(echo "$AN" | js "j.data.totalSalesToman")" = "$(echo "$ME" | js "j.data.totalRevenue")" ]; check "analytics and metrics agree on revenue" $?
P0=$(echo "$ME" | js "j.data.pendingOrdersCount")
mkorder "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID\",\"quantity\":1}]}" >/dev/null
P1=$(curl -s -m 5 -b $A $BASE/admin/metrics | js "j.data.pendingOrdersCount")
[ "$P1" = "$((P0+1))" ]; check "metrics update immediately after a write (no stale 2-minute cache)" $?

# --- 5. dev passcode needs an explicit opt-in
(PORT=3101 nohup npx tsx server.ts > /tmp/admin_server2.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 http://localhost:3101/api/health >/dev/null && break; sleep 1; done
CODE=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST http://localhost:3101/api/auth/admin/login -H "$H" -d '{"passcode":"gisara2026"}'); [ "$CODE" = "401" ]; check "without ALLOW_DEV_AUTH the well-known dev passcode is rejected" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
