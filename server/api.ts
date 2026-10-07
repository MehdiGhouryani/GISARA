import { Router } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { db, saveDb } from './db';
import { createRateLimiter, sanitizeInput } from './security';
import { serverCache } from './cache';
import {
  requireAuth,
  requireAdmin,
  generateOTP,
  verifyOTP,
  authenticateAdmin,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  checkOtpRequestAllowed,
  discardOTP,
  ADMIN_COOKIE,
  OTP_COOLDOWN_SEC,
  OTP_TTL_SEC
} from './auth';
import { getOrCreateUser, updateUserProfile, findUserByCode, findUserByMobile, backfillUsersFromActivity } from './users';

import { Product, UserOrder, WorkshopRequest, Article, StyleModel } from '../src/types/domain';
import { sendSMS, sendOrderConfirmationSMS } from './sms';
import { requestPaymentGateway, verifyPaymentGateway } from './payment';
import { checkOrderTransition } from './orderStateMachine';
import { releaseReservedStock, releaseCouponUsage } from './orderLifecycle';
import { validateImport, snapshotBeforeImport, IMPORTABLE_COLLECTIONS } from './dbImport';
import { validateBody, shippingInfoSchema, profileUpdateSchema, orderStatusUpdateSchema, courseRuleIssues, productCreateSchema, productUpdateSchema, styleCreateSchema, styleUpdateSchema, courseCreateSchema, courseUpdateSchema, couponCreateSchema, couponUpdateSchema, certificateCreateSchema, settingsUpdateSchema, workshopRequestSchema, aiConsultationSchema, articleCreateSchema, articleUpdateSchema, techniqueCreateSchema, techniqueUpdateSchema, sessionCreateSchema, sessionUpdateSchema } from './validation';
import { getEntitledCourseIds, hasCourseAccess, toPublicCourse, findLesson } from './courseAccess';
import { isJalaliExpired, getTodayJalaliString } from './jalali';
import { computeTotals } from '../src/shared/pricing';
import { normalizeCode, normalizeMobile, digitsOnly } from '../src/shared/digits';
import { newId, newOrderNumber } from './ids';
import { toEngineParams } from './consultationInput';
import { computeKpis } from './kpis';
import { generateExpertStylingAdvice } from './expertStylingEngine';

export const apiRouter = Router();

// Rate limiters for sensitive endpoints
const otpLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'تعداد درخواست‌های پیامک بیش از حد مجاز است. لطفاً یک دقیقه صبر کنید.'
});

const loginLimiter = createRateLimiter({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 10,
  message: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۳ دقیقه دیگر دوباره تلاش کنید.'
});

// Public endpoints that are costly (AI provider quota) or enumerable (coupon codes).
const aiLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: 'تعداد درخواست‌های مشاوره هوشمند بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.'
});
const couponLimiter = createRateLimiter({
  windowMs: 3 * 60 * 1000,
  max: 20,
  message: 'تعداد بررسی کد تخفیف بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.'
});

// Independent rate limit for OTP verification attempts (separate from the
// request limiter above), per P0.2 of the audit plan.
const otpVerifyLimiter = createRateLimiter({
  windowMs: 3 * 60 * 1000,
  max: 10,
  message: 'تعداد تلاش‌های تایید کد بیش از حد مجاز است. لطفاً ۳ دقیقه دیگر دوباره تلاش کنید.'
});

const writeLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'درخواست‌های ارسالی بیش از حد سریع است.'
});

// Helper to log administrative actions
// Any successful write may change a dashboard number: drop the cached admin aggregates (never serve stale KPIs).
apiRouter.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.on('finish', () => { if (res.statusCode < 400) serverCache.invalidate('admin_'); });
  }
  next();
});

function logAdminAction(adminUser: string, action: string, details: string) {
  const newLog = {
    id: newId('audit'),
    timestamp: new Date().toISOString(),
    action,
    user: adminUser,
    details
  };
  db.auditLogs = [newLog, ...db.auditLogs];
}

// -----------------------------------------------------------------------------
// 1. Health & Ping
// -----------------------------------------------------------------------------
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GisAra Core Backend is fully operational.',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// 2. Authentication & OTP Routes
// -----------------------------------------------------------------------------

// Request OTP SMS
apiRouter.post('/auth/otp/request', otpLimiter, async (req: any, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  if (!mobile) {
    return res.status(400).json({ success: false, message: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).' });
  }

  // Per-number throttle: protects a victim's phone from being flooded even by many different IPs.
  const allowed = checkOtpRequestAllowed(mobile);
  if (!allowed.ok) {
    res.setHeader('Retry-After', String(allowed.retryAfterSec));
    return res.status(429).json({
      success: false,
      retryAfterSec: allowed.retryAfterSec,
      message: allowed.reason === 'cooldown'
        ? `کد قبلی هنوز معتبر است. ${allowed.retryAfterSec} ثانیه دیگر می‌توانید کد جدید بگیرید.`
        : 'تعداد درخواست‌های کد برای این شماره زیاد بود. حدود یک ساعت دیگر دوباره تلاش کنید.'
    });
  }

  const code = generateOTP(mobile);
  const smsResult = await sendSMS(mobile, code);

  if (!smsResult.success) {
    // Delivery failed / SMS not configured: discard the code so it can never be used, and do not
    // count this attempt against the person's cooldown.
    discardOTP(mobile);
    return res.status(503).json({ success: false, message: 'ارسال پیامک در حال حاضر ممکن نیست. لطفاً کمی بعد دوباره تلاش کنید.' });
  }

  // The code must never be returned to the client — it only ever travels from the server to the SMS
  // provider to the user's phone. In non-production "simulated_dev" mode, sendSMS() echoes the code
  // into its own `message` field so local testing still works without an SMS provider.
  res.json({
    success: true,
    cooldownSec: OTP_COOLDOWN_SEC,
    expiresInSec: OTP_TTL_SEC,
    message: process.env.NODE_ENV === 'production' ? 'کد تایید پیامکی ارسال شد.' : (smsResult.message || 'کد تایید پیامکی صادر گردید.'),
    smsProvider: smsResult.provider
  });
});

// Verify OTP SMS
apiRouter.post('/auth/otp/verify', otpVerifyLimiter, (req, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  const code = digitsOnly(req.body?.code);
  if (!mobile || !code) {
    return res.status(400).json({ success: false, message: 'شماره موبایل و کد تایید الزامی هستند.' });
  }

  const result = verifyOTP(mobile, code);
  if (!result.ok) {
    const message =
      result.reason === 'expired'
        ? 'کد منقضی شده است. کد جدید دریافت کنید.'
        : result.reason === 'locked'
        ? 'تعداد تلاش‌های مجاز تمام شد. کد جدید دریافت کنید.'
        : `کد وارد شده درست نیست. ${result.attemptsLeft} فرصت باقی مانده است.`;
    return res.status(400).json({ success: false, reason: result.reason, attemptsLeft: result.attemptsLeft, message });
  }

  // Sign in (creating the account with its unique user code on first login).
  const user = getOrCreateUser(mobile, true);
  const token = generateToken({ role: 'USER', mobile: user.mobile, uid: user.userCode });
  setAuthCookie(res, token, 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    message: 'ورود با موفقیت انجام شد.',
    user: { mobile: user.mobile, name: user.name, role: 'USER', userCode: user.userCode, avatar: user.avatar }
  });
});

// Admin Passcode Authenticate
apiRouter.post('/auth/admin/login', loginLimiter, (req, res) => {
  const { passcode } = req.body || {};
  if (typeof passcode !== 'string' || !passcode) {
    return res.status(400).json({ success: false, message: 'کد عبور مدیریت الزامی است.' });
  }

  const token = authenticateAdmin(passcode.trim());
  if (!token) {
    return res.status(401).json({ success: false, message: 'کد عبور مدیریت نادرست است.' });
  }

  // Admin cookie is separate from the customer cookie: a customer login can never end an admin session.
  setAuthCookie(res, token, 12 * 60 * 60 * 1000, ADMIN_COOKIE);

  logAdminAction('مدیریت سیستم', 'ورود به سیستم', 'ورود موفقیت‌آمیز به پنل ادمین');

  res.json({
    success: true,
    message: 'ورود مدیر با موفقیت تایید شد.',
    user: {
      role: 'ADMIN',
      name: 'مدیریت گیسآرا'
    }
  });
});

apiRouter.post('/auth/admin/logout', (req, res) => {
  clearAuthCookie(res, ADMIN_COOKIE);
  res.json({ success: true, message: 'از پنل مدیریت خارج شدید.' });
});

// Current session. 401 only when there is neither a customer nor an admin session.
apiRouter.get('/auth/me', (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const isAdmin = !!req.admin;
  const u = req.user && req.user.role === 'USER' ? req.user : null;
  if (!u && !isAdmin) {
    return res.status(401).json({ success: false, message: 'کاربر احراز هویت نشده است.' });
  }
  res.json({
    success: true,
    isAdmin,
    // Only what the UI needs - no token internals (exp, uid, ...).
    user: u ? { mobile: u.mobile, name: u.name, role: 'USER', userCode: u.userCode, avatar: u.avatar } : null
  });
});

// Customer edits their own profile (display name and avatar). The user code and mobile never change.
apiRouter.put('/me/profile', requireAuth, writeLimiter, (req: any, res) => {
  if (req.user.role !== 'USER') {
    return res.status(403).json({ success: false, message: 'این عملیات فقط برای حساب مشتری است.' });
  }
  const parsed = profileUpdateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'اطلاعات پروفایل نامعتبر است.' });
  }
  const user = updateUserProfile(req.user.mobile, parsed.data);
  if (!user) return res.status(404).json({ success: false, message: 'حساب کاربری یافت نشد.' });
  res.json({ success: true, user: { mobile: user.mobile, name: user.name, role: 'USER', userCode: user.userCode, avatar: user.avatar } });
});

// Logout (customer session only)
apiRouter.post('/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'با موفقیت از سیستم خارج شدید.'
  });
});

