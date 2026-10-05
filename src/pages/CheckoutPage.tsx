/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CheckoutPage - dynamic checkout flow (sign-in -> address -> payment) and unpaid-order retry screen.
 * Totals come from the shared pricing module (identical to what the server charges); nothing here is
 * pre-filled with sample data.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CartItem, UserOrder, Coupon } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { ShieldCheck, ArrowLeft, ArrowRight, CreditCard, Lock, Tag, Truck, Loader2 } from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import { useCartTotals } from '../hooks/useCartTotals';
import { normalizeMobile, normalizePostalCode, toLatinDigits } from '../shared/digits';

interface CheckoutPageProps {
  items: CartItem[];
  isLoggedIn: boolean;
  /** False until the first /auth/me answer arrived; prevents flashing the wrong step. */
  authReady?: boolean;
  userMobile: string;
  onOpenAuth: () => void;
  onOpenCart?: () => void;
  onNavigateHome: () => void;
  onCompleteOrder: (order: UserOrder) => void;
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon?: () => void;
}

type StepId = 'auth' | 'address' | 'pay';
type FieldKey = 'recipientName' | 'recipientMobile' | 'province' | 'city' | 'addressLine' | 'postalCode';

const inputBase =
  'w-full p-2.5 bg-white border rounded-xl text-sm text-[#171614] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A5E4D]/40';

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  isLoggedIn,
  authReady = true,
  userMobile,
  onOpenAuth,
  onOpenCart,
  onNavigateHome,
  onCompleteOrder: _onCompleteOrder,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [addressDone, setAddressDone] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<UserOrder | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const totals = useCartTotals(items, appliedCoupon);
  const physicalItems = items.filter((i) => i.type === 'PHYSICAL_PRODUCT');
  const hasPhysical = physicalItems.length > 0;

  // The account mobile is real data, so it is a safe default for "recipient phone" (still editable).
  useEffect(() => {
    if (userMobile && !recipientMobile) setRecipientMobile(userMobile);
  }, [userMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step is DERIVED, never stored: signing in (even from the modal opened on step 1) or an empty/
  // digital-only cart moves the flow along automatically.
  const stepId: StepId = !isLoggedIn ? 'auth' : hasPhysical && !addressDone ? 'address' : 'pay';
  const steps = useMemo(() => {
    const list: Array<{ id: StepId; label: string }> = [];
    if (!isLoggedIn) list.push({ id: 'auth', label: 'ورود' });
    if (hasPhysical) list.push({ id: 'address', label: 'آدرس تحویل' });
    list.push({ id: 'pay', label: 'پرداخت' });
    return list;
  }, [isLoggedIn, hasPhysical]);
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === stepId));

  // One idempotency key per distinct (cart + coupon + address) payload: a retry or double click
  // re-sends the SAME key, so the server returns the same order instead of reserving stock twice.
  const idemRef = useRef<{ sig: string; key: string } | null>(null);
  const idempotencyKeyFor = (payload: unknown) => {
    const sig = JSON.stringify(payload);
    if (!idemRef.current || idemRef.current.sig !== sig) idemRef.current = { sig, key: newKey() };
    return idemRef.current.key;
  };

  const validateAddress = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (recipientName.trim().length < 2) next.recipientName = 'نام و نام خانوادگی گیرنده را وارد کنید.';
    if (!normalizeMobile(recipientMobile)) next.recipientMobile = 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).';
    if (province.trim().length < 2) next.province = 'استان را وارد کنید.';
    if (city.trim().length < 2) next.city = 'شهر را وارد کنید.';
    if (addressLine.trim().length < 10) next.addressLine = 'نشانی را کامل‌تر (حداقل ۱۰ حرف) بنویسید.';
    if (!normalizePostalCode(postalCode)) next.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Move keyboard / screen-reader focus to the first invalid field.
      const first = (Object.keys(next) as FieldKey[])[0];
      requestAnimationFrame(() => document.getElementById(`ck-${first}`)?.focus());
      return false;
    }
    return true;
  };

  const handleAddressSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (validateAddress()) setAddressDone(true);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || !onApplyCoupon || isApplyingCoupon) return;
    setCouponMsg(null);
    setIsApplyingCoupon(true);
    try {
      const res = await onApplyCoupon(toLatinDigits(couponCodeInput).trim());
      setCouponMsg({ text: res.message, isError: !res.success });
      if (res.success) setCouponCodeInput('');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const goToGateway = (url: string) => {
    // Stay in the "processing" state for the whole navigation: the button must NOT re-enable while the
    // browser is leaving the page, otherwise a second click creates a second order.
    setIsRedirecting(true);
    window.location.href = url;
  };

  const handlePay = async () => {
    if (isProcessing || isRedirecting) return;
    setIsProcessing(true);
    setCheckoutError(null);

    let leaving = false;
    try {
      const shippingInfo = hasPhysical
        ? {
            recipientName: recipientName.trim(),
            recipientMobile: normalizeMobile(recipientMobile),
            province: province.trim(),
            city: city.trim(),
            addressLine: addressLine.trim(),
            postalCode: normalizePostalCode(postalCode),
          }
        : undefined;

      const orderPayload = {
        cartItems: items,
        shippingInfo,
        couponCode: appliedCoupon?.code,
      };

      const res = await ApiClient.submitOrder(orderPayload, idempotencyKeyFor({ i: items.map((x) => [x.id, x.quantity]), c: appliedCoupon?.code, s: shippingInfo }));
      if (!res || !res.order) throw new Error('ساختار پاسخ سفارش نامعتبر است.');

      // The order is PENDING_PAYMENT: nothing is "completed" until the bank confirms (see App.tsx
      // handling of the gateway return). The cart is therefore NOT cleared here.
      let pgRes: any;
      try {
        pgRes = await ApiClient.requestOnlinePayment(res.order.id);
      } catch (payErr: any) {
        pgRes = { message: payErr?.message };
      }
      if (pgRes && pgRes.paymentUrl) {
        leaving = true;
        goToGateway(pgRes.paymentUrl);
        return;
      }

      setCompletedOrder(res.order);
      setCheckoutError(pgRes?.message || 'سفارش شما ثبت شد اما اتصال به درگاه پرداخت برقرار نشد. لطفاً دوباره تلاش کنید.');
    } catch (err: any) {
      setCheckoutError(err?.message || 'ثبت سفارش با خطا مواجه شد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.');
    } finally {
      if (!leaving) setIsProcessing(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!completedOrder || isProcessing || isRedirecting) return;
    setIsProcessing(true);
    setCheckoutError(null);
    let leaving = false;
    try {
      const pgRes = await ApiClient.requestOnlinePayment(completedOrder.id);
      if (pgRes && pgRes.paymentUrl) {
        leaving = true;
        goToGateway(pgRes.paymentUrl);
        return;
      }
      setCheckoutError(pgRes?.message || 'اتصال به درگاه پرداخت هنوز برقرار نشد. لطفاً دوباره تلاش کنید.');
    } catch (err: any) {
      setCheckoutError(err?.message || 'اتصال به درگاه پرداخت با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      if (!leaving) setIsProcessing(false);
    }
  };

  const busy = isProcessing || isRedirecting;
  const payLabel = isRedirecting ? 'در حال انتقال به درگاه…' : isProcessing ? 'در حال ثبت سفارش…' : `پرداخت ${totals.payableToman.toLocaleString('fa-IR')} تومان`;

  // ORDER REGISTERED BUT NOT PAID (payment step failed to start) -------------
  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
          <CreditCard className="w-10 h-10" aria-hidden="true" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-700 block">در انتظار پرداخت</span>
          <h1 className="text-2xl font-bold text-[#171614] mt-1">سفارش شما ثبت شد؛ پرداخت هنوز انجام نشده است</h1>
          <p className="text-xs text-[#5E5A54] mt-2">
            شماره سفارش: <strong className="font-mono text-[#171614] text-sm" dir="ltr">{completedOrder.orderNumber}</strong>
          </p>
        </div>

        {checkoutError && (
          <div role="alert" className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-200 text-xs text-right">
            {checkoutError}
          </div>
        )}

        <div className="p-5 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] text-right text-xs space-y-3 shadow-xs">
          <div className="font-bold text-[#171614] border-b border-[#DED7CD] pb-2">اقلام سفارش (پرداخت‌نشده)</div>
          {completedOrder.items.map((it: CartItem) => (
            <div key={it.id} className="flex justify-between items-center py-1 gap-3">
              <span>{it.title} (×{it.quantity.toLocaleString('fa-IR')})</span>
              <span className="font-bold tabular-nums whitespace-nowrap">{(it.priceToman * it.quantity).toLocaleString('fa-IR')} تومان</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-[#DED7CD] font-bold text-sm">
            <span>مبلغ قابل پرداخت</span>
            <span className="text-[#7A5E4D] tabular-nums">{completedOrder.payableToman.toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={busy}
            aria-busy={busy}
            className="min-h-11 px-6 py-3 bg-[#2F6B51] hover:bg-[#24543F] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isRedirecting ? 'در حال انتقال به درگاه…' : isProcessing ? 'در حال اتصال…' : 'تلاش مجدد برای پرداخت'}
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-11 px-6 py-3 bg-[#171614] hover:bg-[#7A5E4D] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  // EMPTY CART ----------------------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-[#171614]">سبد خرید شما خالی است</h1>
        <p className="text-sm text-[#5E5A54]">برای ادامه، ابتدا محصول یا دوره‌ای به سبد اضافه کنید.</p>
        <button type="button" onClick={onNavigateHome} className="min-h-11 px-6 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">
          بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  const fieldProps = (key: FieldKey) => ({
    id: `ck-${key}`,
    'aria-invalid': errors[key] ? (true as const) : undefined,
    'aria-describedby': errors[key] ? `ck-${key}-err` : undefined,
    className: `${inputBase} ${errors[key] ? 'border-rose-400' : 'border-[#DED7CD]'}`,
  });
  const fieldError = (key: FieldKey) =>
    errors[key] ? (
      <p id={`ck-${key}-err`} role="alert" className="mt-1 text-[11px] text-rose-700">
        {errors[key]}
      </p>
    ) : null;

  const primaryAction =
    stepId === 'auth' ? onOpenAuth : stepId === 'address' ? () => handleAddressSubmit() : handlePay;
  const primaryLabel =
    stepId === 'auth' ? 'ورود یا دریافت کد تأیید' : stepId === 'address' ? 'ادامه: پرداخت' : payLabel;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 lg:pb-10 space-y-8">
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          ...(onOpenCart ? [{ label: 'سبد خرید', onClick: onOpenCart }] : []),
          { label: 'تکمیل سفارش', isCurrent: true },
        ]}
      />

      <h1 className="text-2xl font-bold text-[#171614]">تکمیل سفارش و پرداخت</h1>

      {/* Stepper: only the steps that apply to THIS cart / session */}
      <ol className="flex items-center justify-center gap-2 max-w-md mx-auto text-xs font-bold text-center list-none p-0" aria-label="مراحل سفارش">
        {steps.map((s, i) => {
          const reached = i <= currentIndex;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <li aria-hidden="true" className={`w-10 h-0.5 ${i <= currentIndex ? 'bg-[#7A5E4D]' : 'bg-[#DED7CD]'}`} />}
              <li className={`flex-1 min-w-16 ${reached ? 'text-[#7A5E4D]' : 'text-stone-500'}`} aria-current={i === currentIndex ? 'step' : undefined}>
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${reached ? 'bg-[#7A5E4D] text-white' : 'bg-[#EEE8DF]'}`}>
                  {(i + 1).toLocaleString('fa-IR')}
                </div>
                <span>{s.label}</span>
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#FFFCF8] p-5 sm:p-8 rounded-2xl border border-[#DED7CD] shadow-xs space-y-6">
          {!authReady && (
            <div className="py-10 flex flex-col items-center gap-3 text-xs text-[#5E5A54]" role="status">
              <Loader2 className="w-6 h-6 animate-spin text-[#7A5E4D]" aria-hidden="true" />
              در حال بررسی وضعیت ورود…
            </div>
          )}

          {authReady && stepId === 'auth' && (
            <div className="text-center py-6 space-y-4">
              <Lock className="w-10 h-10 mx-auto text-[#7A5E4D]" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#171614]">برای ادامه با شماره موبایل وارد شوید</h2>
              <p className="text-xs text-[#5E5A54] max-w-sm mx-auto leading-6">
                پیگیری سفارش و فعال‌سازی دوره‌ها به حساب شما وابسته است؛ ورود با یک کد پیامکی چند ثانیه بیشتر زمان نمی‌برد. سبد خرید شما حفظ می‌شود.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden lg:inline-flex min-h-11 items-center px-6 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                ورود یا دریافت کد تأیید
              </button>
            </div>
          )}

          {authReady && stepId === 'address' && (
            <form onSubmit={handleAddressSubmit} noValidate className="space-y-4">
              <h2 className="text-sm font-bold text-[#171614] border-b border-[#DED7CD] pb-2">مشخصات گیرنده و آدرس پستی</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ck-recipientName" className="block text-xs font-semibold text-[#171614] mb-1">نام و نام خانوادگی گیرنده</label>
                  <input {...fieldProps('recipientName')} type="text" autoComplete="name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  {fieldError('recipientName')}
                </div>
                <div>
                  <label htmlFor="ck-recipientMobile" className="block text-xs font-semibold text-[#171614] mb-1">شماره موبایل گیرنده</label>
                  <input {...fieldProps('recipientMobile')} type="tel" inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="09123456789" value={recipientMobile} onChange={(e) => setRecipientMobile(e.target.value)} className={`${fieldProps('recipientMobile').className} text-center`} />
                  {fieldError('recipientMobile')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ck-province" className="block text-xs font-semibold text-[#171614] mb-1">استان</label>
                  <input {...fieldProps('province')} type="text" autoComplete="address-level1" value={province} onChange={(e) => setProvince(e.target.value)} />
                  {fieldError('province')}
                </div>
                <div>
                  <label htmlFor="ck-city" className="block text-xs font-semibold text-[#171614] mb-1">شهر</label>
                  <input {...fieldProps('city')} type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                  {fieldError('city')}
                </div>
              </div>

              <div>
                <label htmlFor="ck-addressLine" className="block text-xs font-semibold text-[#171614] mb-1">نشانی کامل پستی</label>
                <textarea {...fieldProps('addressLine')} rows={3} autoComplete="street-address" placeholder="خیابان، کوچه، پلاک، واحد" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
                {fieldError('addressLine')}
              </div>

              <div>
                <label htmlFor="ck-postalCode" className="block text-xs font-semibold text-[#171614] mb-1">کد پستی ۱۰ رقمی</label>
                <input {...fieldProps('postalCode')} type="text" inputMode="numeric" autoComplete="postal-code" dir="ltr" maxLength={14} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={`${fieldProps('postalCode').className} text-center`} />
                {fieldError('postalCode')}
              </div>

              <div className="pt-2 hidden lg:flex justify-end">
                <button type="submit" className="min-h-11 px-6 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
                  <span>ادامه: پرداخت</span>
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {authReady && stepId === 'pay' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#171614] border-b border-[#DED7CD] pb-2">بررسی نهایی و پرداخت</h2>

              {hasPhysical ? (
                <div className="p-3 bg-[#EEE8DF]/60 rounded-xl text-xs text-[#171614] leading-6 flex gap-2.5">
                  <Truck className="w-4 h-4 mt-1 text-[#7A5E4D] shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-bold">ارسال به: {recipientName.trim()}</div>
                    <div className="text-[#5E5A54] break-words">{province.trim()}، {city.trim()}، {addressLine.trim()}</div>
                    <button type="button" onClick={() => setAddressDone(false)} className="mt-1 text-[#7A5E4D] underline underline-offset-2 cursor-pointer inline-flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      ویرایش آدرس
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs border border-emerald-200">
                  این سفارش فقط شامل دوره آنلاین است؛ آدرس پستی لازم نیست و دسترسی بلافاصله پس از تأیید پرداخت فعال می‌شود.
                </div>
              )}

              <div className="p-3 bg-[#EEE8DF]/50 rounded-xl text-xs text-[#5E5A54] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2F6B51] shrink-0" aria-hidden="true" />
                <span>پس از زدن دکمه پرداخت به درگاه امن بانکی منتقل می‌شوید. اطلاعات کارت شما هرگز در گیس‌آرا ذخیره نمی‌شود.</span>
              </div>

              {checkoutError && (
                <div role="alert" className="p-3 bg-red-50 rounded-xl text-red-800 border border-red-200 text-xs">
                  {checkoutError}
                </div>
              )}

              <div className="pt-2 hidden lg:flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  aria-busy={busy}
                  onClick={handlePay}
                  className="min-h-11 px-6 py-3 bg-[#2F6B51] hover:bg-[#23523e] disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-md"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />}
                  <span>{payLabel}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-5 bg-[#FFFCF8] p-5 sm:p-6 rounded-2xl border border-[#DED7CD] shadow-xs space-y-4" aria-label="خلاصه سفارش">
          <h2 className="text-sm font-bold text-[#171614] border-b border-[#DED7CD] pb-2">خلاصه سفارش</h2>

          <ul className="divide-y divide-[#DED7CD]/50 text-xs list-none p-0 m-0">
            {items.map((item) => (
              <li key={item.id} className="py-2.5 flex justify-between gap-3">
                <span className="text-[#5E5A54] min-w-0 break-words">{item.title} (×{item.quantity.toLocaleString('fa-IR')})</span>
                <span className="font-bold text-[#171614] tabular-nums whitespace-nowrap">{(item.priceToman * item.quantity).toLocaleString('fa-IR')} تومان</span>
              </li>
            ))}
          </ul>

          {/* Coupon: the single place a code can be entered */}
          <div className="pt-2 border-t border-[#DED7CD] space-y-2">
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[#2F6B51]/10 border border-[#2F6B51]/30 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-[#2F6B51] font-bold">
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>کد {appliedCoupon.code} اعمال شد ({appliedCoupon.discountPercent.toLocaleString('fa-IR')}٪)</span>
                </div>
                {onRemoveCoupon && (
                  <button type="button" onClick={onRemoveCoupon} className="min-h-8 px-2 text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer underline">
                    حذف
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <label htmlFor="ck-coupon" className="sr-only">کد تخفیف</label>
                <div className="flex gap-2">
                  <input
                    id="ck-coupon"
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => { setCouponCodeInput(e.target.value.toUpperCase()); setCouponMsg(null); }}
                    placeholder="کد تخفیف دارید؟"
                    autoComplete="off"
                    className="flex-1 min-w-0 px-3 py-2 bg-white border border-[#DED7CD] rounded-xl text-sm font-mono uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A5E4D]/40"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    disabled={!couponCodeInput.trim() || isApplyingCoupon}
                    aria-busy={isApplyingCoupon}
                    className="min-h-10 px-4 py-2 bg-[#7A5E4D] hover:bg-[#60493C] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isApplyingCoupon && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                    اعمال
                  </button>
                </div>
                {couponMsg && (
                  <p role={couponMsg.isError ? 'alert' : 'status'} className={`text-[11px] font-medium ${couponMsg.isError ? 'text-rose-700' : 'text-[#2F6B51]'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </form>
            )}
          </div>

          <dl className="pt-3 border-t border-[#DED7CD] space-y-2 text-xs">
            <div className="flex justify-between text-[#5E5A54]">
              <dt>جمع اقلام</dt>
              <dd className="font-semibold text-[#171614] tabular-nums">{totals.subtotalToman.toLocaleString('fa-IR')} تومان</dd>
            </div>
            {totals.discountToman > 0 && (
              <div className="flex justify-between text-[#2F6B51] font-bold">
                <dt>تخفیف ({appliedCoupon?.code})</dt>
                <dd className="tabular-nums">
                  <bdi>‎−{totals.discountToman.toLocaleString('fa-IR')}</bdi> تومان
                </dd>
              </div>
            )}
            {totals.hasPhysical && (
              <div className="flex justify-between text-[#5E5A54]">
                <dt>هزینه ارسال</dt>
                <dd className="font-semibold text-[#171614] tabular-nums">
                  {totals.shippingToman === 0 ? <span className="text-[#2F6B51]">رایگان</span> : `${totals.shippingToman.toLocaleString('fa-IR')} تومان`}
                </dd>
              </div>
            )}
            {totals.remainingForFreeShippingToman > 0 && (
              <p className="text-[11px] text-[#7A5E4D] bg-[#A98570]/10 rounded-lg px-2.5 py-1.5">
                با {totals.remainingForFreeShippingToman.toLocaleString('fa-IR')} تومان خرید کالای بیشتر، ارسال رایگان می‌شود.
              </p>
            )}
            <div className="pt-2 border-t border-[#DED7CD] flex justify-between text-sm font-bold text-[#171614]">
              <dt>مبلغ قابل پرداخت</dt>
              <dd className="text-base text-[#7A5E4D] tabular-nums">{totals.payableToman.toLocaleString('fa-IR')} تومان</dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Mobile: total + the step's primary action stay reachable without scrolling */}
      {authReady && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-[#FFFCF8]/95 backdrop-blur border-t border-[#DED7CD] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-[#5E5A54]">مبلغ قابل پرداخت</div>
            <div className="text-sm font-bold text-[#7A5E4D] tabular-nums">{totals.payableToman.toLocaleString('fa-IR')} تومان</div>
          </div>
          <button
            type="button"
            onClick={primaryAction}
            disabled={stepId === 'pay' && busy}
            aria-busy={stepId === 'pay' && busy}
            className="flex-1 min-h-12 px-4 bg-[#2F6B51] hover:bg-[#23523e] disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
          >
            {stepId === 'pay' && busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {stepId === 'pay' ? (isRedirecting ? 'در حال انتقال…' : isProcessing ? 'در حال ثبت…' : 'پرداخت') : primaryLabel}
          </button>
        </div>
      )}
    </div>
  );
};
