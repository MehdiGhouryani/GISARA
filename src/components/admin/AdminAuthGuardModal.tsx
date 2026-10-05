/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AdminAuthGuardModal - High-Security Gatekeeper for Operations Console
 * Enforces Passcode verification, rate-limiting, and brute-force lockout.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  checkAdminLockout,
  recordFailedAdminAttempt,
  resetAdminAttempts,
  setAdminAuthenticated,
} from '../../utils/security';
import { ApiClient } from '../../services/apiClient';

interface AdminAuthGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAuditLog?: (action: string, note: string) => void;
}

export const AdminAuthGuardModal: React.FC<AdminAuthGuardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAuditLog,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockout, setLockout] = useState(() => checkAdminLockout());
  const [isVerifying, setIsVerifying] = useState(false);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockout.isLocked && lockout.remainingSeconds > 0) {
      timer = setInterval(() => {
        setLockout((prev) => {
          if (prev.remainingSeconds <= 1) {
            clearInterval(timer);
            return { isLocked: false, remainingSeconds: 0, attemptsLeft: 5 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockout.isLocked, lockout.remainingSeconds]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockout.isLocked) return;

    setErrorMsg(null);
    const trimmed = passcode.trim();

    if (!trimmed) {
      setErrorMsg('لطفاً رمز عبور امنیتی مدیریت را وارد کنید.');
      return;
    }

    setIsVerifying(true);

    try {
      await ApiClient.adminLogin(trimmed);
      setIsVerifying(false);
      resetAdminAttempts();
      setAdminAuthenticated();
      if (onAuditLog) {
        onAuditLog('ADMIN_AUTH_SUCCESS', 'ورود موفق به پنل مدیریت با احراز هویت امنیتی');
      }
      setPasscode('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsVerifying(false);
      
      const updatedStatus = recordFailedAdminAttempt();
      setLockout(updatedStatus);

      if (onAuditLog) {
        onAuditLog('ADMIN_AUTH_FAILED', `تلاش ناموفق برای ورود به پنل مدیریت (${updatedStatus.attemptsLeft} فرصت باقی‌مانده)`);
      }

      if (updatedStatus.isLocked) {
        setErrorMsg('تعداد تلاش‌های ناموفق بیش از حد مجاز بود. به دلایل امنیتی دسترسی به مدت ۳ دقیقه مسدود شد.');
      } else {
        setErrorMsg(err.message || `رمز عبور نادرست است. (${updatedStatus.attemptsLeft} بار دیگر می‌توانید امتحان کنید)`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative bg-[#FFFCF8] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE2D5] z-10 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-guard-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-[#59524A] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
          aria-label="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Shield Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 id="admin-guard-title" className="text-lg font-bold text-[#171614]">
              ورود امن به پنل مدیریت گیس‌آرا
            </h2>
            <p className="text-xs text-[#59524A] mt-1 leading-relaxed">
              این بخش ویژه مدیریت دوره‌ها، انبار، کدهای تخفیف و سفارش‌ها است. لطفاً کلید امنیتی دسترسی را وارد نمایید.
            </p>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {lockout.isLocked ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2 mb-4">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>دسترسی موقتاً مسدود شده است</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              به دلیل ۵ بار تلاش ناموفق پیاپی، دسترسی تا {lockout.remainingSeconds} ثانیه دیگر مسدود است.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#171614] mb-1.5">
                کلید امنیتی مدیریت (Admin Passkey)
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87553B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="رمز عبور مدیریت..."
                  disabled={lockout.isLocked || isVerifying}
                  autoFocus
                  className="w-full pl-10 pr-9 py-2.5 bg-[#FAF7F2] border border-[#EAE2D5] focus:border-[#C59B63] focus:ring-2 focus:ring-[#C59B63]/20 rounded-xl text-sm text-[#171614] transition-all outline-hidden text-left dir-ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7265] hover:text-[#171614] p-0.5 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPasscode ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#7A7265] mt-1.5 flex items-center justify-end">
                <span className="text-[#87553B] font-medium">{lockout.attemptsLeft} فرصت باقی‌مانده</span>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#59524A] hover:bg-[#EAE2D5]/40 rounded-xl border border-[#EAE2D5] transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={lockout.isLocked || isVerifying || !passcode}
                className="flex-1 py-2.5 px-4 bg-[#87553B] hover:bg-[#6e442e] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>بررسی اصالت...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>تأیید و ورود</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-[#EAE2D5] flex items-center justify-center gap-1.5 text-[11px] text-[#7A7265]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>حفاظت امنیتی در برابر Brute-force و مسدودسازی خودکار</span>
        </div>
      </div>
    </div>
  );
};
