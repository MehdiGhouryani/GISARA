#!/bin/bash
# Admin CRUD + coupon financial integrity + course-delete protection.
#   rm -f server/data/db.json && bash scripts/smoke-test-crud.sh
cd "$(dirname "$0")/.."
SHIP='{"recipientName":"گیرنده آزمایشی","recipientMobile":"09121234567","province":"تهران","city":"تهران","addressLine":"خیابان آزمایش، پلاک ۱۰، واحد ۲","postalCode":"1234567890"}'
pkill -f "[t]sx server.ts" 2>/dev/null
for i in $(seq 1 20); do curl -s -m 1 http://localhost:3000/api/health >/dev/null 2>&1 || break; sleep 0.5; done
BASE=http://localhost:3000/api
PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log($1)})"; }
code() { curl -s -o /dev/null -w "%{http_code}" -m 8 "$@"; }

(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/crud_server.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done
AJ=/tmp/crud_aj.txt; UJ=/tmp/crud_uj.txt; rm -f $AJ $UJ
curl -s -m 5 -c $AJ -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}' >/dev/null
R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H 'Content-Type: application/json' -d '{"mobile":"09129990001"}')
C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
curl -s -m 5 -c $UJ -X POST $BASE/auth/otp/verify -H 'Content-Type: application/json' -d "{\"mobile\":\"09129990001\",\"code\":\"$C\"}" >/dev/null

##### Products: authz + validation + full-field edit #####
[ "$(code -X POST $BASE/products -H 'Content-Type: application/json' -d '{"name":"x","priceToman":1000}')" = "403" ]; check "product create requires auth (403, consistent with requireAdmin elsewhere)" $?
[ "$(code -b $UJ -X POST $BASE/products -H 'Content-Type: application/json' -d '{"name":"x","priceToman":1000}')" = "403" ]; check "non-admin cannot create product" $?
[ "$(code -b $AJ -X POST $BASE/products -H 'Content-Type: application/json' -d '{"name":"x","priceToman":-500}')" = "400" ]; check "negative price rejected at the route" $?
P=$(curl -s -m 5 -b $AJ -X POST $BASE/products -H 'Content-Type: application/json' -d '{"name":"تست محصول","priceToman":50000,"stock":5,"summary":"s1","description":"d1","sku":"SKU-T1"}')
PID=$(echo "$P" | js "j.data.id")
[ -n "$PID" ]; check "valid product created" $?
curl -s -m 5 -b $AJ -X PUT $BASE/products/$PID -H 'Content-Type: application/json' -d '{"summary":"s2","description":"d2","sku":"SKU-T2","stock":9}' > /tmp/crud_pu.json
echo "$(cat /tmp/crud_pu.json)" | js "j.data.summary" | grep -q "^s2$"; check "product PUT can edit summary (previously unreachable)" $?
echo "$(cat /tmp/crud_pu.json)" | js "j.data.description" | grep -q "^d2$"; check "product PUT can edit description (previously unreachable)" $?
echo "$(cat /tmp/crud_pu.json)" | js "j.data.sku" | grep -q "^SKU-T2$"; check "product PUT can edit sku (previously unreachable)" $?
echo "$(cat /tmp/crud_pu.json)" | js "j.data.name" | grep -q "^تست محصول$"; check "product PUT preserves untouched fields" $?

##### Styles: full-field edit #####
S=$(curl -s -m 5 -b $AJ -X POST $BASE/styles -H 'Content-Type: application/json' -d '{"name":"استایل تست","slug":"style-test-1"}')
SID=$(echo "$S" | js "j.data.id")
curl -s -m 5 -b $AJ -X PUT $BASE/styles/$SID -H 'Content-Type: application/json' -d '{"description":"desc-updated","occasion":"عروسی"}' | js "j.data.description" | grep -q "desc-updated"; check "style PUT can edit description" $?

##### Coupons: financial integrity #####
[ "$(code -b $AJ -X POST $BASE/coupons -H 'Content-Type: application/json' -d '{"code":"BIG","discountPercent":500}')" = "400" ]; check ">100% discount coupon rejected" $?
[ "$(code -b $AJ -X POST $BASE/coupons -H 'Content-Type: application/json' -d '{"code":"BAD CODE!","discountPercent":10}')" = "400" ]; check "malformed coupon code rejected" $?
CU=$(curl -s -m 5 -b $AJ -X POST $BASE/coupons -H 'Content-Type: application/json' -d '{"code":"BIGORDER10","discountPercent":10,"minOrderToman":1000000,"usageLimit":1}')
CID=$(echo "$CU" | js "j.data.id")
[ "$(code -b $AJ -X POST $BASE/coupons -H 'Content-Type: application/json' -d '{"code":"BIGORDER10","discountPercent":10}')" = "409" ]; check "duplicate coupon code rejected" $?

