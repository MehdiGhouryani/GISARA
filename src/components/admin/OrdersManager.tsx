/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OrdersManager - Dedicated Order, Workshop Requests & Capacity Management Center
 * Part of GisAra Admin Console Segmented Architecture
 */

import React, { useState, useMemo } from 'react';
import {
  UserOrder,
  WorkshopRequest,
  WorkshopSession,
  Course,
  OrderStatus,
} from '../../types/domain';
import { StatusBadge } from '../common/StatusBadge';
import {
  PackageCheck,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  Eye,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  Send,
  PlusCircle,
  X,
  CreditCard,
  Hash,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface OrdersManagerProps {
  orders: UserOrder[];
  requests: WorkshopRequest[];
  sessions: WorkshopSession[];
  courses: Course[];
  activeSubTab?: 'ORDERS' | 'REQUESTS' | 'SESSIONS' | 'ENROLLMENTS';
  onSubTabChange?: (tab: 'ORDERS' | 'REQUESTS' | 'SESSIONS' | 'ENROLLMENTS') => void;
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
  onAddNewSession: (session: Omit<WorkshopSession, 'id'>) => void;
  manualEnrollments?: any[];
  onUpdateManualEnrollment?: (userMobile: string, courseId: string, courseName: string, status: 'ACTIVE' | 'REVOKED') => Promise<void>;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  requests,
  sessions,
  courses,
  activeSubTab = 'ORDERS',
  onSubTabChange,
  onUpdateOrderStatus,
  onProposeSchedule,
  onDeclineRequest,
  onAcceptRequest,
  onToggleSessionStatus,
  onAddNewSession,
  manualEnrollments = [],
  onUpdateManualEnrollment,
}) => {
  const [currentTab, setCurrentTab] = useState<'ORDERS' | 'REQUESTS' | 'SESSIONS' | 'ENROLLMENTS'>(activeSubTab);

  // Sync if parent changes tab
  React.useEffect(() => {
    if (activeSubTab && activeSubTab !== currentTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'ORDERS' | 'REQUESTS' | 'SESSIONS' | 'ENROLLMENTS') => {
    setCurrentTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Orders Filter and Search
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [editingTrackingCode, setEditingTrackingCode] = useState('');
  const [editingStatus, setEditingStatus] = useState<OrderStatus>('PAID');

  // Requests Filter
  const [requestFilter, setRequestFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<WorkshopRequest | null>(null);
  const [proposalDate, setProposalDate] = useState('۲۵ آبان ۱۴۰۵');
  const [proposalInstructor, setProposalInstructor] = useState('سارا محمدی');
  const [proposalVenue, setProposalVenue] = useState('سالن همایش‌های هتل همای شیراز');
  const [proposalPrice, setProposalPrice] = useState(3800000);

  // New Session Modal State
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessCourseId, setNewSessCourseId] = useState(courses[0]?.id || 'course-1');
  const [newSessCityName, setNewSessCityName] = useState('تهران');
  const [newSessCityId, setNewSessCityId] = useState('city-tehran');
  const [newSessInstructor, setNewSessInstructor] = useState('سارا محمدی');
  const [newSessDate, setNewSessDate] = useState('۲۰ آذر ۱۴۰۵');
  const [newSessCapacity, setNewSessCapacity] = useState(10);
  const [newSessPrice, setNewSessPrice] = useState(3900000);

  // Calculate Order Metrics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
  const paidOrdersCount = orders.filter((o) => o.status === 'PAID').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalRevenueToman = orders
    .filter((o) => o.status === 'PAID' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.payableToman, 0);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === 'ALL' || order.status === orderStatusFilter;
      const query = orderSearchQuery.trim().toLowerCase();
      if (!query) return matchesStatus;

      const matchesSearch =
        order.orderNumber.toLowerCase().includes(query) ||
        (order.shippingAddress?.recipientName && order.shippingAddress.recipientName.toLowerCase().includes(query)) ||
        (order.shippingAddress?.mobile && order.shippingAddress.mobile.includes(query)) ||
        (order.shippingAddress?.city && order.shippingAddress.city.includes(query)) ||
        (order.trackingCode && order.trackingCode.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (requestFilter === 'ALL') return true;
      return r.status === requestFilter;
    });
  }, [requests, requestFilter]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleOpenOrderDetails = (order: UserOrder) => {
    setSelectedOrder(order);
    setEditingTrackingCode(order.trackingCode || '');
    setEditingStatus(order.status);
    setSaveError(null);
  };

  const handleSaveOrderChanges = async () => {
    if (!selectedOrder) return;
    setSaveError(null);
    if (!onUpdateOrderStatus) return;

    setIsSavingOrder(true);
    const result = await onUpdateOrderStatus(
      selectedOrder.id,
      editingStatus,
      editingTrackingCode.trim() || undefined
    );
    setIsSavingOrder(false);

    if (!result.success) {
      // Do NOT optimistically apply a status change the server rejected
      // (e.g. an admin trying to set PAID directly — only a verified
      // payment can do that). Reset the dropdown back to the real status.
      setSaveError(result.message || 'تغییر وضعیت رد شد.');
      setEditingStatus(selectedOrder.status);
      return;
    }

    setSelectedOrder({
      ...selectedOrder,
      status: editingStatus,
      trackingCode: editingTrackingCode.trim() || undefined,
    });
  };

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    onProposeSchedule(selectedRequest.id, {
      cityName: 'شهر انتخابی متقاضی',
      instructorName: proposalInstructor,
      dateJalali: proposalDate,
      venueName: proposalVenue,
      priceToman: proposalPrice,
    });

    setSelectedRequest(null);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === newSessCourseId) || courses[0];

    onAddNewSession({
      courseId: course.id,
      courseName: course.name,
      cityId: newSessCityId,
      cityName: newSessCityName,
      instructorId: 'inst-1',
      instructorName: newSessInstructor,
      instructorPortrait: '/assets/instructors/sara-mohammadi.jpg',
      slug: `session-${Date.now()}`,
      venueName: `سالن مرکزی کارگاه‌های ${newSessCityName}`,
      venueAddress: `${newSessCityName} (آدرس سالن پس از تایید ارسال می‌شود)`,
      dateJalali: newSessDate,
      timeSlot: '۱۰:۰۰ الی ۱۷:۰۰',
      capacity: newSessCapacity,
      registeredCount: 0,
      priceToman: newSessPrice,
      status: 'OPEN',
    });

    setIsNewSessionModalOpen(false);
  };

  // Manual Enrollment State
  const [manualEnrollMobile, setManualEnrollMobile] = useState('');
  const [manualEnrollCourseId, setManualEnrollCourseId] = useState(courses[0]?.id || '');
  const [manualEnrollStatus, setManualEnrollStatus] = useState<'ACTIVE' | 'REVOKED'>('ACTIVE');
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);

  const handleManualEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEnrollMobile.trim() || !manualEnrollCourseId) return;
    if (!onUpdateManualEnrollment) return;

    const course = courses.find(c => c.id === manualEnrollCourseId);
    if (!course) return;

    setIsSubmittingEnrollment(true);
    await onUpdateManualEnrollment(
      manualEnrollMobile.trim(),
      course.id,
      course.name,
      manualEnrollStatus
    );
    setIsSubmittingEnrollment(false);
    setManualEnrollMobile('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs Navigation */}
      <div className="bg-[#141211] p-5 sm:p-6 rounded-2xl border border-[#26211e] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                میز مدیریت سفارش‌ها و ثبت‌نام ورکشاپ‌ها
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                پایش تراکنش‌های فروشگاه، پردازش و ثبت کدهای رهگیری پستی، صف تایید متقاضیان کارگاه حضوری و ظرفیت کلاس‌ها.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold tabular-nums">
              فروش موفق: {totalRevenueToman.toLocaleString('fa-IR')} تومان
            </span>
            {pendingOrdersCount > 0 && (
              <span className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-xl font-bold tabular-nums">
                {pendingOrdersCount} معلق
              </span>
            )}
          </div>
        </div>

        {/* Segmented Sub-Tab Switcher - Native Touch Scrolling on Mobile */}
        <div className="flex items-center gap-1.5 bg-[#0a0908] p-1.5 rounded-xl border border-[#26211e] overflow-x-auto scrollbar-none w-full sm:max-w-3xl shrink-0">
          <button
            type="button"
            onClick={() => handleTabSwitch('ORDERS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'ORDERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-amber-500" />
            <span>سفارشات فروشگاه</span>
            <span className={`px-2 py-0.5 rounded-md text-xs tabular-nums font-bold ${
              currentTab === 'ORDERS' ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-300'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('REQUESTS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'REQUESTS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>صف متقاضیان کارگاه حضوری</span>
            {requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-xs tabular-nums font-bold">
                {requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('SESSIONS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'SESSIONS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>جلسات و ظرفیت کلاس‌ها</span>
            <span className={`px-2 py-0.5 rounded-md text-xs tabular-nums font-bold ${
              currentTab === 'SESSIONS' ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-300'
            }`}>
              {sessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('ENROLLMENTS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'ENROLLMENTS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <User className="w-4 h-4 text-amber-500" />
            <span>مدیریت دسترسی دستی دوره‌ها</span>
            <span className={`px-2 py-0.5 rounded-md text-xs tabular-nums font-bold ${
              currentTab === 'ENROLLMENTS' ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-300'
            }`}>
              {manualEnrollments.length} مورد
            </span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: STORE ORDERS DESK */}
      {currentTab === 'ORDERS' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#EAE2D5] shadow-xs">
              <div className="text-xs text-[#59524A]">کل سفارشات ثبت شده</div>
              <div className="text-xl sm:text-2xl font-bold text-[#171614] mt-1 tabular-nums">
                {totalOrdersCount} سفارش
              </div>
              <div className="text-xs text-[#87553B] mt-0.5">در تمام کانال‌ها</div>
            </div>

            <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#EAE2D5] shadow-xs">
              <div className="text-xs text-[#59524A]">تسویه شده و پرداخت‌شده</div>
              <div className="text-xl sm:text-2xl font-bold text-[#167C55] mt-1 tabular-nums">
                {paidOrdersCount} موفق
              </div>
              <div className="text-xs text-[#167C55] mt-0.5">آماده ارسال یا تحویل</div>
            </div>

            <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#EAE2D5] shadow-xs">
              <div className="text-xs text-[#59524A]">در انتظار پرداخت</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                {pendingOrdersCount} مورد
              </div>
              <div className="text-xs text-amber-700 mt-0.5">منتظر بازگشت از درگاه</div>
            </div>

            <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#EAE2D5] shadow-xs">
              <div className="text-xs text-[#59524A]">سفارشات تکمیل‌شده</div>
              <div className="text-xl sm:text-2xl font-bold text-[#171614] mt-1 tabular-nums">
                {completedOrdersCount} بسته
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">ارسال و تحویل قطعی</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-[#FFFCF8] p-4 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#968A7C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="جستجو در شماره سفارش، نام خریدار، موبایل، شهر، یا کد رهگیری پستی..."
                className="w-full pr-10 pl-4 py-2.5 bg-white border border-[#EAE2D5] rounded-xl text-xs text-[#171614] placeholder-[#968A7C] focus:outline-hidden focus:border-[#87553B]"
              />
              {orderSearchQuery && (
                <button
                  type="button"
                  onClick={() => setOrderSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#F4EFE7]/50 border border-[#EAE2D5] rounded-xl text-xs overflow-x-auto">
              {(
                [
                  { key: 'ALL', label: 'همه سفارش‌ها' },
                  { key: 'PAID', label: 'پرداخت‌شده' },
                  { key: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
                  { key: 'COMPLETED', label: 'تکمیل و ارسال‌شده' },
                  { key: 'CANCELLED', label: 'لغو شده' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    orderStatusFilter === tab.key
                      ? 'bg-[#171614] text-white shadow-xs'
                      : 'text-[#59524A] hover:bg-[#F4EFE7]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F4EFE7]/60 text-[#59524A]">
                  <tr>
                    <th className="p-3.5 font-bold">شماره سفارش</th>
                    <th className="p-3.5 font-bold">تحویل‌گیرنده / خریدار</th>
                    <th className="p-3.5 font-bold">اقلام خریداری شده</th>
                    <th className="p-3.5 font-bold">مبلغ کل (تومان)</th>
                    <th className="p-3.5 font-bold">وضعیت سفارش</th>
                    <th className="p-3.5 font-bold">کد رهگیری پستی</th>
                    <th className="p-3.5 font-bold">تاریخ ثبت</th>
                    <th className="p-3.5 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE2D5]/40">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#968A7C]">
                        هیچ سفارشی مطابق جستجو یا فیلتر انتخابی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#F4EFE7]/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#171614]">
                          {order.orderNumber}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#171614]">
                            {order.shippingAddress?.recipientName || 'کاربر گیس‌آرا'}
                          </div>
                          <div className="text-xs text-[#968A7C] font-mono mt-0.5">
                            {order.shippingAddress?.mobile || 'بدون شماره'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-[#171614] font-medium max-w-xs truncate">
                            {order.items.map((i) => `${i.title} (${i.quantity} عدد)`).join(' + ')}
                          </div>
                          <div className="text-xs text-[#968A7C] tabular-nums mt-0.5">
                            مجموع {order.items.reduce((s, i) => s + i.quantity, 0)} قلم کالا
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-[#87553B] tabular-nums">
                          {order.payableToman.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                        <td className="p-3.5">
                          {order.trackingCode ? (
                            <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded text-[#171614] border border-stone-200">
                              {order.trackingCode}
                            </span>
                          ) : (
                            <span className="text-[#968A7C] text-xs">ثبت نشده</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#59524A] tabular-nums">
                          {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetails(order)}
                            className="px-3 py-1.5 bg-[#87553B] hover:bg-[#6E422C] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مدیریت و جزئیات</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: WORKSHOP REQUESTS QUEUE */}
      {currentTab === 'REQUESTS' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#171614]">صف بررسی درخواست‌های کارگاه حضوری</h2>
              <p className="text-xs text-[#59524A] mt-1">
                مدیریت درخواست‌های متقاضیان استانی، تنظیم پیشنهاد تاریخ جلسه و تأیید ظرفیت.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-[#EAE2D5] rounded-xl text-xs">
              {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'SCHEDULE_PROPOSED', 'ACCEPTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    requestFilter === st
                      ? 'bg-[#171614] text-white'
                      : 'text-[#59524A] hover:bg-[#F4EFE7]'
                  }`}
                >
                  {st === 'ALL'
                    ? 'همه'
                    : st === 'SUBMITTED'
                    ? 'ارسال‌شده'
                    : st === 'UNDER_REVIEW'
                    ? 'در حال بررسی'
                    : st === 'SCHEDULE_PROPOSED'
                    ? 'پیشنهاد جلسه'
                    : 'پذیرفته‌شده'}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F4EFE7]/60 text-[#59524A]">
                  <tr>
                    <th className="p-3.5 font-bold">شناسه</th>
                    <th className="p-3.5 font-bold">متقاضی</th>
                    <th className="p-3.5 font-bold">موبایل</th>
                    <th className="p-3.5 font-bold">سطح هنرجو</th>
                    <th className="p-3.5 font-bold">تعداد</th>
                    <th className="p-3.5 font-bold">وضعیت</th>
                    <th className="p-3.5 font-bold">عملیات ادمین</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE2D5]/50">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F4EFE7]/20">
                      <td className="p-3.5 font-mono font-bold text-[#171614]">{req.id}</td>
                      <td className="p-3.5 font-semibold text-[#171614]">{req.fullName}</td>
                      <td className="p-3.5 font-mono text-[#59524A]">{req.mobile}</td>
                      <td className="p-3.5 text-[#59524A]">{req.experienceLevel}</td>
                      <td className="p-3.5 font-bold tabular-nums text-[#171614]">{req.participantCount} نفر</td>
                      <td className="p-3.5">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 bg-[#87553B] hover:bg-[#6E422C] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          بررسی و اقدام
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: WORKSHOP SESSIONS & CAPACITY */}
      {currentTab === 'SESSIONS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#171614]">جلسات کارگاهی و ظرفیت صندلی‌ها</h2>
              <p className="text-xs text-[#59524A] mt-1">
                کنترل ظرفیت بافر بر اساس مجموع ثبت‌نام‌های قطعی و در انتظار تأیید.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewSessionModalOpen(true)}
              className="px-4 py-2 bg-[#87553B] hover:bg-[#6E422C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تعریف جلسه کارگاهی جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#87553B]">شهر {sess.cityName}</span>
                  <StatusBadge status={sess.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-[#171614]">{sess.courseName}</h3>
                <div className="text-xs text-[#59524A]">مدرس: {sess.instructorName}</div>
                <div className="text-xs text-[#59524A]">تاریخ: {sess.dateJalali}</div>

                <div className="p-3 bg-[#F4EFE7]/40 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>ظرفیت مجاز:</span>
                    <strong className="tabular-nums">{sess.capacity} صندلی</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>صندلی مصرف‌شده:</span>
                    <strong className="text-[#87553B] tabular-nums">{sess.registeredCount} نفر</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSessionStatus(sess.id)}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    sess.status === 'OPEN'
                      ? 'bg-[#C54636] text-white hover:bg-rose-800'
                      : 'bg-[#167C55] text-white hover:bg-emerald-800'
                  }`}
                >
                  {sess.status === 'OPEN' ? 'بستن موقت ظرفیت' : 'بازگشایی مجدد ظرفیت'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === 'ENROLLMENTS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Form to Grant / Revoke manual enrollment */}
            <div className="w-full md:w-1/3 bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4 h-fit">
              <div>
                <h3 className="text-sm font-bold text-[#171614]">ثبت دسترسی دستی جدید</h3>
                <p className="text-xs text-[#968A7C] mt-1">
                  می‌توانید دسترسی یک کاربر (با شماره موبایل) را به دوره‌های آنلاین فعال یا لغو کنید.
                </p>
              </div>

              <form onSubmit={handleManualEnrollSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#171614] mb-1">شماره همراه کاربر:</label>
                  <input
                    type="text"
                    value={manualEnrollMobile}
                    onChange={(e) => setManualEnrollMobile(e.target.value)}
                    placeholder="مثال: 09121234567"
                    required
                    dir="ltr"
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl focus:outline-none focus:border-[#87553B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171614] mb-1">انتخاب دوره آنلاین:</label>
                  <select
                    value={manualEnrollCourseId}
                    onChange={(e) => setManualEnrollCourseId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl focus:outline-none focus:border-[#87553B]"
                    required
                  >
                    <option value="" disabled>--- انتخاب کنید ---</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#171614] mb-1">وضعیت دسترسی:</label>
                  <select
                    value={manualEnrollStatus}
                    onChange={(e) => setManualEnrollStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl focus:outline-none focus:border-[#87553B]"
                  >
                    <option value="ACTIVE">فعال (صاحب دوره)</option>
                    <option value="REVOKED">لغو شده / مسدود دستی</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEnrollment}
                  className="w-full py-2.5 bg-[#87553B] hover:bg-[#6E422C] disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingEnrollment ? 'در حال ثبت...' : 'ثبت دسترسی دستی'}</span>
                </button>
              </form>
            </div>

            {/* List of Manual Enrollments */}
            <div className="flex-1 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#FAF6F0] border-b border-[#EAE2D5]">
                <h3 className="text-sm font-bold text-[#171614]">تاریخچه ثبت‌نام‌ها و تغییرات دستی</h3>
                <p className="text-xs text-[#59524A] mt-0.5">
                  لیست کاربرانی که دسترسی دوره آن‌ها به صورت دستی توسط ادمین مدیریت شده است.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F4EFE7]/60 text-[#59524A]">
                    <tr>
                      <th className="p-3.5 font-bold">موبایل هنرجو</th>
                      <th className="p-3.5 font-bold">نام دوره آموزشی</th>
                      <th className="p-3.5 font-bold">تاریخ ثبت رخداد</th>
                      <th className="p-3.5 font-bold">وضعیت دسترسی</th>
                      <th className="p-3.5 font-bold text-center">عملیات سریع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE2D5]/40">
                    {manualEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#968A7C]">
                          هیچ دسترسی دستی ثبت نشده است. از فرم سمت راست برای اعطای دسترسی به هنرجویان استفاده کنید.
                        </td>
                      </tr>
                    ) : (
                      manualEnrollments.map((item: any) => (
                        <tr key={item.id} className="hover:bg-[#F4EFE7]/20 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#171614]">
                            {item.userMobile}
                          </td>
                          <td className="p-3.5 font-medium text-[#171614]">
                            {item.courseName}
                          </td>
                          <td className="p-3.5 text-[#59524A] tabular-nums">
                            {new Date(item.grantedAt).toLocaleDateString('fa-IR')} {new Date(item.grantedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.status === 'ACTIVE' ? 'فعال دستی' : 'لغو شده دستی'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={async () => {
                                const nextStatus = item.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
                                if (onUpdateManualEnrollment) {
                                  await onUpdateManualEnrollment(item.userMobile, item.courseId, item.courseName, nextStatus);
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                item.status === 'ACTIVE'
                                  ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {item.status === 'ACTIVE' ? 'سلب دسترسی' : 'فعال‌سازی مجدد'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS & MANAGEMENT */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFFCF8] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-[#EAE2D5] shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#87553B]/10 text-[#87553B] px-2.5 py-0.5 rounded-md font-mono font-bold">
                    {selectedOrder.orderNumber}
                  </span>
                  <StatusBadge status={selectedOrder.status} size="sm" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#171614] mt-1">
                  جزئیات فاکتور و مدیریت ارسال سفارش
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Shipping Information */}
            <div className="bg-white p-4 rounded-xl border border-[#EAE2D5] space-y-3 text-xs">
              <h4 className="font-bold text-[#171614] flex items-center gap-2">
                <User className="w-4 h-4 text-[#87553B]" />
                <span>مشخصات تحویل‌گیرنده و آدرس ارسال</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#59524A]">
                <div>
                  <span className="font-semibold text-[#171614]">نام گیرنده: </span>
                  {selectedOrder.shippingAddress?.recipientName || 'کاربر عمومی'}
                </div>
                <div>
                  <span className="font-semibold text-[#171614]">شماره موبایل: </span>
                  <span className="font-mono">{selectedOrder.shippingAddress?.mobile || 'ثبت نشده'}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#171614]">استان و شهر: </span>
                  {selectedOrder.shippingAddress?.province || '-'} / {selectedOrder.shippingAddress?.city || '-'}
                </div>
                <div>
                  <span className="font-semibold text-[#171614]">کد پستی ۱۰ رقمی: </span>
                  <span className="font-mono">{selectedOrder.shippingAddress?.postalCode || '-'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-[#171614]">نشانی دقیق پستی: </span>
                  {selectedOrder.shippingAddress?.addressLine || 'اطلاعات آدرس ثبت نشده است.'}
                </div>
              </div>
            </div>

            {/* Items Purchased List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[#171614] flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#87553B]" />
                <span>اقلام موجود در این سفارش</span>
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#EAE2D5] text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded-lg border border-[#EAE2D5]"
                      />
                      <div>
                        <div className="font-bold text-[#171614]">{item.title}</div>
                        <div className="text-xs text-[#968A7C] mt-0.5">
                          تعداد: <span className="font-bold tabular-nums text-[#171614]">{item.quantity} عدد</span>
                          {item.sku && <span className="mr-3 font-mono">SKU: {item.sku}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-[#87553B] tabular-nums">
                      {(item.priceToman * item.quantity).toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 bg-[#F4EFE7]/50 rounded-xl space-y-2 text-xs border border-[#EAE2D5]">
              <div className="flex justify-between text-[#59524A]">
                <span>جمع اقلام سبد:</span>
                <span className="tabular-nums">{selectedOrder.subtotalToman.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-[#59524A]">
                <span>هزینه بسته‌بندی و ارسال پیشتاز:</span>
                <span className="tabular-nums">
                  {selectedOrder.shippingToman === 0
                    ? 'رایگان'
                    : `${selectedOrder.shippingToman.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#171614] pt-2 border-t border-[#EAE2D5]">
                <span>مبلغ نهایی پرداختی:</span>
                <span className="text-[#167C55] tabular-nums">
                  {selectedOrder.payableToman.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>

            {/* Admin Action: Change Order Status & Add Tracking Code */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#EAE2D5] space-y-4 text-xs">
              <h4 className="font-bold text-[#171614] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#87553B]" />
                <span>مدیریت وضعیت و درج کد رهگیری پستی</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-[#171614]">تغییر وضعیت سفارش:</label>
                  <select
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value as OrderStatus)}
                    className="w-full p-2.5 bg-[#FFFCF8] border border-[#EAE2D5] rounded-xl font-medium text-xs text-[#171614]"
                  >
                    {/* PENDING_PAYMENT -> PAID is intentionally NOT offered here:
                        only a verified payment-gateway callback may set an
                        order to PAID (server enforces this and will reject
                        any attempt from this form with a 409). */}
                    <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
                    <option value="CANCELLED">لغو سفارش (قبل از پرداخت)</option>
                    <option value="EXPIRED">منقضی شده (قبل از پرداخت)</option>
                    <option value="COMPLETED">تکمیل و ارسال شده (پس از پرداخت)</option>
                    <option value="REFUND_PENDING">در انتظار استرداد (پس از پرداخت)</option>
                    <option value="REFUNDED">مسترد شد</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#171614]">کد رهگیری پست یا تیپاکس:</label>
                  <input
                    type="text"
                    value={editingTrackingCode}
                    onChange={(e) => setEditingTrackingCode(e.target.value)}
                    placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸۹۰"
                    className="w-full p-2.5 bg-[#FFFCF8] border border-[#EAE2D5] rounded-xl font-mono text-xs text-[#171614]"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                  {saveError}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 text-stone-600 hover:text-stone-900 border border-[#EAE2D5] rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>چاپ فاکتور</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveOrderChanges}
                  disabled={isSavingOrder}
                  className="px-5 py-2.5 bg-[#171614] hover:bg-[#87553B] disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isSavingOrder ? 'در حال ذخیره...' : 'ذخیره تغییرات سفارش'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF8] rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#EAE2D5] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <div>
                <span className="text-xs text-[#87553B] font-bold">تنظیم پیشنهاد رسمی</span>
                <h3 className="text-base font-bold text-[#171614]">{selectedRequest.fullName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">تاریخ پیشنهادی برگزاری جلسه:</label>
                <input
                  type="text"
                  value={proposalDate}
                  onChange={(e) => setProposalDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">مدرس مسئول:</label>
                <input
                  type="text"
                  value={proposalInstructor}
                  onChange={(e) => setProposalInstructor(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">محل و سالن برگزاری:</label>
                <input
                  type="text"
                  value={proposalVenue}
                  onChange={(e) => setProposalVenue(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">شهریه پیشنهادی (تومان):</label>
                <input
                  type="number"
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#EAE2D5] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onDeclineRequest(selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold cursor-pointer"
                >
                  رد درخواست
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#171614] hover:bg-[#87553B] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال پیشنهاد رسمی به متقاضی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SESSION */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF8] rounded-2xl max-w-md w-full p-6 border border-[#EAE2D5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="text-base font-bold text-[#171614]">تعریف جلسه حضوری جدید</h3>
              <button
                type="button"
                onClick={() => setIsNewSessionModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">دوره مرتبط:</label>
                <select
                  value={newSessCourseId}
                  onChange={(e) => setNewSessCourseId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">شهر:</label>
                  <input
                    type="text"
                    value={newSessCityName}
                    onChange={(e) => {
                      setNewSessCityName(e.target.value);
                      setNewSessCityId(`city-${e.target.value.toLowerCase()}`);
                    }}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">مدرس جلسه:</label>
                  <input
                    type="text"
                    value={newSessInstructor}
                    onChange={(e) => setNewSessInstructor(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">تاریخ (جلالی):</label>
                  <input
                    type="text"
                    value={newSessDate}
                    onChange={(e) => setNewSessDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ظرفیت صندلی:</label>
                  <input
                    type="number"
                    value={newSessCapacity}
                    onChange={(e) => setNewSessCapacity(parseInt(e.target.value) || 8)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">شهریه کارگاه (تومان):</label>
                <input
                  type="number"
                  step={100000}
                  value={newSessPrice}
                  onChange={(e) => setNewSessPrice(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#EAE2D5] flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#87553B] hover:bg-[#6E422C] text-white font-bold rounded-xl cursor-pointer"
                >
                  ایجاد جلسه و انتشار در سایت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