// -----------------------------------------------------------------------------
// Cart Syncing Endpoints (Phase 3 Optimization)
// -----------------------------------------------------------------------------
const userCartsMap: Record<string, any[]> = {};
const MAX_CART_LINES = 100;

// Carts are only persisted server-side for signed-in users. Guests previously
// all shared a single "guest" bucket, so any visitor could read or overwrite
// every other guest's cart. Guest carts now live only in the visitor's browser.
apiRouter.get('/cart', (req: any, res) => {
  if (!req.user?.mobile) {
    return res.json({ success: true, cart: [] });
  }
  res.json({ success: true, cart: userCartsMap[req.user.mobile] || [] });
});

apiRouter.post('/cart/sync', (req: any, res) => {
  const { cartItems } = req.body || {};
  if (!Array.isArray(cartItems) || cartItems.length > MAX_CART_LINES) {
    return res.status(400).json({ success: false, message: 'سبد خرید نامعتبر است.' });
  }
  if (!req.user?.mobile) {
    // Not persisted for guests; echo back so the client keeps working locally.
    return res.json({ success: true, cart: cartItems });
  }
  userCartsMap[req.user.mobile] = cartItems;
  res.json({ success: true, cart: userCartsMap[req.user.mobile] });
});

// -----------------------------------------------------------------------------
// 3. Styles (Model Portfolio) Endpoints
// -----------------------------------------------------------------------------
apiRouter.get('/styles', (req, res) => {
  const cached = serverCache.get('styles_all');
  if (cached) return res.json({ success: true, data: cached, _cached: true });

  const activeStyles = db.styles.filter(s => s.status !== 'ARCHIVED');
  serverCache.set('styles_all', activeStyles, 5 * 60 * 1000); // Cache for 5 mins
  res.json({ success: true, data: activeStyles });
});

apiRouter.get('/styles/:id', (req, res) => {
  const style = db.styles.find(s => s.id === req.params.id || s.slug === req.params.id);
  if (!style) {
    return res.status(404).json({ success: false, message: 'مدل مو مورد نظر یافت نشد.' });
  }
  
  // Increment view counts
  style.viewsCount++;
  saveDb();
  res.json({ success: true, data: style });
});

apiRouter.post('/styles', requireAdmin, writeLimiter, validateBody(styleCreateSchema), (req: any, res) => {
  const body = req.body;

  const newStyle: StyleModel = {
    id: newId('style'),
    name: body.name,
    slug: body.slug,
    primaryImage: body.primaryImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    summary: body.summary || '',
    description: body.description || '',
    occasion: body.occasion || 'مجلسی',
    difficulty: body.difficulty || 'متوسط',
    approxMinutes: body.approxMinutes ?? 45,
    status: body.status || 'PUBLISHED',
    techniqueIds: body.techniqueIds || [],
    productIds: body.productIds || [],
    courseId: body.courseId,
    viewsCount: 0,
    createdAt: new Date().toISOString()
  };

  db.styles = [newStyle, ...db.styles];
  serverCache.invalidate('styles');
  logAdminAction(req.user.name, 'ایجاد مدل مو', `ایجاد مدل جدید: ${newStyle.name}`);
  
  res.status(201).json({ success: true, data: newStyle });
});

apiRouter.put('/styles/:id', requireAdmin, writeLimiter, validateBody(styleUpdateSchema), (req: any, res) => {
  const styleIndex = db.styles.findIndex(s => s.id === req.params.id);
  if (styleIndex === -1) {
    return res.status(404).json({ success: false, message: 'مدل مو یافت نشد.' });
  }

  const body = req.body;
  const current = db.styles[styleIndex];
  const updatedStyle: StyleModel = {
    ...current,
    ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  };

  const updatedStyles = [...db.styles];
  updatedStyles[styleIndex] = updatedStyle;
  db.styles = updatedStyles;
  
  serverCache.invalidate('styles');
  logAdminAction(req.user.name, 'ویرایش مدل مو', `ویرایش مدل مو: ${updatedStyle.name}`);
  
  res.json({ success: true, data: updatedStyle });
});

apiRouter.delete('/styles/:id', requireAdmin, (req: any, res) => {
  const style = db.styles.find(s => s.id === req.params.id);
  if (!style) {
    return res.status(404).json({ success: false, message: 'مدل مو یافت نشد.' });
  }

  db.styles = db.styles.filter(s => s.id !== req.params.id);
  serverCache.invalidate('styles');
  logAdminAction(req.user.name, 'حذف مدل مو', `حذف مدل مو: ${style.name}`);

  res.json({ success: true, message: 'مدل مو با موفقیت حذف گردید.' });
});


// -----------------------------------------------------------------------------
// 4. Products (Store) Endpoints
// -----------------------------------------------------------------------------
apiRouter.get('/products', (req, res) => {
  const cached = serverCache.get('products_all');
  if (cached) return res.json({ success: true, data: cached, _cached: true });

  const activeProducts = db.products.filter(p => p.status !== 'DISCONTINUED');
  serverCache.set('products_all', activeProducts, 5 * 60 * 1000);
  res.json({ success: true, data: activeProducts });
});

apiRouter.get('/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'محصول مورد نظر یافت نشد.' });
  }
  res.json({ success: true, data: product });
});

