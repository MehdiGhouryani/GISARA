#!/bin/bash
# Academy admin CRUD + publishing rules + public/paid media exposure.
#   rm -f server/data/db.json && bash scripts/smoke-test-academy.sh
cd "$(dirname "$0")/.."
pkill -f "[t]sx server.ts" 2>/dev/null
BASE=http://localhost:3000/api; PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log($1)})"; }
H='Content-Type: application/json'
(nohup npx tsx server.ts > /tmp/academy_server.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done
A=/tmp/ac_a.txt; rm -f $A
curl -s -m 5 -c $A -X POST $BASE/auth/admin/login -H "$H" -d '{"passcode":"gisara2026"}' >/dev/null

NAME="دوره آزمایشی $RANDOM"
C=$(curl -s -m 5 -b $A -X POST $BASE/courses -H "$H" -d "{\"name\":\"$NAME\",\"priceToman\":900000,\"status\":\"DRAFT\",\"modules\":[]}")
CID=$(echo "$C" | js "j.data.id"); [ -n "$CID" ] && [ "$CID" != "undefined" ]; check "draft course without lessons can be created" $?
S1=$(echo "$C" | js "j.data.slug")

R=$(curl -s -m 5 -b $A -X PUT $BASE/courses/$CID -H "$H" -d '{"status":"PUBLISHED"}' | js "j.success"); [ "$R" = "false" ]; check "publishing an empty course is rejected (merged-state rule)" $?
R=$(curl -s -m 5 -b $A -X POST $BASE/courses -H "$H" -d '{"name":"خالی","priceToman":1,"status":"PUBLISHED","modules":[]}' | js "j.success"); [ "$R" = "false" ]; check "creating an empty PUBLISHED course is rejected" $?

D=$(curl -s -m 5 -b $A -X POST $BASE/courses -H "$H" -d "{\"name\":\"$NAME\",\"priceToman\":1,\"modules\":[]}")
[ "$(echo "$D" | js "j.data.slug")" != "$S1" ]; check "same name gets a different unique slug" $?

BODY='{"status":"PUBLISHED","heroImage":"/assets/x.jpg","modules":[{"id":"m1","title":"فصل ۱","lessons":[{"id":"l-free","title":"رایگان","durationMinutes":5,"isPreview":true,"videoUrl":"https://cdn.example.com/free.mp4"},{"id":"l-paid","title":"پولی","durationMinutes":7,"isPreview":false,"videoUrl":"https://cdn.example.com/paid.mp4"}]}]}'
curl -s -m 5 -b $A -X PUT $BASE/courses/$CID -H "$H" -d "$BODY" | js "j.success" | grep -q true; check "course with lessons can be published" $?
curl -s -m 5 $BASE/courses | js "j.data.some(c=>c.id==='$CID')" | grep -q true; check "published course appears in the public catalogue" $?
curl -s -m 5 $BASE/courses | js "(()=>{const c=j.data.find(c=>c.id==='$CID');const l=c.modules[0].lessons;return l[0].videoUrl!==undefined && l[1].videoUrl===undefined})()" | grep -q true; check "public catalogue exposes the preview video only, never the paid one" $?
curl -s -m 5 -b $A $BASE/admin/courses | js "j.data.find(c=>c.id==='$CID').modules[0].lessons[1].videoUrl" | grep -q "paid.mp4"; check "admin list includes every video URL" $?
curl -s -m 5 $BASE/admin/courses | js "j.success" | grep -q false; check "admin course list requires admin" $?
curl -s -m 5 -b $A $BASE/courses/$CID | head -c 1 >/dev/null
DUP='{"modules":[{"id":"m1","title":"x","lessons":[{"id":"same","title":"a"},{"id":"same","title":"b"}]}]}'
R=$(curl -s -m 5 -b $A -X PUT $BASE/courses/$CID -H "$H" -d "$DUP" | js "j.success"); [ "$R" = "false" ]; check "duplicate lesson ids are rejected" $?
R=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -b $A -X DELETE $BASE/courses/$CID); [ "$R" = "200" ]; check "unpurchased course can be deleted" $?
curl -s -m 5 $BASE/courses | js "j.data.some(c=>c.id==='$CID')" | grep -q false; check "deleted course disappears from the public catalogue" $?
echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
