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

interface AccountPageProps {
  userMobile: string;
  userName: string;
  userAvatar?: string;
  onUpdateProfile?: (name: string, avatar: string) => void;
  orders: UserOrder[];
  enrolledCourses: Course[];
  requests: WorkshopRequest[];
  certificates?: Certificate[];
  onNavigateHome: () => void;
  onStartCourse: (course: Course, lessonId?: string) => void;
  onAcceptProposal: (requestId: string) => void;
  onDeclineProposal: (requestId: string) => void;
  onLogout: () => void;
  onOpenOrderTracking?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  userMobile,
  userName,
  userAvatar = '',
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
}) => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'COURSES' | 'REQUESTS' | 'CERTIFICATES'>('ORDERS');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<UserOrder | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempAvatar, setTempAvatar] = useState(userAvatar);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveProfile = () => {
    if (!tempName.trim()) return;
    const finalAvatar = customAvatarUrl.trim() || tempAvatar;
    if (onUpdateProfile) {
      onUpdateProfile(tempName.trim(), finalAvatar);
    }
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setTempName(userName);
    setTempAvatar(userAvatar);
    setCustomAvatarUrl(userAvatar && !defaultAvatars.includes(userAvatar) ? userAvatar : '');
    setIsEditing(true);
  };

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
      <div className="bg-[#FFFCF8] rounded-2xl p-6 sm:p-8 border border-[#DED7CD] shadow-xs space-y-6">
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
              <div className="w-18 h-16 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border border-[#DED7CD] bg-[#EEE8DF] flex items-center justify-center">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#7A5E4D]" />
                )}
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl font-bold text-[#171614]">{userName}</h1>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-xs text-[#87553B] hover:underline font-semibold cursor-pointer"
                  >
                    (ویرایش پروفایل)
                  </button>
                </div>
                <div className="text-xs text-[#5E5A54] mt-1 tabular-nums">
                  شماره همراه: {userMobile} · هنرجوی تاییدشده آکادمی گیس‌آرا
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 text-xs font-semibold text-[#A54843] hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer self-stretch sm:self-auto"
            >
              خروج از حساب کاربری
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-[#171614] border-b border-[#EEE8DF] pb-2">ویرایش اطلاعات حساب کاربری</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Form Input fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5">نام و نام خانوادگی جدید</label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-stone-200 rounded-xl text-xs text-[#171614] focus:outline-none focus:border-amber-600"
                    placeholder="مثال: مریم حسینی"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5">یا وارد کردن لینک مستقیم عکس دلخواه</label>
                  <input
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-stone-200 rounded-xl text-xs font-mono text-[#171614] focus:outline-none focus:border-amber-600 dir-ltr text-left"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              {/* Avatar Chooser */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-stone-600">انتخاب عکس پروفایل از گالری گیس‌آرا</span>
                <div className="flex flex-wrap gap-3 pt-1">
                  {defaultAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTempAvatar(url);
                        setCustomAvatarUrl('');
                      }}
                      className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        tempAvatar === url && !customAvatarUrl
                          ? 'border-amber-600 scale-105 shadow-md shadow-amber-600/10'
                          : 'border-stone-200 hover:border-amber-600/40'
                      }`}
                    >
                      <img src={url} alt={`آواتار ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-[#EEE8DF]">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ذخیره تغییرات پروفایل
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
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

                      {onOpenOrderTracking && (
                        <button
                          type="button"
                          onClick={onOpenOrderTracking}
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

                    <div className="flex items-baseline gap-2 mr-auto">
                      <span className="text-xs text-[#5E5A54]">مبلغ پرداختی:</span>
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
                        دسترسی فعال مادام‌العمر
                      </div>
                      <h3 className="text-base font-bold text-[#171614] leading-snug">
                        {course.name}
                      </h3>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-[#5E5A54] mb-1.5">
                        <span>وضعیت دسترسی:</span>
                        <span className="font-bold text-[#2F6B51]">فعال و نامحدود</span>
                      </div>
                      <div className="w-full h-2 bg-[#EEE8DF] rounded-full overflow-hidden">
                        <div className="w-full h-full bg-[#2F6B51] rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => onStartCourse(course, course.modules[0].lessons[0].id)}
                      className="w-full py-2.5 px-4 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>ورود به محیط مشاهده و پخش ویدیوها</span>
                    </button>
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