apiRouter.post('/products', requireAdmin, writeLimiter, validateBody(productCreateSchema), (req: any, res) => {
  const body = req.body;

  const newProd: Product = {
    id: newId('prod'),
    name: body.name,
    slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
    category: body.category || 'تثبیت‌کننده‌ها',
    brand: body.brand || 'گیس‌آرا',
    priceToman: body.priceToman,
    compareAtPriceToman: body.compareAtPriceToman,
    sku: body.sku || `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    stock: body.stock ?? 10,
    rating: 5.0,
    reviewsCount: 0,
    image: body.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500',
    images: body.images || [],
    summary: body.summary || '',
    description: body.description || '',
    specifications: body.specifications || {},
    status: body.status || 'PUBLISHED'
  };

  db.products = [newProd, ...db.products];
  serverCache.invalidate('products');
  logAdminAction(req.user.name, 'ایجاد محصول', `افزودن محصول جدید: ${newProd.name}`);

  res.status(201).json({ success: true, data: newProd });
});

apiRouter.put('/products/:id', requireAdmin, writeLimiter, validateBody(productUpdateSchema), (req: any, res) => {
  const prodIndex = db.products.findIndex(p => p.id === req.params.id);
  if (prodIndex === -1) {
    return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
  }

  const body = req.body;
  const current = db.products[prodIndex];
  const updatedProd: Product = {
    ...current,
    ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  };

  const updatedProducts = [...db.products];
  updatedProducts[prodIndex] = updatedProd;
  db.products = updatedProducts;

  serverCache.invalidate('products');
  logAdminAction(req.user.name, 'ویرایش محصول', `ویرایش محصول: ${updatedProd.name}`);

  res.json({ success: true, data: updatedProd });
});

apiRouter.delete('/products/:id', requireAdmin, (req: any, res) => {
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) {
    return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
  }

  db.products = db.products.filter(p => p.id !== req.params.id);
  serverCache.invalidate('products');
  logAdminAction(req.user.name, 'حذف محصول', `حذف محصول: ${prod.name}`);

  res.json({ success: true, message: 'محصول با موفقیت حذف شد.' });
});

// -----------------------------------------------------------------------------
// 5. Orders (Checkout & Commerce) Endpoints
// -----------------------------------------------------------------------------
apiRouter.get('/orders', requireAuth, (req: any, res) => {
  // If administrator, return all orders; otherwise return user-owned orders
  if (req.user.role === 'ADMIN') {
    return res.json({ success: true, data: db.orders });
  }
  
  const userOrders = db.orders.filter((o: any) => o.userMobile === req.user.mobile);
  res.json({ success: true, data: userOrders });
});

apiRouter.post('/orders', requireAuth, writeLimiter, (req: any, res) => {
  const { cartItems, shippingInfo, couponCode } = req.body || {};
  const fail = (code: number, message: string) => res.status(code).json({ success: false, message });

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return fail(400, 'سبد خرید خالی است.');
  }
  const MAX_LINES = 50;
  const MAX_QTY_PER_LINE = 20;
  if (cartItems.length > MAX_LINES) {
    return fail(400, 'تعداد اقلام سبد خرید بیش از حد مجاز است.');
  }

  // Idempotency: a retried request (flaky network, double click, back button) with the same
  // key returns the order that was already created instead of reserving stock a second time.
  const rawKey = req.headers['idempotency-key'];
  const idempotencyKey = typeof rawKey === 'string' ? rawKey.trim().slice(0, 100) : '';
  if (idempotencyKey) {
    const prior = (db.orders as any[]).find(o => o.userMobile === req.user.mobile && o.idempotencyKey === idempotencyKey);
    // Only an order that can still be paid is replayed; if it was paid/expired/cancelled the key is spent
    // and a genuinely new request gets a new order.
    if (prior && (prior.status === 'PENDING_PAYMENT' || prior.status === 'PAYMENT_FAILED')) {
      return res.status(200).json({ success: true, replayed: true, message: 'این سفارش قبلاً ثبت شده است.', order: prior });
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 1 — validate and price every line from SERVER data. Nothing is mutated here, so every
  // early return below is side-effect free (no stock reservation / coupon usage to roll back).
  // ---------------------------------------------------------------------------
  const lineItems: any[] = [];
  const stockDemand = new Map<string, number>();
  const courseIdsInCart = new Set<string>();
  const alreadyOwned = new Set(getEntitledCourseIds(req.user.mobile));

  for (const item of cartItems) {
    if (!item || typeof item !== 'object') {
      return fail(400, 'آیتم سبد خرید نامعتبر است.');
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return fail(400, 'تعداد یکی از اقلام نامعتبر است.');
    }
    const image = typeof item.image === 'string' ? item.image.slice(0, 500) : '';
    const lineId = typeof item.id === 'string' ? item.id.slice(0, 100) : `line-${lineItems.length + 1}`;

    if (item.type === 'ONLINE_COURSE') {
      const course = db.courses.find(c => c.id === item.courseId && c.status === 'PUBLISHED');
      if (!course) {
        return fail(400, 'دوره انتخاب‌شده یافت نشد یا در دسترس نیست.');
      }
      if (qty !== 1) {
        return fail(400, 'هر دوره آنلاین فقط یک‌بار قابل خرید است.');
      }
      if (courseIdsInCart.has(course.id)) {
        return fail(400, `دوره «${course.name}» بیش از یک‌بار در سبد وجود دارد.`);
      }
      if (alreadyOwned.has(course.id)) {
        return fail(409, `دوره «${course.name}» قبلاً برای شما فعال شده است و نیازی به خرید دوباره نیست.`);
      }
      courseIdsInCart.add(course.id);
      lineItems.push({ id: lineId, type: 'ONLINE_COURSE', courseId: course.id, title: course.name, priceToman: course.priceToman, quantity: 1, image });
      continue;
    }

    const product = db.products.find(p => p.id === item.productId);
    if (!product || ((product as any).status && (product as any).status !== 'PUBLISHED')) {
      return fail(400, 'محصول انتخاب‌شده یافت نشد یا در دسترس نیست.');
    }
    stockDemand.set(product.id, (stockDemand.get(product.id) || 0) + qty);
    lineItems.push({ id: lineId, type: 'PHYSICAL_PRODUCT', productId: product.id, title: product.name, sku: (product as any).sku, priceToman: product.priceToman, quantity: qty, image });
  }

  // Aggregated demand (the same product may appear on several lines).
  for (const [productId, qty] of stockDemand) {
    const product = db.products.find(p => p.id === productId)!;
    if (product.stock < qty) {
      return fail(400, `موجودی انبار محصول ${product.name} کافی نیست.`);
    }
  }

  // Shipping details: required (and strictly validated) only when something is shipped.
  const hasPhysical = lineItems.some(l => l.type === 'PHYSICAL_PRODUCT');
  let shippingAddress: any;
  if (hasPhysical) {
    const parsed = shippingInfoSchema.safeParse(shippingInfo || {});
    if (!parsed.success) {
      return fail(400, parsed.error.issues[0]?.message || 'اطلاعات آدرس تحویل کامل نیست.');
    }
    const s = parsed.data;
    shippingAddress = {
      recipientName: s.recipientName,
      mobile: s.recipientMobile,
      province: s.province,
      city: s.city,
      addressLine: s.addressLine,
      postalCode: s.postalCode
    };
  }

  // Coupon: fully validated BEFORE any reservation.
  let coupon: any = null;
  const subtotalForCoupon = lineItems.reduce((sum, l) => sum + l.priceToman * l.quantity, 0);
  if (couponCode !== undefined && couponCode !== null && String(couponCode).trim() !== '') {
    const code = normalizeCode(couponCode);
    coupon = db.coupons.find(c => normalizeCode(c.code) === code);
    if (!coupon || !coupon.isActive) {
      return fail(400, 'کد تخفیف معتبر نیست.');
    }
    if (isJalaliExpired(coupon.expiresAtJalali)) {
      return fail(400, 'کد تخفیف منقضی شده است.');
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return fail(400, 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.');
    }
    if (coupon.minOrderToman && subtotalForCoupon < coupon.minOrderToman) {
      return fail(400, `حداقل مبلغ سفارش برای این کد تخفیف ${coupon.minOrderToman.toLocaleString('fa-IR')} تومان است.`);
    }
  }

  const totals = computeTotals(lineItems, coupon);

  // ---------------------------------------------------------------------------
  // Pass 2 — commit. Synchronous (no await) so check-then-decrement stays atomic in the event loop.
  // ---------------------------------------------------------------------------
  for (const [productId, qty] of stockDemand) {
    const product = db.products.find(p => p.id === productId)!;
    product.stock -= qty;
  }
  if (coupon) coupon.usageCount++;

  const PAYMENT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes to complete payment before the order/reservation expires
  const orderNumber = newOrderNumber((db.orders as any[]).map(o => o.orderNumber));

  const newOrder: any = {
    id: newId('order'),
    orderNumber,
    items: lineItems,
    subtotalToman: totals.subtotalToman,
    discountToman: totals.discountToman,
    shippingToman: totals.shippingToman,
    payableToman: totals.payableToman,
    status: 'PENDING_PAYMENT' as any,
    createdAt: new Date().toISOString(),
    paymentExpiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS).toISOString(),
    userMobile: req.user.mobile,
    customerName: req.user.name,
    userCode: req.user.userCode,
    couponApplied: coupon ? coupon.code : undefined,
    idempotencyKey: idempotencyKey || undefined,
    shippingAddress,
    systemLogs: [`سفارش با شناسه پیگیری ${orderNumber} ثبت شد و در انتظار پرداخت است.`]
  };

  db.orders = [newOrder, ...db.orders];
  db.products = [...db.products]; // Trigger product state saving
  db.coupons = [...db.coupons];

  serverCache.invalidate('products');
  serverCache.invalidate('admin_');

  res.status(201).json({
    success: true,
    message: 'سفارش با موفقیت ثبت شد. برای تکمیل، به درگاه پرداخت هدایت می‌شوید.',
    order: newOrder
  });
});

apiRouter.put('/orders/:id/status', requireAdmin, writeLimiter, validateBody(orderStatusUpdateSchema), (req: any, res) => {
  const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
  }

  const { status, shipmentStatus, trackingCode } = req.body;
  const currentOrder = db.orders[orderIndex] as any;
  const logs: string[] = [];
  const stamp = new Date().toISOString();

  // Shipment data only makes sense for a paid order that contains physical goods.
  const touchesShipment = shipmentStatus !== undefined || (trackingCode !== undefined && trackingCode !== '');
  if (touchesShipment) {
    const finalStatus = status || currentOrder.status;
    const hasPhysical = (currentOrder.items || []).some((i: any) => i.type === 'PHYSICAL_PRODUCT');
    if (!hasPhysical) {
      return res.status(409).json({ success: false, message: 'این سفارش کالای فیزیکی ندارد؛ وضعیت ارسال و کد رهگیری برایش معنی ندارد.' });
    }
    if (finalStatus !== 'PAID' && finalStatus !== 'COMPLETED') {
      return res.status(409).json({ success: false, message: 'وضعیت ارسال و کد رهگیری فقط برای سفارش پرداخت‌شده قابل ثبت است.' });
    }
  }

  if (status && status !== currentOrder.status) {
    const decision = checkOrderTransition(currentOrder.status, status, 'ADMIN');
    if (!decision.allowed) {
      return res.status(409).json({ success: false, message: decision.reason });
    }
    logs.push(`وضعیت سفارش از ${currentOrder.status} به ${status} تغییر کرد.`);
    currentOrder.status = status;
    if (status === 'CANCELLED' || status === 'EXPIRED') {
      releaseReservedStock(currentOrder);
      releaseCouponUsage(currentOrder);
      db.products = [...db.products];
    }
  }

  if (shipmentStatus && shipmentStatus !== currentOrder.shipmentStatus) {
    logs.push(`وضعیت ارسال به ${shipmentStatus} تغییر کرد.`);
    currentOrder.shipmentStatus = shipmentStatus;
  }
  if (trackingCode !== undefined && trackingCode !== (currentOrder.trackingCode || '')) {
    if (trackingCode === '') delete currentOrder.trackingCode;
    else currentOrder.trackingCode = trackingCode;
    logs.push(trackingCode === '' ? 'کد رهگیری حذف شد.' : `کد رهگیری ${trackingCode} ثبت شد.`);
  }

  if (logs.length > 0) {
    if (!currentOrder.systemLogs) currentOrder.systemLogs = [];
    // ISO timestamp: the client renders it in Asia/Tehran; the server's locale/timezone never leaks in.
    for (const line of logs) currentOrder.systemLogs.push(`[${stamp}] ${line}`);
    db.orders = [...db.orders];
    serverCache.invalidate('admin_');
    logAdminAction(req.user.name, 'به‌روزرسانی سفارش', `سفارش ${currentOrder.orderNumber}: ${logs.join(' ')}`);
  }

  res.json({ success: true, data: currentOrder });
});

// -----------------------------------------------------------------------------
// 6. In-Person & Workshop Request Endpoints
// -----------------------------------------------------------------------------
const handleGetRequests = (req: any, res: any) => {
  res.json({ success: true, data: db.requests || [] });
};

const MAX_STORED_REQUESTS = 5000;

const handlePostRequest = (req: any, res: any) => {
  // A signed-in customer's request is always attached to THEIR verified mobile (no filing under someone else's number).
  const body = req.user && req.user.role === 'USER' ? { ...req.body, mobile: req.user.mobile } : req.body;

  // Public, unauthenticated write: keep the DB from being filled by a script.
  if (db.requests.length >= MAX_STORED_REQUESTS) {
    return res.status(503).json({ success: false, message: 'ثبت درخواست جدید موقتاً ممکن نیست. لطفاً بعداً تلاش کنید.' });
  }
  // Same person + same session/course within 10 minutes = accidental double submit.
  const dupCutoff = Date.now() - 10 * 60 * 1000;
  const isDuplicate = db.requests.some((r: any) =>
    r.mobile === body.mobile &&
    (r.sessionId || '') === (body.sessionId || '') &&
    (r.cityId === body.cityId) &&
    Date.parse(r.submittedAt) > dupCutoff
  );
  if (isDuplicate) {
    return res.status(409).json({ success: false, message: 'درخواست مشابه شما اخیراً ثبت شده است.' });
  }

  const newRequest: WorkshopRequest = {
    id: newId('req'),
    userId: req.user ? req.user.mobile : 'guest',
    kind: body.kind || 'REQUEST_NEW_SESSION',
    sessionId: body.sessionId || undefined,
    courseId: body.courseId || 'course-1',
    cityId: body.cityId,
    fullName: body.fullName,
    mobile: body.mobile,
    experienceLevel: body.experienceLevel || 'مبتدی',
    participantCount: body.participantCount ?? 1,
    preferredDays: body.preferredDays || 'روزهای زوج',
    notes: body.notes || '',
    status: 'SUBMITTED' as any,
    submittedAt: new Date().toISOString()
  };

  db.requests = [newRequest, ...db.requests];
  res.status(201).json({ success: true, message: 'درخواست شما با موفقیت ثبت گردید.', data: newRequest });
};

apiRouter.get('/requests', requireAdmin, handleGetRequests);
apiRouter.get('/workshops/requests', requireAdmin, handleGetRequests);

apiRouter.post('/requests', writeLimiter, validateBody(workshopRequestSchema), handlePostRequest);
apiRouter.post('/workshops/request', writeLimiter, validateBody(workshopRequestSchema), handlePostRequest);

// -----------------------------------------------------------------------------
// 7. General Caching Directory & LMS Core Queries
// -----------------------------------------------------------------------------
apiRouter.get('/courses', (req, res) => {
  const cached = serverCache.get('courses_all');
  if (cached) return res.json({ success: true, data: cached, _cached: true });

  // Public catalogue: never includes paid lesson media URLs (see courseAccess.ts).
  const activeCourses = db.courses.filter(c => c.status === 'PUBLISHED').map(toPublicCourse);
  serverCache.set('courses_all', activeCourses, 10 * 60 * 1000); // 10 mins cache
  res.json({ success: true, data: activeCourses });
});

// Courses the signed-in user is entitled to (derived from PAID/COMPLETED orders).
// A customer's own workshop requests and certificates (matched on the verified mobile number).
apiRouter.get('/me/requests', requireAuth, (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.user.role !== 'USER') return res.json({ success: true, data: [] });
  res.json({ success: true, data: (db.requests as any[]).filter(r => r.mobile === req.user.mobile) });
});

apiRouter.get('/me/certificates', requireAuth, (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.user.role !== 'USER') return res.json({ success: true, data: [] });
  res.json({ success: true, data: (db.certificates as any[]).filter(c => c.studentMobile === req.user.mobile) });
});

apiRouter.get('/me/enrollments', requireAuth, (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, courseIds: getEntitledCourseIds(req.user.mobile) });
});

// Single lesson, including its media URL, only for free-preview lessons or entitled users.
apiRouter.get('/courses/:courseId/lessons/:lessonId', (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const course = db.courses.find(c => c.id === req.params.courseId && c.status === 'PUBLISHED');
  const lesson = course ? findLesson(course, req.params.lessonId) : undefined;
  if (!course || !lesson) {
    return res.status(404).json({ success: false, message: 'درس یافت نشد.' });
  }
  if (!lesson.isPreview) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'برای مشاهده این درس ابتدا وارد حساب کاربری شوید.' });
    }
    if (!hasCourseAccess(req.user, course.id)) {
      return res.status(403).json({ success: false, message: 'برای مشاهده این درس باید دوره را خریداری کنید.' });
    }
  }
  res.json({ success: true, lesson });
});

// Admin course/lesson management (R-29: previously no way to create or edit a
// course at all). Access control for lesson content is enforced by courseAccess.ts
// regardless of what's created here.
// Admin view of the catalogue: ALL statuses and every lesson incl. media URLs (the public list is PUBLISHED-only).
apiRouter.get('/admin/courses', requireAdmin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: db.courses });
});

function uniqueCourseSlug(base: string, ignoreId?: string): string {
  const clean = base.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]+/gu, '') || 'course';
  let slug = clean;
  let n = 2;
  while (db.courses.some(c => c.slug === slug && c.id !== ignoreId)) slug = `${clean}-${n++}`;
  return slug;
}

const sumLessonMinutes = (modules: any[]) =>
  (modules || []).reduce((acc, m) => acc + (m.lessons || []).reduce((a: number, l: any) => a + (l.durationMinutes || 0), 0), 0);

apiRouter.post('/courses', requireAdmin, writeLimiter, validateBody(courseCreateSchema), (req: any, res) => {
  const body = req.body;
  const modules = (body.modules || []).map((m: any, mi: number) => ({
    id: m.id || `mod-${mi + 1}`,
    title: m.title || '',
    lessons: m.lessons.map((l: any) => ({ ...l, durationMinutes: l.durationMinutes ?? 0, isPreview: !!l.isPreview }))
  }));
  const newCourse: any = {
    id: newId('course'),
    name: body.name,
    slug: uniqueCourseSlug(body.slug || body.name),
    kind: body.kind || 'ONLINE',
    summary: body.summary || '',
    description: body.description || '',
    instructorId: body.instructorId || '',
    priceToman: body.priceToman,
    compareAtPriceToman: body.compareAtPriceToman,
    level: body.level || 'مبتدی',
    durationMinutes: body.durationMinutes ?? sumLessonMinutes(modules),
    status: body.status || 'DRAFT',
    heroImage: body.heroImage || '',
    previewVideoUrl: body.previewVideoUrl,
    prerequisites: body.prerequisites || [],
    targetAudience: body.targetAudience || [],
    modules
  };
  db.courses = [newCourse, ...db.courses];
  serverCache.invalidate('courses');
  logAdminAction(req.user.name, 'ایجاد دوره', `ایجاد دوره جدید: ${newCourse.name}`);
  res.status(201).json({ success: true, data: newCourse });
});

apiRouter.put('/courses/:id', requireAdmin, writeLimiter, validateBody(courseUpdateSchema), (req: any, res) => {
  const idx = db.courses.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'دوره یافت نشد.' });
  }
  const body = req.body;
  const patch: any = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
  if (patch.modules) {
    patch.modules = patch.modules.map((m: any, mi: number) => ({
      id: m.id || `mod-${mi + 1}`,
      title: m.title || '',
      lessons: m.lessons.map((l: any) => ({ ...l }))
    }));
  }
  if (patch.slug) patch.slug = uniqueCourseSlug(patch.slug, db.courses[idx].id);
  const updated = { ...db.courses[idx], ...patch };
  // Re-check the rules on the MERGED course: flipping only `status` to PUBLISHED on an empty course must fail too.
  const ruleIssues = courseRuleIssues({ status: updated.status, modules: updated.modules });
  if (ruleIssues.length > 0) {
    return res.status(400).json({ success: false, message: ruleIssues[0] });
  }
  const list = [...db.courses];
  list[idx] = updated;
  db.courses = list;
  serverCache.invalidate('courses');
  logAdminAction(req.user.name, 'ویرایش دوره', `ویرایش دوره: ${updated.name}`);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/courses/:id', requireAdmin, (req: any, res) => {
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'دوره یافت نشد.' });
  }
  const hasEntitlingOrders = db.orders.some((o: any) =>
    (o.status === 'PAID' || o.status === 'COMPLETED') &&
    (o.items || []).some((i: any) => i.type === 'ONLINE_COURSE' && i.courseId === course.id)
  );
  if (hasEntitlingOrders) {
    return res.status(409).json({
      success: false,
      message: 'این دوره دارای خریدار است و قابل حذف نیست. برای غیرفعال‌سازی، وضعیت آن را به «بایگانی‌شده» تغییر دهید.'
    });
  }
  db.courses = db.courses.filter(c => c.id !== course.id);
  serverCache.invalidate('courses');
  logAdminAction(req.user.name, 'حذف دوره', `حذف دوره: ${course.name}`);
  res.json({ success: true, message: 'دوره حذف شد.' });
});

apiRouter.get('/sessions', (req, res) => {
  res.json({ success: true, data: db.sessions });
});

apiRouter.get('/articles', (req, res) => {
  const cached = serverCache.get('articles_all');
  if (cached) return res.json({ success: true, data: cached, _cached: true });

  const activeArticles = db.articles.filter((a: any) => a.status !== 'ARCHIVED');
  serverCache.set('articles_all', activeArticles, 10 * 60 * 1000);
  res.json({ success: true, data: activeArticles });
});

apiRouter.get('/techniques', (req, res) => {
  const cached = serverCache.get('techniques_all');
  if (cached) return res.json({ success: true, data: cached, _cached: true });

  serverCache.set('techniques_all', db.techniques, 15 * 60 * 1000);
  res.json({ success: true, data: db.techniques });
});

// -----------------------------------------------------------------------------
// CMS Engines for Articles, Techniques, and Sessions (CRUD)
// -----------------------------------------------------------------------------

// Sessions CMS
apiRouter.post('/sessions', requireAdmin, writeLimiter, validateBody(sessionCreateSchema), (req: any, res) => {
  const body = req.body;
  const newSession = {
    id: newId('session'),
    ...body,
    registeredCount: body.registeredCount ?? 0
  };
  db.sessions = [newSession, ...db.sessions];
  logAdminAction(req.user.name, 'ایجاد جلسه کارگاه', `ایجاد جلسه کارگاه: ${newSession.courseName} در ${newSession.cityName}`);
  res.status(201).json({ success: true, data: newSession });
});

apiRouter.put('/sessions/:id', requireAdmin, writeLimiter, validateBody(sessionUpdateSchema), (req: any, res) => {
  const idx = db.sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'جلسه کارگاه یافت نشد.' });
  const body = req.body;
  const updated = { ...db.sessions[idx], ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) };
  const list = [...db.sessions];
  list[idx] = updated;
  db.sessions = list;
  logAdminAction(req.user.name, 'ویرایش جلسه کارگاه', `ویرایش جلسه کارگاه: ${updated.courseName}`);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/sessions/:id', requireAdmin, (req: any, res) => {
  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'جلسه کارگاه یافت نشد.' });
  db.sessions = db.sessions.filter(s => s.id !== req.params.id);
  logAdminAction(req.user.name, 'حذف جلسه کارگاه', `حذف جلسه کارگاه: ${session.courseName}`);
  res.json({ success: true, message: 'جلسه کارگاه حذف شد.' });
});

// Articles CMS
apiRouter.post('/articles', requireAdmin, writeLimiter, validateBody(articleCreateSchema), (req: any, res) => {
  const body = req.body;
  const newArticle = {
    id: newId('article'),
    slug: body.slug || newId('article'),
    publishedAt: body.publishedAt || new Date().toISOString().split('T')[0],
    readTimeMinutes: body.readTimeMinutes || 5,
    author: body.author || { name: 'گیس‌آرا', role: 'دبارتمان آموزش', avatar: '/icon.svg' },
    heroImage: body.heroImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&h=630&q=80&fm=webp',
    ...body
  };
  db.articles = [newArticle, ...db.articles];
  serverCache.invalidate('articles_all');
  logAdminAction(req.user.name, 'ایجاد مقاله', `ایجاد مقاله: ${newArticle.title}`);
  res.status(201).json({ success: true, data: newArticle });
});

apiRouter.put('/articles/:id', requireAdmin, writeLimiter, validateBody(articleUpdateSchema), (req: any, res) => {
  const idx = db.articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'مقاله یافت نشد.' });
  const body = req.body;
  const updated = { ...db.articles[idx], ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) };
  const list = [...db.articles];
  list[idx] = updated;
  db.articles = list;
  serverCache.invalidate('articles_all');
  logAdminAction(req.user.name, 'ویرایش مقاله', `ویرایش مقاله: ${updated.title}`);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/articles/:id', requireAdmin, (req: any, res) => {
  const article = db.articles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'مقاله یافت نشد.' });
  db.articles = db.articles.filter(a => a.id !== req.params.id);
  serverCache.invalidate('articles_all');
  logAdminAction(req.user.name, 'حذف مقاله', `حذف مقاله: ${article.title}`);
  res.json({ success: true, message: 'مقاله حذف شد.' });
});

// Techniques CMS
apiRouter.post('/techniques', requireAdmin, writeLimiter, validateBody(techniqueCreateSchema), (req: any, res) => {
  const body = req.body;
  const newTechnique = {
    id: newId('technique'),
    slug: body.slug || newId('tech'),
    steps: body.steps || [],
    commonMistakes: body.commonMistakes || [],
    toolIds: body.toolIds || [],
    styleIds: body.styleIds || [],
    status: body.status || 'PUBLISHED',
    ...body
  };
  db.techniques = [newTechnique, ...db.techniques];
  serverCache.invalidate('techniques_all');
  logAdminAction(req.user.name, 'ایجاد تکنیک', `ایجاد تکنیک: ${newTechnique.name}`);
  res.status(201).json({ success: true, data: newTechnique });
});

apiRouter.put('/techniques/:id', requireAdmin, writeLimiter, validateBody(techniqueUpdateSchema), (req: any, res) => {
  const idx = db.techniques.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'تکنیک یافت نشد.' });
  const body = req.body;
  const updated = { ...db.techniques[idx], ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) };
  const list = [...db.techniques];
  list[idx] = updated;
  db.techniques = list;
  serverCache.invalidate('techniques_all');
  logAdminAction(req.user.name, 'ویرایش تکنیک', `ویرایش تکنیک: ${updated.name}`);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/techniques/:id', requireAdmin, (req: any, res) => {
  const technique = db.techniques.find(t => t.id === req.params.id);
  if (!technique) return res.status(404).json({ success: false, message: 'تکنیک یافت نشد.' });
  db.techniques = db.techniques.filter(t => t.id !== req.params.id);
  serverCache.invalidate('techniques_all');
  logAdminAction(req.user.name, 'حذف تکنیک', `حذف تکنیک: ${technique.name}`);
  res.json({ success: true, message: 'تکنیک حذف شد.' });
});

// -----------------------------------------------------------------------------
// 8. Coupons Engine
// -----------------------------------------------------------------------------
apiRouter.get('/coupons/validate/:code', couponLimiter, (req, res) => {
  const wanted = normalizeCode(req.params.code);
  const coupon: any = db.coupons.find(c => normalizeCode(c.code) === wanted);
  if (!coupon || !coupon.isActive) {
    return res.status(404).json({ success: false, message: 'کد تخفیف معتبر نیست.' });
  }
  if (isJalaliExpired(coupon.expiresAtJalali)) {
    return res.status(404).json({ success: false, message: 'کد تخفیف منقضی شده است.' });
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return res.status(404).json({ success: false, message: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.' });
  }
  // minOrderToman cannot be fully checked without the cart total; the order-creation route enforces
  // it authoritatively. Only the fields the storefront needs are exposed (no usage counters).
  res.json({
    success: true,
    data: {
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxDiscountToman: coupon.maxDiscountToman,
      minOrderToman: coupon.minOrderToman,
      expiresAtJalali: coupon.expiresAtJalali,
      isActive: true
    }
  });
});

apiRouter.get('/coupons', requireAdmin, (req, res) => {
  res.json({ success: true, data: db.coupons });
});

apiRouter.post('/coupons', requireAdmin, writeLimiter, validateBody(couponCreateSchema), (req: any, res) => {
  const body = req.body;
  if (db.coupons.some(c => c.code.toLowerCase() === body.code.toLowerCase())) {
    return res.status(409).json({ success: false, message: 'این کد تخفیف قبلاً ثبت شده است.' });
  }

  const newCoupon = {
    id: newId('coupon'),
    code: body.code.toUpperCase(),
    discountPercent: body.discountPercent,
    maxDiscountToman: body.maxDiscountToman,
    minOrderToman: body.minOrderToman,
    usageLimit: body.usageLimit,
    description: body.description || 'تخفیف سفارشی ادمین',
    isActive: body.isActive ?? true,
    expiresAtJalali: body.expiresAtJalali,
    usageCount: 0
  };

  db.coupons = [newCoupon, ...db.coupons];
  logAdminAction(req.user.name, 'ایجاد کد تخفیف', `ایجاد کد تخفیف: ${newCoupon.code}`);
  res.status(201).json({ success: true, data: newCoupon });
});

apiRouter.put('/coupons/:id', requireAdmin, writeLimiter, validateBody(couponUpdateSchema), (req: any, res) => {
  const idx = db.coupons.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'کد تخفیف یافت نشد.' });
  }
  const body = req.body;
  if (body.code) {
    const clash = db.coupons.find(c => c.id !== req.params.id && c.code.toLowerCase() === body.code.toLowerCase());
    if (clash) return res.status(409).json({ success: false, message: 'این کد تخفیف قبلاً ثبت شده است.' });
    body.code = body.code.toUpperCase();
  }
  const updated = { ...db.coupons[idx], ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) };
  const list = [...db.coupons];
  list[idx] = updated;
  db.coupons = list;
  logAdminAction(req.user.name, 'ویرایش کد تخفیف', `ویرایش کد تخفیف: ${updated.code}`);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/coupons/:id', requireAdmin, (req: any, res) => {
  const coupon = db.coupons.find(c => c.id === req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'کد تخفیف یافت نشد.' });
  }
  db.coupons = db.coupons.filter(c => c.id !== req.params.id);
  logAdminAction(req.user.name, 'حذف کد تخفیف', `حذف کد تخفیف: ${coupon.code}`);
  res.json({ success: true, message: 'کد تخفیف حذف شد.' });
});

// -----------------------------------------------------------------------------
// 9. Certificates Engine
// -----------------------------------------------------------------------------
apiRouter.get('/certificates/validate/:code', (req, res) => {
  const cert = db.certificates.find(c => c.certificateCode.toUpperCase() === req.params.code.toUpperCase() && c.status === 'ISSUED');
  if (!cert) {
    return res.status(404).json({ success: false, message: 'مدرک مورد نظر یافت نشد یا معتبر نمی‌باشد.' });
  }
  res.json({ success: true, data: cert });
});

apiRouter.post('/certificates', requireAdmin, writeLimiter, validateBody(certificateCreateSchema), (req: any, res) => {
  const body = req.body;

  const certCode = `GSR-CERT-${crypto.randomInt(10_000_000, 100_000_000)}`;

  const newCert = {
    id: newId('cert'),
    certificateCode: certCode,
    courseId: body.courseId || newId('course'),
    courseTitle: body.courseTitle,
    studentName: body.studentName,
    studentMobile: body.studentMobile,
    issueDateJalali: getTodayJalaliString(),
    instructorName: body.instructorName || 'استاد آکادمی',
    hoursCount: body.hoursCount ?? 16,
    grade: body.grade || 'عالی',
    status: 'ISSUED' as const
  };

  db.certificates = [newCert, ...db.certificates];
  logAdminAction(req.user.name, 'صدور گواهی‌نامه', `صدور مدرک برای: ${newCert.studentName}`);
  
  res.status(201).json({ success: true, data: newCert });
});

// -----------------------------------------------------------------------------
// Admin: customer lookup by user code / mobile / name
// -----------------------------------------------------------------------------
const PAID_STATUSES = new Set(['PAID', 'COMPLETED']);

function summarizeUser(u: any) {
  const orders = (db.orders as any[]).filter(o => o.userMobile === u.mobile);
  const paid = orders.filter(o => PAID_STATUSES.has(o.status));
  return {
    userCode: u.userCode,
    name: u.name,
    mobile: u.mobile,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    ordersCount: orders.length,
    paidOrdersCount: paid.length,
    totalPaidToman: paid.reduce((sum, o) => sum + (o.payableToman || 0), 0),
    coursesCount: getEntitledCourseIds(u.mobile).length
  };
}

apiRouter.get('/admin/users', requireAdmin, (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  backfillUsersFromActivity();
  const raw = String(req.query.q || '').trim();
  let list = db.users as any[];
  if (raw) {
    const upper = raw.toUpperCase();
    const mobile = normalizeMobile(raw);
    const digits = digitsOnly(raw);
    const lower = raw.toLowerCase();
    list = list.filter(u =>
      u.userCode === upper ||
      u.userCode.startsWith(upper) ||
      (mobile && u.mobile === mobile) ||
      (digits.length >= 4 && u.mobile.includes(digits)) ||
      String(u.name).toLowerCase().includes(lower)
    );
  }
  const sorted = [...list].sort((a, b) => String(b.lastLoginAt).localeCompare(String(a.lastLoginAt)));
  res.json({ success: true, total: sorted.length, data: sorted.slice(0, 50).map(summarizeUser) });
});

apiRouter.get('/admin/users/:code', requireAdmin, (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  backfillUsersFromActivity();
  const user: any = findUserByCode(req.params.code);
  if (!user) {
    return res.status(404).json({ success: false, message: 'کاربری با این شناسه یافت نشد.' });
  }
  const orders = (db.orders as any[])
    .filter(o => o.userMobile === user.mobile)
    .map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      payableToman: o.payableToman,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      shipmentStatus: o.shipmentStatus,
      trackingCode: o.trackingCode,
      items: (o.items || []).map((i: any) => ({ type: i.type, title: i.title, quantity: i.quantity }))
    }));
  const courses = getEntitledCourseIds(user.mobile).map(id => {
    const c = db.courses.find(x => x.id === id);
    return { id, name: c?.name || id };
  });
  const manual = (db.manualEnrollments as any[]).filter(e => e.userMobile === user.mobile);
  const requests = (db.requests as any[])
    .filter(r => r.mobile === user.mobile)
    .map(r => ({ id: r.id, kind: r.kind, status: r.status, courseId: r.courseId, submittedAt: r.submittedAt }));
  const certificates = (db.certificates as any[])
    .filter(c => c.studentMobile === user.mobile)
    .map(c => ({ certificateCode: c.certificateCode, courseTitle: c.courseTitle, status: c.status }));

  res.json({
    success: true,
    data: { ...summarizeUser(user), avatar: user.avatar, orders, courses, manualEnrollments: manual, requests, certificates }
  });
});

// -----------------------------------------------------------------------------
// Manual Enrollments & Course Access Administration
// -----------------------------------------------------------------------------
apiRouter.get('/admin/enrollments', requireAdmin, (req, res) => {
  res.json({ success: true, data: db.manualEnrollments });
});

apiRouter.post('/admin/enrollments', requireAdmin, writeLimiter, (req: any, res) => {
  const { courseId, status } = req.body || {};
  const userMobile = normalizeMobile(req.body?.userMobile);
  if (!userMobile || !courseId || !status) {
    return res.status(400).json({ success: false, message: 'شماره موبایل معتبر، دوره و وضعیت الزامی است.' });
  }
  if (status !== 'ACTIVE' && status !== 'REVOKED') {
    return res.status(400).json({ success: false, message: 'وضعیت نامعتبر است.' });
  }
  // The course name is taken from the database, never from the request body.
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'دوره یافت نشد.' });
  }
  const courseName = course.name;
  const nowIso = new Date().toISOString();

  // One override per (user, course): changing it again updates the same record.
  const existingIdx = db.manualEnrollments.findIndex((e: any) => e.userMobile === userMobile && e.courseId === courseId);

  if (existingIdx !== -1) {
    const list = [...db.manualEnrollments];
    list[existingIdx] = {
      ...list[existingIdx],
      status,
      grantedAt: nowIso,
      ...(status === 'REVOKED' ? { revokedAt: nowIso } : {})
    };
    db.manualEnrollments = list;
    logAdminAction(req.user.name, 'تغییر دسترسی دستی دوره', `تغییر دسترسی کاربر ${userMobile} به دوره ${courseName} به ${status === 'ACTIVE' ? 'فعال' : 'لغو شده'}`);
    return res.json({ success: true, data: list[existingIdx] });
  }

  const newEnrollment: any = {
    id: newId('enrollment'),
    userMobile,
    courseId,
    courseName,
    grantedAt: nowIso,
    ...(status === 'REVOKED' ? { revokedAt: nowIso } : {}),
    status
  };

  db.manualEnrollments = [newEnrollment, ...db.manualEnrollments];
  logAdminAction(req.user.name, 'ثبت دسترسی دستی دوره', `دسترسی کاربر ${userMobile} به دوره ${courseName} به صورت ${status === 'ACTIVE' ? 'فعال' : 'لغو شده'} ثبت شد.`);
  res.status(201).json({ success: true, data: newEnrollment });
});

// -----------------------------------------------------------------------------
// 10. AI Smart Style Consultation Endpoint with Resilient Failover Engine
// -----------------------------------------------------------------------------
apiRouter.post('/ai/consultation', aiLimiter, validateBody(aiConsultationSchema), async (req, res) => {
  // The body holds validated option IDs; the engine and the prompt speak Persian.
  const { faceShape, foreheadHeight, hairLength, hairDensity, hairTexture, occasion, neckline, styleVibe } = toEngineParams(req.body);
  const expertResult = generateExpertStylingAdvice({ faceShape, foreheadHeight, hairLength, hairDensity, hairTexture, occasion, neckline, styleVibe });

  const aiKey = process.env.GEMINI_API_KEY || '';
  if (!aiKey) {
    return res.json({
      success: true,
      data: expertResult
    });
  }

  try {
    // Hard 2.5s budget for Gemini. The request is actually ABORTED on timeout (a bare Promise.race
    // leaves it running and still consuming quota).
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    let aiText = '';
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: aiKey });

      const prompt = `تو استاد ارشد شینیون مو و استایلیست زیبایی آکادمی گیس‌آرا هستی.
کاربری با مشخصات زیر درخواست مشاوره و فیلتر شینیون دارد:
- فرم صورت: ${faceShape || 'مشخص‌نشده'}
- قد پیشانی: ${foreheadHeight || 'مشخص‌نشده'}
- قد مو: ${hairLength || 'مشخص‌نشده'}
- تراکم مو: ${hairDensity || 'مشخص‌نشده'}
- بافت مو: ${hairTexture || 'مشخص‌نشده'}
- نوع مراسم: ${occasion || 'مشخص‌نشده'}
- مدل یقه لباس: ${neckline || 'مشخص‌نشده'}
- سبک مورد علاقه: ${styleVibe || 'مشخص‌نشده'}

لطفاً در ۳ جمله کوتاه و کاملاً حرفه‌ای و منسجم (با لحن صمیمی و تخصصی فارسی)، تحلیل موتور پیشنهاددهنده در خصوص ارتباط قد پیشانی، فرم چهره و یقه لباس با شینیون انتخابی و ترفند فیکساتور مورد نیاز را بیان کن. فقط متن پاسخ فارسی را بدون هیچ مقدمه یا نشانه‌گذاری اضافی خروجی بده.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { abortSignal: controller.signal },
      });
      aiText = response.text ? response.text.trim() : '';
    } finally {
      clearTimeout(timer);
    }

    if (aiText && aiText.length > 20) {
      return res.json({
        success: true,
        data: {
          ...expertResult,
          aiAdvice: aiText,
          source: 'gemini_ai'
        }
      });
    }

    return res.json({
      success: true,
      data: expertResult
    });
  } catch (err: any) {
    console.warn('[AI Consultation Resilient Failover Triggered]:', err.message);
    return res.json({
      success: true,
      data: {
        ...expertResult,
        source: 'expert_rule_engine'
      }
    });
  }
});

