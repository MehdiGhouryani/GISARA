/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CheckoutPage - 4-Step Checkout Flow & Result
 * Strictly server-authoritative totals and clear digital/physical distinction
 */

import React, { useState } from 'react';
import { CartItem, UserOrder, Coupon } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { ShieldCheck, ArrowLeft, ArrowRight, CreditCard, Lock, Tag } from 'lucide-react';
import { ApiClient } from '../services/apiClient';

interface CheckoutPageProps {
  items: CartItem[];
  isLoggedIn: boolean;
  userMobile: string;
  onOpenAuth: () => void;
  onNavigateHome: () => void;
  onCompleteOrder: (order: UserOrder) => void;
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  isLoggedIn,
  userMobile,
  onOpenAuth,
  onNavigateHome,
  onCompleteOrder,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [step, setStep] = useState(isLoggedIn ? 2 : 1);
  const [recipientName, setRecipientName] = useState('مهسا کاظمی');
  const [recipientMobile, setRecipientMobile] = useState(userMobile || '09121234567');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [addressLine, setAddressLine] = useState('خیابان شریعتی، بالاتر از پل رومی، پلاک ۴۲، واحد ۳');
  const [postalCode, setPostalCode] = useState('1934812345');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<UserOrder | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Coupon state within checkout
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const physicalItems = items.filter((i) => i.type === 'PHYSICAL_PRODUCT');
  const digitalItems = items.filter((i) => i.type === 'ONLINE_COURSE');

  const subtotal = items.reduce((acc, item) => acc + item.priceToman * item.quantity, 0);
  const shipping = physicalItems.length > 0 ? 45000 : 0;

  const discountAmount = appliedCoupon
    ? Math.min(
        Math.round((subtotal * appliedCoupon.discountPercent) / 100),
        appliedCoupon.maxDiscountToman || Infinity
      )
    : 0;

