import crypto from 'crypto';

/** Collision-safe identifier (replaces Date.now()-based ids that collide within one millisecond). */
export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

/** Human-friendly order number, unique among the supplied existing numbers. */
export function newOrderNumber(existing: Iterable<string>): string {
  const taken = new Set(existing);
  for (let i = 0; i < 20; i++) {
    const candidate = `GSR-${crypto.randomInt(10_000_000, 100_000_000)}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `GSR-${Date.now()}`;
}

/** Public, stable, searchable user identifier, e.g. "U-7K3QX9PD" (no ambiguous characters). */
export function newUserCode(existing: Iterable<string> = []): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const taken = new Set(existing);
  for (let i = 0; i < 20; i++) {
    let s = '';
    for (let k = 0; k < 8; k++) s += alphabet[crypto.randomInt(alphabet.length)];
    const code = `U-${s}`;
    if (!taken.has(code)) return code;
  }
  return `U-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}
