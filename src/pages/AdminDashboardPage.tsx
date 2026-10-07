/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AdminDashboardPage - Segmented Information-Dense Operations Console
 * Clear separation of:
 * 1. Content Management (مدیریت محتوا: مدل‌ها، مقالات، تکنیک‌ها)
 * 2. Store Management (فروشگاه و محصولات: انبارداری، کدهای تخفیف، ویترین)
 * 3. Order Management (مدیریت سفارش‌ها: فاکتورها، کدهای رهگیری، صف کارگاه، ظرفیت جلسات)
 * + Overview Dashboard, Live Analytics Console, and Audit Logs
 */

import React, { useState } from 'react';
import {
  WorkshopRequest,
  Product,
  WorkshopSession,
  UserOrder,
  Course,
  Instructor,
  StyleModel,
  Article,
  Technique,
  Coupon,
  OrderStatus,
  AboutContent,
} from '../types/domain';
import { mockStyles } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { Download, FileSpreadsheet } from 'lucide-react';
import { ExporterService } from '../utils/exporter';
import { AnalyticsConsole } from '../components/admin/AnalyticsConsole';
import { ContentCmsManager } from '../components/admin/ContentCmsManager';
import { StoreManager } from '../components/admin/StoreManager';
import { CoursesManager } from '../components/admin/CoursesManager';
import { UsersManager } from '../components/admin/UsersManager';
import { OrdersManager } from '../components/admin/OrdersManager';
import { BackendDiagnosticTool } from '../components/admin/BackendDiagnosticTool';
import { SystemSettingsManager } from '../components/admin/SystemSettingsManager';
import {
  LayoutDashboard,
  Clock,
  Package,
  Calendar,
  Users,
  Send,
  Plus,
  Minus,
  History,
  ArrowRight,
  TrendingDown,
  PlusCircle,
  X,
  CheckCircle2,
  BarChart3,
  Activity,
  Sparkles,
  Image as ImageIcon,
  Tag,
  BookOpen,
  ShoppingBag,
  PackageCheck,
  Layers,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Settings,
  CreditCard,
  GraduationCap,
  Users as UsersIcon,
} from 'lucide-react';

export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  note: string;
}

