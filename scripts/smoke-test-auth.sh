#!/bin/bash
# OTP throttling/locking, digit normalisation, stable user codes, profile, split admin/user cookies, admin user lookup.
#   rm -f server/data/db.json && bash scripts/smoke-test-auth.sh
cd "$(dirname "$0")/.."
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1; rm -f server/data/*.tmp
BASE=http://localhost:3000/api; PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{let j;try{j=JSON.parse(d)}catch(e){console.log('PARSE_ERROR');return}console.log($1)})"; }
H='Content-Type: application/json'
(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/auth_server.log 2>&1 &)
for i in $(seq 1 25); do curl -s -m 1 $BASE/health >/dev/null && break; sleep 1; done
toFa() { node -e "console.log(process.argv[1].replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]))" "$1"; }

MA=09128880001; MB=09128880002; MC=09128880003
UA=/tmp/au_a.txt; JAR=/tmp/au_mix.txt; rm -f $UA $JAR

# --- 1. request with Persian digits + cooldown
R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H "$H" -d "{\"mobile\":\"$(toFa $MA)\"}")
echo "$R" | js "j.success" | grep -q true; check "OTP request accepts a Persian-digit mobile" $?
echo "$R" | js "j.cooldownSec" | grep -q "^60$"; check "response tells the client the resend cooldown (60s)" $?
CODE_A=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
CODE=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X POST $BASE/auth/otp/request -H "$H" -d "{\"mobile\":\"$MA\"}")
[ "$CODE" = "429" ]; check "second request within 60s for the same number -> 429" $?
curl -s -m 5 -D - -o /dev/null -X POST $BASE/auth/otp/request -H "$H" -d "{\"mobile\":\"$MA\"}" | grep -qi "^retry-after:"; check "429 carries a Retry-After header" $?

# --- 2. wrong code then correct code typed with Persian digits
R=$(curl -s -m 5 -X POST $BASE/auth/otp/verify -H "$H" -d "{\"mobile\":\"$MA\",\"code\":\"000000\"}")
echo "$R" | js "j.reason+':'+j.attemptsLeft" | grep -q "^invalid:4$"; check "wrong code -> invalid with 4 attempts left" $?
R=$(curl -s -m 5 -c $UA -X POST $BASE/auth/otp/verify -H "$H" -d "{\"mobile\":\"$MA\",\"code\":\"$(toFa $CODE_A)\"}")
echo "$R" | js "j.success" | grep -q true; check "correct code typed in Persian digits logs in" $?
UCODE=$(echo "$R" | js "j.user.userCode")
echo "$UCODE" | grep -qE '^U-[A-HJKMNP-Z2-9]{8}$'; check "login returns a unique user code (U-XXXXXXXX)" $?

# --- 3. /auth/me content
ME=$(curl -s -m 5 -b $UA $BASE/auth/me)
echo "$ME" | js "j.user.userCode" | grep -q "^$UCODE$"; check "/auth/me returns the same user code" $?
echo "$ME" | js "Object.keys(j.user).includes('exp')" | grep -q false; check "/auth/me exposes no token internals (exp)" $?
curl -s -m 5 -c $UA -b $UA $BASE/auth/me | js "j.user.mobile" | grep -q "^$MA$"; check "session cookie accepted" $?

# --- 4. profile
R=$(curl -s -m 5 -b $UA -X PUT $BASE/me/profile -H "$H" -d '{"name":"  مریم  احمدی "}')
echo "$R" | js "j.success" | grep -q true; check "profile name can be changed" $?
curl -s -m 5 -b $UA $BASE/auth/me | js "j.user.name" | grep -q "احمدی"; check "new name is what /auth/me returns afterwards" $?
curl -s -m 5 -b $UA $BASE/auth/me | js "j.user.userCode" | grep -q "^$UCODE$"; check "user code does not change when the name changes" $?
R=$(curl -s -m 5 -b $UA -X PUT $BASE/me/profile -H "$H" -d '{"name":"x"}' | js "j.success"); [ "$R" = "false" ]; check "1-character name rejected" $?
R=$(curl -s -m 5 -b $UA -X PUT $BASE/me/profile -H "$H" -d '{"avatar":"http://evil.example/a.png"}' | js "j.success"); [ "$R" = "false" ]; check "non-https avatar URL rejected" $?
R=$(curl -s -m 5 -b $UA -X PUT $BASE/me/profile -H "$H" -d '{"avatar":"javascript:alert(1)"}' | js "j.success"); [ "$R" = "false" ]; check "javascript: avatar URL rejected" $?
CODE=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -X PUT $BASE/me/profile -H "$H" -d '{"name":"بدون ورود"}'); [ "$CODE" = "401" ]; check "profile update requires login" $?

# --- 5. lockout after 5 wrong codes
curl -s -m 5 -X POST $BASE/auth/otp/request -H "$H" -d "{\"mobile\":\"$MB\"}" >/dev/null
LAST=""
for i in 1 2 3 4 5; do LAST=$(curl -s -m 5 -X POST $BASE/auth/otp/verify -H "$H" -d "{\"mobile\":\"$MB\",\"code\":\"11111$i\"}" | js "j.reason"); done
[ "$LAST" = "locked" ]; check "5th wrong attempt locks the code" $?

# --- 6. admin + customer sessions coexist in one browser
curl -s -m 5 -c $JAR -X POST $BASE/auth/admin/login -H "$H" -d '{"passcode":"gisara2026"}' >/dev/null
R=$(curl -s -m 5 -X POST $BASE/auth/otp/request -H "$H" -d "{\"mobile\":\"$MC\"}"); CODE_C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
curl -s -m 5 -b $JAR -c $JAR -X POST $BASE/auth/otp/verify -H "$H" -d "{\"mobile\":\"$MC\",\"code\":\"$CODE_C\"}" >/dev/null
grep -q "gisara_admin" $JAR && grep -q "gisara_token" $JAR; check "browser holds BOTH an admin cookie and a customer cookie" $?
curl -s -m 5 -b $JAR $BASE/admin/users | js "j.success" | grep -q true; check "customer login did not end the admin session" $?
curl -s -m 5 -b $JAR $BASE/auth/me | js "j.user.mobile" | grep -q "^$MC$"; check "storefront identity stays the customer" $?
N_USER=$(curl -s -m 5 -b $JAR $BASE/orders | js "j.data.length")
N_ADMIN=$(curl -s -m 5 -b $JAR -H "X-Admin-Context: 1" $BASE/orders | js "j.data.length")
[ "$N_USER" -lt "$N_ADMIN" ]; check "admin console sees all orders only with the admin-context header" $?

# --- 7. admin lookup by user code / mobile / name
ADM=/tmp/au_admin.txt; rm -f $ADM
curl -s -m 5 -c $ADM -X POST $BASE/auth/admin/login -H "$H" -d '{"passcode":"gisara2026"}' >/dev/null
curl -s -m 5 -b $ADM "$BASE/admin/users?q=$UCODE" | js "j.data.length+':'+j.data[0].userCode" | grep -q "^1:$UCODE$"; check "admin finds a customer by user code" $?
curl -s -m 5 -b $ADM "$BASE/admin/users?q=$(echo $UCODE | tr 'A-Z' 'a-z')" | js "j.data.length" | grep -q "^1$"; check "user-code search is case-insensitive" $?
curl -s -m 5 -b $ADM -G --data-urlencode "q=$(toFa $MA)" "$BASE/admin/users" | js "j.data[0].mobile" | grep -q "^$MA$"; check "admin finds a customer by Persian-digit mobile" $?
curl -s -m 5 -b $ADM -G --data-urlencode "q=احمدی" "$BASE/admin/users" | js "j.data.some(u=>u.userCode==='$UCODE')" | grep -q true; check "admin finds a customer by name" $?
D=$(curl -s -m 5 -b $ADM $BASE/admin/users/$UCODE)
echo "$D" | js "Array.isArray(j.data.orders)&&Array.isArray(j.data.courses)&&Array.isArray(j.data.requests)" | grep -q true; check "detail view returns orders, courses and requests" $?
curl -s -m 5 -b $ADM $BASE/admin/users/U-NOPE0000 -o /dev/null -w "%{http_code}" | grep -q 404; check "unknown user code -> 404" $?
CODE=$(curl -s -m 5 -o /dev/null -w "%{http_code}" -b $UA "$BASE/admin/users?q=a"); [ "$CODE" = "403" ]; check "a customer cannot use the admin user lookup" $?
CODE=$(curl -s -m 5 -o /dev/null -w "%{http_code}" "$BASE/admin/users?q=a"); [ "$CODE" = "403" ]; check "anonymous cannot use the admin user lookup" $?

# --- 8. nothing sensitive reaches disk
sleep 1.2
grep -q '"otps"' server/data/db.json; [ $? -ne 0 ]; check "no OTP data is persisted to db.json" $?

echo "-----"; echo "passed: $PASS  failed: $FAIL"
pkill -f "[t]sx server.ts" 2>/dev/null; sleep 1
[ $FAIL -eq 0 ]
