import fs from 'fs';
import path from 'path';

const MAX_ITEMS_PER_COLLECTION = 5000;
const MAX_DEPTH = 12;
const MAX_NODES = 400_000;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Collections the importer restores. Everything else in a backup file is reported as ignored. */
export const IMPORTABLE_COLLECTIONS = ['styles', 'techniques', 'articles', 'products', 'courses', 'orders', 'requests'] as const;
export type ImportableCollection = (typeof IMPORTABLE_COLLECTIONS)[number];

const ORDER_STATUSES = new Set([
  'PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'REFUND_PENDING', 'REFUNDED'
]);

export interface ImportValidation {
  ok: boolean;
  errors: string[];
  data: Partial<Record<ImportableCollection, any[]>>;
  counts: Partial<Record<ImportableCollection, number>>;
  ignored: string[];
}

const isObj = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isMoney = (v: any) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e12;
const isCount = (v: any) => Number.isInteger(v) && v >= 0 && v <= 1e9;

/** Rejects prototype-pollution keys and pathological nesting/size anywhere in the payload. */
function scanStructure(root: any, errors: string[]): void {
  let nodes = 0;
  const walk = (v: any, depth: number, where: string) => {
    if (errors.length >= 20) return;
    if (++nodes > MAX_NODES) { errors.push('حجم فایل پشتیبان بیش از حد مجاز است.'); return; }
    if (depth > MAX_DEPTH) { errors.push(`عمق ساختار در ${where} بیش از حد مجاز است.`); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, depth + 1, `${where}[${i}]`)); return; }
    if (isObj(v)) {
      for (const k of Object.keys(v)) {
        if (FORBIDDEN_KEYS.has(k)) { errors.push(`کلید غیرمجاز «${k}» در ${where}`); continue; }
        walk(v[k], depth + 1, `${where}.${k}`);
      }
    }
  };
  walk(root, 0, 'root');
}

function validateItem(col: ImportableCollection, item: any, idx: number, errors: string[]): void {
  const at = `${col}[${idx}]`;
  if (!isObj(item)) { errors.push(`${at}: باید یک شیء باشد.`); return; }
  if (typeof item.id !== 'string' || !item.id || item.id.length > 200) { errors.push(`${at}: شناسه (id) نامعتبر است.`); return; }

  if (col === 'products') {
    if (typeof item.name !== 'string' || !item.name) errors.push(`${at}: نام محصول نامعتبر است.`);
    if (!isMoney(item.priceToman)) errors.push(`${at}: قیمت نامعتبر است.`);
    if (!isCount(item.stock)) errors.push(`${at}: موجودی باید عدد صحیح نامنفی باشد.`);
  } else if (col === 'courses') {
    if (typeof item.name !== 'string' || !item.name) errors.push(`${at}: نام دوره نامعتبر است.`);
    if (!isMoney(item.priceToman)) errors.push(`${at}: قیمت نامعتبر است.`);
    if (!Array.isArray(item.modules)) errors.push(`${at}: modules باید آرایه باشد.`);
    else {
      item.modules.forEach((m: any, mi: number) => {
        if (!isObj(m) || !Array.isArray(m.lessons)) errors.push(`${at}.modules[${mi}]: ساختار ماژول نامعتبر است.`);
        else m.lessons.forEach((l: any, li: number) => {
          if (!isObj(l) || typeof l.id !== 'string' || !l.id) errors.push(`${at}.modules[${mi}].lessons[${li}]: شناسه درس نامعتبر است.`);
          else if (l.videoUrl !== undefined && (typeof l.videoUrl !== 'string' || !/^https:\/\/|^\/uploads\//.test(l.videoUrl))) {
            errors.push(`${at}.modules[${mi}].lessons[${li}]: videoUrl باید https یا مسیر داخلی باشد.`);
          }
        });
      });
    }
  } else if (col === 'orders') {
    if (!ORDER_STATUSES.has(item.status)) errors.push(`${at}: وضعیت سفارش نامعتبر است.`);
    if (!isMoney(item.payableToman)) errors.push(`${at}: مبلغ قابل پرداخت نامعتبر است.`);
    if (!Array.isArray(item.items)) errors.push(`${at}: items باید آرایه باشد.`);
  }
}

/**
 * Validates a backup payload completely BEFORE anything is applied, so an import is
 * all-or-nothing (the old code assigned collection by collection with no checks).
 */
export function validateImport(payload: any): ImportValidation {
  const errors: string[] = [];
  const result: ImportValidation = { ok: false, errors, data: {}, counts: {}, ignored: [] };

  if (!isObj(payload)) { errors.push('ساختار فایل پشتیبان معتبر نیست.'); return result; }
  scanStructure(payload, errors);
  if (errors.length) return result;

  for (const key of Object.keys(payload)) {
    if (!(IMPORTABLE_COLLECTIONS as readonly string[]).includes(key)) result.ignored.push(key);
  }

  for (const col of IMPORTABLE_COLLECTIONS) {
    const arr = payload[col];
    if (arr === undefined) continue;
    if (!Array.isArray(arr)) { errors.push(`${col}: باید آرایه باشد.`); continue; }
    if (arr.length > MAX_ITEMS_PER_COLLECTION) { errors.push(`${col}: تعداد آیتم‌ها بیش از ${MAX_ITEMS_PER_COLLECTION} است.`); continue; }
    const seen = new Set<string>();
    arr.forEach((item, i) => {
      if (errors.length >= 20) return;
      validateItem(col, item, i, errors);
      if (isObj(item) && typeof item.id === 'string') {
        if (seen.has(item.id)) errors.push(`${col}[${i}]: شناسه تکراری «${item.id}».`);
        seen.add(item.id);
      }
    });
    result.data[col] = arr;
    result.counts[col] = arr.length;
  }

  if (Object.keys(result.data).length === 0 && errors.length === 0) {
    errors.push('فایل پشتیبان هیچ مجموعهٔ قابل بازیابی‌ای ندارد.');
  }
  result.ok = errors.length === 0;
  return result;
}

/** Writes a full pre-import snapshot (kept separate from the throttled rotating backups). */
export function snapshotBeforeImport(state: Record<string, any>): string {
  const dir = path.resolve(process.cwd(), 'server', 'data', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `pre_import_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(state), 'utf-8');

  const old = fs.readdirSync(dir).filter(f => f.startsWith('pre_import_')).sort();
  for (const f of old.slice(0, Math.max(0, old.length - 5))) {
    try { fs.unlinkSync(path.join(dir, f)); } catch { /* best effort */ }
  }
  return path.basename(file);
}
