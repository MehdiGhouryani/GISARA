/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * شنیون مو (Shanyoon) - Main Application Controller
 * Orchestrating all 4 Core Engines: Content & SEO, Commerce, LMS, In-Person & Admin Workspace
 * Matching UI Workbench v1.0 and Master Blueprint v5.0
 */

import React, { useState, useEffect } from 'react';
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
} from './data/mockData';
import {
  StyleModel,
  Technique,
  Article,
  Product,
  Course,
  City,
  Instructor,
  WorkshopSession,
  CartItem,
  UserOrder,
  WorkshopRequest,
  Coupon,
  Certificate,
  OrderStatus,
  AboutContent,
} from './types/domain';
import { defaultAboutContent } from './data/mockAbout';

// Layout & Common
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { FloatingActions } from './components/common/FloatingActions';
import { PageFallback } from './components/common/PageFallback';
import { useSeoMeta } from './utils/useSeoMeta';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { scheduleIdleRoutePrefetch } from './utils/routePrefetch';

// Primary Core Landing Page (Eager for instant FCP)
import { HomePage } from './pages/HomePage';

// Type Imports for Lazy Components
import type { AuditRecord } from './pages/AdminDashboardPage';

// Performance Optimization: Code-Split Secondary Routes via React.lazy & Suspense
const StylesPage = React.lazy(() =>
  import('./pages/StylesPage').then((m) => ({ default: m.StylesPage }))
);
const StyleDetailPage = React.lazy(() =>
  import('./pages/StyleDetailPage').then((m) => ({ default: m.StyleDetailPage }))
);
const TechniquesPage = React.lazy(() =>
  import('./pages/TechniquesPage').then((m) => ({ default: m.TechniquesPage }))
);
const TechniqueDetailPage = React.lazy(() =>
  import('./pages/TechniqueDetailPage').then((m) => ({ default: m.TechniqueDetailPage }))
);
const MagazinePage = React.lazy(() =>
  import('./pages/MagazinePage').then((m) => ({ default: m.MagazinePage }))
);
const ShopPage = React.lazy(() =>
  import('./pages/ShopPage').then((m) => ({ default: m.ShopPage }))
);
const ProductDetailPage = React.lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CoursesPage = React.lazy(() =>
  import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage }))
);
const CourseDetailPage = React.lazy(() =>
  import('./pages/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage }))
);
const LearnPlayerPage = React.lazy(() =>
  import('./pages/LearnPlayerPage').then((m) => ({ default: m.LearnPlayerPage }))
);
const CityDetailPage = React.lazy(() =>
  import('./pages/CityDetailPage').then((m) => ({ default: m.CityDetailPage }))
);
const CitiesPage = React.lazy(() =>
  import('./pages/CitiesPage').then((m) => ({ default: m.CitiesPage }))
);
const InstructorDetailPage = React.lazy(() =>
  import('./pages/InstructorDetailPage').then((m) => ({ default: m.InstructorDetailPage }))
);
const AccountPage = React.lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage }))
);
const CheckoutPage = React.lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const SearchPage = React.lazy(() =>
  import('./pages/SearchPage').then((m) => ({ default: m.SearchPage }))
);
const AboutPage = React.lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const FaqPage = React.lazy(() =>
  import('./pages/FaqPage').then((m) => ({ default: m.FaqPage }))
);
const AboutContactFaqPage = React.lazy(() =>
  import('./pages/AboutContactFaqPage').then((m) => ({ default: m.AboutContactFaqPage }))
);
// The bank simulator exists ONLY in development builds; production bundles contain no trace of it.
const SimulatedGatewayPage = !import.meta.env.DEV ? null : React.lazy(() =>
  import('./pages/SimulatedGatewayPage').then((m) => ({ default: m.SimulatedGatewayPage }))
);
const AdminDashboardPage = React.lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);

// Security & Resilient Storage Utilities
import { safeGetJSON, safeRemoveKeys, safeSetJSON } from './utils/safeStorage';
import { normalizeCode } from './shared/digits';
import type { PaymentResult } from './pages/AccountPage';
import { isUserAdminAuthenticated, clearAdminAuthentication } from './utils/security';
import { ApiClient } from './services/apiClient';
import { OfflineQueueService } from './utils/offlineQueue';
import { ExporterService } from './utils/exporter';

// Performance Optimization: Lazy Load Heavy Global Modals and Drawers on Demand
const CartDrawer = React.lazy(() =>
  import('./components/commerce/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const OTPModal = React.lazy(() =>
  import('./components/forms/OTPModal').then((m) => ({ default: m.OTPModal }))
);
const RequestModal = React.lazy(() =>
  import('./components/forms/RequestModal').then((m) => ({ default: m.RequestModal }))
);
const MobileNavDrawer = React.lazy(() =>
  import('./components/layout/MobileNavDrawer').then((m) => ({ default: m.MobileNavDrawer }))
);
const StyleConsultationModal = React.lazy(() =>
  import('./components/forms/StyleConsultationModal').then((m) => ({ default: m.StyleConsultationModal }))
);
const OrderTrackingModal = React.lazy(() =>
  import('./components/commerce/OrderTrackingModal').then((m) => ({ default: m.OrderTrackingModal }))
);
const AdminAuthGuardModal = React.lazy(() =>
  import('./components/admin/AdminAuthGuardModal').then((m) => ({ default: m.AdminAuthGuardModal }))
);

/** Same per-line ceiling the server enforces (POST /orders). */
const MAX_LINE_QTY = 20;

/** Union of two carts (e.g. guest cart + saved server cart). Same item -> larger quantity, never summed twice. */
function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const keyOf = (i: CartItem) => (i.type === 'ONLINE_COURSE' ? `c:${i.courseId}` : `p:${i.productId}`);
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    const k = keyOf(item);
    const prev = map.get(k);
    map.set(k, prev ? { ...prev, quantity: item.type === 'ONLINE_COURSE' ? 1 : Math.min(MAX_LINE_QTY, Math.max(prev.quantity, item.quantity)) } : item);
  }
  return [...map.values()];
}

/** Keeps only well-formed cart lines from storage; drops anything tampered/outdated instead of crashing. */
function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const it of raw as any[]) {
    if (!it || typeof it !== 'object') continue;
    const isCourse = it.type === 'ONLINE_COURSE';
    const isProduct = it.type === 'PHYSICAL_PRODUCT';
    if (!isCourse && !isProduct) continue;
    if (isCourse && typeof it.courseId !== 'string') continue;
    if (isProduct && typeof it.productId !== 'string') continue;
    const quantity = isCourse ? 1 : Math.min(20, Math.max(1, Math.trunc(Number(it.quantity) || 0)));
    if (!quantity || typeof it.id !== 'string' || typeof it.title !== 'string' || !Number.isFinite(Number(it.priceToman))) continue;
    out.push({ ...it, quantity, priceToman: Number(it.priceToman) });
  }
  return out;
}

const STORAGE_KEYS = {
  CART: 'shanyoon_cart_v1',
  REQUESTS: 'shanyoon_requests_v1',
  ORDERS: 'shanyoon_orders_v1',
  ENROLLED: 'shanyoon_enrolled_v1',
  PRODUCTS: 'shanyoon_products_v1',
  SESSIONS: 'shanyoon_sessions_v1',
  STYLES: 'shanyoon_styles_v1',
  ARTICLES: 'shanyoon_articles_v1',
  TECHNIQUES: 'shanyoon_techniques_v1',
  COUPONS: 'shanyoon_coupons_v1',
  CERTIFICATES: 'shanyoon_certificates_v1',
  AUDIT: 'shanyoon_audit_v1',
};