// DB Export & Import (1-Click Admin Backup/Restore)
apiRouter.get('/admin/db/export', requireAdmin, (req: any, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=gisara_db_backup_${Date.now()}.json`);
  logAdminAction(req.user.name, 'پشتیبان‌گیری دیتابیس', 'دانلود خروجی کامل دیتابیس سامانه');
  return res.json({
    styles: db.styles,
    techniques: db.techniques,
    articles: db.articles,
    products: db.products,
    courses: db.courses,
    instructors: db.instructors,
    cities: db.cities,
    sessions: db.sessions,
    requests: db.requests,
    orders: db.orders,
    coupons: db.coupons,
    certificates: db.certificates,
    manualEnrollments: db.manualEnrollments,
    paymentIntents: db.paymentIntents,
    users: db.users,
    auditLogs: db.auditLogs
    // `settings` (payment / SMS keys) is deliberately NOT exported: a backup file must never contain live secrets.
  });
});

apiRouter.post('/admin/db/import', requireAdmin, writeLimiter, (req: any, res) => {
  // Validate the WHOLE payload first; apply nothing unless every collection is valid.
  const check = validateImport(req.body);
  if (!check.ok) {
    logAdminAction(req.user.name, 'بازیابی دیتابیس (رد شد)', `فایل پشتیبان نامعتبر: ${check.errors[0]}`);
    return res.status(400).json({ success: false, message: 'فایل پشتیبان نامعتبر است و هیچ تغییری اعمال نشد.', errors: check.errors });
  }

  // Full snapshot first so a bad-but-valid import can be rolled back by hand.
  let snapshot: string;
  try {
    snapshot = snapshotBeforeImport(Object.fromEntries(IMPORTABLE_COLLECTIONS.map(c => [c, (db as any)[c]])));
  } catch (e: any) {
    return res.status(500).json({ success: false, message: 'ایجاد نسخهٔ پشتیبان پیش از بازیابی ناموفق بود؛ بازیابی انجام نشد.' });
  }

  for (const col of IMPORTABLE_COLLECTIONS) {
    const data = check.data[col];
    if (data) (db as any)[col] = data;
  }

  saveDb(true);
  serverCache.clearAll();
  const summary = Object.entries(check.counts).map(([k, v]) => `${k}:${v}`).join(', ');
  logAdminAction(req.user.name, 'بازیابی دیتابیس', `بازیابی از فایل پشتیبان (${summary}). نسخهٔ قبلی: ${snapshot}`);

  res.json({
    success: true,
    message: 'پایگاه‌داده با موفقیت بازگردانی شد.',
    restored: check.counts,
    ignoredCollections: check.ignored,
    previousStateSnapshot: snapshot
  });
});

// -----------------------------------------------------------------------------
// 11. Audit Logs & Dashboard Analytics (Admin Exclusive)
// -----------------------------------------------------------------------------
const handleGetAuditLogs = (req: any, res: any) => {
  res.json({ success: true, data: db.auditLogs || [] });
};

apiRouter.get('/admin/audit-logs', requireAdmin, handleGetAuditLogs);
apiRouter.get('/admin/logs', requireAdmin, handleGetAuditLogs);

apiRouter.get('/admin/analytics', requireAdmin, (req: any, res) => {
  const k = computeKpis();
  const topStyle = db.styles.reduce((max, s) => (s.viewsCount > max.viewsCount ? s : max), db.styles[0] || { name: 'ندارد', viewsCount: 0 });

  res.json({
    success: true,
    data: {
      totalSalesToman: k.netRevenueToman,
      ordersCount: k.paidOrdersCount,
      workshopRequestsCount: k.totalRequestsCount,
      productsCount: k.productsCount,
      pendingRefundToman: k.pendingRefundToman,
      refundedToman: k.refundedToman,
      topStyle: { name: topStyle.name, views: topStyle.viewsCount },
      recentLogs: db.auditLogs.slice(0, 5)
    }
  });
});
apiRouter.get('/admin/metrics', requireAdmin, (req: any, res) => {
  try {
    const cached = serverCache.get('admin_dashboard_metrics');
    if (cached) return res.json({ success: true, data: cached, _cached: true });

    const k = computeKpis();
    const metrics = {
      pendingOrdersCount: k.pendingOrdersCount,
      paidOrdersCount: k.paidOrdersCount,
      openRequestsCount: k.openRequestsCount,
      lowStockCount: k.lowStockCount,
      lowStockThreshold: k.lowStockThreshold,
      totalRevenue: k.netRevenueToman,
      activeStylesCount: k.activeStylesCount,
      totalArticlesCount: k.totalArticlesCount,
      timestamp: new Date().toISOString()
    };

    serverCache.set('admin_dashboard_metrics', metrics, 2 * 60 * 1000);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    console.error('[Admin Metrics Exception]:', err.message);
    res.status(500).json({ success: false, message: 'خطا در محاسبه آمارهای سیستمی داشبورد' });
  }
});

// -----------------------------------------------------------------------------
// 12. Admin System Settings & Payment Gateway Callbacks
// -----------------------------------------------------------------------------
// Secrets never leave the server in clear text: the browser only learns whether a key exists and its last 4 characters.
const maskSecret = (v?: string) => (v ? `••••${v.slice(-4)}` : '');
const publicSettings = () => {
  const st: any = db.settings || {
    payment: { provider: 'zarinpal', merchantId: '', sandbox: true },
    sms: { provider: 'kavenegar', apiKey: '', patternCode: 'otp_verify' }
  };
  return {
    payment: { provider: st.payment.provider, sandbox: st.payment.sandbox, merchantId: maskSecret(st.payment.merchantId), hasMerchantId: !!st.payment.merchantId },
    sms: { provider: st.sms.provider, patternCode: st.sms.patternCode, apiKey: maskSecret(st.sms.apiKey), hasApiKey: !!st.sms.apiKey }
  };
};

apiRouter.get('/admin/settings', requireAdmin, (req: any, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: publicSettings() });
});

apiRouter.post('/admin/settings', requireAdmin, writeLimiter, validateBody(settingsUpdateSchema), (req: any, res) => {
  const { payment, sms } = req.body;
  if (!db.settings) {
    db.settings = {
      payment: { provider: 'zarinpal', merchantId: '', sandbox: true },
      sms: { provider: 'kavenegar', apiKey: '', patternCode: 'otp_verify' }
    };
  }

  if (payment) {
    db.settings.payment = {
      provider: payment.provider || 'zarinpal',
      // Blank or the masked placeholder = "keep the stored value"; only a genuinely new value replaces it.
      merchantId: payment.merchantId && !String(payment.merchantId).startsWith('••••') ? payment.merchantId : db.settings.payment.merchantId,
      sandbox: payment.sandbox !== undefined ? Boolean(payment.sandbox) : true
    };
  }

  if (sms) {
    db.settings.sms = {
      provider: sms.provider || 'kavenegar',
      apiKey: sms.apiKey && !String(sms.apiKey).startsWith('••••') ? sms.apiKey : db.settings.sms.apiKey,
      patternCode: sms.patternCode !== undefined ? sms.patternCode : db.settings.sms.patternCode
    };
  }

  saveDb(true);
  logAdminAction(req.user.name, 'بروزرسانی تنظیمات سیستم', 'ارتقا یا تغییر کلیدهای درگاه پرداخت و پنل پیامک');

  res.json({
    success: true,
    message: 'تنظیمات درگاه پرداخت و سامانه پیامک با موفقیت به روز شد.',
    data: publicSettings()
  });
});

// Where the gateway sends the customer back. PUBLIC_BASE_URL pins it in production so a spoofed
// Host header can never redirect a paying customer (or the gateway callback) elsewhere.
function resolveBaseUrl(req: any): string {
  const pinned = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (pinned) return pinned;
  return `${req.protocol || 'https'}://${req.get('host') || 'localhost:3000'}`;
}

// Create Online Payment Gateway Link
apiRouter.post('/payments/request', requireAuth, writeLimiter, async (req: any, res) => {
  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ success: false, message: 'کد سفارش الزامی است.' });
  }

  const order: any = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'سفارش مورد نظر یافت نشد.' });
  }

  // Ownership check — a user may only request payment for their own order.
  if (req.user.role !== 'ADMIN' && order.userMobile !== req.user.mobile) {
    return res.status(403).json({ success: false, message: 'شما مجاز به پرداخت این سفارش نیستید.' });
  }

  // A declined payment may be retried while the original payment window is still
  // open (the stock reservation is not extended).
  if (order.status === 'PAYMENT_FAILED') {
    const windowOpen = !order.paymentExpiresAt || Date.parse(order.paymentExpiresAt) > Date.now();
    const decision = checkOrderTransition('PAYMENT_FAILED', 'PENDING_PAYMENT', 'SYSTEM');
    if (windowOpen && decision.allowed) {
      order.status = 'PENDING_PAYMENT';
      db.orders = [...db.orders];
    }
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return res.status(409).json({ success: false, message: 'این سفارش در وضعیت قابل پرداخت نیست.' });
  }
  if (order.paymentExpiresAt && Date.parse(order.paymentExpiresAt) < Date.now()) {
    return res.status(409).json({ success: false, message: 'مهلت پرداخت این سفارش به پایان رسیده است.' });
  }

  // A course bought through another order in the meantime must not be paid for twice.
  const owned = new Set(getEntitledCourseIds(order.userMobile));
  if ((order.items || []).some((i: any) => i.type === 'ONLINE_COURSE' && owned.has(i.courseId))) {
    return res.status(409).json({ success: false, message: 'یکی از دوره‌های این سفارش قبلاً برای شما فعال شده است. سفارش را لغو و سبد خرید را اصلاح کنید.' });
  }

  const now = Date.now();
  const intentsForOrder = db.paymentIntents.filter(pi => pi.orderId === orderId);
  if (intentsForOrder.some(pi => pi.status === 'VERIFYING')) {
    return res.status(409).json({ success: false, message: 'پرداخت قبلی شما در حال بررسی است. لطفاً چند لحظه صبر کنید.' });
  }
  // Idempotent: a retry (timeout, double click) re-uses the still-valid gateway session
  // instead of opening a second one for the same order.
  const live = intentsForOrder.find(pi => pi.status === 'PENDING' && Date.parse(pi.expiresAt) > now && pi.paymentUrl);
  if (live) {
    return res.json({
      success: true,
      paymentUrl: live.paymentUrl,
      authority: live.providerAuthority,
      isSimulated: live.provider === 'simulated',
      reused: true
    });
  }

  const callbackUrl = `${resolveBaseUrl(req)}/api/payments/verify?orderId=${encodeURIComponent(orderId)}`;

  const pgResult = await requestPaymentGateway({
    orderId,
    amountToman: order.payableToman,
    description: `پرداخت سفارش ${order.orderNumber} در گیس‌آرا`,
    mobile: order.userMobile || order.mobile,
    callbackUrl
  });

  if (!pgResult.success || !pgResult.authority) {
    if (res.headersSent) return; // the request-timeout middleware already answered
    return res.status(503).json({ success: false, message: pgResult.message || 'اتصال به درگاه پرداخت برقرار نشد.' });
  }

  order.paymentRefId = pgResult.authority;

  // Persist a payment intent so /payments/verify can bind the incoming callback to
  // (orderId, amount, authority). Saved BEFORE responding, so even if the HTTP response
  // was lost to a timeout, the client's retry finds and re-uses this intent.
  const intent = {
    id: newId('pi'),
    orderId,
    amountToman: order.payableToman,
    provider: pgResult.isSimulated ? 'simulated' : 'zarinpal',
    providerAuthority: pgResult.authority,
    paymentUrl: pgResult.url,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20-minute gateway window
  };
  db.paymentIntents = [intent, ...db.paymentIntents];
  db.orders = [...db.orders];

  if (res.headersSent) return;
  res.json({
    success: true,
    paymentUrl: pgResult.url,
    authority: pgResult.authority,
    isSimulated: pgResult.isSimulated,
    message: pgResult.message
  });
});

