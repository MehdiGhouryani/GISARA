/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AccountPage - Screen 12 (User Account Dashboard)
 * Orders Timeline with Shipment Tracking & Invoice Details + Online Courses with Progress + Workshop Requests Timeline
 */

import React, { useState } from 'react';
import { UserOrder, Course, WorkshopRequest, CartItem, Certificate } from '../types/domain';
import { StatusBadge } from '../components/common/StatusBadge';
import { Breadcrumb } from '../components/common/Breadcrumb';
import {
  ShoppingBag,
  BookOpen,
  Clock,
  User,
  Calendar,
  Play,
  FileText,
  Truck,
  PackageCheck,
  CheckCircle2,
  X,
  Printer,
  ShieldCheck,
  Award,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { EditorialImage } from '../components/common/EditorialImage';
import { getAllLessons } from '../utils/course';
import { getCourseResume } from '../utils/courseProgress';

/** Outcome of a bank-gateway round trip, shown as a persistent banner on the orders tab. */
export interface PaymentResult {
  status: 'success' | 'failed' | 'cancelled' | 'pending';
  orderId?: string;
  refId?: string;
  message?: string;
}

interface AccountPageProps {
  userMobile: string;
  userName: string;
  /** Public account identifier (shown so support / admin can find this account quickly). */
  userCode?: string;
  onUpdateProfile?: (name: string) => Promise<{ success: boolean; message?: string }>;
  orders: UserOrder[];
  enrolledCourses: Course[];
  requests: WorkshopRequest[];
  certificates?: Certificate[];
  onNavigateHome: () => void;
  onStartCourse: (course: Course, lessonId?: string) => void;
  onAcceptProposal: (requestId: string) => void;
  onDeclineProposal: (requestId: string) => void;
  onLogout: () => void;
  /** Receives the order whose tracking the user asked for. */
  onOpenOrderTracking?: (order?: UserOrder) => void;
  paymentResult?: PaymentResult | null;
  onDismissPaymentResult?: () => void;
  /** Starts a new bank session for an unpaid order; on success the browser leaves for the gateway. */
  onRetryPayment?: (orderId: string) => Promise<{ success: boolean; message?: string }>;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  userMobile,
  userName,
  userCode = '',
  onUpdateProfile,
  orders,
  enrolledCourses,
  requests,
  certificates = [],
  onNavigateHome,
  onStartCourse,
  onAcceptProposal,
  onDeclineProposal,
  onLogout,
  onOpenOrderTracking,
  paymentResult = null,
  onDismissPaymentResult,
  onRetryPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'COURSES' | 'REQUESTS' | 'CERTIFICATES'>(() => {
    // Deep link support: /account?tab=courses (the gateway returns with ?tab=orders).
    const tab = (new URLSearchParams(window.location.search).get('tab') || '').toUpperCase();
    return tab === 'COURSES' || tab === 'REQUESTS' || tab === 'CERTIFICATES' ? tab : 'ORDERS';
  });
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<{ orderId: string; message: string } | null>(null);

  const handleRetry = async (orderId: string) => {
    if (!onRetryPayment || retryingOrderId) return;
    setRetryingOrderId(orderId);
    setRetryError(null);
    const res = await onRetryPayment(orderId);
    // On success the browser is already navigating to the bank: keep the button busy until it leaves.
    if (!res.success) {
      setRetryingOrderId(null);
      setRetryError({ orderId, message: res.message || 'اتصال به درگاه برقرار نشد.' });
    }
  };
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<UserOrder | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Profile edit: only the display name is editable (saved on the server). Mobile and user ID are fixed.
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard can be blocked (insecure context / permissions); the code stays visible and selectable.
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = tempName.trim();
    if (name.length < 2) {
      setProfileError('نام باید حداقل ۲ حرف باشد.');
      return;
    }
    if (!onUpdateProfile || isSavingProfile) return;
    setIsSavingProfile(true);
    setProfileError(null);
    const res = await onUpdateProfile(name);
    setIsSavingProfile(false);
    if (res.success) setIsEditing(false);
    else setProfileError(res.message || 'ذخیره نام انجام نشد. دوباره تلاش کنید.');
  };

  const handleStartEdit = () => {
    setTempName(userName);
    setProfileError(null);
    setIsEditing(true);
  };

  const initial = (userName || '').trim().charAt(0) || '؟';

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'حساب کاربری', isCurrent: true },
        ]}
      />

      {/* User Header Profile */}
      <div className="bg-[#FFFCF8] rounded-2xl p-5 sm:p-8 border border-[#DED7CD] shadow-xs space-y-4">
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start min-w-0">
              <div aria-hidden="true" className="w-16 h-16 rounded-full shrink-0 bg-[#7A5E4D] text-white flex items-center justify-center text-2xl font-bold">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <h1 className="text-xl font-bold text-[#171614] break-words">{userName}</h1>
                  {onUpdateProfile && (
                    <button type="button" onClick={handleStartEdit} className="min-h-9 text-xs text-[#87553B] hover:underline font-semibold cursor-pointer">
                      ویرایش نام
                    </button>
                  )}
                </div>
                <div className="text-xs text-[#5E5A54] mt-1 space-y-1">
                  <div>
                    شماره همراه: <bdi dir="ltr" className="tabular-nums">{userMobile}</bdi>
                  </div>
                  {userCode && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span>شناسه کاربری:</span>
                      <bdi dir="ltr" className="font-mono font-bold text-[#171614] select-all">{userCode}</bdi>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(userCode)}
                        className="min-h-9 px-2 inline-flex items-center gap-1 text-[#87553B] hover:underline cursor-pointer"
                        aria-label="کپی شناسه کاربری"
                      >
                        {copiedCode === userCode ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span>{copiedCode === userCode ? 'کپی شد' : 'کپی'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-11 px-4 text-xs font-semibold text-[#A54843] hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer self-stretch sm:self-auto"
            >
              خروج از حساب کاربری
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} noValidate className="space-y-4 max-w-md">
            <h2 className="text-sm font-bold text-[#171614] border-b border-[#EEE8DF] pb-2">ویرایش نام</h2>
            <div>
              <label htmlFor="profile-name" className="block text-xs font-bold text-stone-700 mb-1.5">نام و نام خانوادگی</label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                maxLength={60}
                value={tempName}
                onChange={(e) => { setTempName(e.target.value); if (profileError) setProfileError(null); }}
                aria-invalid={profileError ? true : undefined}
                aria-describedby={profileError ? 'profile-name-err' : undefined}
                className="w-full min-h-11 px-3 bg-white border border-stone-300 rounded-xl text-sm text-[#171614] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40"
                placeholder="مثال: مریم حسینی"
                autoFocus
              />
              {profileError && <p id="profile-name-err" role="alert" className="mt-1 text-xs text-rose-700">{profileError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={isSavingProfile} aria-busy={isSavingProfile} className="min-h-11 px-5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
                {isSavingProfile ? 'در حال ذخیره…' : 'ذخیره'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="min-h-11 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer">
                انصراف
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EEE8DF] rounded-2xl max-w-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('ORDERS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ORDERS'
              ? 'bg-[#FFFCF8] text-[#171614] shadow-xs'
              : 'text-[#5E5A54] hover:text-[#171614]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#7A5E4D]" />
          <span>سفارش‌ها ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COURSES')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'COURSES'
              ? 'bg-[#FFFCF8] text-[#171614] shadow-xs'
              : 'text-[#5E5A54] hover:text-[#171614]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#7A5E4D]" />
          <span>دوره‌های من ({enrolledCourses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REQUESTS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'REQUESTS'
              ? 'bg-[#FFFCF8] text-[#171614] shadow-xs'
              : 'text-[#5E5A54] hover:text-[#171614]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#7A5E4D]" />
          <span>درخواست‌ها ({requests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CERTIFICATES')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CERTIFICATES'
              ? 'bg-[#FFFCF8] text-[#171614] shadow-xs'
              : 'text-[#5E5A54] hover:text-[#171614]'
          }`}
        >
          <Award className="w-4 h-4 text-[#7A5E4D]" />
          <span>گواهینامه‌ها ({certificates.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          {paymentResult && (
            <div
              role={paymentResult.status === 'success' ? 'status' : 'alert'}
              className={`rounded-2xl border p-4 sm:p-5 flex items-start gap-3 text-xs leading-6 ${
                paymentResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : paymentResult.status === 'pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {paymentResult.status === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> : <Clock className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">
                  {paymentResult.status === 'success' && 'پرداخت با موفقیت انجام شد'}
                  {paymentResult.status === 'pending' && 'پرداخت در حال بررسی است'}
                  {paymentResult.status === 'cancelled' && 'پرداخت لغو شد'}
                  {paymentResult.status === 'failed' && 'پرداخت انجام نشد'}
                </div>
                {paymentResult.status === 'success' ? (
                  <p>
                    سفارش شما تأیید شد.
                    {paymentResult.refId && <> کد پیگیری بانکی: <bdi dir="ltr" className="font-mono font-bold">{paymentResult.refId}</bdi></>}
                  </p>
                ) : (
                  <p>{paymentResult.message || 'تراکنش به نتیجه نرسید.'}</p>
                )}
                {(paymentResult.status === 'failed' || paymentResult.status === 'cancelled') && (
                  <p className="mt-1">سفارش شما نگه داشته شده است؛ تا پایان مهلت پرداخت می‌توانید از دکمه «پرداخت مجدد» همین سفارش استفاده کنید.</p>
                )}
              </div>
              {onDismissPaymentResult && (
                <button type="button" onClick={onDismissPaymentResult} aria-label="بستن پیام" className="shrink-0 w-8 h-8 -m-1 flex items-center justify-center rounded-lg hover:bg-black/5 cursor-pointer">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] p-6">
              <p className="text-sm font-semibold text-[#171614]">تاکنون سفارشی ثبت نکرده‌اید.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#FFFCF8] rounded-2xl p-5 sm:p-6 border border-[#DED7CD] shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DED7CD]">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#171614]">
                        سفارش {ord.orderNumber}
                      </span>
                      <StatusBadge status={ord.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForInvoice(ord)}
                        className="px-3 py-1.5 bg-[#EEE8DF] hover:bg-[#DED7CD] text-[#171614] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#7A5E4D]" />
                        <span>مشاهده فاکتور</span>
                      </button>

                      {onRetryPayment && (ord.status === 'PENDING_PAYMENT' || ord.status === 'PAYMENT_FAILED') && (
                        <button
                          type="button"
                          onClick={() => handleRetry(ord.id)}
                          disabled={retryingOrderId !== null}
                          aria-busy={retryingOrderId === ord.id}
                          className="min-h-9 px-3 py-1.5 bg-[#2F6B51] hover:bg-[#24543F] disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{retryingOrderId === ord.id ? 'در حال اتصال به درگاه…' : 'پرداخت مجدد'}</span>
                        </button>
                      )}

                      {onOpenOrderTracking && (ord.status === 'PAID' || ord.status === 'COMPLETED') && ord.items.some((i: CartItem) => i.type === 'PHYSICAL_PRODUCT') && (
                        <button
                          type="button"
                          onClick={() => onOpenOrderTracking(ord)}
                          className="px-3 py-1.5 bg-[#87553B]/10 hover:bg-[#87553B]/20 text-[#87553B] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#87553B]" />
                          <span>رهگیری آنلاین مرسوله</span>
                        </button>
                      )}

                      <div className="text-xs text-[#5E5A54] tabular-nums">
                        ثبت سفارش: {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-[#DED7CD]/50">
                    {ord.items.map((item: CartItem) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#DED7CD] bg-white">
                            <EditorialImage src={item.image} alt={item.title} aspectRatio="1:1" />
                          </div>
                          <div>
                            <div className="font-bold text-[#171614]">{item.title}</div>
                            <div className="text-[#5E5A54] mt-0.5">تعداد: {item.quantity} عدد</div>
                          </div>
                        </div>

                        <div className="font-bold text-[#171614] tabular-nums">
                          {(item.priceToman * item.quantity).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Snapshot */}
                  <div className="pt-4 border-t border-[#DED7CD] flex flex-wrap items-center justify-between gap-4 text-xs">
                    {ord.shippingAddress && (
                      <div className="text-[#5E5A54] max-w-md">
                        <span className="font-semibold text-[#171614]">آدرس تحویل: </span>
                        {ord.shippingAddress.province}، {ord.shippingAddress.city}، {ord.shippingAddress.addressLine}
                      </div>
                    )}

                    {(ord.status === 'PENDING_PAYMENT' || ord.status === 'PAYMENT_FAILED') && ord.paymentExpiresAt && (
                      <div className="w-full text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role={retryError?.orderId === ord.id ? 'alert' : undefined}>
                        {retryError?.orderId === ord.id
                          ? retryError.message
                          : Date.parse(ord.paymentExpiresAt) > Date.now()
                          ? `مهلت پرداخت: حدود ${Math.max(1, Math.ceil((Date.parse(ord.paymentExpiresAt) - Date.now()) / 60000)).toLocaleString('fa-IR')} دقیقه دیگر؛ پس از آن سفارش لغو و موجودی آزاد می‌شود.`
                          : 'مهلت پرداخت رو به پایان است.'}
                      </div>
                    )}

                    <div className="flex items-baseline gap-2 mr-auto">
                      <span className="text-xs text-[#5E5A54]">{ord.status === 'PAID' || ord.status === 'COMPLETED' ? 'مبلغ پرداختی:' : 'مبلغ سفارش:'}</span>
                      <span className="text-base font-bold text-[#7A5E4D] tabular-nums">
                        {ord.payableToman.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ONLINE COURSES */}
      {activeTab === 'COURSES' && (
        <div className="space-y-6">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-16 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] p-6">
              <p className="text-sm font-semibold text-[#171614]">شما هنوز در دوره‌ای ثبت‌نام نکرده‌اید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#FFFCF8] rounded-2xl overflow-hidden border border-[#DED7CD] shadow-xs flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="rounded-xl overflow-hidden border border-[#DED7CD]">
                      <EditorialImage src={course.heroImage} alt={course.name} aspectRatio="16:9" />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#7A5E4D] mb-1">
                        دسترسی فعال
                      </div>
                      <h3 className="text-base font-bold text-[#171614] leading-snug">
                        {course.name}
                      </h3>
                    </div>

                    {(() => {
                      const lessons = getAllLessons(course);
                      const resume = getCourseResume(userMobile, course.id, lessons);
                      return (
                        <div>
                          <div className="flex justify-between text-xs text-[#5E5A54] mb-1.5">
                            <span>پیشرفت شما</span>
                            <span className="font-bold text-[#2F6B51] tabular-nums">{resume.percent.toLocaleString('fa-IR')}٪</span>
                          </div>
                          <div className="w-full h-2 bg-[#EEE8DF] rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={resume.percent} aria-label={`پیشرفت در ${course.name}`}>
                            <div className="h-full bg-[#2F6B51] rounded-full transition-all" style={{ width: `${resume.percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-5 pt-0">
                    {getAllLessons(course).length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onStartCourse(course)}
                        className="w-full min-h-11 py-2.5 px-4 bg-[#171614] hover:bg-[#7A5E4D] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                      >
                        <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                        <span>{getCourseResume(userMobile, course.id, getAllLessons(course)).started ? 'ادامه یادگیری' : 'شروع یادگیری'}</span>
                      </button>
                    ) : (
                      <p className="text-xs text-[#5E5A54] text-center py-2">درس‌های این دوره به‌زودی منتشر می‌شوند.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORKSHOP REQUESTS TIMELINE */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-6">
          {requests.length === 0 ? (
            <div className="text-center py-16 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] p-6">
              <p className="text-sm font-semibold text-[#171614]">هیچ درخواست کارگاه فعالی ندارید.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-[#FFFCF8] rounded-2xl p-5 sm:p-6 border border-[#DED7CD] shadow-xs space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DED7CD]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#5E5A54]">
                        شناسه: <strong className="font-mono text-[#171614]">{req.id}</strong>
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>

                    <div className="text-xs text-[#5E5A54] tabular-nums">
                      تاریخ ثبت: {new Date(req.submittedAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>

                  {/* Timeline Graphic Nodes */}
                  <div className="relative py-2">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {/* Node 1: SUBMITTED */}
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-[#2F6B51] text-white flex items-center justify-center font-bold mb-1">
                          ✓
                        </div>
                        <span className="font-bold text-[#171614]">ارسال شد</span>
                      </div>

                      {/* Node 2: UNDER_REVIEW */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 ${
                            ['UNDER_REVIEW', 'SCHEDULE_PROPOSED', 'ACCEPTED'].includes(req.status)
                              ? 'bg-[#2F6B51] text-white'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {['SCHEDULE_PROPOSED', 'ACCEPTED'].includes(req.status) ? '✓' : '۲'}
                        </div>
                        <span className="font-medium text-[#171614]">در حال بررسی</span>
                      </div>

                      {/* Node 3: SCHEDULE_PROPOSED */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 ${
                            ['SCHEDULE_PROPOSED', 'ACCEPTED'].includes(req.status)
                              ? 'bg-[#7A5E4D] text-white animate-pulse'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {req.status === 'ACCEPTED' ? '✓' : '۳'}
                        </div>
                        <span className="font-medium text-[#171614]">پیشنهاد تاریخ</span>
                      </div>

                      {/* Node 4: ACCEPTED */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 ${
                            req.status === 'ACCEPTED'
                              ? 'bg-[#2F6B51] text-white'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          ۴
                        </div>
                        <span className="font-medium text-[#171614]">تأیید نهایی</span>
                      </div>
                    </div>
                  </div>

                  {/* Proposal Action Card (When status is SCHEDULE_PROPOSED) */}
                  {req.status === 'SCHEDULE_PROPOSED' && req.proposal && (
                    <div className="p-5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span>پیشنهاد رسمی دپارتمان آموزش برای درخواست شما:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#171614]">
                        <div>مربی دوره: <strong>{req.proposal.instructorName}</strong></div>
                        <div>تاریخ پیشنهادی: <strong>{req.proposal.dateJalali}</strong></div>
                        <div>مکان: <strong>{req.proposal.venueName}</strong></div>
                        <div>شهریه کارگاه: <strong>{req.proposal.priceToman.toLocaleString('fa-IR')} تومان</strong></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => onAcceptProposal(req.id)}
                          className="px-4 py-2 bg-[#2F6B51] hover:bg-[#23523e] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          پذیرش تاریخ و انتقال به ثبت‌نام قطعی
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineProposal(req.id)}
                          className="px-3 py-2 text-xs font-semibold text-[#A54843] hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          درخواست زمان دیگر
                        </button>
                      </div>
                    </div>
                  )}

                  {req.status === 'ACCEPTED' && (
                    <div className="p-4 bg-[#2F6B51]/10 border border-[#2F6B51]/30 rounded-xl text-xs text-[#2F6B51] font-semibold">
                      این جلسه توسط شما تأیید شد و صندلی شما در کارگاه رزرو گردید. هماهنگی نهایی پیش از تشکیل جلسه به شماره همراه شما پیامک خواهد شد.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATES */}
      {activeTab === 'CERTIFICATES' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#FAF6F0] rounded-2xl border border-[#DED7CD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#171614] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#7A5E4D]" />
                <span>گواهینامه‌های رسمی پایان دوره آکادمی شنیون مو</span>
              </h3>
              <p className="text-xs text-[#5E5A54]">
                این مدارک دارای بارکد و شناسه استعلام یکتا بوده و مورد تایید سالن‌های برتر و مدرسین کشوری است.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#7A5E4D] bg-[#7A5E4D]/10 px-3 py-1.5 rounded-xl text-center">
              {certificates.length} گواهی معتبر صادر شده
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-16 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] p-6 space-y-2">
              <Award className="w-12 h-12 text-[#8C857B] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-[#171614]">هنوز گواهینامه‌ای صادر نشده است.</p>
              <p className="text-xs text-[#5E5A54]">
                پس از تکمیل دوره‌های آنلاین یا کارگاه‌های حضوری، گواهی رسمی شما در این بخش فعال خواهد شد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-[#FFFCF8] rounded-2xl border-2 border-[#DED7CD] hover:border-[#7A5E4D] p-6 transition-all shadow-xs space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DED7CD]/70">
                      <div>
                        <span className="text-[11px] font-bold text-[#7A5E4D] uppercase tracking-wider block">
                          گواهی رسمی پایان مسترکلاس
                        </span>
                        <h4 className="text-base font-bold text-[#171614] mt-0.5">{cert.courseTitle}</h4>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#A98570]/15 flex items-center justify-center text-[#7A5E4D] shrink-0 border border-[#A98570]/30">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-[#5E5A54] pt-1">
                      <div>
                        <span className="text-[#8C857B] block text-[11px]">هنرجو:</span>
                        <strong className="text-[#171614]">{cert.studentName}</strong>
                      </div>
                      <div>
                        <span className="text-[#8C857B] block text-[11px]">مدرس تاییدکننده:</span>
                        <strong className="text-[#171614]">{cert.instructorName}</strong>
                      </div>
                      <div>
                        <span className="text-[#8C857B] block text-[11px]">تاریخ صدور:</span>
                        <span className="tabular-nums font-semibold text-[#171614]">{cert.issueDateJalali}</span>
                      </div>
                      <div>
                        <span className="text-[#8C857B] block text-[11px]">ارزیابی نهایی:</span>
                        <span className="font-bold text-[#2F6B51]">{cert.grade}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between bg-[#EEE8DF]/40 p-2.5 rounded-xl border border-[#DED7CD]/60 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#8C857B] block">شناسه یکتای استعلام:</span>
                        <span className="font-mono font-bold text-[#7A5E4D] text-xs">{cert.certificateCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(cert.certificateCode)}
                        className="px-2.5 py-1 text-[11px] bg-white border border-[#DED7CD] hover:border-[#7A5E4D] rounded-lg flex items-center gap-1 cursor-pointer transition-colors text-[#171614]"
                      >
                        {copiedCode === cert.certificateCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2F6B51]" />
                            <span className="text-[#2F6B51] font-bold">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#7A5E4D]" />
                            <span>کپی شناسه</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCertificate(cert)}
                      className="flex-1 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>مشاهده و چاپ مدرک رسمی</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoice & Shipment Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF8] rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-[#DED7CD] shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#DED7CD] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#171614]">صورتحساب رسمی فروشگاه شنیون مو</span>
                <span className="text-xs bg-[#2F6B51]/10 text-[#2F6B51] px-2 py-0.5 rounded-sm font-bold">
                  پرداخت‌شده
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForInvoice(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shipment Timeline */}
            <div className="p-4 bg-[#EEE8DF]/40 rounded-xl border border-[#DED7CD]/60 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#7A5E4D]">
                <Truck className="w-4 h-4" />
                <span>وضعیت ارسال مرسوله پستی:</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="font-bold text-[#2F6B51]">۱. تأیید مالی ✓</div>
                <div className="font-bold text-[#2F6B51]">۲. بسته‌بندی ✓</div>
                <div className="font-bold text-[#7A5E4D]">۳. تحویل به پست</div>
                <div className="text-stone-400">۴. تحویل مشتری</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-right text-xs">
              <thead className="bg-[#EEE8DF]/50 text-[#5E5A54]">
                <tr>
                  <th className="p-2.5 font-bold">شرح کالا</th>
                  <th className="p-2.5 font-bold">تعداد</th>
                  <th className="p-2.5 font-bold">قیمت واحد</th>
                  <th className="p-2.5 font-bold">مجموع (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED7CD]/50">
                {selectedOrderForInvoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-2.5 font-medium">{it.title}</td>
                    <td className="p-2.5 tabular-nums">{it.quantity}</td>
                    <td className="p-2.5 tabular-nums">{it.priceToman.toLocaleString('fa-IR')}</td>
                    <td className="p-2.5 font-bold tabular-nums">
                      {(it.priceToman * it.quantity).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="pt-3 border-t border-[#DED7CD] space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-[#5E5A54]">
                <span>جمع کل اقلام:</span>
                <span className="font-bold tabular-nums">
                  {selectedOrderForInvoice.subtotalToman.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between text-[#5E5A54]">
                <span>هزینه حمل و بسته‌بندی:</span>
                <span className="font-bold tabular-nums">
                  {selectedOrderForInvoice.shippingToman.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#171614] pt-2 border-t border-[#DED7CD]">
                <span>مبلغ نهایی پرداخت‌شده:</span>
                <span className="text-[#7A5E4D] tabular-nums">
                  {selectedOrderForInvoice.payableToman.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DED7CD] flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-[#2F6B51]">
                <ShieldCheck className="w-4 h-4" />
                <span>رسید الکترونیکی معتبر شاپرک با اسنپ‌شات تغییرناپذیر کاتالوگ</span>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#171614] hover:bg-[#7A5E4D] text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ صورتحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Luxury Viewer Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF6F0] rounded-3xl max-w-3xl w-full p-6 sm:p-10 border-4 border-[#7A5E4D] shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 relative text-right">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-5 left-5 p-1.5 bg-white text-stone-500 hover:text-stone-900 rounded-full border border-[#DED7CD] cursor-pointer shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Canvas / Outer Frame */}
            <div className="p-8 sm:p-10 bg-white rounded-2xl border-2 border-[#DED7CD] shadow-inner space-y-8 relative overflow-hidden">
              {/* Background Luxury Guilloche Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Award className="w-96 h-96 text-[#7A5E4D]" />
              </div>

              {/* Certificate Top Header */}
              <div className="text-center space-y-2 relative z-10 border-b-2 border-[#7A5E4D]/30 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#7A5E4D]/10 rounded-full text-xs font-bold text-[#7A5E4D]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>آکادمی بین‌المللی هنر و استایلینگ مو گیس‌آرا (GisAra)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#171614] tracking-tight">
                  گواهینامه رسمی پایان دوره تخصصی
                </h2>
                <p className="text-xs text-[#5E5A54] font-medium">
                  GISARA ACADEMY · CERTIFICATE OF PROFESSIONAL EXCELLENCE
                </p>
              </div>

              {/* Certificate Body Text */}
              <div className="space-y-4 text-center relative z-10 py-2">
                <p className="text-xs text-[#5E5A54]">بدین‌وسیله گواهی می‌شود سرکار خانم</p>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#7A5E4D] tracking-wide">
                  {selectedCertificate.studentName}
                </div>
                <p className="text-xs text-[#5E5A54] leading-relaxed max-w-xl mx-auto">
                  پس از گذراندن موفقیت‌آمیز سرفصل‌های تئوری و عملی، ارزشیابی کارگاهی و پروژه‌های ژورنالی، دوره
                  {' '}<strong className="text-[#171614] font-bold">«{selectedCertificate.courseTitle}»</strong>{' '}
                  به مدت <span className="font-bold tabular-nums">{selectedCertificate.hoursCount} ساعت آموزش تخصصی</span> را با درجه کیفی <strong className="text-[#2F6B51] font-bold">{selectedCertificate.grade}</strong> در آکادمی گیس‌آرا با موفقیت به پایان رسانده است.
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#DED7CD] items-center text-center relative z-10 text-xs">
                {/* Right: Issue Date */}
                <div className="space-y-1">
                  <span className="text-[#8C857B] block text-[11px]">تاریخ صدور گواهینامه:</span>
                  <span className="font-bold text-[#171614] tabular-nums">{selectedCertificate.issueDateJalali}</span>
                  <span className="text-[10px] text-[#8C857B] block">تهران - آکادمی مرکزی گیس‌آرا</span>
                </div>

                {/* Center: Official Golden Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-[#7A5E4D] bg-[#FAF6F0] flex flex-col items-center justify-center text-[#7A5E4D] shadow-md p-1">
                    <Award className="w-7 h-7" />
                    <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">GISARA SEAL</span>
                  </div>
                  <span className="text-[9px] text-[#2F6B51] font-bold mt-1.5">اصالت تایید شده</span>
                </div>

                {/* Left: Instructor Signature */}
                <div className="space-y-1">
                  <span className="text-[#8C857B] block text-[11px]">امضای مدرس و مستر آکادمی:</span>
                  <strong className="text-[#171614] block font-bold text-sm">{selectedCertificate.instructorName}</strong>
                  <div className="font-serif italic text-[#7A5E4D] text-xs">Verified Signature ✓</div>
                </div>
              </div>

              {/* Certificate Security Barcode & Footer */}
              <div className="pt-4 border-t border-[#DED7CD]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#5E5A54] relative z-10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2F6B51]" />
                  <span>کد یکتای ثبت در پایگاه ملی گواهینامه‌ها:</span>
                  <strong className="font-mono text-xs text-[#7A5E4D]">{selectedCertificate.certificateCode}</strong>
                </div>

                <div className="text-[10px] text-[#8C857B]">
                  قابلیت استعلام برخط در بخش استعلام گواهینامه گیس‌آرا
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedCertificate.certificateCode)}
                  className="px-4 py-2 bg-white border border-[#DED7CD] hover:border-[#7A5E4D] text-xs font-semibold text-[#171614] rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-[#7A5E4D]" />
                  <span>کپی کد استعلام مدرک</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#7A5E4D] hover:bg-[#60493C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ / ذخیره PDF گواهینامه</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