PID2=$(curl -s -m 5 $BASE/products | js "j.data[0].id")
mkorder() { curl -s -m 5 -b $UJ -X POST $BASE/orders -H 'Content-Type: application/json' -d "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"PHYSICAL_PRODUCT\",\"productId\":\"$PID2\",\"quantity\":1}],\"couponCode\":\"$1\"}"; }

R1=$(mkorder BIGORDER10)
echo "$R1" | js "j.success" | grep -q false; check "coupon below minOrderToman rejected at checkout" $?

curl -s -m 5 -b $AJ -X PUT $BASE/coupons/$CID -H 'Content-Type: application/json' -d '{"minOrderToman":0}' >/dev/null
O1=$(mkorder BIGORDER10 | js "j.order.id")
[ -n "$O1" ]; check "coupon applies once minOrderToman satisfied" $?
[ "$(curl -s -m5 -b $AJ $BASE/coupons | js "j.data.find(c=>c.id==='$CID').usageCount")" = "1" ]; check "usageCount incremented on use" $?

O2=$(mkorder BIGORDER10)
echo "$O2" | js "j.success" | grep -q false; check "usageLimit=1 blocks a second use" $?

# Cancel the order that consumed the coupon -> usage must roll back
curl -s -m 5 -b $AJ -X PUT $BASE/orders/$O1/status -H 'Content-Type: application/json' -d '{"status":"CANCELLED"}' >/dev/null
[ "$(curl -s -m5 -b $AJ $BASE/coupons | js "j.data.find(c=>c.id==='$CID').usageCount")" = "0" ]; check "usageCount rolled back on cancel (R-27)" $?
O3=$(mkorder BIGORDER10 | js "j.order.id")
[ -n "$O3" ]; check "coupon usable again after rollback freed capacity" $?

curl -s -m 5 -b $AJ -X DELETE $BASE/coupons/$CID -H 'Content-Type: application/json' > /tmp/crud_cd.json
js "j.success" < /tmp/crud_cd.json | grep -q true; check "coupon delete works" $?

##### Courses: CRUD + delete protection #####
[ "$(code -b $UJ -X POST $BASE/courses -H 'Content-Type: application/json' -d '{"name":"c","priceToman":1}')" = "403" ]; check "non-admin cannot create course" $?
CR=$(curl -s -m 5 -b $AJ -X POST $BASE/courses -H 'Content-Type: application/json' -d '{"name":"دوره تست","priceToman":10000,"status":"PUBLISHED","modules":[{"lessons":[{"id":"l1","title":"درس ۱","isPreview":true},{"id":"l2","title":"درس ۲"}]}]}')
COID=$(echo "$CR" | js "j.data.id")
[ -n "$COID" ]; check "course created" $?
curl -s -m 5 $BASE/courses | js "j.data.find(c=>c.id==='$COID')?'ok':'bad'" | grep -q ok; check "new course appears in public catalogue" $?
[ "$(code $BASE/courses/$COID/lessons/l1)" = "200" ]; check "created course's preview lesson is publicly viewable" $?
[ "$(code $BASE/courses/$COID/lessons/l2)" = "401" ]; check "created course's paid lesson is gated" $?
curl -s -m 5 -b $AJ -X PUT $BASE/courses/$COID -H 'Content-Type: application/json' -d '{"priceToman":20000}' | js "j.data.priceToman" | grep -q "^20000$"; check "course price editable via PUT" $?

CO=$(curl -s -m 5 -b $UJ -X POST $BASE/orders -H 'Content-Type: application/json' -d "{\"shippingInfo\":$SHIP,\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$COID\",\"quantity\":1}]}")
COOID=$(echo "$CO" | js "j.order.id")
A=$(curl -s -m 5 -b $UJ -X POST $BASE/payments/request -H 'Content-Type: application/json' -d "{\"orderId\":\"$COOID\"}" | js "j.authority")
curl -s -m 5 "$BASE/payments/verify?Authority=$A&Status=OK&orderId=$COOID" -o /dev/null
[ "$(code -b $AJ -X DELETE $BASE/courses/$COID)" = "409" ]; check "course with a paying customer cannot be hard-deleted" $?
curl -s -m 5 -b $AJ -X PUT $BASE/courses/$COID -H 'Content-Type: application/json' -d '{"status":"ARCHIVED"}' | js "j.success" | grep -q true; check "course can be archived instead" $?

C2=$(curl -s -m 5 -b $AJ -X POST $BASE/courses -H 'Content-Type: application/json' -d '{"name":"disposable","priceToman":1,"modules":[]}')
C2ID=$(echo "$C2" | js "j.data.id")
[ "$(code -b $AJ -X DELETE $BASE/courses/$C2ID)" = "200" ]; check "course with no paying customers deletes cleanly" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