// Redirect the customer to the account page with a machine-readable outcome + a human message.
type PayOutcome = 'success' | 'failed' | 'cancelled' | 'pending';
function payRedirect(res: any, o: { status: PayOutcome; orderId?: string; refId?: string; message?: string }) {
  const q = new URLSearchParams({ tab: 'orders', paymentStatus: o.status });
  if (o.orderId) q.set('orderId', o.orderId);
  if (o.refId) q.set('refId', o.refId);
  if (o.message) q.set('message', o.message);
  return res.redirect(`/account?${q.toString()}`);
}

// Verify Online Payment Callback from Zarinpal / Simulator
apiRouter.get('/payments/verify', async (req: any, res) => {
  const authority = String(req.query.Authority || '');
  const gatewayStatus = String(req.query.Status || '');
  const orderId = String(req.query.orderId || '');

  if (!authority || !orderId) {
    return payRedirect(res, { status: 'failed', message: 'شناسه پرداخت یافت نشد.' });
  }

  const order: any = db.orders.find(o => o.id === orderId);
  if (!order) {
    return payRedirect(res, { status: 'failed', message: 'سفارش یافت نشد.' });
  }

  // --- Binding & idempotency checks ---------------------------------------
  const intent: any = db.paymentIntents.find(pi => pi.providerAuthority === authority);

  if (!intent || intent.orderId !== orderId) {
    // Never trust the query string alone.
    return payRedirect(res, { status: 'failed', orderId, message: 'شناسه پرداخت با سفارش مطابقت ندارد.' });
  }

  if (intent.status === 'VERIFYING') {
    // A second callback for the same authority while the first is still being verified.
    return payRedirect(res, { status: 'pending', orderId, message: 'پرداخت شما در حال بررسی است. لطفاً چند لحظه بعد وضعیت سفارش را ببینید.' });
  }

  if (intent.status !== 'PENDING') {
    // Replay of an already-processed callback. Decided by THIS intent's own outcome, not just the
    // order status: an order can hold several intents (declined attempt, then a successful retry).
    if (intent.status === 'SUCCEEDED' && order.status === 'PAID' && order.paymentIntentId === intent.id) {
      return payRedirect(res, { status: 'success', orderId, refId: order.paymentRefId || '' });
    }
    return payRedirect(res, { status: 'failed', orderId, message: 'این پرداخت قبلاً پردازش شده است.' });
  }

  if (new Date(intent.expiresAt).getTime() < Date.now()) {
    intent.status = 'EXPIRED';
    db.paymentIntents = [...db.paymentIntents];
    const decision = checkOrderTransition(order.status, 'EXPIRED', 'SYSTEM');
    if (decision.allowed) {
      order.status = 'EXPIRED';
      releaseReservedStock(order);
      releaseCouponUsage(order);
      db.orders = [...db.orders];
      serverCache.invalidate('admin_');
    }
    return payRedirect(res, { status: 'failed', orderId, message: 'مهلت پرداخت به پایان رسیده است.' });
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return payRedirect(res, { status: 'failed', orderId, message: 'سفارش در وضعیت قابل تأیید نیست.' });
  }

  // Amount binding — what we are about to verify must be what the order currently costs.
  if (intent.amountToman !== order.payableToman) {
    intent.status = 'FAILED';
    db.paymentIntents = [...db.paymentIntents];
    return payRedirect(res, { status: 'failed', orderId, message: 'مبلغ پرداخت با مبلغ سفارش مطابقت ندارد.' });
  }

  if (gatewayStatus !== 'OK') {
    intent.status = 'FAILED';
    db.paymentIntents = [...db.paymentIntents];
    const decision = checkOrderTransition(order.status, 'PAYMENT_FAILED', 'SYSTEM');
    if (decision.allowed) {
      order.status = 'PAYMENT_FAILED';
      db.orders = [...db.orders];
      serverCache.invalidate('admin_');
    }
    return payRedirect(res, { status: 'cancelled', orderId, message: 'پرداخت توسط شما لغو شد یا از سوی بانک تأیید نشد.' });
  }

  // Claim the intent SYNCHRONOUSLY, before the first await: two concurrent callbacks can no
  // longer both pass the PENDING check, and the expiry sweeper skips orders with a live intent.
  intent.status = 'VERIFYING';
  db.paymentIntents = [...db.paymentIntents];

  let verifyRes: { success: boolean; refId?: string; message?: string; retryable?: boolean };
  try {
    verifyRes = await verifyPaymentGateway(authority, intent.amountToman);
  } catch (err: any) {
    verifyRes = { success: false, retryable: true, message: err?.message };
  }

  if (verifyRes.success) {
    const decision = checkOrderTransition(order.status, 'PAID', 'SYSTEM');
    if (!decision.allowed) {
      // Money was taken but the order can no longer be paid (e.g. an admin cancelled it while we
      // were verifying). Never lose that fact: flag it for manual review / refund.
      intent.status = 'SUCCEEDED';
      intent.verifiedAt = new Date().toISOString();
      intent.needsReview = true;
      db.paymentIntents = [...db.paymentIntents];
      if (!order.systemLogs) order.systemLogs = [];
      order.systemLogs.push(`پرداخت موفق (کد ${verifyRes.refId || authority}) برای سفارشی با وضعیت ${order.status} ثبت شد؛ نیازمند بررسی و بازپرداخت دستی.`);
      db.orders = [...db.orders];
      logAdminAction('سیستم', 'پرداخت نیازمند بررسی', `سفارش ${order.orderNumber}: پرداخت موفق اما وضعیت سفارش ${order.status} است (کد ${verifyRes.refId || authority}).`);
      return payRedirect(res, { status: 'failed', orderId, message: 'پرداخت انجام شد اما سفارش دیگر قابل تأیید نیست. تیم پشتیبانی بررسی و با شما تماس می‌گیرد.' });
    }

    intent.status = 'SUCCEEDED';
    intent.verifiedAt = new Date().toISOString();
    db.paymentIntents = [...db.paymentIntents];

    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    order.paymentRefId = verifyRes.refId || authority;
    order.paymentIntentId = intent.id;
    order.shipmentStatus = order.shipmentStatus || ((order.items || []).some((i: any) => i.type === 'PHYSICAL_PRODUCT') ? 'PACKING' : undefined);
    if (!order.systemLogs) order.systemLogs = [];
    order.systemLogs.push(`پرداخت با کد پیگیری ${order.paymentRefId} در ${new Date().toISOString()} تأیید شد.`);
    db.orders = [...db.orders];
    serverCache.invalidate('admin_');

    // Confirmation SMS is best-effort and must never affect the payment outcome.
    const recipientMobile = order.userMobile || order.mobile;
    if (recipientMobile) {
      sendOrderConfirmationSMS(recipientMobile, order.orderNumber, order.paymentRefId).catch(() => {});
    }

    return payRedirect(res, { status: 'success', orderId, refId: order.paymentRefId });
  }

  if (verifyRes.retryable) {
    // The gateway could not be reached: the customer may well have paid. Do NOT mark the attempt
    // failed — re-open the intent so the outcome is not decided by a network blip.
    intent.status = 'PENDING';
    db.paymentIntents = [...db.paymentIntents];
    return payRedirect(res, { status: 'pending', orderId, message: 'تأیید پرداخت با تأخیر مواجه شد. اگر مبلغ از حساب شما کسر شده، تا چند ساعت آینده به‌صورت خودکار برگشت داده می‌شود یا با پشتیبانی تماس بگیرید.' });
  }

  intent.status = 'FAILED';
  db.paymentIntents = [...db.paymentIntents];
  const decision = checkOrderTransition(order.status, 'PAYMENT_FAILED', 'SYSTEM');
  if (decision.allowed) {
    order.status = 'PAYMENT_FAILED';
    db.orders = [...db.orders];
    serverCache.invalidate('admin_');
  }
  return payRedirect(res, { status: 'failed', orderId, message: verifyRes.message || 'تأیید پرداخت از سمت بانک ناموفق بود.' });
});