  const total = Math.max(0, subtotal - discountAmount + shipping);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || !onApplyCoupon) return;
    setCouponMsg(null);
    const res = await onApplyCoupon(couponCodeInput.trim());
    if (res.success) {
      setCouponMsg({ text: res.message, isError: false });
      setCouponCodeInput('');
    } else {
      setCouponMsg({ text: res.message, isError: true });
    }
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setCheckoutError(null);

    try {
      // Prepare shipping info payload
      const shippingInfo = physicalItems.length > 0 ? {
        recipientName,
        recipientMobile,
        province,
        city,
        addressLine,
        postalCode,
      } : undefined;

      const res = await ApiClient.submitOrder({
        cartItems: items,
        shippingInfo,
        couponCode: appliedCoupon?.code,
      });

      if (!res || !res.order) {
        throw new Error('ساختار پاسخ سفارش نامعتبر است.');
      }

      // Order is created as PENDING_PAYMENT on the server — it is NOT paid
      // yet, and course access / order history are intentionally not
      // updated here. That only happens once the payment gateway confirms
      // the payment (see App.tsx's handling of ?paymentStatus=success).
      let pgRes: any;
      try {
        pgRes = await ApiClient.requestOnlinePayment(res.order.id);
      } catch (payErr: any) {
        // The order was created; only the gateway step failed. Keep the order on screen
        // (retry screen) instead of dropping back to the form, where paying again would
        // create a second order and a second stock reservation.
        pgRes = { message: payErr?.message };
      }
      if (pgRes && pgRes.paymentUrl) {
        window.location.href = pgRes.paymentUrl;
        return;
      }

      // Order exists server-side but we couldn't start the payment step.
      // Show the real (unpaid) order and let the person retry — never
      // fabricate a paid state.
      setCompletedOrder(res.order);
      setCheckoutError(pgRes?.message || 'سفارش شما ثبت شد اما اتصال به درگاه پرداخت برقرار نشد. لطفاً دوباره تلاش کنید.');
    } catch (err: any) {
      setCheckoutError(err?.message || 'ثبت سفارش با خطا مواجه شد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!completedOrder) return;
    setIsProcessing(true);
    setCheckoutError(null);
    try {
      const pgRes = await ApiClient.requestOnlinePayment(completedOrder.id);
      if (pgRes && pgRes.paymentUrl) {
        window.location.href = pgRes.paymentUrl;
        return;
      }
      setCheckoutError(pgRes?.message || 'اتصال به درگاه پرداخت هنوز برقرار نشد. لطفاً دوباره تلاش کنید.');
    } catch {
      setCheckoutError('اتصال به درگاه پرداخت با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ORDER REGISTERED BUT NOT YET PAID (payment step failed to start) ---------
  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
          <CreditCard className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
            در انتظار پرداخت
          </span>
          <h1 className="text-2xl font-bold text-[#171614] mt-1">
            سفارش شما ثبت شد؛ پرداخت هنوز انجام نشده است
          </h1>
          <p className="text-xs text-[#5E5A54] mt-2">
            شماره سفارش: <strong className="font-mono text-[#171614] text-sm">{completedOrder.orderNumber}</strong>
          </p>
        </div>

        {checkoutError && (
          <div className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-200 text-xs text-right">
            {checkoutError}
          </div>
        )}

        <div className="p-5 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] text-right text-xs space-y-3 shadow-xs">
          <div className="font-bold text-[#171614] border-b border-[#DED7CD] pb-2">
            خلاصه اقلام سفارش (هنوز پرداخت نشده):
          </div>
          {completedOrder.items.map((it: CartItem) => (
            <div key={it.id} className="flex justify-between items-center py-1">
              <span>{it.title} (x{it.quantity})</span>
              <span className="font-bold tabular-nums">
                {(it.priceToman * it.quantity).toLocaleString('fa-IR')} تومان
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={isProcessing}
            className="px-6 py-3 bg-[#2F6B51] hover:bg-[#24543F] disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isProcessing ? 'در حال اتصال...' : 'تلاش مجدد برای پرداخت'}
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-6 py-3 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'سبد خرید', onClick: onNavigateHome },
          { label: 'مراحل تسویه‌حساب', isCurrent: true },
        ]}
      />

      <h1 className="text-2xl font-bold text-[#171614]">
        تکمیل سفارش و پرداخت
      </h1>

      {/* Stepper Header */}
      <div className="flex items-center justify-between max-w-md mx-auto text-xs font-bold text-center">
        <div className={`flex-1 ${step >= 1 ? 'text-[#7A5E4D]' : 'text-stone-400'}`}>
          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${step >= 1 ? 'bg-[#7A5E4D] text-white' : 'bg-[#EEE8DF]'}`}>
            ۱
          </div>
          <span>ورود / هویت</span>
        </div>

        <div className="w-12 h-0.5 bg-[#DED7CD]" />

        <div className={`flex-1 ${step >= 2 ? 'text-[#7A5E4D]' : 'text-stone-400'}`}>
          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${step >= 2 ? 'bg-[#7A5E4D] text-white' : 'bg-[#EEE8DF]'}`}>
            ۲
          </div>
          <span>آدرس تحویل</span>
        </div>

        <div className="w-12 h-0.5 bg-[#DED7CD]" />

        <div className={`flex-1 ${step >= 3 ? 'text-[#7A5E4D]' : 'text-stone-400'}`}>
          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${step >= 3 ? 'bg-[#7A5E4D] text-white' : 'bg-[#EEE8DF]'}`}>
            ۳
          </div>
          <span>درگاه پرداخت</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Flow (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFCF8] p-6 sm:p-8 rounded-2xl border border-[#DED7CD] shadow-xs space-y-6">
          {/* STEP 1: AUTH CHECK */}
          {step === 1 && (
            <div className="text-center py-6 space-y-4">
              <Lock className="w-10 h-10 mx-auto text-[#7A5E4D]" />
              <h3 className="text-base font-bold text-[#171614]">
                برای ادامه نیاز به ورود با شماره موبایل است
              </h3>
              <p className="text-xs text-[#5E5A54] max-w-sm mx-auto">
                طبق قوانین امنیتی شنیون مو، خرید کالا یا دریافت دسترسی دوره‌های آنلاین نیازمند تأیید شماره موبایل با پیامک OTP است.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-6 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                ورود یا دریافت کد تأیید پیامکی
              </button>
            </div>
          )}

          {/* STEP 2: ADDRESS (Only if physical items exist) */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#171614] border-b border-[#DED7CD] pb-2">
                مشخصات گیرنده و آدرس پستی
              </h3>

              {physicalItems.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl text-xs border border-emerald-200">
                  سفارش شما شامل دوره‌های آنلاین است؛ نیازی به آدرس پستی نیست و دسترسی بلافاصله پس از پرداخت فعال می‌شود.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#171614] mb-1">نام و نام خانوادگی:</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#DED7CD] rounded-xl text-xs text-[#171614]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#171614] mb-1">شماره تماس تحویل‌گیرنده:</label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={recipientMobile}
                        onChange={(e) => setRecipientMobile(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#DED7CD] rounded-xl text-center text-xs text-[#171614]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#171614] mb-1">استان:</label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#DED7CD] rounded-xl text-xs text-[#171614]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#171614] mb-1">شهر:</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#DED7CD] rounded-xl text-xs text-[#171614]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171614] mb-1">نشانی کامل پستی:</label>
                    <textarea
                      rows={2}
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#DED7CD] rounded-xl text-xs text-[#171614]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171614] mb-1">کد پستی ۱۰ رقمی:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#DED7CD] rounded-xl text-center text-xs text-[#171614]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>مرحله بعد: انتخاب درگاه پرداخت</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#171614] border-b border-[#DED7CD] pb-2">
                انتخاب روش پرداخت آنلاین
              </h3>

              <div className="p-4 rounded-xl border-2 border-[#7A5E4D] bg-[#A98570]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#7A5E4D]" />
                  <div>
                    <div className="text-xs font-bold text-[#171614]">درگاه امن بانکی شاپرک (کلیه کارت‌های عضو شتاب)</div>
                    <div className="text-[11px] text-[#5E5A54] mt-0.5">تأییدیه آنی و بدون کارمزد اضافی</div>
                  </div>
                </div>
                <span className="w-4 h-4 rounded-full bg-[#7A5E4D] border-2 border-white" />
              </div>

              <div className="p-3 bg-[#EEE8DF]/50 rounded-xl text-xs text-[#5E5A54] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2F6B51] shrink-0" />
                <span>اتصال رمزنگاری‌شده SSL به درگاه مرکزی شاپرک با پروتکل SHA-256</span>
              </div>

              {checkoutError && (
                <div className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-200 text-xs text-right">
                  {checkoutError}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-[#5E5A54] hover:text-[#171614] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغییر آدرس</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="px-6 py-3 bg-[#2F6B51] hover:bg-[#23523e] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'در حال اتصال به بانک...' : `پرداخت ${total.toLocaleString('fa-IR')} تومان`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Aside (5 cols) */}
        <aside className="lg:col-span-5 bg-[#FFFCF8] p-6 rounded-2xl border border-[#DED7CD] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#171614] border-b border-[#DED7CD] pb-2">
            فاکتور نهایی سفارش
          </h2>

          <div className="divide-y divide-[#DED7CD]/50 text-xs">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between">
                <span className="text-[#5E5A54] truncate max-w-[200px]">{item.title} (x{item.quantity})</span>
                <span className="font-bold text-[#171614] tabular-nums">
                  {(item.priceToman * item.quantity).toLocaleString('fa-IR')} تومان
                </span>
              </div>
            ))}
          </div>

          {/* Coupon Entry In Checkout */}
          <div className="pt-2 border-t border-[#DED7CD] space-y-2">
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-[#2F6B51]/10 border border-[#2F6B51]/30 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-[#2F6B51] font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>کوپن {appliedCoupon.code} فعال شد ({appliedCoupon.discountPercent}٪)</span>
                </div>
                {onRemoveCoupon && (
                  <button
                    type="button"
                    onClick={onRemoveCoupon}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline mr-2"
                  >
                    حذف
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value.toUpperCase());
                      setCouponMsg(null);
                    }}
                    placeholder="کد تخفیف داری؟ وارد کن"
                    className="flex-1 px-3 py-2 bg-white border border-[#DED7CD] rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-[#7A5E4D]"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    disabled={!couponCodeInput.trim()}
                    className="px-3 py-2 bg-[#7A5E4D] hover:bg-[#60493C] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    ثبت
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-[11px] font-medium ${couponMsg.isError ? 'text-rose-600' : 'text-[#2F6B51]'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="pt-3 border-t border-[#DED7CD] space-y-2 text-xs">
            <div className="flex justify-between text-[#5E5A54]">
              <span>جمع اقلام:</span>
              <span className="font-semibold text-[#171614] tabular-nums">{subtotal.toLocaleString('fa-IR')} تومان</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#2F6B51] font-bold">
                <span>تخفیف کوپن ({appliedCoupon?.code}):</span>
                <span className="tabular-nums">- {discountAmount.toLocaleString('fa-IR')} تومان</span>
              </div>
            )}
            {physicalItems.length > 0 && (
              <div className="flex justify-between text-[#5E5A54]">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-semibold text-[#171614] tabular-nums">{shipping.toLocaleString('fa-IR')} تومان</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#DED7CD] flex justify-between text-sm font-bold text-[#171614]">
              <span>مبلغ نهایی قابل پرداخت:</span>
              <span className="text-base text-[#7A5E4D] tabular-nums">{total.toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
