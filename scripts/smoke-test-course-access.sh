#!/bin/bash
# Course access smoke test: entitlement is server-derived from PAID orders.
#   rm -f server/data/db.json && bash scripts/smoke-test-course-access.sh
cd "$(dirname "$0")/.."
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
code() { curl -s -o /dev/null -w "%{http_code}" -m 5 "$@"; }

(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/ca_server.log 2>&1 &)
for i in $(seq 1 20); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done
JAR=/tmp/ca_jar.txt; AJAR=/tmp/ca_ajar.txt; rm -f $JAR $AJAR
login() { # jar mobile
  R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H 'Content-Type: application/json' -d "{\"mobile\":\"$2\"}")
  C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
  curl -s -m 5 -c $1 -X POST $BASE/auth/otp/verify -H 'Content-Type: application/json' -d "{\"mobile\":\"$2\",\"code\":\"$C\"}" >/dev/null
}
login $JAR 09125550001
curl -s -m 5 -c $AJAR -X POST $BASE/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}' >/dev/null

COURSES=$(curl -s -m 5 $BASE/courses)
CID=$(echo "$COURSES" | js "j.data.find(c=>c.modules.some(m=>m.lessons.some(l=>!l.isPreview))).id")
PAIDL=$(echo "$COURSES" | js "j.data.find(c=>c.id==='$CID').modules.flatMap(m=>m.lessons).find(l=>!l.isPreview).id")
PREVL=$(echo "$COURSES" | js "(j.data.flatMap(c=>c.modules.flatMap(m=>m.lessons.map(l=>({c:c.id,l})))).find(x=>x.l.isPreview)||{c:'',l:{id:''}}).l.id")
PREVC=$(echo "$COURSES" | js "(j.data.flatMap(c=>c.modules.flatMap(m=>m.lessons.map(l=>({c:c.id,l})))).find(x=>x.l.isPreview)||{c:'',l:{id:''}}).c")

[ "$(code -b $JAR $BASE/me/enrollments)" = "200" ]; check "/me/enrollments works for signed-in user" $?
[ "$(code $BASE/me/enrollments)" = "401" ]; check "/me/enrollments requires auth" $?
curl -s -m 5 -b $JAR $BASE/me/enrollments | js "j.courseIds.length===0?'ok':'bad'" | grep -q ok; check "new user has NO enrollments (no free demo grant)" $?

[ "$(code $BASE/courses/$CID/lessons/$PAIDL)" = "401" ]; check "paid lesson: anonymous -> 401" $?
[ "$(code -b $JAR $BASE/courses/$CID/lessons/$PAIDL)" = "403" ]; check "paid lesson: signed-in but not purchased -> 403" $?
if [ -n "$PREVL" ]; then [ "$(code $BASE/courses/$PREVC/lessons/$PREVL)" = "200" ]; check "free-preview lesson: anonymous -> 200" $?; fi
[ "$(code $BASE/courses/$CID/lessons/nope)" = "404" ]; check "unknown lesson -> 404" $?
[ "$(code -b $AJAR $BASE/courses/$CID/lessons/$PAIDL)" = "200" ]; check "admin can open any lesson" $?

# Purchase the course through the real order + payment flow
O=$(curl -s -m 5 -b $JAR -X POST $BASE/orders -H 'Content-Type: application/json' -d "{\"cartItems\":[{\"type\":\"ONLINE_COURSE\",\"courseId\":\"$CID\",\"quantity\":1}]}")
OID=$(echo "$O" | js "j.order.id")
curl -s -m 5 -b $JAR $BASE/me/enrollments | js "j.courseIds.includes('$CID')?'bad':'ok'" | grep -q ok; check "unpaid order grants NO access" $?
[ "$(code -b $JAR $BASE/courses/$CID/lessons/$PAIDL)" = "403" ]; check "lesson still 403 while order unpaid" $?
AUTH=$(curl -s -m 5 -b $JAR -X POST $BASE/payments/request -H 'Content-Type: application/json' -d "{\"orderId\":\"$OID\"}" | js "j.authority")
code "$BASE/payments/verify?Authority=$AUTH&Status=OK&orderId=$OID" >/dev/null
curl -s -m 5 -b $JAR $BASE/me/enrollments | js "j.courseIds.includes('$CID')?'ok':'bad'" | grep -q ok; check "PAID order grants access" $?
[ "$(code -b $JAR $BASE/courses/$CID/lessons/$PAIDL)" = "200" ]; check "paid lesson -> 200 after payment" $?

# Another user must not inherit access
login /tmp/ca_jar2.txt 09125550002
[ "$(code -b /tmp/ca_jar2.txt $BASE/courses/$CID/lessons/$PAIDL)" = "403" ]; check "different user still 403" $?

# Refund revokes access
curl -s -m 5 -b $AJAR -X PUT $BASE/orders/$OID/status -H 'Content-Type: application/json' -d '{"status":"REFUND_PENDING"}' >/dev/null
[ "$(code -b $JAR $BASE/courses/$CID/lessons/$PAIDL)" = "403" ]; check "refund pending revokes lesson access" $?
curl -s -m 5 -b $JAR $BASE/me/enrollments | js "j.courseIds.includes('$CID')?'bad':'ok'" | grep -q ok; check "refund pending removes enrollment" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
