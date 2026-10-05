import { Router } from 'express';
import fs from 'fs';
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
  clearAuthCookie
} from './auth';

import { Product, UserOrder, WorkshopRequest, Article, StyleModel } from '../src/types/domain';
import { sendSMS } from './sms';
import { requestPaymentGateway, verifyPaymentGateway } from './payment';
import { checkOrderTransition } from './orderStateMachine';
import { releaseReservedStock, releaseCouponUsage } from './orderLifecycle';
import { validateImport, snapshotBeforeImport, IMPORTABLE_COLLECTIONS } from './dbImport';
import { validateBody, productCreateSchema, productUpdateSchema, styleCreateSchema, styleUpdateSchema, courseCreateSchema, courseUpdateSchema, couponCreateSchema, couponUpdateSchema, certificateCreateSchema, settingsUpdateSchema, workshopRequestSchema, aiConsultationSchema, articleCreateSchema, articleUpdateSchema, techniqueCreateSchema, techniqueUpdateSchema, sessionCreateSchema, sessionUpdateSchema } from './validation';
import { getEntitledCourseIds, hasCourseAccess, toPublicCourse, findLesson } from './courseAccess';
import { isJalaliExpired } from './jalali';
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
function logAdminAction(adminUser: string, action: string, details: string) {
  const newLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
  const { mobile } = req.body || {};
  if (typeof mobile !== 'string' || !/^09[0-9]{9}$/.test(mobile.trim())) {
    return res.status(400).json({ success: false, message: 'شماره موبایل معتبر نیست.' });
  }

  const code = generateOTP(mobile.trim());
  const smsResult = await sendSMS(mobile.trim(), code);

  if (!smsResult.success) {
    // Delivery failed / SMS not configured: discard the code so it can never be used.
    db.otps = db.otps.filter(o => o.mobile !== mobile.trim());
    return res.status(503).json({ success: false, message: 'ارسال پیامک در حال حاضر ممکن نیست. لطفاً کمی بعد دوباره تلاش کنید.' });
  }

  // The code must never be returned to the client — it only ever travels
  // from the server to the SMS provider to the user's phone. In non-production
  // "simulated_dev" mode, sendSMS() already echoes the code into its own
  // `message` field so local testing still works without an SMS provider.
  res.json({
    success: true,
    // The provider message can contain the code in simulated (dev) mode - never in production.
    message: process.env.NODE_ENV === 'production' ? 'کد تایید پیامکی ارسال شد.' : (smsResult.message || 'کد تایید پیامکی صادر گردید.'),
    smsProvider: smsResult.provider
  });
});

// Verify OTP SMS
apiRouter.post('/auth/otp/verify', otpVerifyLimiter, (req, res) => {
  const { mobile, code } = req.body || {};
  if (typeof mobile !== 'string' || typeof code !== 'string' || !mobile || !code) {
    return res.status(400).json({ success: false, message: 'شماره موبایل و کد تایید الزامی هستند.' });
  }

  const isValid = verifyOTP(mobile.trim(), code.trim());
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'کد وارد شده معتبر نیست یا منقضی شده است.' });
  }

  // Issue User Token
  const token = generateToken({
    role: 'USER',
    mobile: mobile.trim(),
    name: `کاربر ${mobile.trim().slice(-4)}`
  });

  // Set Secure HttpOnly Cookie
  setAuthCookie(res, token, 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    message: 'ورود با موفقیت انجام شد.',
    user: {
      mobile: mobile.trim(),
      name: `کاربر ${mobile.trim().slice(-4)}`,
      role: 'USER'
    }
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

  // Set Secure HttpOnly Cookie
  setAuthCookie(res, token, 12 * 60 * 60 * 1000);

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

// Current User Session Info (/auth/me)
apiRouter.get('/auth/me', (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'کاربر احراز هویت نشده است.' });
  }

  res.json({
    success: true,
    user: req.user
  });
});

