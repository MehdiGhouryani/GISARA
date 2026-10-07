#!/bin/bash
# Phase-2 hardening smoke test: DB import safety + production CSP/headers + production admin login.
#   bash scripts/smoke-test-hardening.sh
cd "$(dirname "$0")/.."
# Make suites order-independent: stop any leftover server and wait until its ports are free.
pkill -f "[t]sx server.ts" 2>/dev/null
for i in $(seq 1 20); do
  curl -s -m 1 http://localhost:3000/api/health >/dev/null 2>&1 || curl -s -m 1 http://localhost:3100/api/health >/dev/null 2>&1 || break
  sleep 0.5
done
PASS=0; FAIL=0
check() { if [ "$2" -eq 0 ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; FAIL=$((FAIL+1)); fi; }
js() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log($1)})"; }
code() { curl -s -o /dev/null -w "%{http_code}" -m 8 "$@"; }
wait_up() { for i in $(seq 1 25); do curl -s -m 1 "$1/health" >/dev/null && return 0; sleep 1; done; return 1; }

PART=${PART:-both}
if [ "$PART" != "B" ]; then
########## Part A: DB import (dev mode, port 3000) ##########
rm -f server/data/db.json; rm -f server/data/backups/pre_import_*.json
(ALLOW_DEV_AUTH=1 nohup npx tsx server.ts > /tmp/h_dev.log 2>&1 &)
wait_up http://localhost:3000/api
A=http://localhost:3000/api
AJ=/tmp/h_admin.txt; UJ=/tmp/h_user.txt; rm -f $AJ $UJ
curl -s -m 5 -c $AJ -X POST $A/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}' >/dev/null
R=$(curl -s -m 5 -X POST $A/auth/otp/request -H 'Content-Type: application/json' -d '{"mobile":"09127770001"}')
C=$(echo "$R" | grep -oE '[0-9]{6}' | head -1)
curl -s -m 5 -c $UJ -X POST $A/auth/otp/verify -H 'Content-Type: application/json' -d "{\"mobile\":\"09127770001\",\"code\":\"$C\"}" >/dev/null

[ "$(code -X POST $A/admin/db/import -H 'Content-Type: application/json' -d '{"products":[]}')" != "200" ]; check "anonymous import rejected" $?
[ "$(code -b $UJ -X POST $A/admin/db/import -H 'Content-Type: application/json' -d '{"products":[]}')" = "403" ]; check "non-admin import rejected (403)" $?

N0=$(curl -s -m 5 $A/products | js "j.data.length")
BAD='{"products":[{"id":"evil","name":"x","priceToman":-5,"stock":1}]}'
[ "$(code -b $AJ -X POST $A/admin/db/import -H 'Content-Type: application/json' -d "$BAD")" = "400" ]; check "invalid backup rejected (400)" $?
[ "$(curl -s -m 5 $A/products | js "j.data.length")" = "$N0" ]; check "rejected import changed nothing" $?

# Round trip: a real export must be restorable, and unsupported collections must be reported
curl -s -m 8 -b $AJ $A/admin/db/export -o /tmp/h_export.json
grep -q '"otps"\|"apiKey"\|"merchantId"\|"settings"' /tmp/h_export.json; [ $? -ne 0 ]; check "export contains no OTPs / secrets / settings (payment intents ARE included so a restore is complete)" $?
RES=$(curl -s -m 8 -b $AJ -X POST $A/admin/db/import -H 'Content-Type: application/json' --data-binary @/tmp/h_export.json)
echo "$RES" | js "j.success" | grep -q true; check "real export round-trips through import" $?
echo "$RES" | js "j.ignoredCollections.length>0" | grep -q true; check "import reports collections it does not restore" $?
SNAP=$(echo "$RES" | js "j.previousStateSnapshot")
[ -f "server/data/backups/$SNAP" ]; check "pre-import snapshot file written" $?
curl -s -m 5 -b $AJ $A/admin/audit-logs 2>/dev/null | grep -q "بازیابی دیتابیس" || curl -s -m 5 -b $AJ $A/audit-logs | grep -q "بازیابی دیتابیس"; check "import recorded in audit log" $?
curl -s -m 5 $A/products | js "j.data.length" | grep -q "^$N0$"; check "data intact after round trip" $?
pkill -f "[t]sx server.ts"; sleep 1

fi

if [ "$PART" != "A" ]; then
########## Part B: production headers (port 3100) ##########
HASH=$(node scripts/hash-admin-password.js "prod-test-passcode-1" | grep ADMIN_PASSWORD_HASH | cut -d= -f2)
rm -f server/data/db.json
(NODE_ENV=production PORT=3100 JWT_SECRET=0123456789abcdef0123456789abcdef0123 ADMIN_PASSWORD_HASH="$HASH" nohup npx tsx server.ts > /tmp/h_prod.log 2>&1 &)
wait_up http://localhost:3100/api
P=http://localhost:3100
H=$(curl -s -m 5 -D - -o /dev/null $P/)
CSP=$(echo "$H" | grep -i '^content-security-policy' | tr -d '\r')
echo "$CSP" | grep -qi "script-src 'self'"; check "prod CSP: script-src 'self'" $?
echo "$CSP" | grep -qi "unsafe-eval"; [ $? -ne 0 ]; check "prod CSP: no unsafe-eval anywhere" $?
SS=$(echo "$CSP" | tr ';' '\n' | grep -i "script-src"); echo "$SS" | grep -qi "unsafe-inline"; [ $? -ne 0 ]; check "prod CSP: script-src has no unsafe-inline" $?
echo "$CSP" | grep -qi "object-src 'none'"; check "prod CSP: object-src 'none'" $?
echo "$CSP" | grep -qi "frame-ancestors 'self'"; check "prod CSP: frame-ancestors 'self'" $?
echo "$CSP" | grep -qi "frame-ancestors[^;]*\*"; [ $? -ne 0 ]; check "prod CSP: no wildcard frame-ancestors" $?
echo "$H" | grep -qi '^x-frame-options: SAMEORIGIN'; check "prod: X-Frame-Options SAMEORIGIN" $?
echo "$H" | grep -qi '^strict-transport-security'; check "prod: HSTS present" $?
[ "$(code $P/)" = "200" ]; check "prod serves the app shell (200)" $?
[ "$(code -X POST $P/api/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"gisara2026"}')" = "401" ]; check "prod: dev passcode gisara2026 REJECTED" $?
[ "$(code -X POST $P/api/auth/admin/login -H 'Content-Type: application/json' -d '{"passcode":"prod-test-passcode-1"}')" = "200" ]; check "prod: hashed admin passcode accepted" $?
# Unconfigured SMS in production must fail closed: 503 and NO code anywhere in the response
OTPR=$(curl -s -m 8 -w "\n%{http_code}" -X POST $P/api/auth/otp/request -H 'Content-Type: application/json' -d '{"mobile":"09120001111"}')
[ "$(echo "$OTPR" | tail -1)" = "503" ]; check "prod: OTP request fails closed (503) when SMS unconfigured" $?
echo "$OTPR" | head -1 | grep -qE '[0-9]{6}'; [ $? -ne 0 ]; check "prod: OTP response contains no 6-digit code" $?
pkill -f "[t]sx server.ts"

fi

echo "-----"; echo "passed: $PASS  failed: $FAIL"
[ $FAIL -eq 0 ]
