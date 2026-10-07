/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PwaInstallPrompt - In-App Progressive Web App Install Banner & Modal
 * Provides 1-click installation on Android/Chromium/Desktop and guidance for iOS Safari.
 */

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { GisaraEmblem } from './GisaraEmblem';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_STORAGE_KEY = 'gisara_pwa_dismissed_until';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed and running)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check dismissal date
    const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    if (isIosDevice && isSafari) {
      setIsIos(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_STORAGE_KEY, nextWeek.toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Floating Pill Banner */}
      <aside
        aria-label="نصب وب‌اپلیکیشن گیس‌آرا"
        className="fixed bottom-20 md:bottom-5 right-4 left-4 md:right-auto md:left-6 md:max-w-md z-45 bg-[#171614] text-[#F4EFE7] p-3.5 rounded-2xl shadow-2xl border border-[#C59B63]/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#87553B] to-[#4A2D1F] flex items-center justify-center shrink-0 border border-[#C59B63]/50 shadow-inner">
            <GisaraEmblem className="w-6 h-6 text-[#F5E3C9]" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>نصب اپلیکیشن گیس‌آرا</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#87553B] text-white">رایگان</span>
            </div>
            <div className="text-xs text-[#A69B8D] truncate">
              دسترسی سریع و بدون فیلتر به مدل‌ها و آموزش‌ها
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#87553B] to-[#C59B63] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="تایید نصب اپلیکیشن روی گوشی"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نصب</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="بستن اعلان نصب"
            title="بعداً"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* iOS Safari Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div
            className="bg-[#FFFCF8] rounded-2xl max-w-sm w-full p-6 text-right space-y-5 border border-[#EAE2D5] shadow-2xl relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="راهنمای نصب در آیفون"
          >
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 left-4 p-1 text-stone-400 hover:text-stone-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#87553B] text-white flex items-center justify-center shrink-0">
                <GisaraEmblem className="w-7 h-7 text-[#F5E3C9]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#171614]">نصب گیس‌آرا در آیفون (iOS)</h3>
                <p className="text-xs text-[#59524A]">بدون نیاز به اپ‌استور در ۲ گام ساده</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#171614] bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE2D5]">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#87553B] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ۱
                </div>
                <div className="leading-relaxed">
                  در پایین صفحه مرورگر Safari، روی آیکون <strong>اشتراک‌گذاری (Share)</strong>
                  <Share className="inline-block w-4 h-4 mx-1 text-[#87553B]" />
                  بزنید.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#87553B] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ۲
                </div>
                <div className="leading-relaxed">
                  منو را کمی بالا بکشید و گزینه <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong>
                  <PlusSquare className="inline-block w-4 h-4 mx-1 text-[#87553B]" />
                  را انتخاب کنید.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosModal(false);
                setShowBanner(false);
              }}
              className="w-full py-2.5 bg-[#87553B] hover:bg-[#724530] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              متوجه شدم، تشکر
            </button>
          </div>
        </div>
      )}
    </>
  );
};