// Logout and Clear Auth Cookie
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
    id: `style-${Date.now()}`,
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
    id: `prod-${Date.now()}`,
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
  const { cartItems, shippingInfo, couponCode } = req.body;
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'سبد خرید خالی است.' });
  }

  // ---------------------------------------------------------------------------
  // Validate + price every line from SERVER data (never trust client price/title),
  // and only then reserve stock. Two passes make the reservation all-or-nothing:
  // previously a failure on line N returned 400 after lines 1..N-1 had already
  // been decremented, and negative/fractional quantities were accepted.
  // ---------------------------------------------------------------------------
  const MAX_LINES = 50;
  const MAX_QTY_PER_LINE = 20;
  if (cartItems.length > MAX_LINES) {
    return res.status(400).json({ success: false, message: 'تعداد اقلام سبد خرید بیش از حد مجاز است.' });
  }

  const lineItems: any[] = [];
  const stockDemand = new Map<string, number>();
  let subtotal = 0;

  for (const item of cartItems) {
    if (!item || typeof item !== 'object') {
      return res.status(400).json({ success: false, message: 'آیتم سبد خرید نامعتبر است.' });
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return res.status(400).json({ success: false, message: 'تعداد یکی از اقلام نامعتبر است.' });
    }
    const image = typeof item.image === 'string' ? item.image.slice(0, 500) : '';
    const lineId = typeof item.id === 'string' ? item.id.slice(0, 100) : `line-${lineItems.length + 1}`;

    if (item.type === 'ONLINE_COURSE') {
      const course = db.courses.find(c => c.id === item.courseId && c.status === 'PUBLISHED');
      if (!course) {
        return res.status(400).json({ success: false, message: 'دوره انتخاب‌شده یافت نشد یا در دسترس نیست.' });
      }
      if (qty !== 1) {
        return res.status(400).json({ success: false, message: 'هر دوره آنلاین فقط یک‌بار قابل خرید است.' });
      }
      subtotal += course.priceToman;
      lineItems.push({ id: lineId, type: 'ONLINE_COURSE', courseId: course.id, title: course.name, priceToman: course.priceToman, quantity: 1, image });
      continue;
    }

    const product = db.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: 'محصول انتخاب‌شده یافت نشد.' });
    }
    stockDemand.set(product.id, (stockDemand.get(product.id) || 0) + qty);
    subtotal += product.priceToman * qty;
    lineItems.push({ id: lineId, type: 'PHYSICAL_PRODUCT', productId: product.id, title: product.name, sku: (product as any).sku, priceToman: product.priceToman, quantity: qty, image });
  }

  // Check aggregated demand (the same product may appear on several lines).
  for (const [productId, qty] of stockDemand) {
    const product = db.products.find(p => p.id === productId)!;
    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `موجودی انبار محصول ${product.name} کافی نیست.` });
    }
  }
  // Validation complete: reserve stock. Kept synchronous (no await) so the
  // check-then-decrement above is atomic within the single-threaded event loop.
  for (const [productId, qty] of stockDemand) {
    const product = db.products.find(p => p.id === productId)!;
    product.stock -= qty;
  }

  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ success: false, message: 'کد تخفیف معتبر نیست.' });
    }
    if (isJalaliExpired(coupon.expiresAtJalali)) {
      return res.status(400).json({ success: false, message: 'کد تخفیف منقضی شده است.' });
    }
    if ((coupon as any).usageLimit && coupon.usageCount >= (coupon as any).usageLimit) {
      return res.status(400).json({ success: false, message: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.' });
    }
    if (coupon.minOrderToman && subtotal < coupon.minOrderToman) {
      return res.status(400).json({ success: false, message: `حداقل مبلغ سفارش برای این کد تخفیف ${coupon.minOrderToman.toLocaleString('fa-IR')} تومان است.` });
    }
    discount = Math.round((subtotal * coupon.discountPercent) / 100);
    if (coupon.maxDiscountToman && discount > coupon.maxDiscountToman) {
      discount = coupon.maxDiscountToman;
    }
    coupon.usageCount++;
  }

  const shippingCost = subtotal > 1000000 ? 0 : 45000; // Free shipping over 1M Toman
  const finalTotal = Math.max(0, subtotal - discount + shippingCost);

  const orderNumber = `GSR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const PAYMENT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes to complete payment before the order/reservation expires

  const newOrder: any = {
    id: `order-${Date.now()}`,
    orderNumber,
    items: lineItems,
    subtotalToman: subtotal,
    shippingToman: shippingCost,
    payableToman: finalTotal,
    status: 'PENDING_PAYMENT' as any,
    createdAt: new Date().toISOString(),
    paymentExpiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS).toISOString(),
    userMobile: req.user.mobile,
    couponApplied: couponCode || undefined,
    shippingAddress: {
      recipientName: sanitizeInput(shippingInfo?.recipientName || req.user.name),
      mobile: sanitizeInput(shippingInfo?.recipientMobile || req.user.mobile),
      province: shippingInfo?.province || 'تهران',
      city: shippingInfo?.city || 'تهران',
      addressLine: sanitizeInput(shippingInfo?.addressLine || 'تحویل دیجیتال'),
      postalCode: sanitizeInput(shippingInfo?.postalCode || '1111111111')
    },
    systemLogs: [`سفارش با شناسه پیگیری ${orderNumber} ثبت شد و در انتظار پرداخت است.`]
  };

  db.orders = [newOrder, ...db.orders];
  db.products = [...db.products]; // Trigger product state saving
  db.coupons = [...db.coupons];
  
  // Invalidate cache
  serverCache.invalidate('products');
  
  res.status(201).json({
    success: true,
    message: 'سفارش با موفقیت ثبت شد. برای تکمیل، به درگاه پرداخت هدایت می‌شوید.',
    order: newOrder
  });
});

apiRouter.put('/orders/:id/status', requireAdmin, (req: any, res) => {
  const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
  }

  const { status, shipmentStatus, trackingCode } = req.body;
  const currentOrder = db.orders[orderIndex] as any;

  if (status && status !== currentOrder.status) {
    const decision = checkOrderTransition(currentOrder.status, status, 'ADMIN');
    if (!decision.allowed) {
      return res.status(409).json({ success: false, message: decision.reason });
    }
    currentOrder.status = status;
    if (status === 'CANCELLED' || status === 'EXPIRED') {
      releaseReservedStock(currentOrder);
      releaseCouponUsage(currentOrder);
      db.products = [...db.products];
    }
  }

  const VALID_SHIPMENT_STATUSES = ['UNFULFILLED', 'PACKING', 'SHIPPED', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED'];
  if (shipmentStatus) {
    if (!VALID_SHIPMENT_STATUSES.includes(shipmentStatus)) {
      return res.status(400).json({ success: false, message: 'وضعیت مرسوله نامعتبر است.' });
    }
    currentOrder.shipmentStatus = shipmentStatus;
  }
  if (trackingCode) currentOrder.trackingCode = trackingCode;
  
  if (!currentOrder.systemLogs) currentOrder.systemLogs = [];
  currentOrder.systemLogs.push(`تغییر وضعیت در تاریخ ${new Date().toLocaleTimeString('fa-IR')}: وضعیت سفارش به ${status || currentOrder.status} تغییر کرد.`);

  db.orders = [...db.orders];
  logAdminAction(req.user.name, 'تغییر وضعیت سفارش', `به‌روزرسانی سفارش ${currentOrder.orderNumber}`);

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
  const body = req.body;

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
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
apiRouter.post('/courses', requireAdmin, writeLimiter, validateBody(courseCreateSchema), (req: any, res) => {
  const body = req.body;
  const newCourse: any = {
    id: `course-${Date.now()}`,
    name: body.name,
    slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
    kind: body.kind || 'ONLINE',
    summary: body.summary || '',
    description: body.description || '',
    instructorId: body.instructorId || '',
    priceToman: body.priceToman,
    compareAtPriceToman: body.compareAtPriceToman,
    level: body.level || 'مبتدی',
    durationMinutes: body.durationMinutes ?? 0,
    status: body.status || 'DRAFT',
    modules: (body.modules || []).map((m: any, mi: number) => ({
      id: m.id || `mod-${mi + 1}`,
      title: m.title || '',
      lessons: m.lessons.map((l: any) => ({ ...l }))
    }))
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
  const updated = { ...db.courses[idx], ...patch };
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
    id: `session-${Date.now()}`,
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
    id: `article-${Date.now()}`,
    slug: body.slug || `article-${Date.now()}`,
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
    id: `technique-${Date.now()}`,
    slug: body.slug || `tech-${Date.now()}`,
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
  const coupon = db.coupons.find(c => c.code.toLowerCase() === req.params.code.toLowerCase());
  if (!coupon || !coupon.isActive) {
    return res.status(404).json({ success: false, message: 'کد تخفیف معتبر نیست یا منقضی شده است.' });
  }
  if (isJalaliExpired(coupon.expiresAtJalali)) {
    return res.status(404).json({ success: false, message: 'کد تخفیف منقضی شده است.' });
  }
  if ((coupon as any).usageLimit && coupon.usageCount >= (coupon as any).usageLimit) {
    return res.status(404).json({ success: false, message: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.' });
  }
  // minOrderToman cannot be fully checked without the cart total; the order-creation
  // route enforces it authoritatively. This endpoint reports it so the UI can warn early.
  res.json({ success: true, data: coupon });
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
    id: `coupon-${Date.now()}`,
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

  const certCode = `GSR-CERT-${Math.floor(Math.random() * 90000 + 10000)}`;

  const newCert = {
    id: `cert-${Date.now()}`,
    certificateCode: certCode,
    courseId: body.courseId || `course-${Date.now()}`,
    courseTitle: body.courseTitle,
    studentName: body.studentName,
    studentMobile: body.studentMobile,
    issueDateJalali: 'امروز',
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
// Manual Enrollments & Course Access Administration
// -----------------------------------------------------------------------------
apiRouter.get('/admin/enrollments', requireAdmin, (req, res) => {
  res.json({ success: true, data: db.manualEnrollments });
});

apiRouter.post('/admin/enrollments', requireAdmin, writeLimiter, (req: any, res) => {
  const { userMobile, courseId, courseName, status } = req.body;
  if (!userMobile || !courseId || !courseName || !status) {
    return res.status(400).json({ success: false, message: 'اطلاعات ارسالی ناقص است.' });
  }
  if (!/^09[0-9]{9}$/.test(userMobile)) {
    return res.status(400).json({ success: false, message: 'شماره موبایل نامعتبر است.' });
  }
  if (status !== 'ACTIVE' && status !== 'REVOKED') {
    return res.status(400).json({ success: false, message: 'وضعیت نامعتبر است.' });
  }

  // Check if there is an existing override for this user + course
  const existingIdx = db.manualEnrollments.findIndex((e: any) => e.userMobile === userMobile && e.courseId === courseId);
  
  if (existingIdx !== -1) {
    const list = [...db.manualEnrollments];
    list[existingIdx] = {
      ...list[existingIdx],
      status,
      grantedAt: new Date().toISOString()
    };
    db.manualEnrollments = list;
    logAdminAction(req.user.name, 'تغییر دسترسی دستی دوره', `تغییر دسترسی کاربر ${userMobile} به دوره ${courseName} به ${status === 'ACTIVE' ? 'فعال' : 'لغو شده'}`);
    return res.json({ success: true, data: list[existingIdx] });
  }

  const newEnrollment = {
    id: `enrollment-${Date.now()}`,
    userMobile,
    courseId,
    courseName,
    grantedAt: new Date().toISOString(),
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
  const { faceShape, foreheadHeight, hairLength, hairDensity, hairTexture, occasion, neckline, styleVibe } = req.body;
  const expertResult = generateExpertStylingAdvice(req.body);

  const aiKey = process.env.GEMINI_API_KEY || '';
  if (!aiKey) {
    return res.json({
      success: true,
      data: expertResult
    });
  }

  try {
    // 2.5s Timeout Guard for Gemini AI to ensure instantaneous user experience
    const geminiPromise = (async () => {
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
      });

      return response.text ? response.text.trim() : '';
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 2500);
    });

    const aiText = await Promise.race([geminiPromise, timeoutPromise]);

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
    auditLogs: db.auditLogs
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
  // Aggregate calculations
  const totalSales = db.orders.reduce((sum, o: any) => sum + (o.status === 'PAID' || o.status === 'COMPLETED' ? o.payableToman : 0), 0);
  const paidOrdersCount = db.orders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED').length;
  const requestsCount = db.requests.length;
  const productsCount = db.products.length;
  
  // Calculate top-viewed style
  const topStyle = db.styles.reduce((max, s) => s.viewsCount > max.viewsCount ? s : max, db.styles[0] || { name: 'ندارد', viewsCount: 0 });
  
  res.json({
    success: true,
    data: {
      totalSalesToman: totalSales,
      ordersCount: paidOrdersCount,
      workshopRequestsCount: requestsCount,
      productsCount: productsCount,
      topStyle: {
        name: topStyle.name,
        views: topStyle.viewsCount
      },
      recentLogs: db.auditLogs.slice(0, 5)
    }
  });
});

// -----------------------------------------------------------------------------
// 11.5 Admin Metrics & Dashboard Aggregate Cache
// -----------------------------------------------------------------------------
apiRouter.get('/admin/metrics', requireAdmin, (req: any, res) => {
  try {
    const cached = serverCache.get('admin_dashboard_metrics');
    if (cached) return res.json({ success: true, data: cached, _cached: true });

    const pendingOrdersCount = db.orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
    const paidOrdersCount = db.orders.filter((o) => o.status === 'PAID').length;
    const openRequestsCount = db.requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const lowStockCount = db.products.filter((p) => p.stock <= 15).length;
    const totalRevenue = db.orders
      .filter((o) => o.status === 'PAID' || o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.payableToman, 0);

    const metrics = {
      pendingOrdersCount,
      paidOrdersCount,
      openRequestsCount,
      lowStockCount,
      totalRevenue,
      activeStylesCount: db.styles.filter(s => s.status !== 'ARCHIVED').length,
      totalArticlesCount: db.articles.length,
      timestamp: new Date().toISOString()
    };

    serverCache.set('admin_dashboard_metrics', metrics, 2 * 60 * 1000); // 2 minutes server-side TTL
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    console.error('[Admin Metrics Exception]:', err.message);
    res.status(500).json({ success: false, message: 'خطا در محاسبه آمارهای سیستمی داشبورد' });
  }
});

// -----------------------------------------------------------------------------
// 12. Admin System Settings & Payment Gateway Callbacks
// -----------------------------------------------------------------------------
apiRouter.get('/admin/settings', requireAdmin, (req: any, res) => {
  res.json({
    success: true,
    data: db.settings || {
      payment: { provider: 'zarinpal', merchantId: '', sandbox: true },
      sms: { provider: 'kavenegar', apiKey: '', patternCode: 'otp_verify' }
    }
  });
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
      merchantId: payment.merchantId !== undefined ? payment.merchantId : db.settings.payment.merchantId,
      sandbox: payment.sandbox !== undefined ? Boolean(payment.sandbox) : true
    };
  }

  if (sms) {
    db.settings.sms = {
      provider: sms.provider || 'kavenegar',
      apiKey: sms.apiKey !== undefined ? sms.apiKey : db.settings.sms.apiKey,
      patternCode: sms.patternCode !== undefined ? sms.patternCode : db.settings.sms.patternCode
    };
  }

  saveDb(true);
  logAdminAction(req.user.name, 'بروزرسانی تنظیمات سیستم', 'ارتقا یا تغییر کلیدهای درگاه پرداخت و پنل پیامک');

  res.json({
    success: true,
    message: 'تنظیمات درگاه پرداخت و سامانه پیامک با موفقیت به روز شد.',
    data: db.settings
  });
});

// Create Online Payment Gateway Link
apiRouter.post('/payments/request', requireAuth, writeLimiter, async (req: any, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'کد سفارش الزامی است.' });
  }

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'سفارش مورد نظر یافت نشد.' });
  }

  // Ownership check — a user may only request payment for their own order.
  if (req.user.role !== 'ADMIN' && order.userMobile !== req.user.mobile) {
    return res.status(403).json({ success: false, message: 'شما مجاز به پرداخت این سفارش نیستید.' });
  }

  // A declined payment may be retried while the original payment window is still
  // open (the stock reservation is not extended).
  if ((order as any).status === 'PAYMENT_FAILED') {
    const windowOpen = !(order as any).paymentExpiresAt || Date.parse((order as any).paymentExpiresAt) > Date.now();
    const decision = checkOrderTransition('PAYMENT_FAILED', 'PENDING_PAYMENT', 'SYSTEM');
    if (windowOpen && decision.allowed) {
      (order as any).status = 'PENDING_PAYMENT';
      db.orders = [...db.orders];
    }
  }

  if ((order as any).status !== 'PENDING_PAYMENT') {
    return res.status(409).json({ success: false, message: 'این سفارش در وضعیت قابل پرداخت نیست.' });
  }
  if ((order as any).paymentExpiresAt && Date.parse((order as any).paymentExpiresAt) < Date.now()) {
    return res.status(409).json({ success: false, message: 'مهلت پرداخت این سفارش به پایان رسیده است.' });
  }

  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const callbackUrl = `${protocol}://${host}/api/payments/verify?orderId=${orderId}`;

  const pgResult = await requestPaymentGateway({
    orderId,
    amountToman: order.payableToman,
    description: `پرداخت آنلاین سفارش ${orderId} در گیس‌آرا`,
    mobile: order.userMobile || order.mobile,
    callbackUrl
  });

  if (!pgResult.success) {
    return res.status(503).json({ success: false, message: pgResult.message || 'اتصال به درگاه پرداخت برقرار نشد.' });
  }

  if (pgResult.success && pgResult.authority) {
    (order as any).paymentRefId = pgResult.authority;

    // Persist a payment intent so /payments/verify has something real to
    // bind the incoming callback against (orderId, amount, authority) —
    // this is what P0.4 requires and what was previously entirely missing.
    const intent = {
      id: `pi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId,
      amountToman: order.payableToman,
      provider: pgResult.isSimulated ? 'simulated' : 'zarinpal',
      providerAuthority: pgResult.authority,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20-minute gateway window
    };
    db.paymentIntents = [intent, ...db.paymentIntents];
  }

  res.json({
    success: pgResult.success,
    paymentUrl: pgResult.url,
    authority: pgResult.authority,
    isSimulated: pgResult.isSimulated,
    message: pgResult.message
  });
});

// Verify Online Payment Callback from Zarinpal / Simulator
apiRouter.get('/payments/verify', async (req: any, res) => {
  const { Authority, Authority: authorityQuery, Status, orderId } = req.query;
  const authority = Authority || authorityQuery;

  if (!authority || !orderId) {
    return res.redirect('/orders?paymentStatus=failed&message=کد_شناسه_پرداخت_یافت_نشد');
  }

  const order = db.orders.find(o => o.id === orderId) as any;
  if (!order) {
    return res.redirect('/orders?paymentStatus=failed&message=سفارش_یافت_نشد');
  }

  // --- Binding & idempotency checks (P0.4) ---------------------------------
  const intent = db.paymentIntents.find(pi => pi.providerAuthority === String(authority));

  if (!intent || intent.orderId !== orderId) {
    // Either no intent was ever created for this authority, or it belongs
    // to a different order — never trust the query string alone.
    return res.redirect(`/orders?paymentStatus=failed&orderId=${orderId}&message=شناسه_پرداخت_با_سفارش_مطابقت_ندارد`);
  }

  if (intent.status !== 'PENDING') {
    // Already processed — replay of a callback. Idempotency must be decided by
    // THIS intent's own outcome, not merely the order's current status: an order
    // can hold several intents (e.g. a declined attempt followed by a successful
    // retry), and replaying the OLD declined authority must never be reported as
    // success just because the order was later paid through a different intent.
    if (intent.status === 'SUCCEEDED' && order.status === 'PAID' && order.paymentIntentId === intent.id) {
      return res.redirect(`/orders?paymentStatus=success&orderId=${orderId}&refId=${order.paymentRefId || ''}`);
    }
    return res.redirect(`/orders?paymentStatus=failed&orderId=${orderId}&message=این_پرداخت_قبلاً_پردازش_شده_است`);
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
    }
    return res.redirect(`/orders?paymentStatus=failed&orderId=${orderId}&message=مهلت_پرداخت_به_پایان_رسیده_است`);
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return res.redirect(`/orders?paymentStatus=failed&orderId=${orderId}&message=سفارش_در_وضعیت_قابل_تایید_نیست`);
  }

  if (Status === 'NOK') {
    intent.status = 'FAILED';
    db.paymentIntents = [...db.paymentIntents];
    const decision = checkOrderTransition(order.status, 'PAYMENT_FAILED', 'SYSTEM');
    if (decision.allowed) {
      order.status = 'PAYMENT_FAILED';
      db.orders = [...db.orders];
    }
    return res.redirect(`/orders?paymentStatus=cancelled&orderId=${orderId}`);
  }

  // Amount binding — the amount charged must match what we asked for.
  const verifyRes = await verifyPaymentGateway(String(authority), intent.amountToman);
  if (verifyRes.success) {
    const decision = checkOrderTransition(order.status, 'PAID', 'SYSTEM');
    if (!decision.allowed) {
      return res.redirect(`/orders?paymentStatus=failed&orderId=${orderId}&message=${encodeURIComponent(decision.reason || 'خطای_وضعیت_سفارش')}`);
    }

    intent.status = 'SUCCEEDED';
    intent.verifiedAt = new Date().toISOString();
    db.paymentIntents = [...db.paymentIntents];

    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    order.paymentRefId = verifyRes.refId || String(authority);
    order.paymentIntentId = intent.id;
    order.shipmentStatus = order.shipmentStatus || 'PACKING';
    if (!order.systemLogs) order.systemLogs = [];
    order.systemLogs.push(`پرداخت با کد پیگیری ${order.paymentRefId} در تاریخ ${new Date().toLocaleTimeString('fa-IR')} تایید شد.`);
    db.orders = [...db.orders];

    // Send confirmation SMS if mobile available
    const recipientMobile = order.userMobile || order.mobile;
    if (recipientMobile) {
      sendSMS(recipientMobile, `سفارش ${order.id} با کد پیگیری ${order.paymentRefId} تایید شد. گیس‌آرا`);
    }

    return res.redirect(`/orders?paymentStatus=success&orderId=${orderId}&refId=${order.paymentRefId}`);
  } else {
    intent.status = 'FAILED';
    db.paymentIntents = [...db.paymentIntents];
    const decision = checkOrderTransition(order.status, 'PAYMENT_FAILED', 'SYSTEM');
    if (decision.allowed) {
      order.status = 'PAYMENT_FAILED';
      db.orders = [...db.orders];
    }
    return res.redirect(`/orders?paymentStatus=failed&orderId=${orderId}&message=${encodeURIComponent(verifyRes.message || 'خطا_در_استعلام')}`);
  }
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
