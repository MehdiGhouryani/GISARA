#!/usr/bin/env node
/**
 * Generates an ADMIN_PASSWORD_HASH value for server/auth.ts.
 *
 * Usage:
 *   node scripts/hash-admin-password.js "your-new-admin-passcode"
 *
 * Copy the printed value into your environment/secret manager as
 * ADMIN_PASSWORD_HASH. Never commit the output to source control.
 */
import crypto from 'crypto';

const passcode = process.argv[2];

if (!passcode || passcode.length < 8) {
  console.error('Usage: node scripts/hash-admin-password.js "<passcode, min 8 chars>"');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(passcode, Buffer.from(salt, 'hex'), 64).toString('hex');

console.log('\nADMIN_PASSWORD_HASH=' + salt + ':' + hash + '\n');
console.log('Set this as an environment variable (ADMIN_PASSWORD_HASH) for the server process.');
console.log('Do not commit this value or the plaintext passcode to source control.\n');