interface AdminDashboardPageProps {
  orders: UserOrder[];
  requests: WorkshopRequest[];
  products: Product[];
  sessions: WorkshopSession[];
  courses: Course[];
  styles?: StyleModel[];
  articles?: Article[];
  techniques?: Technique[];
  coupons?: Coupon[];
  auditLogs: AuditRecord[];
  onExitAdmin: () => void;
  onUpdateProductStock: (productId: string, newStock: number, note: string) => void;
  onAddNewProduct: (product: Omit<Product, 'id'>) => void;
  onAddNewSession: (session: Omit<WorkshopSession, 'id'>) => void;
  onAddNewStyle?: (style: Omit<StyleModel, 'id' | 'viewsCount' | 'createdAt'>) => void;
  onDeleteStyle?: (styleId: string) => void;
  onAddNewArticle?: (article: Omit<Article, 'id' | 'publishedAt'>) => void;
  onDeleteArticle?: (articleId: string) => void;
  onAddNewTechnique?: (technique: Omit<Technique, 'id'>) => void;
  onDeleteTechnique?: (techniqueId: string) => void;
  onAddNewCoupon?: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  onToggleCouponStatus?: (couponId: string) => void;
  onDeleteCoupon?: (couponId: string) => void;
  faqs?: any[];
  onAddNewFaq?: (faq: { category: string; question: string; answer: string }) => void;
  onDeleteFaq?: (faqId: string) => void;
  onUpdateStyle?: (style: StyleModel) => void;
  onUpdateArticle?: (article: Article) => void;
  onUpdateTechnique?: (technique: Technique) => void;
  onUpdateCoupon?: (coupon: Coupon) => void;
  onUpdateFaq?: (faqId: string, faq: { category: string; question: string; answer: string }) => void;
  aboutContent?: AboutContent;
  onUpdateAboutContent?: (content: AboutContent) => void;
  onUpdateOrderStatus?: (
    orderId: string,
    status: OrderStatus,
    trackingCode?: string,
    shipmentStatus?: string
  ) => Promise<{ success: boolean; message?: string }>;
  onProposeSchedule: (
    requestId: string,
    proposal: {
      cityName: string;
      instructorName: string;
      dateJalali: string;
      venueName: string;
      priceToman: number;
    }
  ) => void;
  onDeclineRequest: (requestId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onToggleSessionStatus: (sessionId: string) => void;
  manualEnrollments?: any[];
  onUpdateManualEnrollment?: (userMobile: string, courseId: string, courseName: string, status: 'ACTIVE' | 'REVOKED') => Promise<void>;
  instructors?: Instructor[];
  onSaveCourse?: (course: any, existingId?: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteCourse?: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export type AdminSection = 'OVERVIEW' | 'CONTENT' | 'STORE' | 'COURSES' | 'USERS' | 'ORDERS' | 'ANALYTICS' | 'AUDIT' | 'DIAGNOSTICS' | 'SETTINGS';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  orders,
  requests,
  products,
  sessions,
  courses,
  styles = [],
  articles = [],
  techniques = [],
  coupons = [],
  faqs = [],
  auditLogs,
  onExitAdmin,
  onUpdateProductStock,
  onAddNewProduct,
  onAddNewSession,
  onAddNewStyle,
  onDeleteStyle,
  onAddNewArticle,
  onDeleteArticle,
  onAddNewTechnique,
  onDeleteTechnique,
  onAddNewCoupon,
  onToggleCouponStatus,
  onDeleteCoupon,
  onAddNewFaq,
  onDeleteFaq,
  onUpdateStyle,
  onUpdateArticle,
  onUpdateTechnique,
  onUpdateCoupon,
  onUpdateFaq,
  aboutContent,
  onUpdateAboutContent,
  onUpdateOrderStatus,
  onProposeSchedule,
  onDeclineRequest,
  onAcceptRequest,
  onToggleSessionStatus,
  manualEnrollments = [],
  onUpdateManualEnrollment,
  instructors = [],
  onSaveCourse,
  onDeleteCourse,
}) => {
  // Main Section Navigation
  const [activeSection, setActiveSection] = useState<AdminSection>('OVERVIEW');

  // Sub-tab States for deep linking
  const [contentSubTab, setContentSubTab] = useState<'STYLES' | 'ARTICLES' | 'TECHNIQUES' | 'COUPONS'>('STYLES');
  const [storeSubTab, setStoreSubTab] = useState<'INVENTORY' | 'COUPONS' | 'ASSETS'>('INVENTORY');
  const [ordersSubTab, setOrdersSubTab] = useState<'ORDERS' | 'REQUESTS' | 'SESSIONS' | 'ENROLLMENTS'>('ORDERS');
  const [settingsSubTab, setSettingsSubTab] = useState<'PROV' | 'ANALYTICS' | 'AUDIT' | 'DIAG'>('PROV');

  // Key Top Indicators
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
  const paidOrdersCount = orders.filter((o) => o.status === 'PAID').length;
  const openRequestsCount = requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const lowStockProducts = products.filter((p) => p.stock <= 15);
  const totalRevenueToman = orders
    .filter((o) => o.status === 'PAID' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.payableToman, 0);

  return (
    <div className="min-h-screen bg-[#0a0908] text-[#f5f4f2] flex flex-col font-sans" dir="rtl">
      {/* Top Header Bar */}
      <header className="h-16 bg-[#12100f] text-white px-3 sm:px-6 flex items-center justify-between border-b border-[#26211e] shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#e2b87f] shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-base font-bold text-white tracking-tight truncate">
                <span className="sm:hidden">پنل مدیریت گیس‌آرا</span>
                <span className="hidden sm:inline">کنسول مدیریت و عملیات گیس‌آرا (GisAra)</span>
              </span>
              <span className="text-xs bg-amber-500/20 text-[#e2b87f] px-2 py-0.5 rounded-md font-bold border border-amber-500/30 hidden lg:inline-block">
                پنل فوق کامل
              </span>
            </div>
            <div className="text-xs text-stone-400 hidden md:block">
              کنترل یکپارچه همه‌جانبه محتوا، فروشگاه، کارگاه و امنیت سیستم
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick status counters */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {pendingOrdersCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold tabular-nums">
                {pendingOrdersCount} سفارش منتظر پرداخت
              </span>
            )}
            {openRequestsCount > 0 && (
              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold tabular-nums">
                {openRequestsCount} درخواست جدید کارگاه
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => ExporterService.exportOrders(orders)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-[#f5f4f2] text-xs font-semibold rounded-xl border border-stone-700 transition-colors cursor-pointer"
              title="دانلود فایل خروجی Excel/CSV فاکتورها و سفارشات"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>اکسل سفارشات</span>
            </button>

            <button
              type="button"
              onClick={() => ExporterService.exportWorkshopRequests(requests)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-[#f5f4f2] text-xs font-semibold rounded-xl border border-stone-700 transition-colors cursor-pointer"
              title="دانلود فایل خروجی Excel/CSV متقاضیان ورکشاپ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>اکسل ورکشاپ‌ها</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="min-h-[38px] px-3 sm:px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
              title="بازگشت به نمای مشتری سایت"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">مشاهده سایت</span>
              <span className="xs:hidden">سایت</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body: Responsive Mobile Sub-bar + Desktop Sidebar (260px) + Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Mobile Sticky Tab Navigation Strip (< md) */}
        <div className="md:hidden sticky top-0 z-30 bg-[#12100f]/95 backdrop-blur-md border-b border-[#26211e] px-2.5 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 shadow-md">
          <button
            type="button"
            onClick={() => setActiveSection('OVERVIEW')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'OVERVIEW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span>داشبورد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('CONTENT');
              setContentSubTab('STYLES');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'CONTENT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>مدیریت محتوا</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('STORE');
              setStoreSubTab('INVENTORY');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'STORE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>فروشگاه</span>
            {lowStockProducts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('COURSES')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'COURSES'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>دوره‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('USERS')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'USERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>کاربران</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('ORDERS');
              setOrdersSubTab('ORDERS');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'ORDERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>سفارشات</span>
            {openRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-xs font-bold tabular-nums">
                {openRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('SETTINGS');
              setSettingsSubTab('PROV');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer min-h-[40px] ${
              activeSection === 'SETTINGS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>تنظیمات</span>
          </button>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-64 bg-[#12100f] border-l border-[#26211e] p-5 shrink-0 space-y-6">
          {/* User profile section */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#26211e]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              مدیر
            </div>
            <div>
              <div className="text-xs font-bold text-[#f5f4f2]">پنل ارشد گیس‌آرا</div>
              <div className="text-xs text-amber-500 font-medium">سطح دسترسی: فوق کامل</div>
            </div>
          </div>

          {/* Clean Main Options Group */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-3 mb-2">
              منوی ناوبری اصلی
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'OVERVIEW'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 text-amber-500" />
              <span>داشبورد اصلی</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('CONTENT');
                setContentSubTab('STYLES');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'CONTENT'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                <span>۱. مدیریت محتوا (CMS)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('STORE');
                setStoreSubTab('INVENTORY');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'STORE'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4.5 h-4.5 text-amber-500" />
                <span>۲. مدیریت فروشگاه</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('COURSES')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'COURSES'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4.5 h-4.5 text-amber-500" />
                <span>۳. آکادمی و دوره‌ها</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('USERS')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'USERS'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="w-4.5 h-4.5 text-amber-500" />
                <span>۴. کاربران</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('ORDERS');
                setOrdersSubTab('ORDERS');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'ORDERS'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <PackageCheck className="w-4.5 h-4.5 text-amber-500" />
                <span>۵. سفارشات و کارگاه‌ها</span>
              </div>
              {openRequestsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                  {openRequestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('SETTINGS');
                setSettingsSubTab('PROV');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                activeSection === 'SETTINGS'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4.5 h-4.5 text-amber-500" />
                <span>۶. تنظیمات و ابزار سیستم</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Workspace Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto space-y-6 min-w-0">
          {/* SECTION 1: OVERVIEW DASHBOARD */}
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-8">
              {/* Header with quick welcoming */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#f5f4f2]">
                    داشبورد عملیات و کنترل آکادمی گیس‌آرا (GisAra)
                  </h1>
                  <p className="text-xs text-stone-400 mt-1">
                    خلاصه وضعیت لحظه‌ای بخش‌های ۳گانه: مدیریت محتوا، فروشگاه، و سفارش‌های آنلاین.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3.5 py-1.5 bg-[#141211] border border-[#26211e] rounded-xl font-medium text-stone-300">
                    کنترل‌پنل نظارتی ارشد
                  </span>
                </div>
              </div>

              {/* 3 Prominent Pillar Gateway Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pillar 1: Content Management */}
                <div className="bg-[#141211] rounded-2xl p-6 border border-[#26211e] shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-bold bg-amber-500/20 text-[#e2b87f] px-2.5 py-0.5 rounded-full">
                        بخش اول
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">مدیریت محتوا (CMS)</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      مدیریت کامل ژورنال مدل‌های عروس و مجلسی، مقالات و وبلاگ، و تکنیک‌های آموزشی.
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#26211e] text-center text-xs">
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-[#f5f4f2] tabular-nums">{styles.length}</div>
                        <div className="text-xs text-stone-400">مدل مو</div>
                      </div>
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-[#f5f4f2] tabular-nums">{articles.length}</div>
                        <div className="text-xs text-stone-400">مقاله</div>
                      </div>
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-[#f5f4f2] tabular-nums">{techniques.length}</div>
                        <div className="text-xs text-stone-400">تکنیک</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#26211e]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('CONTENT');
                        setContentSubTab('STYLES');
                      }}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>ورود به مدیریت محتوا</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pillar 2: Store Management */}
                <div className="bg-[#141211] rounded-2xl p-6 border border-[#26211e] shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                        <ShoppingBag className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-bold bg-amber-500/20 text-[#e2b87f] px-2.5 py-0.5 rounded-full">
                        بخش دوم
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">فروشگاه و انبارداری</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      کنترل موجودی انبار، تعریف کالاها، کدهای تخفیف جشنواره و بنرهای ویترین فروشگاه.
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#26211e] text-center text-xs">
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-[#f5f4f2] tabular-nums">{products.length}</div>
                        <div className="text-xs text-stone-400">محصول</div>
                      </div>
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-emerald-400 tabular-nums">{coupons.length}</div>
                        <div className="text-xs text-stone-400">کوپن</div>
                      </div>
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className={`font-bold tabular-nums ${lowStockProducts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {lowStockProducts.length}
                        </div>
                        <div className="text-xs text-stone-400">کمبود انبار</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#26211e]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('STORE');
                        setStoreSubTab('INVENTORY');
                      }}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>ورود به مدیریت فروشگاه</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pillar 3: Order Management */}
                <div className="bg-[#141211] rounded-2xl p-6 border border-[#26211e] shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                        <PackageCheck className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-bold bg-amber-500/20 text-[#e2b87f] px-2.5 py-0.5 rounded-full">
                        بخش سوم
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">مدیریت سفارش‌ها و کارگاه</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      فاکتورهای آنلاین، کدهای رهگیری مرسولات، صف بررسی کارگاه حضوری و ظرفیت صندلی‌ها.
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#26211e] text-center text-xs">
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-[#f5f4f2] tabular-nums">{orders.length}</div>
                        <div className="text-xs text-stone-400">سفارشات</div>
                      </div>
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-emerald-400 tabular-nums">{paidOrdersCount}</div>
                        <div className="text-xs text-stone-400">پرداخت شده</div>
                      </div>
                      <div className="p-2 bg-stone-900 rounded-lg">
                        <div className="font-bold text-rose-400 tabular-nums">{openRequestsCount}</div>
                        <div className="text-xs text-stone-400">درخواست باز</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#26211e]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('ORDERS');
                        setOrdersSubTab('ORDERS');
                      }}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>ورود به مدیریت سفارش‌ها</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Quick Stat Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#141211] p-5 rounded-2xl border border-[#26211e] shadow-sm">
                  <div className="flex items-center justify-between text-stone-400 text-xs">
                    <span>مجموع فروش ناخالص</span>
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400 mt-2 tabular-nums">
                    {totalRevenueToman.toLocaleString('fa-IR')} تومان
                  </div>
                  <div className="text-xs text-stone-500 mt-1">تراکنش‌های موفق درگاه</div>
                </div>

                <div className="bg-[#141211] p-5 rounded-2xl border border-[#26211e] shadow-sm">
                  <div className="flex items-center justify-between text-stone-400 text-xs">
                    <span>درخواست‌های باز کارگاه</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-[#f5f4f2] mt-2 tabular-nums">
                    {openRequestsCount} متقاضی
                  </div>
                  <div className="text-xs text-amber-500 mt-1">نیازمند برنامه‌ریزی ادمین</div>
                </div>

                <div className="bg-[#141211] p-5 rounded-2xl border border-[#26211e] shadow-sm">
                  <div className="flex items-center justify-between text-stone-400 text-xs">
                    <span>جلسات دارای ظرفیت</span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-[#f5f4f2] mt-2 tabular-nums">
                    {sessions.filter(s => s.status === 'OPEN').length} جلسه
                  </div>
                  <div className="text-xs text-stone-500 mt-1">آماده ثبت‌نام در سایت</div>
                </div>

                <div className="bg-[#141211] p-5 rounded-2xl border border-[#26211e] shadow-sm">
                  <div className="flex items-center justify-between text-stone-400 text-xs">
                    <span>کالاهای نزدیک به اتمام</span>
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-rose-400 mt-2 tabular-nums">
                    {lowStockProducts.length} کالا
                  </div>
                  <div className="text-xs text-rose-400/80 mt-1">موجودی کمتر از ۱۵ عدد</div>
                </div>
              </div>

              {/* Recent Orders Snapshot Table */}
              <div className="bg-[#141211] rounded-2xl p-6 border border-[#26211e] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#26211e] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">آخرین تراکنش‌ها و سفارشات</h3>
                    <p className="text-xs text-stone-400">خلاصه آخرین سفارش‌های ثبت شده در سیستم</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('ORDERS');
                      setOrdersSubTab('ORDERS');
                    }}
                    className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>مشاهده تمام سفارش‌ها ({orders.length})</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-stone-400 border-b border-[#26211e]">
                        <th className="py-3 font-bold">شماره سفارش</th>
                        <th className="py-3 font-bold">تحویل‌گیرنده</th>
                        <th className="py-3 font-bold">تعداد اقلام</th>
                        <th className="py-3 font-bold">مبلغ کل</th>
                        <th className="py-3 font-bold">وضعیت</th>
                        <th className="py-3 font-bold">تاریخ ثبت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26211e]">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-stone-900/60 transition-colors">
                          <td className="py-3.5 font-mono font-bold text-[#f5f4f2]">{o.orderNumber}</td>
                          <td className="py-3.5 text-stone-300">{o.shippingAddress?.recipientName || 'کاربر گیس‌آرا'}</td>
                          <td className="py-3.5 text-stone-400 tabular-nums">{o.items.length} قلم</td>
                          <td className="py-3.5 font-bold text-amber-500 tabular-nums">
                            {o.payableToman.toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="py-3.5">
                            <StatusBadge status={o.status} size="sm" />
                          </td>
                          <td className="py-3.5 text-stone-400 tabular-nums">
                            {new Date(o.createdAt).toLocaleDateString('fa-IR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CONTENT MANAGEMENT (مدیریت محتوا) */}
          {activeSection === 'CONTENT' && (
            <div className="space-y-6">
              <ContentCmsManager
                styles={styles}
                articles={articles}
                techniques={techniques}
                coupons={coupons}
                faqs={faqs}
                onAddNewStyle={onAddNewStyle || (() => {})}
                onDeleteStyle={onDeleteStyle || (() => {})}
                onAddNewArticle={onAddNewArticle || (() => {})}
                onDeleteArticle={onDeleteArticle || (() => {})}
                onAddNewTechnique={onAddNewTechnique || (() => {})}
                onDeleteTechnique={onDeleteTechnique || (() => {})}
                onAddNewCoupon={onAddNewCoupon || (() => {})}
                onToggleCouponStatus={onToggleCouponStatus || (() => {})}
                onDeleteCoupon={onDeleteCoupon || (() => {})}
                onAddNewFaq={onAddNewFaq}
                onDeleteFaq={onDeleteFaq}
                onUpdateStyle={onUpdateStyle}
                onUpdateArticle={onUpdateArticle}
                onUpdateTechnique={onUpdateTechnique}
                onUpdateCoupon={onUpdateCoupon}
                onUpdateFaq={onUpdateFaq}
                aboutContent={aboutContent}
                onUpdateAboutContent={onUpdateAboutContent}
                initialSubTab={contentSubTab}
              />
            </div>
          )}

          {/* SECTION 3: STORE MANAGEMENT (فروشگاه و محصولات) */}
          {activeSection === 'STORE' && (
            <div className="space-y-6">
              <StoreManager
                products={products}
                coupons={coupons}
                onUpdateProductStock={onUpdateProductStock}
                onAddNewProduct={onAddNewProduct}
                onAddNewCoupon={onAddNewCoupon}
                onToggleCouponStatus={onToggleCouponStatus}
                onDeleteCoupon={onDeleteCoupon}
                onUpdateCoupon={onUpdateCoupon}
                activeSubTab={storeSubTab}
                onSubTabChange={(tab) => setStoreSubTab(tab)}
              />
            </div>
          )}

          {/* SECTION: ACADEMY COURSES (آکادمی و دوره‌ها) */}
          {activeSection === 'COURSES' && onSaveCourse && onDeleteCourse && (
            <CoursesManager courses={courses} instructors={instructors} onSaveCourse={onSaveCourse} onDeleteCourse={onDeleteCourse} />
          )}

          {/* SECTION: CUSTOMERS (کاربران) - search by user ID / mobile / name */}
          {activeSection === 'USERS' && <UsersManager />}

          {/* SECTION 4: ORDER MANAGEMENT (مدیریت سفارش‌ها) */}
          {activeSection === 'ORDERS' && (
            <div className="space-y-6">
              <OrdersManager
                orders={orders}
                requests={requests}
                sessions={sessions}
                courses={courses}
                activeSubTab={ordersSubTab}
                onSubTabChange={(tab) => setOrdersSubTab(tab)}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onProposeSchedule={onProposeSchedule}
                onDeclineRequest={onDeclineRequest}
                onAcceptRequest={onAcceptRequest}
                onToggleSessionStatus={onToggleSessionStatus}
                onAddNewSession={onAddNewSession}
                manualEnrollments={manualEnrollments}
                onUpdateManualEnrollment={onUpdateManualEnrollment}
              />
            </div>
          )}

          {/* SECTION 5: ADVANCED SYSTEM SETTINGS & UTILITIES */}
          {activeSection === 'SETTINGS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#26211e]">
                <div>
                  <h2 className="text-xl font-bold text-[#f5f4f2] flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-500" />
                    <span>تنظیمات و ابزارهای سیستم پیشرفته</span>
                  </h2>
                  <p className="text-xs text-stone-400 mt-1">
                    پیکربندی درگاه‌های پرداخت، پیامک‌های اعتبارسنجی، لاگ‌های حسابرسی و ابزارهای خودکار عیب‌یابی سامانه.
                  </p>
                </div>
              </div>

              {/* Sub tabs inside Settings */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#12100f] p-1.5 rounded-2xl border border-[#26211e] max-w-xl">
                {[
                  { id: 'PROV', label: 'درگاه و پیامک' },
                  { id: 'ANALYTICS', label: 'کنسول آمار و آنالیز' },
                  { id: 'AUDIT', label: 'لاگ‌های امنیتی (Audit)' },
                  { id: 'DIAG', label: 'عیب‌یابی سیستم' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSettingsSubTab(t.id as any)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      settingsSubTab === t.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab Views */}
              {settingsSubTab === 'PROV' && (
                <div className="bg-[#141211] p-6 rounded-2xl border border-[#26211e] shadow-sm">
                  <SystemSettingsManager />
                </div>
              )}

              {settingsSubTab === 'ANALYTICS' && (
                <div className="space-y-4">
                  <AnalyticsConsole
                    orders={orders}
                    products={products}
                    courses={courses}
                    styles={styles || mockStyles}
                    requests={requests}
                    sessions={sessions}
                  />
                </div>
              )}

              {settingsSubTab === 'AUDIT' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#26211e]">
                    <div>
                      <h3 className="text-sm font-bold text-white">دفتر ثبت رخدادهای حساس (Audit Trail)</h3>
                      <p className="text-xs text-stone-400">ثبت تغییرناپذیر کلیه تراکنش‌ها، ویرایش‌ها و ورودی‌های انبار</p>
                    </div>
                    <span className="text-xs bg-stone-900 text-stone-300 px-2.5 py-1 rounded-lg font-mono">
                      {auditLogs.length} رخداد
                    </span>
                  </div>

                  <div className="bg-[#141211] rounded-2xl border border-[#26211e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[#1a1817] text-stone-300 border-b border-[#26211e]">
                          <tr>
                            <th className="p-4 font-bold">عامل (Actor)</th>
                            <th className="p-4 font-bold">اقدام انجام‌شده</th>
                            <th className="p-4 font-bold">موجودیت مرتبط</th>
                            <th className="p-4 font-bold">توضیحات و جزئیات</th>
                            <th className="p-4 font-bold">زمان رخداد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26211e]">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-stone-900/40 transition-colors">
                              <td className="p-4 font-semibold text-[#f5f4f2]">{log.actor}</td>
                              <td className="p-4 font-bold text-amber-500">{log.action}</td>
                              <td className="p-4 text-stone-400">{log.entityType} ({log.entityId})</td>
                              <td className="p-4 text-stone-300">{log.note}</td>
                              <td className="p-4 text-stone-400 tabular-nums font-mono">
                                {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'DIAG' && (
                <div className="bg-[#141211] p-6 rounded-2xl border border-[#26211e] shadow-sm">
                  <BackendDiagnosticTool />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