export default function App() {
  // Navigation & View State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/+/, '');
      const [routeName] = path.split('?');
      return routeName || 'home';
    }
    return 'home';
  });
  const [searchParam, setSearchParam] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Selected Entities
  const [selectedStyle, setSelectedStyle] = useState<StyleModel | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');

  // Dynamic SEO & Title Management
  useSeoMeta({
    route: currentRoute,
    selectedStyle,
    selectedTechnique,
    selectedProduct,
    selectedCourse,
    selectedArticle,
    selectedCity,
    selectedInstructor,
  });

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'info' | 'error', title: string, message?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Persisted or Stateful Domain Data
  // ---------------------------------------------------------------------------
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : mockProducts;
  });

  const [sessions, setSessions] = useState<WorkshopSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : mockSessions;
  });

  const [styles, setStyles] = useState<StyleModel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STYLES);
    return saved ? JSON.parse(saved) : mockStyles;
  });

  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    return saved ? JSON.parse(saved) : mockArticles;
  });

  const [techniques, setTechniques] = useState<Technique[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TECHNIQUES);
    return saved ? JSON.parse(saved) : mockTechniques;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
    return saved ? JSON.parse(saved) : mockCoupons;
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    return saved ? JSON.parse(saved) : mockCertificates;
  });

  const [faqs, setFaqs] = useState<any[]>(() => {
    const saved = localStorage.getItem('gisara_faqs_v1');
    return saved ? JSON.parse(saved) : [
      {
        id: 'faq-1',
        category: 'COURSES',
        question: 'شینیون مو چیست و چه کاربردی دارد؟',
        answer: 'شینیون مو یک مدل آرایش موست که موها را با سنجاق یا لوازم فرم‌دهی به پشت یا بالای سر جمع می‌کند. این مدل جلوه‌ی کلاسیک و حجیم به مو می‌بخشد و مناسب مراسم رسمی و عروسی است.',
      },
      {
        id: 'faq-2',
        category: 'SHOP',
        question: 'ابزارهای ضروری برای اجرای شینیون حرفه‌ای کدامند؟',
        answer: 'شینیون حرفه‌ای به ابزار تثبیت و حالت‌دهنده نیاز دارد: سنجاق‌های مو (پین) و کش مو برای نگهداشتن پایه‌ها، اسپری فیکساتور (تافت) و موس یا پودر حجم‌دهنده برای تثبیت و حجم‌دهی، و برس چوبی و شانه برای فرم‌دهی اولیه.',
      },
      {
        id: 'faq-3',
        category: 'COURSES',
        question: 'چگونه می‌توان شینیون مو را در خانه مرحله‌به‌مرحله انجام داد؟',
        answer: 'ابتدا موها را شسته، خشک و شانه کنید. سپس موها را دسته‌بندی کرده و از پایین به بالا با کش و سنجاق ببندید. در پایان، برای تثبیت نهایی از اسپری حالت‌دهنده یا تافت استفاده کنید.',
      },
      {
        id: 'faq-4',
        category: 'COURSES',
        question: 'ملاحظات مهم در آموزش شینیون عروس چیست؟',
        answer: 'در شینیون عروس باید مدل مو با فرم صورت و لباس عروس هماهنگ باشد. استفاده از مواد تثبیت‌کننده قوی و اجرای دقیق مراحل نیز الزامی است.',
      },
      {
        id: 'faq-5',
        category: 'SHOP',
        question: 'چگونه دوام شینیون مو را برای مدت طولانی افزایش دهیم؟',
        answer: 'برای ماندگاری شینیون: از محصولات قدرتمند تثبیت‌کننده مانند تافت یا اسپری مو استفاده کنید؛ تافت محلولی چسبنده برای حفظ حالت موست. همچنین استفاده از پودر یا موس حجم‌دهنده قبل از کار و بستن محکم مو با سنجاق مناسب، دوام شینیون را افزایش می‌دهد.',
      },
      {
        id: 'faq-6',
        category: 'COURSES',
        question: 'آیا دسترسی به ویدیوهای دوره‌های آنلاین محدودیت زمانی دارد؟',
        answer: 'خیر، پس از ثبت‌نام در هر یک از دوره‌های آنلاین شنیون مو، دسترسی به تمام قسمت‌ها، ویدیوهای باکیفیت Full-HD و آپدیت‌های تکمیلی دوره به صورت مادام‌العمر در پنل یادگیری شما باقی می‌ماند.',
      },
      {
        id: 'faq-7',
        category: 'COURSES',
        question: 'آیا برای شرکت در دوره‌ها به پیش‌نیاز یا سابقه قبلی نیاز است؟',
        answer: 'خیر، دوره‌ها به صورت سطح‌بندی‌شده (از مبانی فونداسیون، پوش‌دهی اصولی و وزگیری مو تا تکنیک‌های پیشرفته خطی و اروپایی) طراحی شده‌اند. در صفحه هر دوره، پیش‌نیازهای پیشنهادی ذکر شده است.',
      },
      {
        id: 'faq-8',
        category: 'CERTIFICATES',
        question: 'گواهینامه پایان دوره چگونه صادر می‌شود و چطور قابل استعلام است؟',
        answer: 'پس از تکمیل جلسات دوره، گواهینامه معتبر دیجیتال آکادمی با شناسه یکتای اعتبارسنجی در حساب کاربری شما صادر می‌گردد. گواهینامه‌ها دارای بارکد و شناسه استعلام برخط غیرقابل جعل هستند.',
      },
      {
        id: 'faq-9',
        category: 'SHOP',
        question: 'زمان ارسال سفارش‌های ابزار فیزیکی چقدر است؟',
        answer: 'سفارش‌های شهر تهران در همان روز کاری یا نهایتاً ۲۴ ساعت با پیک ویژه ارسال می‌گردند. برای شهرستان‌ها، مرسولات با پست پیشتاز و بسته‌بندی ایمن ضدضربه طی ۲ الی ۳ روز کاری تحویل می‌گردند.',
      },
      {
        id: 'faq-10',
        category: 'SHOP',
        question: 'آیا ابزارها و اسپری‌های مو دارای ضمانت اصالت هستند؟',
        answer: 'بله، تمامی محصولات موجود در فروشگاه شنیون مو (از برندهای معتبر نظیر Osis+، Silhouette و شانه و پین‌های حرفه‌ای) با ضمانت ۱۰۰٪ اورجینال بودن و تاریخ انقضای معتبر ارائه می‌شوند.',
      },
      {
        id: 'faq-11',
        category: 'WORKSHOPS',
        question: 'چگونه می‌توانم درخواست برگزاری ورکشاپ در شهر خودم را ثبت کنم؟',
        answer: 'در بخش کارگاه‌های حضوری یا از طریق دکمه «درخواست ورکشاپ»، می‌توانید شهر مورد نظرتان را به همراه تعداد نفرات انتخاب کنید. به محض رسیدن به حد نصاب، تیم هماهنگی آکادمی تاریخ و سالن را برنامه‌ریزی و به شما پیامک می‌فرستد.',
      }
    ];
  });

  // Dedicated About Page Content State (Synced with CMS)
  const [aboutContent, setAboutContent] = useState<AboutContent>(() => {
    const saved = localStorage.getItem('gisara_about_content_v1');
    return saved ? JSON.parse(saved) : defaultAboutContent;
  });

  const handleUpdateAboutContent = (updated: AboutContent) => {
    setAboutContent(updated);
    localStorage.setItem('gisara_about_content_v1', JSON.stringify(updated));
    logAudit('UPDATE_ABOUT', 'AboutContent', 'about', 'بروزرسانی محتوای صفحه درباره ما در سامانه مدیریت CMS');
    addToast('success', 'تغییرات صفحه درباره ما با موفقیت ذخیره شد');
  };

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // The cart starts EMPTY for a new visitor and survives corrupted/tampered storage (no white screen).
  const [cartItems, setCartItems] = useState<CartItem[]>(() => sanitizeCart(safeGetJSON<unknown>(STORAGE_KEYS.CART, [])));

  const [userRequests, setUserRequests] = useState<WorkshopRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : mockInitialRequests;
  });

  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Order history is owned by the server (it contains names, phones and addresses). It is held in memory
  // only: never seeded with sample orders and never written to browser storage.
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);

  // Course entitlement is owned by the server (derived from PAID orders). It is never
  // read from or written to browser storage - editing storage cannot grant access.
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [manualEnrollments, setManualEnrollments] = useState<any[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : [
      {
        id: 'aud-001',
        actor: 'سیستم مرکزی',
        action: 'INITIAL_BOOTSTRAP',
        entityType: 'System',
        entityId: 'SYS',
        timestamp: new Date().toISOString(),
        note: 'بارگذاری کاتالوگ و شالوده داده‌های اولیه شنیون مو',
      },
    ];
  });

  // Synchronize route and selected entities on load, popstate, and when database lists update
  const resolveEntitiesFromUrl = () => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const slug = searchParams.get('slug') || '';
    const id = searchParams.get('id') || '';

    const path = pathname.replace(/^\/+/, '');
    const [route] = path.split('?');
    let activeRoute = route || 'home';

    // Auto-normalize legacy about-contact route to dedicated /about or /faq slug
    if (activeRoute === 'about-contact') {
      const tab = searchParams.get('tab');
      activeRoute = tab === 'faq' ? 'faq' : 'about';
      try {
        window.history.replaceState({ route: activeRoute }, '', `/${activeRoute}`);
      } catch {
        // ignore iframe constraints
      }
    }

    // Update current route if different
    if (currentRoute !== activeRoute) {
      setCurrentRoute(activeRoute);
    }

    // Resolve specific entities based on route and query params
    if (activeRoute === 'style-detail' && slug) {
      const found = styles.find((s) => s.slug === slug);
      if (found && (!selectedStyle || selectedStyle.id !== found.id)) {
        setSelectedStyle(found);
      }
    } else if (activeRoute === 'technique-detail' && slug) {
      const found = techniques.find((t) => t.slug === slug);
      if (found && (!selectedTechnique || selectedTechnique.id !== found.id)) {
        setSelectedTechnique(found);
      }
    } else if (activeRoute === 'course-detail' && slug) {
      const found = mockCourses.find((c) => c.slug === slug);
      if (found && (!selectedCourse || selectedCourse.id !== found.id)) {
        setSelectedCourse(found);
      }
    } else if (activeRoute === 'product-detail' && slug) {
      const found = products.find((p) => p.slug === slug);
      if (found && (!selectedProduct || selectedProduct.id !== found.id)) {
        setSelectedProduct(found);
      }
    } else if (activeRoute === 'city-detail' && slug) {
      const found = mockCities.find((c) => c.slug === slug);
      if (found && (!selectedCity || selectedCity.id !== found.id)) {
        setSelectedCity(found);
      }
    } else if (activeRoute === 'instructor-detail' && id) {
      const found = mockInstructors.find((i) => i.id === id);
      if (found && (!selectedInstructor || selectedInstructor.id !== found.id)) {
        setSelectedInstructor(found);
      }
    } else if (activeRoute === 'mag') {
      if (slug) {
        const found = articles.find((a) => a.slug === slug);
        if (found && (!selectedArticle || selectedArticle.id !== found.id)) {
          setSelectedArticle(found);
        }
      } else {
        if (selectedArticle !== null) {
          setSelectedArticle(null);
        }
      }
    }
  };

  useEffect(() => {
    resolveEntitiesFromUrl();
    scheduleIdleRoutePrefetch(['styles', 'techniques', 'shop', 'courses', 'mag', 'cart', 'search']);
  }, [styles, techniques, products, articles]);

  // Startup Fullstack Session & Live Data Sync
  useEffect(() => {
    async function initSession() {
      // 1. First try verifying server-side HttpOnly cookie session
      try {
        const meRes = await ApiClient.getCurrentUser();
        if (meRes && meRes.success && meRes.user) {
          ApiClient.markSession(true);
          ApiClient.getEnrollments().then(setEnrolledCourseIds).catch(() => {});
          setIsLoggedIn(true);
          setUserMobile(meRes.user.mobile || '');
          setUserName(meRes.user.name || '');
          if (meRes.user.role === 'ADMIN') {
            setIsAdminMode(true);
          }
          return;
        }
      } catch {
        // 401 = no valid cookie session (guest) - handled below
      }

      // No valid server session: the browser holds no readable credential to fall back on.
      ApiClient.markSession(false);
      setIsLoggedIn(false);
      setUserMobile('');
      setUserName('');
    }

    async function loadData() {
      try {
        const liveStyles = await ApiClient.getStyles(styles);
        setStyles(liveStyles);
      } catch (e) {}

      try {
        const liveProducts = await ApiClient.getProducts(products);
        setProducts(liveProducts);
      } catch (e) {}

      try {
        const liveArticles = await ApiClient.getArticles(articles);
        setArticles(liveArticles);
      } catch (e) {}
      
      try {
        const liveTechniques = await ApiClient.getTechniques(techniques);
        setTechniques(liveTechniques);
      } catch (e) {}

      try {
        const liveSessions = await ApiClient.getSessions(sessions);
        setSessions(liveSessions);
      } catch (e) {}

      // Fetch user-specific order history if authenticated
      if (ApiClient.hasSession()) {
        try {
          const liveOrders = await ApiClient.getOrders([]);
          if (liveOrders && liveOrders.length > 0) {
            setUserOrders(liveOrders);
          }
        } catch (e) {}
      }

      // Fetch admin-exclusive logs and requests ONLY if logged in as Admin
      if (isAdminMode || isUserAdminAuthenticated()) {
        try {
          const liveRequests = await ApiClient.getWorkshopRequests([]);
          if (liveRequests && liveRequests.length > 0) {
            setUserRequests(liveRequests);
          }
        } catch (e) {}

        try {
          const liveLogs = await ApiClient.getAdminAuditLogs();
          if (liveLogs && liveLogs.length > 0) {
            const formattedLogs: AuditRecord[] = liveLogs.map((l: any) => ({
              id: l.id,
              actor: l.user,
              action: l.action,
              entityType: 'System',
              entityId: 'SYS',
              timestamp: l.timestamp,
              note: l.details
            }));
            setAuditLogs((prev) => [...formattedLogs, ...prev.filter(p => !formattedLogs.some(f => f.id === p.id))]);
          }
        } catch (e) {}
      }
    }

    // Gateway round trip: the server redirects to /account?tab=orders&paymentStatus=...&orderId=...
    // Success is NEVER trusted from the URL alone - the order is re-read from the server and must be PAID.
    async function settlePaymentReturn() {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('paymentStatus');
      if (!status) return;
      const orderId = params.get('orderId') || undefined;
      const refId = params.get('refId') || undefined;
      const message = params.get('message') || undefined;
      // Drop the one-shot parameters immediately so a refresh or a copied link never replays the result.
      window.history.replaceState({}, document.title, `${window.location.pathname}?tab=orders`);

      if (status === 'success') {
        let confirmed: UserOrder | undefined;
        try {
          const serverOrders = await ApiClient.getOrders([]);
          if (serverOrders && serverOrders.length > 0) setUserOrders(serverOrders);
          confirmed = (serverOrders || []).find((o: any) => o.id === orderId && (o.status === 'PAID' || o.status === 'COMPLETED'));
        } catch { /* handled below as "not confirmed yet" */ }

        if (confirmed) {
          setPaymentResult({ status: 'success', orderId, refId: refId || confirmed.paymentRefId });
          handleCompleteOrder(confirmed); // refreshes enrollments and empties the cart
        } else {
          setPaymentResult({ status: 'pending', orderId, message: 'پرداخت شما ثبت شد ولی هنوز در سامانه تأیید نشده است. چند دقیقه بعد همین صفحه را دوباره باز کنید؛ اگر مبلغ کسر شده بود تأیید نهایی خودکار انجام می‌شود.' });
        }
        return;
      }

      if (status === 'failed' || status === 'cancelled' || status === 'pending') {
        setPaymentResult({ status, orderId, message });
        try {
          const serverOrders = await ApiClient.getOrders([]);
          if (serverOrders && serverOrders.length > 0) setUserOrders(serverOrders);
        } catch { /* orders are refreshed by loadData as well */ }
      }
    }

    // Resolve the server session first so loadData knows whether to fetch private data, then settle a
    // possible return from the payment gateway (it needs the session to read the order).
    initSession()
      .finally(() => { setAuthReady(true); loadData(); settlePaymentReturn(); });
  }, []);

  // Fetch Admin Data whenever Admin Mode is explicitly activated
  useEffect(() => {
    if (isAdminMode) {
      ApiClient.getWorkshopRequests([]).then((liveRequests) => {
        if (liveRequests && liveRequests.length > 0) setUserRequests(liveRequests);
      }).catch(() => {});

      ApiClient.getManualEnrollments().then((liveEnrollments) => {
        if (liveEnrollments) setManualEnrollments(liveEnrollments);
      }).catch(() => {});

      ApiClient.getAdminAuditLogs().then((liveLogs) => {
        if (liveLogs && liveLogs.length > 0) {
          const formattedLogs: AuditRecord[] = liveLogs.map((l: any) => ({
            id: l.id,
            actor: l.user,
            action: l.action,
            entityType: 'System',
            entityId: 'SYS',
            timestamp: l.timestamp,
            note: l.details
          }));
          setAuditLogs((prev) => [...formattedLogs, ...prev.filter(p => !formattedLogs.some(f => f.id === p.id))]);
        }
      }).catch(() => {});
    }
  }, [isAdminMode]);

  // Online/Offline Connectivity Monitor
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('success', 'اتصال برقرار شد', 'سیستم همگام‌سازی سمت سرور مجدداً متصل گردید.');
      OfflineQueueService.flushQueue().then((res) => {
        if (res.syncedCount > 0) {
          addToast('success', 'همگام‌سازی اطلاعات آفلاین', `${res.syncedCount} درخواست ذخیره‌شده با موفقیت به سرور منتقل شد.`);
        }
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('info', 'حالت آفلاین فعال شد', 'در حال استفاده از نسخه کش‌شده محلی کلاینت گیس‌آرا.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // LocalStorage & Server Cart Sync Effect
  useEffect(() => {
    safeSetJSON(STORAGE_KEYS.CART, cartItems);
  }, [cartItems]);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(userRequests));
  }, [userRequests]);

  useEffect(() => {
    // Older builds persisted every order (PII) in the browser; remove that leftover.
    safeRemoveKeys([STORAGE_KEYS.ORDERS]);
  }, []);

  useEffect(() => {
    // Legacy builds kept a client-side enrollment list; it is meaningless now, remove it.
    try { localStorage.removeItem(STORAGE_KEYS.ENROLLED); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STYLES, JSON.stringify(styles));
  }, [styles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TECHNIQUES, JSON.stringify(techniques));
  }, [techniques]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('gisara_faqs_v1', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAudit = (action: string, entityType: string, entityId: string, note: string) => {
    const record: AuditRecord = {
      id: `aud-${Date.now().toString().slice(-5)}`,
      actor: 'مدیر سامانه (SuperAdmin)',
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      note,
    };
    setAuditLogs((prev) => [record, ...prev]);
  };

  // CMS Handlers
  const handleAddNewStyle = async (newStyle: Omit<StyleModel, 'id' | 'viewsCount' | 'createdAt'>) => {
    try {
      const savedStyle = await ApiClient.createStyle(newStyle);
      setStyles((prev) => [savedStyle, ...prev]);
      logAudit('CREATE_STYLE', 'StyleModel', savedStyle.id, `ثبت مدل جدید «${savedStyle.name}» در ژورنال شنیون`);
      addToast('success', 'مدل جدید به ژورنال اضافه شد', savedStyle.name);
    } catch (err: any) {
      console.warn('Backend createStyle failed, falling back to local state:', err);
      const id = `style-${Date.now().toString().slice(-4)}`;
      const fullStyle: StyleModel = {
        ...newStyle,
        id,
        viewsCount: 1,
        createdAt: new Date().toISOString(),
      };
      setStyles((prev) => [fullStyle, ...prev]);
      logAudit('CREATE_STYLE', 'StyleModel', id, `ثبت مدل جدید «${fullStyle.name}» در ژورنال شنیون`);
      addToast('success', 'مدل جدید به ژورنال اضافه شد', fullStyle.name);
    }
  };

  const handleDeleteStyle = async (styleId: string) => {
    const target = styles.find((s) => s.id === styleId);
    try {
      await ApiClient.deleteStyle(styleId);
      setStyles((prev) => prev.filter((s) => s.id !== styleId));
      logAudit('DELETE_STYLE', 'StyleModel', styleId, `حذف مدل «${target?.name || styleId}» از ژورنال`);
      addToast('info', 'مدل از ژورنال حذف شد', target?.name);
    } catch (err: any) {
      console.warn('Backend deleteStyle failed, falling back to local state:', err);
      setStyles((prev) => prev.filter((s) => s.id !== styleId));
      logAudit('DELETE_STYLE', 'StyleModel', styleId, `حذف مدل «${target?.name || styleId}» از ژورنال`);
      addToast('info', 'مدل از ژورنال حذف شد', target?.name);
    }
  };

  const handleUpdateStyle = async (updatedStyle: StyleModel) => {
    try {
      const saved = await ApiClient.updateStyle(updatedStyle.id, updatedStyle);
      setStyles((prev) => prev.map((s) => (s.id === updatedStyle.id ? (saved || updatedStyle) : s)));
      logAudit('UPDATE_STYLE', 'StyleModel', updatedStyle.id, `ویرایش مدل شنیون «${updatedStyle.name}»`);
      addToast('success', 'تغییرات مدل ذخیره شد', updatedStyle.name);
    } catch (err: any) {
      console.warn('Backend updateStyle failed, updating local state:', err);
      setStyles((prev) => prev.map((s) => (s.id === updatedStyle.id ? updatedStyle : s)));
      logAudit('UPDATE_STYLE', 'StyleModel', updatedStyle.id, `ویرایش مدل شنیون «${updatedStyle.name}»`);
      addToast('success', 'تغییرات مدل ذخیره شد', updatedStyle.name);
    }
  };

  const handleAddNewArticle = async (newArticle: Omit<Article, 'id' | 'publishedAt'>) => {
    try {
      const saved = await ApiClient.createArticle(newArticle);
      setArticles((prev) => [saved, ...prev]);
      logAudit('CREATE_ARTICLE', 'Article', saved.id, `انتشار مقاله جدید «${saved.title}» در مجله`);
      addToast('success', 'مقاله جدید در مجله منتشر شد', saved.title);
    } catch (err: any) {
      console.warn('Backend createArticle failed, using local state:', err);
      const id = `art-${Date.now().toString().slice(-4)}`;
      const fullArt: Article = {
        ...newArticle,
        id,
        publishedAt: new Date().toISOString(),
      };
      setArticles((prev) => [fullArt, ...prev]);
      logAudit('CREATE_ARTICLE', 'Article', id, `انتشار مقاله جدید «${fullArt.title}» در مجله`);
      addToast('success', 'مقاله جدید در مجله منتشر شد', fullArt.title);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    const target = articles.find((a) => a.id === articleId);
    try {
      await ApiClient.deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      logAudit('DELETE_ARTICLE', 'Article', articleId, `حذف مقاله «${target?.title || articleId}»`);
      addToast('info', 'مقاله حذف شد', target?.title);
    } catch (err: any) {
      console.warn('Backend deleteArticle failed, using local state:', err);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      logAudit('DELETE_ARTICLE', 'Article', articleId, `حذف مقاله «${target?.title || articleId}»`);
      addToast('info', 'مقاله حذف شد', target?.title);
    }
  };

  const handleUpdateArticle = async (updatedArticle: Article) => {
    try {
      const saved = await ApiClient.updateArticle(updatedArticle.id, updatedArticle);
      setArticles((prev) => prev.map((a) => (a.id === updatedArticle.id ? (saved || updatedArticle) : a)));
      logAudit('UPDATE_ARTICLE', 'Article', updatedArticle.id, `ویرایش مقاله «${updatedArticle.title}»`);
      addToast('success', 'تغییرات مقاله ذخیره شد', updatedArticle.title);
    } catch (err: any) {
      console.warn('Backend updateArticle failed, updating local state:', err);
      setArticles((prev) => prev.map((a) => (a.id === updatedArticle.id ? updatedArticle : a)));
      logAudit('UPDATE_ARTICLE', 'Article', updatedArticle.id, `ویرایش مقاله «${updatedArticle.title}»`);
      addToast('success', 'تغییرات مقاله ذخیره شد', updatedArticle.title);
    }
  };

  const handleAddNewTechnique = async (newTechnique: Omit<Technique, 'id'>) => {
    try {
      const saved = await ApiClient.createTechnique(newTechnique);
      setTechniques((prev) => [saved, ...prev]);
      logAudit('CREATE_TECHNIQUE', 'Technique', saved.id, `ثبت تکنیک جدید «${saved.name}»`);
      addToast('success', 'تکنیک جدید ثبت شد', saved.name);
    } catch (err: any) {
      console.warn('Backend createTechnique failed, using local state:', err);
      const id = `tech-${Date.now().toString().slice(-4)}`;
      const fullTech: Technique = {
        ...newTechnique,
        id,
      };
      setTechniques((prev) => [fullTech, ...prev]);
      logAudit('CREATE_TECHNIQUE', 'Technique', id, `ثبت تکنیک جدید «${fullTech.name}»`);
      addToast('success', 'تکنیک جدید ثبت شد', fullTech.name);
    }
  };

  const handleDeleteTechnique = async (techniqueId: string) => {
    const target = techniques.find((t) => t.id === techniqueId);
    try {
      await ApiClient.deleteTechnique(techniqueId);
      setTechniques((prev) => prev.filter((t) => t.id !== techniqueId));
      logAudit('DELETE_TECHNIQUE', 'Technique', techniqueId, `حذف تکنیک «${target?.name || techniqueId}»`);
      addToast('info', 'تکنیک حذف شد', target?.name);
    } catch (err: any) {
      console.warn('Backend deleteTechnique failed, using local state:', err);
      setTechniques((prev) => prev.filter((t) => t.id !== techniqueId));
      logAudit('DELETE_TECHNIQUE', 'Technique', techniqueId, `حذف تکنیک «${target?.name || techniqueId}»`);
      addToast('info', 'تکنیک حذف شد', target?.name);
    }
  };

  const handleUpdateTechnique = async (updatedTechnique: Technique) => {
    try {
      const saved = await ApiClient.updateTechnique(updatedTechnique.id, updatedTechnique);
      setTechniques((prev) => prev.map((t) => (t.id === updatedTechnique.id ? (saved || updatedTechnique) : t)));
      logAudit('UPDATE_TECHNIQUE', 'Technique', updatedTechnique.id, `ویرایش تکنیک «${updatedTechnique.name}»`);
      addToast('success', 'تغییرات تکنیک ذخیره شد', updatedTechnique.name);
    } catch (err: any) {
      console.warn('Backend updateTechnique failed, updating local state:', err);
      setTechniques((prev) => prev.map((t) => (t.id === updatedTechnique.id ? updatedTechnique : t)));
      logAudit('UPDATE_TECHNIQUE', 'Technique', updatedTechnique.id, `ویرایش تکنیک «${updatedTechnique.name}»`);
      addToast('success', 'تغییرات تکنیک ذخیره شد', updatedTechnique.name);
    }
  };

  const handleAddNewCoupon = (newCoupon: Omit<Coupon, 'id' | 'usageCount'>) => {
    const id = `coup-${Date.now().toString().slice(-4)}`;
    const fullCoup: Coupon = {
      ...newCoupon,
      id,
      usageCount: 0,
    };
    setCoupons((prev) => [fullCoup, ...prev]);
    logAudit('CREATE_COUPON', 'Coupon', id, `تعریف کد تخفیف «${fullCoup.code}» با ${fullCoup.discountPercent}٪ تخفیف`);
    addToast('success', 'کد تخفیف جدید ایجاد شد', `${fullCoup.code} (${fullCoup.discountPercent}٪)`);
  };

  const handleToggleCouponStatus = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === couponId) {
          const updated = { ...c, isActive: !c.isActive };
          logAudit('TOGGLE_COUPON', 'Coupon', couponId, `تغییر وضعیت کد «${c.code}» به ${updated.isActive ? 'فعال' : 'غیرفعال'}`);
          addToast('info', `کد ${c.code} ${updated.isActive ? 'فعال' : 'غیرفعال'} شد`);
          return updated;
        }
        return c;
      })
    );
  };

  const handleDeleteCoupon = (couponId: string) => {
    const target = coupons.find((c) => c.id === couponId);
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    logAudit('DELETE_COUPON', 'Coupon', couponId, `حذف کد تخفیف «${target?.code || couponId}»`);
    addToast('info', 'کد تخفیف حذف شد', target?.code);
  };

  const handleUpdateCoupon = (updatedCoupon: Coupon) => {
    setCoupons((prev) => prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c)));
    logAudit('UPDATE_COUPON', 'Coupon', updatedCoupon.id, `ویرایش مشخصات کد تخفیف «${updatedCoupon.code}»`);
    addToast('success', 'کد تخفیف به‌روزرسانی شد', updatedCoupon.code);
  };

  const handleAddNewFaq = (faq: { category: string; question: string; answer: string }) => {
    const id = `faq-${Date.now().toString().slice(-4)}`;
    const newFaq = {
      id,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
    };
    setFaqs((prev) => [newFaq, ...prev]);
    logAudit('CREATE_FAQ', 'FAQ', id, `ثبت سوال متداول جدید: «${faq.question.slice(0, 30)}...»`);
    addToast('success', 'سوال متداول جدید ثبت شد', faq.question);
  };

  const handleDeleteFaq = (faqId: string) => {
    const target = faqs.find((f) => f.id === faqId);
    setFaqs((prev) => prev.filter((f) => f.id !== faqId));
    logAudit('DELETE_FAQ', 'FAQ', faqId, `حذف سوال متداول: «${target?.question?.slice(0, 30) || faqId}...»`);
    addToast('info', 'سوال متداول حذف شد', target?.question);
  };

  const handleUpdateFaq = (faqId: string, updatedData: { category: string; question: string; answer: string }) => {
    setFaqs((prev) =>
      prev.map((f) => {
        if (f.id === faqId) {
          const updated = { ...f, ...updatedData };
          logAudit('UPDATE_FAQ', 'FAQ', faqId, `ویرایش سوال متداول: «${updated.question.slice(0, 30)}...»`);
          return updated;
        }
        return f;
      })
    );
    addToast('success', 'سوال متداول به‌روزرسانی شد', updatedData.question);
  };

  // The server is the only authority on whether a code is valid (active, not expired, capacity left):
  // there is deliberately NO local fallback, otherwise an expired code could show a discount that the
  // order would then reject at the very last step.
  const handleApplyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const clean = normalizeCode(code);
    if (!clean) return { success: false, message: 'کد تخفیف را وارد کنید.' };

    try {
      const liveCoupon = await ApiClient.validateCoupon(clean);
      if (!liveCoupon) return { success: false, message: 'کد تخفیف معتبر نیست.' };

      const subtotal = cartItems.reduce((acc, item) => acc + item.priceToman * item.quantity, 0);
      if (liveCoupon.minOrderToman && subtotal < liveCoupon.minOrderToman) {
        return {
          success: false,
          message: `حداقل مبلغ سفارش برای این کد ${liveCoupon.minOrderToman.toLocaleString('fa-IR')} تومان است.`,
        };
      }
      setAppliedCoupon(liveCoupon);
      return { success: true, message: `کد ${liveCoupon.code} با ${liveCoupon.discountPercent.toLocaleString('fa-IR')}٪ تخفیف اعمال شد.` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'بررسی کد تخفیف ممکن نشد. دوباره تلاش کنید.' };
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    addToast('info', 'کد تخفیف حذف شد');
  };

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  // Signed OUT until the server confirms a session; `authReady` flips once /auth/me has answered.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userMobile, setUserMobile] = useState('');
  const [userName, setUserName] = useState('');

  // Server-side cart copy exists only for signed-in users; debounced so rapid +/- clicks send one request.
  useEffect(() => {
    if (!authReady || !isLoggedIn) return;
    const t = window.setTimeout(() => { ApiClient.syncCart(cartItems).catch(() => {}); }, 700);
    return () => window.clearTimeout(t);
  }, [cartItems, isLoggedIn, authReady]);

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('shanyoon_user_avatar') || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80';
  });

  const handleUpdateProfile = (newName: string, newAvatar: string) => {
    setUserName(newName);
    setUserAvatar(newAvatar);
    localStorage.setItem('shanyoon_user_avatar', newAvatar);
    addToast('success', 'پروفایل بروزرسانی شد', `نام شما به «${newName}» تغییر یافت.`);
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestModalSession, setRequestModalSession] = useState<WorkshopSession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Browser History synchronization (Clean URLs & Back/Forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      resolveEntitiesFromUrl();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [styles, techniques, products, articles]);

  // Navigation
  const handleNavigate = (route: string) => {
    setIsAdminMode(false);
    
    let targetRoute = route;
    if (route === 'about-contact') {
      targetRoute = 'about';
    } else if (route === 'about-contact?tab=faq') {
      targetRoute = 'faq';
    } else if (route === 'style-detail' && selectedStyle) {
      targetRoute = `style-detail?slug=${selectedStyle.slug}`;
    } else if (route === 'technique-detail' && selectedTechnique) {
      targetRoute = `technique-detail?slug=${selectedTechnique.slug}`;
    } else if (route === 'course-detail' && selectedCourse) {
      targetRoute = `course-detail?slug=${selectedCourse.slug}`;
    } else if (route === 'product-detail' && selectedProduct) {
      targetRoute = `product-detail?slug=${selectedProduct.slug}`;
    } else if (route === 'city-detail' && selectedCity) {
      targetRoute = `city-detail?slug=${selectedCity.slug}`;
    } else if (route === 'instructor-detail' && selectedInstructor) {
      targetRoute = `instructor-detail?id=${selectedInstructor.id}`;
    } else if (route === 'mag' && selectedArticle) {
      targetRoute = `mag?slug=${selectedArticle.slug}`;
    }

    if (targetRoute.startsWith('search')) {
      const q = targetRoute.split('?q=')[1] ? decodeURIComponent(targetRoute.split('?q=')[1]) : '';
      setSearchParam(q);
      setCurrentRoute('search');
      try {
        window.history.pushState({ route: 'search' }, '', `/?q=${encodeURIComponent(q)}`);
      } catch {
        // ignore iframe security constraint if any
      }
    } else {
      const [routeName] = targetRoute.split('?');
      setCurrentRoute(routeName);
      try {
        const cleanPath = routeName === 'home' ? '/' : `/${targetRoute}`;
        window.history.pushState({ route: routeName }, '', cleanPath);
      } catch {
        // ignore iframe security constraint if any
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(MAX_LINE_QTY, item.quantity + 1) } : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}`,
          type: 'PHYSICAL_PRODUCT',
          productId: product.id,
          title: product.name,
          sku: product.sku,
          priceToman: product.priceToman,
          quantity: 1,
          image: product.image,
        },
      ];
    });
    addToast('success', 'به سبد خرید اضافه شد', product.name);
    setIsCartOpen(true);
  };

  const handleAddToCartWithQty = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(MAX_LINE_QTY, item.quantity + quantity) } : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}`,
          type: 'PHYSICAL_PRODUCT',
          productId: product.id,
          title: product.name,
          sku: product.sku,
          priceToman: product.priceToman,
          quantity: Math.min(MAX_LINE_QTY, quantity),
          image: product.image,
        },
      ];
    });
    addToast('success', `${quantity} عدد به سبد افزوده شد`, product.name);
    setIsCartOpen(true);
  };

  const handleEnrollCourse = (course: Course) => {
    if (enrolledCourseIds.includes(course.id)) {
      addToast('info', 'این دوره قبلاً برای شما فعال شده است', 'از بخش «دوره‌های من» در حساب کاربری ادامه دهید.');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.courseId === course.id);
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `cart-course-${course.id}`,
          type: 'ONLINE_COURSE',
          courseId: course.id,
          title: course.name,
          priceToman: course.priceToman,
          quantity: 1,
          image: course.heroImage,
        },
      ];
    });
    addToast('success', 'دوره به سبد خرید اضافه شد', course.name);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.min(MAX_LINE_QTY, item.quantity + delta);
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCompleteOrder = (newOrder: UserOrder) => {
    // Guard against duplicate application (e.g. an effect firing twice) —
    // this must be idempotent since it's now called from the payment-success
    // redirect handler, not from order creation.
    setUserOrders((prev) => {
      if (prev.some((o) => o.id === newOrder.id)) {
        return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
      }
      return [newOrder, ...prev];
    });

    // Physical stock is already reserved/decremented server-side at order
    // creation (see server/api.ts POST /orders) — the locally displayed
    // `products` list is refreshed from the server via loadData(), so no
    // separate client-side decrement is applied here.

    // Access is never granted locally: re-read the server's entitlement list, which is
    // derived from the now-PAID order.
    if (newOrder.items.some((i) => i.type === 'ONLINE_COURSE')) {
      ApiClient.getEnrollments().then(setEnrolledCourseIds).catch(() => {});
    }

    setCartItems([]);
  };

  // Workshop Request Actions
  const handleOpenRequestModal = (session?: WorkshopSession) => {
    if (!isLoggedIn) {
      addToast('info', 'ورود به حساب کاربری الزامی است', 'جهت ثبت درخواست کارگاه، بفرمایید ابتدا با شماره همراه وارد شوید.');
      setIsAuthModalOpen(true);
      return;
    }
    setRequestModalSession(session || null);
    setIsRequestModalOpen(true);
  };

  const handleOpenConsultation = () => {
    if (!isLoggedIn) {
      addToast('info', 'ورود به حساب کاربری الزامی است', 'جهت درخواست مشاوره تخصصی، بفرمایید ابتدا وارد حساب خود شوید.');
      setIsAuthModalOpen(true);
      return;
    }
    setIsConsultationOpen(true);
  };

  const handleRequestSubmitted = (newRequest: WorkshopRequest) => {
    setUserRequests((prev) => [newRequest, ...prev]);
    logAudit('REQUEST_SUBMITTED', 'WorkshopRequest', newRequest.id, `ثبت درخواست شرکت برای ${newRequest.fullName}`);
    addToast('success', 'درخواست شما ثبت شد', 'کارشناس آموزش ظرف ۲۴ ساعت درخواست را بررسی خواهد کرد.');
  };

  const handleAcceptProposal = (requestId: string) => {
    setUserRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'ACCEPTED' } : r))
    );
    logAudit('PROPOSAL_ACCEPTED_BY_USER', 'WorkshopRequest', requestId, 'متقاضی پیشنهاد تاریخ و مکان جلسه را تایید کرد.');
    addToast('success', 'پیشنهاد کارگاه تأیید شد', 'صندلی شما در کارگاه رزرو شد و جزئیات نهایی پیامک خواهد شد.');
  };

  const handleDeclineProposal = (requestId: string) => {
    setUserRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'DECLINED' } : r))
    );
    logAudit('PROPOSAL_DECLINED_BY_USER', 'WorkshopRequest', requestId, 'متقاضی پیشنهاد جلسه را رد کرد.');
    addToast('info', 'درخواست زمان جایگزین ثبت شد', 'کارشناس زمان‌های جدید را بررسی خواهد کرد.');
  };

  // Admin Operational Actions
  const handleAddNewProduct = async (newProductData: Omit<Product, 'id'>) => {
    try {
      const savedProd = await ApiClient.createProduct(newProductData);
      setProducts((prev) => [savedProd, ...prev]);
      logAudit('NEW_PRODUCT_CREATED', 'Product', savedProd.id, `افزودن محصول جدید: ${savedProd.name} با موجودی ${savedProd.stock}`);
      addToast('success', 'محصول جدید ثبت شد', `${savedProd.name} با موفقیت در فروشگاه منتشر شد.`);
    } catch (err: any) {
      console.warn('Backend createProduct failed, using client state fallback:', err);
      const newProd: Product = {
        ...newProductData,
        id: `prod-${Date.now()}`,
      };
      setProducts((prev) => [newProd, ...prev]);
      logAudit('NEW_PRODUCT_CREATED', 'Product', newProd.id, `افزودن محصول جدید: ${newProd.name} با موجودی ${newProd.stock}`);
      addToast('success', 'محصول جدید ثبت شد', `${newProd.name} با موفقیت در فروشگاه منتشر شد.`);
    }
  };

  const handleAddNewSession = async (newSessionData: Omit<WorkshopSession, 'id'>) => {
    try {
      const saved = await ApiClient.createSession(newSessionData);
      setSessions((prev) => [saved, ...prev]);
      logAudit('NEW_WORKSHOP_SESSION_CREATED', 'WorkshopSession', saved.id, `ایجاد کارگاه جدید در ${saved.cityName} با ظرفیت ${saved.capacity}`);
      addToast('success', 'جلسه کارگاهی جدید ایجاد شد', `کارگاه در شهر ${saved.cityName} منتشر گردید.`);
    } catch (err: any) {
      console.warn('Backend createSession failed, using local state fallback:', err);
      const newSess: WorkshopSession = {
        ...newSessionData,
        id: `sess-${Date.now()}`,
      };
      setSessions((prev) => [newSess, ...prev]);
      logAudit('NEW_WORKSHOP_SESSION_CREATED', 'WorkshopSession', newSess.id, `ایجاد کارگاه جدید در ${newSess.cityName} با ظرفیت ${newSess.capacity}`);
      addToast('success', 'جلسه کارگاهی جدید ایجاد شد', `کارگاه در شهر ${newSess.cityName} منتشر گردید.`);
    }
  };

  const handleUpdateManualEnrollment = async (userMobile: string, courseId: string, courseName: string, status: 'ACTIVE' | 'REVOKED') => {
    try {
      const updated = await ApiClient.submitManualEnrollment(userMobile, courseId, courseName, status);
      setManualEnrollments((prev) => {
        const idx = prev.findIndex((e) => e.userMobile === userMobile && e.courseId === courseId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
      // Force refresh user enrollments if the current logged-in user is affected
      if (isLoggedIn && userMobile === userMobile) {
        ApiClient.getEnrollments().then(setEnrolledCourseIds).catch(() => {});
      }
      logAudit('UPDATE_MANUAL_ENROLLMENT', 'ManualEnrollment', updated.id || 'N/A', `تغییر دسترسی دستی کاربر ${userMobile} به دوره ${courseName} به ${status === 'ACTIVE' ? 'فعال' : 'لغو شده'}`);
      addToast('success', 'وضعیت دسترسی دستی به‌روزرسانی شد', `دسترسی به دوره ${courseName} به ${status === 'ACTIVE' ? 'فعال' : 'لغو شده'} تغییر یافت.`);
    } catch (err: any) {
      addToast('error', 'خطا در ثبت تغییرات دسترسی', err?.message || 'مشکلی رخ داد.');
    }
  };

  const handleUpdateProductStock = (productId: string, newStock: number, note: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    logAudit('MANUAL_INVENTORY_ADJUSTMENT', 'Product', productId, `${note} (موجودی جدید: ${newStock})`);
    addToast('info', 'موجودی انبار به‌روزرسانی شد', `موجودی به ${newStock} عدد تغییر یافت.`);
  };

  const handleAdminProposeSchedule = (
    requestId: string,
    proposal: {
      cityName: string;
      instructorName: string;
      dateJalali: string;
      venueName: string;
      priceToman: number;
    }
  ) => {
    setUserRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'SCHEDULE_PROPOSED',
              proposal: {
                id: `prop-${Date.now().toString().slice(-4)}`,
                cityName: proposal.cityName,
                instructorName: proposal.instructorName,
                dateJalali: proposal.dateJalali,
                venueName: proposal.venueName,
                priceToman: proposal.priceToman,
                expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
              },
            }
          : r
      )
    );
    logAudit('ADMIN_SCHEDULE_PROPOSAL', 'WorkshopRequest', requestId, `ارسال پیشنهاد جلسه ${proposal.dateJalali} با تدریس ${proposal.instructorName}`);
    addToast('success', 'پیشنهاد جلسه برای کاربر ارسال شد', 'متقاضی در پیشخوان کاربری خود می‌تواند تاریخ را تأیید کند.');
  };

  const handleAdminDeclineRequest = (requestId: string) => {
    setUserRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'DECLINED' } : r))
    );
    logAudit('ADMIN_DECLINE_REQUEST', 'WorkshopRequest', requestId, 'رد درخواست به علت عدم امکان برگزاری در بازه اعلامی');
    addToast('info', 'درخواست متقاضی رد شد');
  };

  const handleToggleSessionStatus = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const nextStatus = s.status === 'OPEN' ? 'FULL' : 'OPEN';
          logAudit('SESSION_STATUS_TOGGLED', 'WorkshopSession', sessionId, `تغییر وضعیت جلسه به ${nextStatus}`);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    addToast('info', 'وضعیت ظرفیت جلسه تغییر یافت');
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    trackingCode?: string,
    shipmentStatus?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const updated = await ApiClient.updateOrderStatus(orderId, newStatus, shipmentStatus);
      setUserOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
      );
      logAudit(
        'ORDER_STATUS_UPDATED',
        'UserOrder',
        orderId,
        `تغییر وضعیت سفارش به ${newStatus}${trackingCode ? ` - رهگیری: ${trackingCode}` : ''}`
      );
      addToast('success', 'وضعیت سفارش ذخیره شد', 'اطلاعات سفارش و کد رهگیری با موفقیت به‌روزرسانی شد.');
      return { success: true };
    } catch (err: any) {
      const message = err?.message || 'تغییر وضعیت سفارش رد شد.';
      addToast('error', 'تغییر وضعیت ذخیره نشد', message);
      return { success: false, message };
    }
  };

  // Auth Handlers
  const handleAuthSuccess = async (userData: { mobile: string; name: string }) => {
    setUserMobile(userData.mobile);
    setUserName(userData.name);
    setIsLoggedIn(true);
    ApiClient.getEnrollments().then(setEnrolledCourseIds).catch(() => {});

    // Merge the guest cart with the cart saved on the server for this account (union, never overwrite);
    // the debounced sync effect then persists the merged result.
    try {
      const serverCart = await ApiClient.getCart();
      const saved = sanitizeCart(serverCart?.cart);
      if (saved.length > 0) setCartItems((local) => mergeCarts(local, saved));
    } catch {
      // The local cart is still valid on its own.
    }

    addToast('success', 'ورود موفقیت‌آمیز بود', `خوش آمدید ${userData.name}`);
  };

  // Re-open the bank session for an unpaid order ("پرداخت مجدد" in the account page).
  const handleRetryOrderPayment = async (orderId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const pg = await ApiClient.requestOnlinePayment(orderId);
      if (pg?.paymentUrl) {
        window.location.href = pg.paymentUrl;
        return { success: true };
      }
      return { success: false, message: pg?.message || 'اتصال به درگاه پرداخت برقرار نشد. دوباره تلاش کنید.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'اتصال به درگاه پرداخت برقرار نشد. دوباره تلاش کنید.' };
    }
  };

  const handleLogout = () => {
    ApiClient.logout();
    setEnrolledCourseIds([]);
    setIsLoggedIn(false);
    setUserMobile('');
    setUserName('');
    // Shared/borrowed devices: nothing of this account may outlive the session.
    setCartItems([]);
    setUserOrders([]);
    setAppliedCoupon(null);
    setPaymentResult(null);
    safeRemoveKeys([STORAGE_KEYS.CART, STORAGE_KEYS.ORDERS, 'shanyoon_user_avatar']);
    handleNavigate('home');
    addToast('info', 'از حساب کاربری خارج شدید');
  };

  // ---------------------------------------------------------------------------
  // RENDER ADMIN CONSOLE
  // ---------------------------------------------------------------------------
  if (isAdminMode) {
    return (
      <React.Suspense fallback={<PageFallback />}>
        <AdminDashboardPage
          orders={userOrders}
          requests={userRequests}
          products={products}
          sessions={sessions}
          courses={mockCourses}
          styles={styles}
          articles={articles}
          techniques={techniques}
          coupons={coupons}
          faqs={faqs}
          auditLogs={auditLogs}
          onExitAdmin={() => setIsAdminMode(false)}
          onUpdateProductStock={handleUpdateProductStock}
          onAddNewProduct={handleAddNewProduct}
          onAddNewSession={handleAddNewSession}
          onAddNewStyle={handleAddNewStyle}
          onDeleteStyle={handleDeleteStyle}
          onAddNewArticle={handleAddNewArticle}
          onDeleteArticle={handleDeleteArticle}
          onAddNewTechnique={handleAddNewTechnique}
          onDeleteTechnique={handleDeleteTechnique}
          onAddNewCoupon={handleAddNewCoupon}
          onToggleCouponStatus={handleToggleCouponStatus}
          onDeleteCoupon={handleDeleteCoupon}
          onAddNewFaq={handleAddNewFaq}
          onDeleteFaq={handleDeleteFaq}
          onUpdateStyle={handleUpdateStyle}
          onUpdateArticle={handleUpdateArticle}
          onUpdateTechnique={handleUpdateTechnique}
          onUpdateCoupon={handleUpdateCoupon}
          onUpdateFaq={handleUpdateFaq}
          aboutContent={aboutContent}
          onUpdateAboutContent={handleUpdateAboutContent}
          onProposeSchedule={handleAdminProposeSchedule}
          onDeclineRequest={handleAdminDeclineRequest}
          onAcceptRequest={(id) => handleAcceptProposal(id)}
          onToggleSessionStatus={handleToggleSessionStatus}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          manualEnrollments={manualEnrollments}
          onUpdateManualEnrollment={handleUpdateManualEnrollment}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </React.Suspense>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER STOREFRONT / CLIENT VIEW
  // ---------------------------------------------------------------------------
  if (SimulatedGatewayPage && window.location.pathname.includes('/payment/simulated-gateway')) {
    const params = new URLSearchParams(window.location.search);
    const authority = params.get('authority') || 'SIM-DEMO';
    const orderId = params.get('orderId') || 'ord-123';
    const amount = Number(params.get('amount') || 100000);
    return (
      <React.Suspense fallback={<PageFallback />}>
        <SimulatedGatewayPage authority={authority} orderId={orderId} amountToman={amount} />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#171614] font-sans overflow-x-clip">
      {/* Accessibility: Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#87553B] focus:text-white focus:font-bold focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#C59B63] transition-all"
      >
        پرش به محتوای اصلی
      </a>

      {/* Global Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdminMode}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAdmin={() => setIsAdminMode(true)}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        onOpenOrderTracking={() => setIsOrderTrackingOpen(true)}
        userName={userName}
        userMobile={userMobile}
        cartItems={cartItems}
        onSelectStyle={(s) => {
          setSelectedStyle(s);
          handleNavigate('style-detail');
        }}
        onSelectTechnique={(t) => {
          setSelectedTechnique(t);
          handleNavigate('technique-detail');
        }}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          handleNavigate('product-detail');
        }}
        onSelectCourse={(c) => {
          setSelectedCourse(c);
          handleNavigate('course-detail');
        }}
        onSelectArticle={(a) => {
          setSelectedArticle(a);
          handleNavigate('mag');
        }}
        onLogout={() => {
          void ApiClient.logout();
          setIsLoggedIn(false);
          handleNavigate('home');
          addToast('info', 'از حساب کاربری خارج شدید');
        }}
      />

      {/* Main View Router */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-0 outline-none">
        <React.Suspense fallback={<PageFallback />}>
          {/* 01. Homepage */}
        {currentRoute === 'home' && (
          <HomePage
            styles={styles}
            techniques={techniques}
            articles={articles}
            products={products}
            courses={mockCourses}
            onNavigate={handleNavigate}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onSelectTechnique={(t) => {
              setSelectedTechnique(t);
              handleNavigate('technique-detail');
            }}
            onSelectArticle={(a) => {
              setSelectedArticle(a);
              handleNavigate('mag');
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              handleNavigate('product-detail');
            }}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              handleNavigate('course-detail');
            }}
            onAddToCart={handleAddToCart}
            onRequestWorkshop={() => handleOpenRequestModal()}
            onOpenConsultation={handleOpenConsultation}
          />
        )}

        {/* 02. Styles Hub */}
        {currentRoute === 'styles' && (
          <StylesPage
            styles={styles}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onNavigateHome={() => handleNavigate('home')}
            onOpenConsultation={handleOpenConsultation}
          />
        )}

        {/* 03. Style Detail */}
        {currentRoute === 'style-detail' && selectedStyle && (
          <StyleDetailPage
            styleItem={selectedStyle}
            allTechniques={techniques}
            allProducts={products}
            allCourses={mockCourses}
            allArticles={articles}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateStyles={() => handleNavigate('styles')}
            onSelectTechnique={(t) => {
              setSelectedTechnique(t);
              handleNavigate('technique-detail');
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              handleNavigate('product-detail');
            }}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              handleNavigate('course-detail');
            }}
            onSelectArticle={(a) => {
              setSelectedArticle(a);
              handleNavigate('mag');
            }}
            onAddToCart={handleAddToCart}
            currentUserName={userName}
            onToast={addToast}
          />
        )}

        {/* 04. Techniques Hub */}
        {currentRoute === 'techniques' && (
          <TechniquesPage
            techniques={techniques}
            onSelectTechnique={(t) => {
              setSelectedTechnique(t);
              handleNavigate('technique-detail');
            }}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {/* 04. Technique Detail */}
        {currentRoute === 'technique-detail' && selectedTechnique && (
          <TechniqueDetailPage
            technique={selectedTechnique}
            allProducts={products}
            allStyles={styles}
            allCourses={mockCourses}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateTechniques={() => handleNavigate('techniques')}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              handleNavigate('product-detail');
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* 05/06. Magazine & Articles */}
        {currentRoute === 'mag' && (
          <MagazinePage
            articles={articles}
            selectedArticle={selectedArticle}
            allStyles={styles}
            allProducts={products}
            allCourses={mockCourses}
            onSelectArticle={(a) => setSelectedArticle(a)}
            onClearArticleSelection={() => setSelectedArticle(null)}
            onNavigateHome={() => handleNavigate('home')}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              handleNavigate('product-detail');
            }}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              handleNavigate('course-detail');
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* 06/07. Shop & Categories */}
        {currentRoute === 'shop' && (
          <ShopPage
            products={products}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              handleNavigate('product-detail');
            }}
            onAddToCart={handleAddToCart}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {/* 08. Product Detail */}
        {currentRoute === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            allStyles={styles}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateShop={() => handleNavigate('shop')}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onAddToCartWithQty={handleAddToCartWithQty}
            currentUserName={userName}
            onToast={addToast}
          />
        )}

        {/* 08/09. Courses Hub */}
        {currentRoute === 'courses' && (
          <CoursesPage
            courses={mockCourses}
            sessions={sessions}
            cities={mockCities}
            instructors={mockInstructors}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              handleNavigate('course-detail');
            }}
            onRequestJoinSession={(sess) => handleOpenRequestModal(sess)}
            onRequestNewCity={() => handleOpenRequestModal()}
            onSelectCity={(city) => {
              setSelectedCity(city);
              handleNavigate('city-detail');
            }}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {/* 09. Online Course Detail */}
        {currentRoute === 'course-detail' && selectedCourse && (
          <CourseDetailPage
            course={selectedCourse}
            instructor={mockInstructors.find((i) => i.id === selectedCourse.instructorId)}
            isEnrolled={enrolledCourseIds.includes(selectedCourse.id)}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCourses={() => handleNavigate('courses')}
            onEnroll={handleEnrollCourse}
            onStartLearning={(c, lessonId) => {
              setSelectedCourse(c);
              setActiveLessonId(lessonId);
              handleNavigate('learn');
            }}
            currentUserName={userName}
            onToast={addToast}
          />
        )}

        {/* 09. Video Player & Progress */}
        {currentRoute === 'learn' && selectedCourse && (() => {
          const lessonId = activeLessonId || selectedCourse.modules[0].lessons[0].id;
          const lesson = selectedCourse.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
          const canWatch = enrolledCourseIds.includes(selectedCourse.id) || !!lesson?.isPreview;
          // UX guard only - the server independently refuses paid lessons (GET /courses/:id/lessons/:id).
          if (!canWatch) {
            return (
              <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
                <h1 className="text-lg font-bold text-[#171614]">دسترسی به این درس فعال نیست</h1>
                <p className="text-xs text-[#5E5A54]">
                  برای مشاهدهٔ این درس باید دوره را خریداری کنید. پس از تأیید پرداخت، دسترسی به‌طور خودکار فعال می‌شود.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate('course-detail')}
                  className="px-5 py-2.5 bg-[#171614] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  بازگشت به صفحهٔ دوره
                </button>
              </div>
            );
          }
          return (
            <LearnPlayerPage
              course={selectedCourse}
              activeLessonId={lessonId}
              onNavigateHome={() => handleNavigate('home')}
              onNavigateCourse={() => handleNavigate('course-detail')}
              onSelectLesson={(lesId) => {
                const target = selectedCourse.modules.flatMap((m) => m.lessons).find((l) => l.id === lesId);
                if (target && !target.isPreview && !enrolledCourseIds.includes(selectedCourse.id)) {
                  addToast('info', 'این درس پس از خرید دوره در دسترس است');
                  return;
                }
                setActiveLessonId(lesId);
              }}
            />
          );
        })()}

        {/* 10. Cities Network Hub */}
        {currentRoute === 'cities' && (
          <CitiesPage
            cities={mockCities}
            sessions={sessions}
            instructors={mockInstructors}
            onSelectCity={(city) => {
              setSelectedCity(city);
              handleNavigate('city-detail');
            }}
            onRequestWorkshop={() => handleOpenRequestModal()}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {/* 10. City Detail & In-Person Sessions */}
        {currentRoute === 'city-detail' && selectedCity && (
          <CityDetailPage
            city={selectedCity}
            sessions={sessions}
            instructors={mockInstructors}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCourses={() => handleNavigate('courses')}
            onRequestJoinSession={(sess) => handleOpenRequestModal(sess)}
            onRequestNewSession={() => handleOpenRequestModal()}
            onSelectInstructor={(inst) => {
              setSelectedInstructor(inst);
              handleNavigate('instructor-detail');
            }}
          />
        )}

        {/* 11. Instructor Detail */}
        {currentRoute === 'instructor-detail' && selectedInstructor && (
          <InstructorDetailPage
            instructor={selectedInstructor}
            instructorCourses={mockCourses.filter((c) => c.instructorId === selectedInstructor.id)}
            instructorSessions={sessions.filter((s) => s.instructorId === selectedInstructor.id)}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCourses={() => handleNavigate('courses')}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              handleNavigate('course-detail');
            }}
            onRequestJoinSession={(sess) => handleOpenRequestModal(sess)}
            onRequestWorkshop={() => handleOpenRequestModal()}
          />
        )}

        {/* 11. Instructors Hub */}
        {currentRoute === 'instructors' && (
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171614]">
              مربیان و اساتید تاییدشده شنیون مو
            </h1>
            <p className="text-xs sm:text-sm text-[#59524A]">
              اساتید صاحب‌سبک با سابقه برگزاری دوره‌های بین‌المللی و کارگاه‌های تخصصی در سراسر کشور.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockInstructors.map((inst) => (
                <div
                  key={inst.id}
                  onClick={() => {
                    setSelectedInstructor(inst);
                    handleNavigate('instructor-detail');
                  }}
                  className="bg-[#FFFCF8] p-6 rounded-2xl border border-[#EAE2D5] hover:border-[#87553B] transition-all cursor-pointer shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-[#EAE2D5]">
                      <img
                        src={inst.portrait}
                        alt={inst.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#171614]">{inst.name}</h3>
                      <div className="text-xs text-[#87553B] mt-0.5">{inst.specialty}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#59524A] line-clamp-2 leading-relaxed">{inst.bio}</p>
                  <div className="text-xs font-semibold text-[#87553B]">مشاهده پروفایل و کارگاه‌ها ←</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. Cities Hub */}
        {currentRoute === 'cities' && (
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171614]">
              کارگاه‌های حضوری در شهرهای ایران
            </h1>
            <p className="text-xs sm:text-sm text-[#59524A]">
              انتخاب شهر برای مشاهده جلسات فعال با ظرفیت باقیمانده و ثبت درخواست.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCities.map((city) => (
                <div
                  key={city.id}
                  onClick={() => {
                    setSelectedCity(city);
                    handleNavigate('city-detail');
                  }}
                  className="bg-[#FFFCF8] p-6 rounded-2xl border border-[#EAE2D5] hover:border-[#87553B] transition-all cursor-pointer shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#171614]">{city.name}</h3>
                    <span className="text-xs text-[#87553B] font-medium bg-[#C59B63]/10 px-2 py-0.5 rounded-md">
                      استان {city.province}
                    </span>
                  </div>
                  <p className="text-xs text-[#59524A] leading-relaxed">{city.description}</p>
                  <div className="pt-2 flex items-center justify-between text-xs text-[#59524A]">
                    <span>{city.activeSessionsCount} جلسه فعال</span>
                    <span className="font-semibold text-[#87553B]">مشاهده تقویم و مربیان ←</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. Account Dashboard with Certificates */}
        {currentRoute === 'account' && (
          <AccountPage
            userMobile={userMobile}
            userName={userName}
            userAvatar={userAvatar}
            onUpdateProfile={handleUpdateProfile}
            orders={userOrders}
            enrolledCourses={mockCourses.filter((c) => enrolledCourseIds.includes(c.id))}
            requests={userRequests}
            certificates={certificates}
            onNavigateHome={() => handleNavigate('home')}
            onStartCourse={(c, lessonId) => {
              setSelectedCourse(c);
              setActiveLessonId(lessonId || c.modules[0].lessons[0].id);
              handleNavigate('learn');
            }}
            onAcceptProposal={handleAcceptProposal}
            onDeclineProposal={handleDeclineProposal}
            onLogout={handleLogout}
            onOpenOrderTracking={(order) => { setTrackingOrderId(order?.id || ''); setIsOrderTrackingOpen(true); }}
            paymentResult={paymentResult}
            onDismissPaymentResult={() => setPaymentResult(null)}
            onRetryPayment={handleRetryOrderPayment}
          />
        )}

        {/* Checkout Flow with Coupon Support */}
        {currentRoute === 'checkout' && (
          <CheckoutPage
            items={cartItems}
            isLoggedIn={isLoggedIn}
            authReady={authReady}
            userMobile={userMobile}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenCart={() => setIsCartOpen(true)}
            onNavigateHome={() => handleNavigate('home')}
            onCompleteOrder={handleCompleteOrder}
          />
        )}

        {/* Dedicated About Us Page (/about) */}
        {currentRoute === 'about' && (
          <AboutPage
            content={aboutContent}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCourses={() => handleNavigate('courses')}
            onNavigateStyles={() => handleNavigate('styles')}
          />
        )}

        {/* Dedicated FAQ Page (/faq) */}
        {currentRoute === 'faq' && (
          <FaqPage
            onNavigateHome={() => handleNavigate('home')}
            faqs={faqs}
          />
        )}

        {/* Backward Compatibility for /about-contact */}
        {currentRoute === 'about-contact' && (
          <AboutPage
            content={aboutContent}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCourses={() => handleNavigate('courses')}
            onNavigateStyles={() => handleNavigate('styles')}
          />
        )}

        {/* Search Page */}
        {currentRoute === 'search' && (
          <SearchPage
            initialQuery={searchParam}
            allStyles={styles}
            allTechniques={techniques}
            allArticles={articles}
            allProducts={products}
            allCourses={mockCourses}
            onNavigateHome={() => handleNavigate('home')}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onSelectTechnique={(t) => {
              setSelectedTechnique(t);
              handleNavigate('technique-detail');
            }}
            onSelectArticle={(a) => {
              setSelectedArticle(a);
              handleNavigate('mag');
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              handleNavigate('product-detail');
            }}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              handleNavigate('course-detail');
            }}
          />
        )}
        </React.Suspense>
      </main>

      {/* Global Modals & Drawers - Code-split & Lazy-Loaded on User Demand */}
      <React.Suspense fallback={null}>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            appliedCoupon={appliedCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onCheckout={() => {
              setIsCartOpen(false);
              handleNavigate('checkout');
            }}
          />
        )}

        {isAuthModalOpen && (
          <OTPModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {isRequestModalOpen && (
          <RequestModal
            isOpen={isRequestModalOpen}
            onClose={() => setIsRequestModalOpen(false)}
            initialSession={requestModalSession}
            onSubmitSuccess={handleRequestSubmitted}
            currentUserName={userName}
            currentUserMobile={userMobile}
          />
        )}

        {isMobileMenuOpen && (
          <MobileNavDrawer
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            onNavigate={handleNavigate}
            currentRoute={currentRoute}
            onOpenAdmin={() => setIsAdminMode(true)}
            onOpenConsultation={handleOpenConsultation}
            onOpenOrderTracking={() => setIsOrderTrackingOpen(true)}
          />
        )}

        {/* Smart Style Consultation Modal */}
        {isConsultationOpen && (
          <StyleConsultationModal
            isOpen={isConsultationOpen}
            onClose={() => setIsConsultationOpen(false)}
            styles={styles}
            products={products}
            techniques={techniques}
            courses={mockCourses}
            onSelectStyle={(s) => {
              setSelectedStyle(s);
              handleNavigate('style-detail');
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Online Order & Postal Tracking Modal */}
        {isOrderTrackingOpen && (
          <OrderTrackingModal
            isOpen={isOrderTrackingOpen}
            onClose={() => setIsOrderTrackingOpen(false)}
            orders={userOrders}
            initialOrderCode={trackingOrderId}
          />
        )}
      </React.Suspense>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* GDPR & Privacy Compliant Cookie Consent Banner & Modal */}
      <CookieConsentBanner />

      {/* Mobile Ergonomic Bottom Nav Bar (< md screens) */}
      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Floating Action Buttons: Back-to-Top, Consultation & WhatsApp */}
      <FloatingActions
        onOpenConsultation={() => setIsConsultationOpen(true)}
        onOpenOrderTracking={() => setIsOrderTrackingOpen(true)}
      />

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
