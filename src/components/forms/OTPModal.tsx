/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OTPModal - mobile + one-time-code sign-in (no passwords).
 * The resend cooldown, code lifetime and attempt limits are dictated by the SERVER; this component only
 * mirrors them so the person always knows what happens next.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Smartphone, KeyRound, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { digitsOnly, normalizeMobile, toLatinDigits } from '../../shared/digits';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { mobile: string; name: string; userCode?: string }) => void;
}

const CODE_LENGTH = 6;
const DEFAULT_COOLDOWN_SEC = 60;
const DEFAULT_EXPIRY_SEC = 120;

const fmt = (sec: number) => `${Math.floor(sec / 60).toLocaleString('fa-IR')}:${(sec % 60).toString().padStart(2, '0').replace(/\d/g, (d) => Number(d).toLocaleString('fa-IR'))}`;

export const OTPModal: React.FC<OTPModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobileInput, setMobileInput] = useState('');
  const [mobile, setMobile] = useState(''); // normalised, the one the code was sent to
  const [otpCode, setOtpCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  useDialogA11y(isOpen, onClose, panelRef);

  // Nothing of a previous attempt may survive closing the dialog.
  useEffect(() => {
    if (isOpen) return;
    setStep('MOBILE');
    setMobileInput('');
    setMobile('');
    setOtpCode('');
    setResendIn(0);
    setExpiresIn(0);
    setError(null);
    setDevHint(null);
    setIsSending(false);
    setIsVerifying(false);
  }, [isOpen]);

  // One ticking clock for both countdowns.
  useEffect(() => {
    if (step !== 'OTP' || (resendIn <= 0 && expiresIn <= 0)) return;
    const timer = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
      setExpiresIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, resendIn > 0, expiresIn > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const sendCode = async (target: string, isResend: boolean) => {
    setError(null);
    setIsSending(true);
    try {
      const res = await ApiClient.requestOTP(target);
      setMobile(target);
      setStep('OTP');
      setOtpCode('');
      setResendIn(res.cooldownSec ?? DEFAULT_COOLDOWN_SEC);
      setExpiresIn(res.expiresInSec ?? DEFAULT_EXPIRY_SEC);
      // Development only: the server echoes the code in its message so the flow can be tried without an SMS provider.
      setDevHint(import.meta.env.DEV ? res.message || null : null);
      if (isResend) setError(null);
      requestAnimationFrame(() => otpInputRef.current?.focus());
    } catch (err: any) {
      const wait = err?.data?.retryAfterSec;
      if (typeof wait === 'number') {
        // The code we already sent is still valid: go to the code step and show the real remaining wait.
        if (step === 'MOBILE') {
          setMobile(target);
          setStep('OTP');
          requestAnimationFrame(() => otpInputRef.current?.focus());
        }
        setResendIn(wait);
      }
      setError(err?.message || 'ارسال کد انجام نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    const normalized = normalizeMobile(mobileInput);
    if (!normalized) {
      setError('شماره موبایل معتبر نیست. شماره ۱۱ رقمی را با ۰۹ شروع کنید (مثال: ۰۹۱۲۱۲۳۴۵۶۷).');
      return;
    }
    sendCode(normalized, false);
  };

  const verify = async (code: string) => {
    if (isVerifying) return;
    setError(null);
    setIsVerifying(true);
    try {
      const res = await ApiClient.verifyOTP(mobile, code);
      onSuccess({ mobile: res.user.mobile, name: res.user.name, userCode: res.user.userCode });
      onClose();
    } catch (err: any) {
      setIsVerifying(false);
      const reason = err?.data?.reason;
      setError(err?.message || 'کد وارد شده درست نیست.');
      setOtpCode('');
      if (reason === 'expired' || reason === 'locked') setExpiresIn(0);
      requestAnimationFrame(() => otpInputRef.current?.focus());
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== CODE_LENGTH) {
      setError(`کد تأیید ${CODE_LENGTH.toLocaleString('fa-IR')} رقمی است.`);
      return;
    }
    verify(otpCode);
  };

  const handleCodeChange = (value: string) => {
    const digits = digitsOnly(value).slice(0, CODE_LENGTH);
    setOtpCode(digits);
    if (error) setError(null);
    // Typing (or pasting / autofilling) the last digit submits by itself.
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  const codeDead = expiresIn <= 0 && step === 'OTP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs gisara-fade-in" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative bg-[#FFFCF8] rounded-2xl max-w-[400px] w-full p-6 sm:p-8 shadow-2xl border border-[#EAE2D5] z-10 gisara-fade-in focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 start-3 w-11 h-11 flex items-center justify-center text-[#59524A] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F4EFE7] flex items-center justify-center text-[#87553B] mb-3">
            {step === 'MOBILE' ? <Smartphone className="w-6 h-6" aria-hidden="true" /> : <KeyRound className="w-6 h-6" aria-hidden="true" />}
          </div>
          <h2 id="otp-title" className="text-lg font-bold text-[#171614]">
            {step === 'MOBILE' ? 'ورود یا ثبت‌نام در گیس‌آرا' : 'کد تأیید را وارد کنید'}
          </h2>
          <p className="text-xs text-[#59524A] mt-1 leading-6">
            {step === 'MOBILE' ? (
              'برای دسترسی به دوره‌ها، سفارش‌ها و ثبت‌نام کارگاه‌ها، شماره موبایل خود را وارد کنید.'
            ) : (
              <>کد ۶ رقمی پیامک‌شده به شماره <bdi dir="ltr" className="font-semibold tabular-nums">{mobile}</bdi> را وارد کنید.</>
            )}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-[#C54636]/10 text-[#9E3326] text-xs leading-6 rounded-lg border border-[#C54636]/20">
            {error}
          </div>
        )}

        {step === 'MOBILE' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
            <div>
              <label htmlFor="otp-mobile" className="block text-xs font-semibold text-[#171614] mb-1.5">شماره تلفن همراه</label>
              <input
                id="otp-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                placeholder="09121234567"
                value={mobileInput}
                onChange={(e) => { setMobileInput(toLatinDigits(e.target.value)); if (error) setError(null); }}
                aria-invalid={error && step === 'MOBILE' ? true : undefined}
                className="w-full px-4 py-3 bg-white border border-[#EAE2D5] rounded-xl text-center text-base font-semibold tracking-widest text-[#171614] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#87553B]/40"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              aria-busy={isSending}
              className="w-full min-h-12 px-4 bg-[#171614] hover:bg-[#87553B] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
              <span>{isSending ? 'در حال ارسال کد…' : 'دریافت کد تأیید'}</span>
              {!isSending && <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
            <div>
              <label htmlFor="otp-code" className="block text-xs font-semibold text-[#171614] mb-1.5">کد تأیید</label>
              <input
                id="otp-code"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                placeholder="------"
                maxLength={CODE_LENGTH}
                value={otpCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isVerifying}
                aria-invalid={error ? true : undefined}
                className="w-full px-4 py-3 bg-white border border-[#EAE2D5] rounded-xl text-center text-xl font-bold tracking-[0.5em] text-[#171614] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#87553B]/40 disabled:opacity-60"
              />
              {devHint && <p className="mt-2 text-[11px] text-[#59524A] bg-[#F4EFE7] rounded-md px-2 py-1" dir="auto">نسخه توسعه: {devHint}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-[#59524A]" aria-live="polite">
              {resendIn > 0 ? (
                <span className="tabular-nums">ارسال مجدد کد تا {fmt(resendIn)} دیگر</span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendCode(mobile, true)}
                  disabled={isSending}
                  className="min-h-11 text-[#87553B] font-bold hover:underline cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {isSending && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  ارسال مجدد کد
                </button>
              )}

              <button
                type="button"
                onClick={() => { setStep('MOBILE'); setOtpCode(''); setError(null); setDevHint(null); }}
                className="min-h-11 px-1 text-[#59524A] hover:text-[#171614] underline underline-offset-2 cursor-pointer"
              >
                ویرایش شماره
              </button>
            </div>

            {codeDead && !error && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">مهلت این کد تمام شده است؛ کد جدید دریافت کنید.</p>
            )}

            <button
              type="submit"
              disabled={isVerifying || otpCode.length !== CODE_LENGTH}
              aria-busy={isVerifying}
              className="w-full min-h-12 px-4 bg-[#87553B] hover:bg-[#6E422C] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
              <span>{isVerifying ? 'در حال بررسی…' : 'تأیید و ورود'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