// -----------------------------------------------------------------------------
// 13. Direct Image Upload & Media Library Management
// -----------------------------------------------------------------------------
// Known magic-byte (file signature) prefixes for the image types we accept.
// SVG is intentionally NOT in this allowlist: it is XML/script-capable and we
// have no SVG sanitizer in this codebase yet (see P0.5 in AUDIT_BASELINE.md).
const IMAGE_SIGNATURES: Record<string, (buf: Buffer) => boolean> = {
  jpg: (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  png: (buf) => buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  gif: (buf) => buf.length > 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a'),
  webp: (buf) => buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
};

apiRouter.post('/upload', requireAdmin, writeLimiter, (req: any, res) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, message: 'فایل تصویر ارسال نشده است.' });
    }

    // Extract mime type and base64 buffer. SVG deliberately excluded from
    // the accepted pattern below — see IMAGE_SIGNATURES comment.
    const matches = imageBase64.match(/^data:(image\/(jpe?g|png|gif|webp));base64,(.+)$/i);
    if (!matches || matches.length !== 4) {
      return res.status(400).json({ success: false, message: 'فرمت تصویر ارسالی معتبر نیست. فرمت‌های مجاز: JPG، PNG، GIF، WEBP.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[3];
    const buffer = Buffer.from(base64Data, 'base64');

    // Max 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.' });
    }

    // Determine extension from the declared MIME type, then verify the
    // actual file signature (magic bytes) matches — never trust the
    // client-declared MIME type alone.
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';

    const signatureCheck = IMAGE_SIGNATURES[ext];
    if (!signatureCheck || !signatureCheck(buffer)) {
      return res.status(400).json({ success: false, message: 'محتوای فایل با نوع اعلام‌شده مطابقت ندارد.' });
    }

    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sanitizedTitle = (filename || 'img').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const uniqueFilename = `${sanitizedTitle}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;
    logAdminAction(req.user?.name || 'مدیر', 'آپلود مستقیم تصویر', `آپلود عکس ${uniqueFilename}`);

    res.json({
      success: true,
      message: 'تصویر با موفقیت آپلود گردید.',
      url: fileUrl,
      filename: uniqueFilename,
      sizeKb: Math.round(buffer.length / 1024)
    });
  } catch (err: any) {
    console.error('[Upload Exception]:', err.message);
    res.status(500).json({ success: false, message: `خطا در ذخیره‌سازی تصویر: ${err.message}` });
  }
});

// Get Media Library List
apiRouter.get('/admin/media', requireAdmin, (req: any, res) => {
  try {
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    const mediaList = files
      .filter((f: string) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f))
      .map((f: string) => {
        const stats = fs.statSync(path.join(uploadsDir, f));
        return {
          filename: f,
          url: `/uploads/${f}`,
          sizeKb: Math.round(stats.size / 1024),
          createdAt: stats.mtime.toISOString()
        };
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: mediaList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست رسانه‌ها' });
  }
});

// Delete Media File
apiRouter.delete('/admin/media/:filename', requireAdmin, (req: any, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logAdminAction(req.user?.name || 'مدیر', 'حذف رسانه', `حذف فایل ${safeFilename}`);
      return res.json({ success: true, message: 'فایل با موفقیت حذف شد.' });
    }

    res.status(404).json({ success: false, message: 'فایل یافت نشد.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'خطا در حذف فایل' });
  }
});
