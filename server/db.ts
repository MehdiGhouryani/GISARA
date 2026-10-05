import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serverCache } from './cache';

// Import initial seed data from the front-end mockup
import {
  mockStyles,
  mockTechniques,
  mockArticles,
  mockProducts,
  mockCourses,
  mockInstructors,
  mockCities,
  mockSessions,
  mockInitialRequests,
  mockUserOrders,
  mockCoupons,
  mockCertificates,
} from '../src/data/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

export interface SystemSettings {
  payment: {
    provider: 'zarinpal' | 'idpay' | 'nextpay' | 'mock';
    merchantId: string;
    sandbox: boolean;
  };
  sms: {
    provider: 'kavenegar' | 'farazsms' | 'ghasedak' | 'mock';
    apiKey: string;
    patternCode: string;
  };
}

// Memory store structure
export interface DBStructure {
  styles: typeof mockStyles;
  techniques: typeof mockTechniques;
  articles: typeof mockArticles;
  products: typeof mockProducts;
  courses: typeof mockCourses;
  instructors: typeof mockInstructors;
  cities: typeof mockCities;
  sessions: typeof mockSessions;
  requests: typeof mockInitialRequests;
  orders: typeof mockUserOrders;
  coupons: typeof mockCoupons;
  certificates: typeof mockCertificates;
  settings: SystemSettings;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>;
  otps: Array<{
    mobile: string;
    code: string;
    expiresAt: number;
    attempts: number;
  }>;
  paymentIntents: Array<{
    id: string;
    orderId: string;
    amountToman: number;
    provider: string;
    providerAuthority: string;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
    createdAt: string;
    expiresAt: string;
    verifiedAt?: string;
  }>;
  manualEnrollments: Array<{
    id: string;
    userMobile: string;
    courseId: string;
    courseName: string;
    grantedAt: string;
    status: 'ACTIVE' | 'REVOKED';
  }>;
}

const defaultSettings: SystemSettings = {
  payment: {
    provider: 'zarinpal',
    merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
    sandbox: true
  },
  sms: {
    provider: 'kavenegar',
    apiKey: process.env.KAVENEGAR_API_KEY || '',
    patternCode: process.env.KAVENEGAR_PATTERN_CODE || 'otp_verify'
  }
};

// Initialize internal store with mock data as fallback
let store: DBStructure = {
  styles: [...mockStyles],
  techniques: [...mockTechniques],
  articles: [...mockArticles],
  products: [...mockProducts],
  courses: [...mockCourses],
  instructors: [...mockInstructors],
  cities: [...mockCities],
  sessions: [...mockSessions],
  requests: [...mockInitialRequests],
  orders: [...mockUserOrders],
  coupons: [...mockCoupons],
  certificates: [...mockCertificates],
  settings: defaultSettings,
  auditLogs: [],
  otps: [],
  paymentIntents: [],
  manualEnrollments: []
};

// Ensure directory and load file
export function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      
      // Merge keys to ensure schema updates don't break old files
      store = {
        styles: parsed.styles || [...mockStyles],
        techniques: parsed.techniques || [...mockTechniques],
        articles: parsed.articles || [...mockArticles],
        products: parsed.products || [...mockProducts],
        courses: parsed.courses || [...mockCourses],
        instructors: parsed.instructors || [...mockInstructors],
        cities: parsed.cities || [...mockCities],
        sessions: parsed.sessions || [...mockSessions],
        requests: parsed.requests || [...mockInitialRequests],
        orders: parsed.orders || [...mockUserOrders],
        coupons: parsed.coupons || [...mockCoupons],
        certificates: parsed.certificates || [...mockCertificates],
        settings: parsed.settings || defaultSettings,
        auditLogs: parsed.auditLogs || [],
        otps: parsed.otps || [],
        paymentIntents: parsed.paymentIntents || [],
        manualEnrollments: parsed.manualEnrollments || []
      };
      console.log('Database successfully loaded from persistent JSON file.');
    } else {
      saveDb();
      console.log('Database seeded and created at ' + DB_FILE);
    }
  } catch (err) {
    console.error('Failed to initialize database, using memory fallback:', err);
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
let isWriting = false;
let pendingSave = false;

export function saveDb(immediate = false) {
  if (immediate) {
    saveDbAsync();
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveDbAsync();
  }, 100);
}

