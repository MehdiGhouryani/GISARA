/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MobileNavDrawer - Slide-over navigation for mobile viewports
 * Enhanced with:
 * - Live Mobile Search
 * - Categorized Navigation Groups (Styles, Techniques, Shop, LMS, Workshops)
 * - Support Hotline & Admin Quick-Access
 */

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Sparkles,
  BookOpen,
  GraduationCap,
  Search,
  PhoneCall,
  ShieldCheck,
  Wrench,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { GisaraEmblem } from '../common/GisaraEmblem';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
  onOpenAdmin: () => void;
  onOpenConsultation?: () => void;
  onOpenOrderTracking?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentRoute,
  onOpenAdmin,
  onOpenConsultation,
  onOpenOrderTracking,
}) => {
  const [mobileQuery, setMobileQuery] = useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock background body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const links = [
    { label: 'مدل‌های شینیون مو', route: 'styles', icon: Sparkles, desc: 'ژورنال کامل استایل‌های روز' },
    { label: 'تکنیک‌های آموزشی', route: 'techniques', icon: Layers, desc: 'وزگیری، لاین‌بندی و فونداسیون' },
    { label: 'فروشگاه تخصصی ابزار', route: 'shop', icon: Wrench, desc: 'اسپری‌ها، شانه‌ها و ابزار حرارتی' },
    { label: 'دوره‌های آنلاین LMS', route: 'courses', icon: GraduationCap, desc: 'آموزش گام‌به‌گام با ویدیو و مدرک' },
    { label: 'مجله و مقالات تخصصی', route: 'mag', icon: BookOpen, desc: 'نکات تخصصی و ترندهای ۲۰۲۶' },
    { label: 'پرسش‌های متداول (FAQ)', route: 'faq', icon: HelpCircle, desc: 'پاسخ به سوالات و راهنمای ثبت‌نام' },
  ];

  const handleLinkClick = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileQuery.trim()) return;
    onNavigate(`search?q=${encodeURIComponent(mobileQuery.trim())}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className="mobile-nav-drawer fixed inset-y-0 right-0 max-w-[320px] sm:max-w-[360px] w-full bg-[#FFFCF8] shadow-2xl flex flex-col justify-between overflow-hidden z-10 border-l border-[#EAE2D5] text-right h-full max-h-[100dvh]"
        role="dialog"
        aria-modal="true"
        aria-label="منوی ناوبری اصلی گیس‌آرا"
      >
        {/* 1. Header (Pinned Top) */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2D5]/70 flex items-center justify-between shrink-0 bg-[#FFFCF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#87553B] to-[#4E392E] text-white flex items-center justify-center shadow-xs">
              <GisaraEmblem className="w-4.5 h-4.5 text-[#F5E3C9]" size={18} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-[#171614] leading-tight">گیس‌آرا</span>
                <span className="text-[10px] font-mono font-bold text-[#C59B63]">GisAra</span>
              </div>
              <span className="text-[10px] text-[#87553B] font-bold">آکادمی و مرجع استایل مو</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#59524A] hover:text-[#171614] hover:bg-[#F4EFE7] rounded-xl transition-colors cursor-pointer"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body (Smooth Native Scrolling) */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {/* In-Drawer Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center bg-[#F4EFE7]/80 rounded-xl border border-[#EAE2D5] px-3 py-1.5 focus-within:border-[#87553B] focus-within:bg-[#FFFCF8] transition-colors">
              <Search className="w-4 h-4 text-[#87553B] shrink-0" />
              <input
                type="text"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                placeholder="جستجوی مدل، تکنیک، محصول..."
                className="w-full py-1.5 pr-2 pl-1 text-xs text-[#171614] placeholder-[#968A7C] bg-transparent outline-none"
              />
              {mobileQuery && (
                <button
                  type="button"
                  onClick={() => setMobileQuery('')}
                  className="p-1 text-[#968A7C] hover:text-[#171614] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Nav List */}
          <nav className="space-y-1">
            <p className="text-[11px] font-bold text-[#87553B] px-2 mb-2">دسته‌بندی‌های اصلی</p>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  type="button"
                  onClick={() => handleLinkClick(link.route)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-colors cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-[#F4EFE7] text-[#171614] font-bold shadow-2xs'
                      : 'text-[#59524A] hover:bg-[#F4EFE7]/50 hover:text-[#171614]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-[#87553B] text-white'
                          : 'bg-[#F4EFE7] text-[#87553B]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#171614] truncate">{link.label}</p>
                      <p className="text-[10px] text-[#968A7C] truncate">{link.desc}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#C59B63] shrink-0" />
                </button>
              );
            })}

            {/* Quick Actions: Consultation */}
            <div className="pt-2 space-y-1.5">
              {onOpenConsultation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenConsultation();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#87553B] to-[#C59B63] text-white shadow-xs hover:opacity-95 transition-all cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#F5E3C9]" />
                    <span>مشاور هوشمند انتخاب شینیون</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Admin Console Direct Link */}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold bg-[#C59B63]/15 text-[#87553B] border border-[#C59B63]/30 hover:bg-[#C59B63]/25 transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#87553B]" />
                  <span>کنسول مدیریت و هوش تجاری</span>
                </div>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>

        {/* 3. Footer (Pinned Bottom) */}
        <div className="p-4 border-t border-[#EAE2D5]/70 space-y-2.5 shrink-0 bg-[#FAF7F2]">
          <a
            href="tel:02191015467"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAE2D5]/80 text-xs text-[#59524A] hover:text-[#171614] transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#87553B]" />
              <span className="font-semibold">پشتیبانی تلفنی:</span>
            </div>
            <span className="font-bold tabular-nums dir-ltr text-[#87553B]">۰۲۱-۹۱۰۱۵۴۶۷</span>
          </a>

          <div className="text-[10px] text-[#968A7C] text-center leading-relaxed">
            مرجع تخصصی و آکادمی شینیون مو گیس‌آرا
          </div>
        </div>
      </div>
    </div>
  );
};
