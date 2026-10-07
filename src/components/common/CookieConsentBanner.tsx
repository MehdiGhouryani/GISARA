/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CookieConsentBanner - Standard & Formal Google-style Cookie Notification
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Check, X } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'gisara_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!savedConsent) {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          accepted,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // Safe context
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300 font-sans">
      <div className="bg-white border border-stone-200 shadow-xl rounded-xl p-4 text-right text-stone-800 space-y-3 dir-rtl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <span>اطلاعیه کوکی‌ها و حریم خصوصی</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </h4>
              <button
                type="button"
                onClick={() => handleConsent(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              این وب‌سایت برای ارائه خدمات بهتر، حفظ نشست‌های امن کاربری و بهبود عملکرد، از کوکی‌ها استفاده می‌کند.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="py-1.5 px-3.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors cursor-pointer"
          >
            رد کوکی‌ها
          </button>
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="py-1.5 px-4 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>پذیرش همه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