async function saveDbAsync() {
  if (isWriting) {
    pendingSave = true;
    return;
  }

  isWriting = true;
  pendingSave = false;

  try {
    if (!fs.existsSync(DB_DIR)) {
      await fs.promises.mkdir(DB_DIR, { recursive: true });
    }

    const tmpPath = `${DB_FILE}.${Date.now()}_${Math.random().toString(36).substring(2, 6)}.tmp`;
    const jsonContent = JSON.stringify(store, null, 2);

    await fs.promises.writeFile(tmpPath, jsonContent, 'utf-8');
    await fs.promises.rename(tmpPath, DB_FILE);

    // Invalidate metrics cache to reflect changes instantly on the dashboard
    serverCache.invalidate('admin_dashboard_metrics');

    // Trigger rotating database backup securely
    await triggerDatabaseBackup(jsonContent);
  } catch (err) {
    console.error('[Database Queue] Failed to write atomic database file:', err);
    // Do not leave orphaned temp files behind after a failed write.
    try {
      const dir = path.dirname(DB_FILE);
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith(path.basename(DB_FILE) + '.') && f.endsWith('.tmp')) fs.unlinkSync(path.join(dir, f));
      }
    } catch { /* best effort */ }
  } finally {
    isWriting = false;
    if (pendingSave) {
      saveDbAsync();
    }
  }
}

let lastBackupTime = 0;
const BACKUPS_DIR = path.resolve(DB_DIR, 'backups');

async function triggerDatabaseBackup(jsonContent: string) {
  try {
    const now = Date.now();
    // 5-minute throttle for backup files to avoid excessive disk use
    if (now - lastBackupTime < 5 * 60 * 1000) {
      return;
    }

    if (!fs.existsSync(BACKUPS_DIR)) {
      await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.resolve(BACKUPS_DIR, `db_backup_${timestamp}.json`);
    await fs.promises.writeFile(backupFile, jsonContent, 'utf-8');
    lastBackupTime = now;
    console.log(`[Backup System] Created secure database backup: db_backup_${timestamp}.json`);

    // Keep only last 5 backups
    const files = await fs.promises.readdir(BACKUPS_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('db_backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, path: path.resolve(BACKUPS_DIR, f) }));

    if (backupFiles.length > 5) {
      // Sort older first (alphabetical sorting matches chronological perfectly because of ISO format)
      backupFiles.sort((a, b) => a.name.localeCompare(b.name));
      const filesToDelete = backupFiles.slice(0, backupFiles.length - 5);
      for (const file of filesToDelete) {
        await fs.promises.unlink(file.path);
        console.log(`[Backup System] Pruned old backup file: ${file.name}`);
      }
    }
  } catch (err: any) {
    console.error('[Backup System Error] Failed to generate or prune database backups:', err.message);
  }
}

// Expose store as reactive getters and modifiers
export const db = {
  get styles() { return store.styles; },
  set styles(val) { store.styles = val; saveDb(); },

  get techniques() { return store.techniques; },
  set techniques(val) { store.techniques = val; saveDb(); },

  get articles() { return store.articles; },
  set articles(val) { store.articles = val; saveDb(); },

  get products() { return store.products; },
  set products(val) { store.products = val; saveDb(); },

  get courses() { return store.courses; },
  set courses(val) { store.courses = val; saveDb(); },

  get instructors() { return store.instructors; },
  set instructors(val) { store.instructors = val; saveDb(); },

  get cities() { return store.cities; },
  set cities(val) { store.cities = val; saveDb(); },

  get sessions() { return store.sessions; },
  set sessions(val) { store.sessions = val; saveDb(); },

  get requests() { return store.requests; },
  set requests(val) { store.requests = val; saveDb(); },

  get orders() { return store.orders; },
  set orders(val) { store.orders = val; saveDb(); },

  get coupons() { return store.coupons; },
  set coupons(val) { store.coupons = val; saveDb(); },

  get certificates() { return store.certificates; },
  set certificates(val) { store.certificates = val; saveDb(); },

  get settings() { return store.settings; },
  set settings(val) { store.settings = val; saveDb(); },

  get auditLogs() { return store.auditLogs; },
  set auditLogs(val) { store.auditLogs = val; saveDb(); },

  get otps() { return store.otps; },
  set otps(val) { store.otps = val; saveDb(); },

  get paymentIntents() { return store.paymentIntents; },
  set paymentIntents(val) { store.paymentIntents = val; saveDb(); },

  get manualEnrollments() { return store.manualEnrollments; },
  set manualEnrollments(val) { store.manualEnrollments = val; saveDb(); }
};

/**
 * Synchronously persists the current state (atomic temp-file + rename). Used on
 * shutdown so a pending debounced save (up to 100ms of writes) is never lost when
 * the process is stopped by SIGTERM/SIGINT.
 */
export function flushDbSync(): boolean {
  try {
    if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null as any; }
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    const tmpPath = `${DB_FILE}.${Date.now()}_flush.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_FILE);
    return true;
  } catch (err) {
    console.error('[Database] Final flush failed:', err);
    return false;
  }
}

