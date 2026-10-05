/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OTPModal - Mobile + OTP Authentication Modal
 * Conforming strictly to Master Invariant: No password field in P0
 */

import React, { useState, useEffect } from 'react';
import { X, Smartphone, KeyRound, ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { mobile: string; name: string }) => void;
}

export const OTPModal: React.FC<OTPModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim();
    if (!/^09[0-9]{9}$/.test(cleanMobile)) {
      setError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۱۲۳۴۵۶۷) وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiClient.requestOTP(cleanMobile);
      setIsSubmitting(false);
      setStep('OTP');
      setCountdown(120);
      if (res.code) {
        setDemoCode(res.code); // Display on-screen for easy demoing
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'خطا در برقراری ارتباط با سرور.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length < 4) {
      setError('کد تأیید معتبر نیست.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiClient.verifyOTP(mobile, otpCode);
      setIsSubmitting(false);
      onSuccess({
        mobile: res.user.mobile,
        name: res.user.name,
      });
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'کد وارد شده صحیح نیست.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div
        className="relative bg-[#FFFCF8] rounded-2xl max-w-[400px] w-full p-6 sm:p-8 shadow-2xl border border-[#EAE2D5] z-10"
        role="dialog"
        aria-modal="true"
        aria-label="ورود یا ثبت‌نام"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-[#59524A] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F4EFE7] flex items-center justify-center text-[#87553B] mb-3">
            {step === 'MOBILE' ? <Smartphone className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold text-[#171614]">
            {step === 'MOBILE' ? 'ورود یا ثبت‌نام در شنیون مو' : 'تأیید شماره موبایل'}
          </h3>
          <p className="text-xs text-[#59524A] mt-1">
            {step === 'MOBILE'
              ? 'برای دسترسی به دوره‌ها، سفارش‌ها و ثبت‌نام کارگاه‌ها شماره خود را وارد کنید.'
              : `کد یک‌بارمصرف ارسال‌شده به شماره ${mobile} را وارد کنید.`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#C54636]/10 text-[#C54636] text-xs rounded-lg border border-[#C54636]/20">
            {error}
          </div>
        )}

        {step === 'MOBILE' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="mobile" className="block text-xs font-semibold text-[#171614] mb-1.5">
                شماره تلفن همراه
              </label>
              <input
                id="mobile"
                type="tel"
                dir="ltr"
                placeholder="09121234567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#EAE2D5] rounded-xl text-center text-sm font-semibold tracking-widest text-[#171614] focus:outline-none focus:border-[#87553B] focus:ring-1 focus:ring-[#87553B]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#171614] hover:bg-[#87553B] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'در حال ارسال کد...' : 'دریافت کد تأیید (پیامک)'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold text-[#171614] mb-1.5">
                کد تأیید پیامک‌شده {demoCode ? <span className="text-[#87553B] font-bold bg-[#87553B]/10 px-2.5 py-0.5 rounded-md">کد دریافت شده: {demoCode}</span> : '(کد نمونه: ۱۲۳۴)'}
              </label>
              <input
                id="otp"
                type="text"
                dir="ltr"
                placeholder="1 2 3 4"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#EAE2D5] rounded-xl text-center text-lg font-bold tracking-widest text-[#171614] focus:outline-none focus:border-[#87553B] focus:ring-1 focus:ring-[#87553B]"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#59524A]">
              {countdown > 0 ? (
                <span className="tabular-nums">
                  ارسال مجدد کد در {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCountdown(120)}
                  className="text-[#87553B] font-bold hover:underline cursor-pointer"
                >
                  ارسال مجدد کد پیامکی
                </button>
              )}

              <button
                type="button"
                onClick={() => setStep('MOBILE')}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                تغییر شماره
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#87553B] hover:bg-[#6E422C] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال بررسی...' : 'تأیید و ورود'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
