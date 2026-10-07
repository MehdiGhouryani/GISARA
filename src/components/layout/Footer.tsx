/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Footer Component - Responsive Layout with Mobile-First Accordion & Desktop 4-Column Grid
 * Restored to original version as requested, with support for deep-linking directly to FAQs.
 */

import React, { useState } from 'react';
import { Truck, ShieldCheck, Video, HeartHandshake, ChevronDown, ArrowUp } from 'lucide-react';
import { GisaraEmblem } from '../common/GisaraEmblem';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  // Mobile accordion state for expandable sections
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#141311] text-[#F4EFE7] border-t border-stone-800/80 mt-14 sm:mt-24 pb-28 md:pb-8 w-full overflow-hidden text-right font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TRUST STRIP (Compact 2x2 on Mobile, 4-Col on Desktop)           */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-stone-800/60 w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 rounded-xl bg-stone-900/40 sm:bg-transparent border border-stone-800/40 sm:border-transparent group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-stone-900/90 flex items-center justify-center text-[#C59B63] shrink-0 border border-stone-800 transition-all duration-300 group-hover:border-[#C59B63]/40 group-hover:scale-105">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-xs font-bold text-white transition-colors duration-300 group-hover:text-[#C59B63] truncate">ارسال تخصصی ابزار</h4>
                <p className="text-xs sm:text-xs text-stone-400 mt-0.5 leading-relaxed hidden sm:block">
                  بسته‌بندی استاندارد و ارسال امن
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 rounded-xl bg-stone-900/40 sm:bg-transparent border border-stone-800/40 sm:border-transparent group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-stone-900/90 flex items-center justify-center text-[#C59B63] shrink-0 border border-stone-800 transition-all duration-300 group-hover:border-[#C59B63]/40 group-hover:scale-105">
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-xs font-bold text-white transition-colors duration-300 group-hover:text-[#C59B63] truncate">دسترسی نامحدود</h4>
                <p className="text-xs sm:text-xs text-stone-400 mt-0.5 leading-relaxed hidden sm:block">
                  مشاهده همیشگی دوره‌ها با کیفیت بالا
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 rounded-xl bg-stone-900/40 sm:bg-transparent border border-stone-800/40 sm:border-transparent group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-stone-900/90 flex items-center justify-center text-[#C59B63] shrink-0 border border-stone-800 transition-all duration-300 group-hover:border-[#C59B63]/40 group-hover:scale-105">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-xs font-bold text-white transition-colors duration-300 group-hover:text-[#C59B63] truncate">تضمین اصالت کالا</h4>
                <p className="text-xs sm:text-xs text-stone-400 mt-0.5 leading-relaxed hidden sm:block">
                  محصولات و فیکساتورهای اورجینال سالنی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 rounded-xl bg-stone-900/40 sm:bg-transparent border border-stone-800/40 sm:border-transparent group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-stone-900/90 flex items-center justify-center text-[#C59B63] shrink-0 border border-stone-800 transition-all duration-300 group-hover:border-[#C59B63]/40 group-hover:scale-105">
                <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-xs font-bold text-white transition-colors duration-300 group-hover:text-[#C59B63] truncate">مشاوره و پشتیبانی</h4>
                <p className="text-xs sm:text-xs text-stone-400 mt-0.5 leading-relaxed hidden sm:block">
                  راهنمایی تخصصی انتخاب دوره و ابزار
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAIN FOOTER CONTENT                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        
        {/* ================================================================ */}
        {/* A. MOBILE VIEW (< 768px: Compact Vertical Stack + Accordions)     */}
        {/* ================================================================ */}
        <div className="block md:hidden space-y-6">
          {/* Brand Header & Short Description */}
          <div className="text-right">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#87553B] to-[#381F13] text-white flex items-center justify-center shadow-xs border border-[#C59B63]/30 shrink-0">
                <GisaraEmblem className="w-4.5 h-4.5 text-[#F5E3C9]" size={16} />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight">گیس‌آرا</span>
                <span className="text-xs font-mono text-[#C59B63] font-bold">GisAra</span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              مرجع تخصصی هنر شینیون و استایلینگ مو در ایران؛ ارائه‌دهنده دوره‌های مهارتی سطح استادی و ملزومات حرفه‌ای سالن‌های زیبایی.
            </p>
          </div>

          {/* Collapsible Link Accordions for Mobile */}
          <div className="border-t border-b border-stone-800/80 divide-y divide-stone-800/60">
            {/* Accordion 1: Discovery */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('discovery')}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs font-bold text-[#EAE2D5] hover:text-[#C59B63] transition-colors cursor-pointer"
                aria-expanded={openSection === 'discovery'}
              >
                <span>کشف و ایده‌پردازی شینیون</span>
                <ChevronDown className={`w-4 h-4 text-[#C59B63] transition-transform duration-300 ${openSection === 'discovery' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'discovery' && (
                <ul className="pb-3 pr-2 space-y-1 text-xs text-stone-400 animate-in fade-in duration-200">
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('styles')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      ژورنال مدل‌های شینیون
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('techniques')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      تکنیک‌های گام‌به‌گام
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('mag')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      مجله تخصصی مو و استایل
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('styles')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      شینیون‌های خطی و عروس
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Accordion 2: Education */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('education')}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs font-bold text-[#EAE2D5] hover:text-[#C59B63] transition-colors cursor-pointer"
                aria-expanded={openSection === 'education'}
              >
                <span>آموزش و آکادمی تخصصی</span>
                <ChevronDown className={`w-4 h-4 text-[#C59B63] transition-transform duration-300 ${openSection === 'education' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'education' && (
                <ul className="pb-3 pr-2 space-y-1 text-xs text-stone-400 animate-in fade-in duration-200">
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('courses')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      دوره‌های آنلاین تخصصی
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('instructors')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      مربیان و اساتید تاییدشده
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('cities')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      کارگاه‌های حضوری در شهرها
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('cities')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      درخواست برگزاری ورکشاپ
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Accordion 3: Shop */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('shop')}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs font-bold text-[#EAE2D5] hover:text-[#C59B63] transition-colors cursor-pointer"
                aria-expanded={openSection === 'shop'}
              >
                <span>فروشگاه و ابزار سالنی</span>
                <ChevronDown className={`w-4 h-4 text-[#C59B63] transition-transform duration-300 ${openSection === 'shop' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'shop' && (
                <ul className="pb-3 pr-2 space-y-1 text-xs text-stone-400 animate-in fade-in duration-200">
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      اسپری‌ها و تثبیت‌کننده‌ها
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      سنجاق، گیره و پین مات
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      برس‌ها و ابزارهای حرارتی
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      کیت‌های کامل شینیون‌کاری
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Accordion 4: About & Support */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('support')}
                className="w-full min-h-[44px] py-3 flex items-center justify-between text-xs font-bold text-[#EAE2D5] hover:text-[#C59B63] transition-colors cursor-pointer"
                aria-expanded={openSection === 'support'}
              >
                <span>درباره و پشتیبانی گیس‌آرا</span>
                <ChevronDown className={`w-4 h-4 text-[#C59B63] transition-transform duration-300 ${openSection === 'support' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'support' && (
                <ul className="pb-3 pr-2 space-y-1 text-xs text-stone-400 animate-in fade-in duration-200">
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('about')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      درباره ما و آکادمی
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('faq')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      پرسش‌های متداول (FAQ)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('about')}
                      className="min-h-[40px] w-full flex items-center text-stone-400 hover:text-white transition-colors text-right"
                    >
                      تماس و شعبه مرکزی
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('account')}
                      className="min-h-[40px] w-full flex items-center text-[#C59B63] hover:text-white transition-colors text-right font-medium"
                    >
                      استعلام اصالت گواهینامه هنرجو
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Quick Links Horizontal Pill Strip (RTL Safe) */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 text-xs text-stone-400">
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="min-h-[36px] px-2 flex items-center text-[#C59B63] hover:text-white transition-colors cursor-pointer"
            >
              درباره ما
            </button>
            <span className="text-stone-700">·</span>
            <button
              type="button"
              onClick={() => onNavigate('faq')}
              className="min-h-[36px] px-2 flex items-center text-[#C59B63] hover:text-white transition-colors cursor-pointer"
            >
              پرسش‌های متداول
            </button>
            <span className="text-stone-700">·</span>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="min-h-[36px] px-2 flex items-center text-[#C59B63] hover:text-white transition-colors cursor-pointer"
            >
              تماس با ما
            </button>
          </div>

          {/* Back to Top Dedicated Button for Mobile */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 border border-stone-800 text-xs text-[#EAE2D5] hover:text-[#C59B63] hover:border-[#C59B63]/40 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="بازگشت به ابتدای صفحه"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#C59B63]" />
              <span>بازگشت به بالای صفحه</span>
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* B. TABLET VIEW (768px - 1023px: Balanced Brand Row + 3 Col Links) */}
        {/* ================================================================ */}
        <div className="hidden md:block lg:hidden space-y-8">
          {/* Tablet Brand & Trust Banner */}
          <div className="p-5 rounded-2xl bg-stone-900/40 border border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-lg">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#87553B] to-[#381F13] text-white flex items-center justify-center shadow-xs border border-[#C59B63]/30 shrink-0">
                  <GisaraEmblem className="w-4.5 h-4.5 text-[#F5E3C9]" size={16} />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white tracking-tight">گیس‌آرا</span>
                  <span className="text-xs font-mono text-[#C59B63] font-bold">GisAra</span>
                </div>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                مرجع تخصصی هنر شینیون و استایلینگ مو در ایران؛ ارائه‌دهنده آموزش‌های سطح استادی و ملزومات حرفه‌ای سالن‌های زیبایی.
              </p>
            </div>
            
            {/* Tablet Quick Secondary Action Links */}
            <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('about-contact')}
                className="px-3 py-1.5 rounded-lg bg-stone-800/80 text-[#EAE2D5] hover:text-[#C59B63] hover:bg-stone-800 border border-stone-700/50 transition-colors cursor-pointer"
              >
                درباره ما و شعب
              </button>
              <button
                type="button"
                onClick={() => onNavigate('faq')}
                className="px-3 py-1.5 rounded-lg bg-stone-800/80 text-[#EAE2D5] hover:text-[#C59B63] hover:bg-stone-800 border border-stone-700/50 transition-colors cursor-pointer"
              >
                پرسش‌های متداول
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-l from-[#87553B] to-[#6E422C] text-white font-medium hover:brightness-110 transition-all cursor-pointer shadow-xs"
              >
                تماس و پشتیبانی
              </button>
            </div>
          </div>

          {/* 3 Balanced Link Columns for Tablet */}
          <div className="grid grid-cols-3 gap-6 pt-2">
            {/* Col 1: Discovery */}
            <div>
              <h3 className="text-xs font-bold text-[#C59B63] uppercase tracking-wider mb-4">
                کشف و ایده‌پردازی
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('styles')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    ژورنال مدل‌های شینیون
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('techniques')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    تکنیک‌های گام‌به‌گام
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('mag')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    مجله تخصصی مو و استایل
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('styles')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    شینیون‌های خطی و عروس
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 2: Education */}
            <div>
              <h3 className="text-xs font-bold text-[#C59B63] uppercase tracking-wider mb-4">
                آموزش و آکادمی
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('courses')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    دوره‌های آنلاین تخصصی
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('instructors')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    مربیان و اساتید تاییدشده
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('cities')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    کارگاه‌های حضوری در شهرها
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('about-contact')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    درخواست برگزاری ورکشاپ
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Shop */}
            <div>
              <h3 className="text-xs font-bold text-[#C59B63] uppercase tracking-wider mb-4">
                فروشگاه و ابزار
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    اسپری‌ها و تثبیت‌کننده‌ها
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    سنجاق، گیره و پین مات
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    برس‌ها و ابزارهای حرارتی
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="hover:text-white transition-colors cursor-pointer text-right block w-full"
                  >
                    کیت‌های کامل شینیون‌کاری
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* C. DESKTOP VIEW (>= 1024px: 4-Column Luxury Structured Grid)       */}
        {/* ================================================================ */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column (Col Span 4 in RTL) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#87553B] to-[#381F13] text-white flex items-center justify-center shadow-xs border border-[#C59B63]/30 shrink-0">
                <GisaraEmblem className="w-4.5 h-4.5 text-[#F5E3C9]" size={16} />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-tight">گیس‌آرا</span>
                <span className="text-xs font-mono text-[#C59B63] font-bold">GisAra</span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              مرجع تخصصی هنر شینیون و استایلینگ مو در ایران؛ ارائه‌دهنده تکنیک‌های روز بین‌المللی، آموزش‌های سطح استادی و ملزومات حرفه‌ای سالن‌های زیبایی.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-[#C59B63]/40 transition-colors cursor-pointer"
              >
                درباره ما و شعب
              </button>
              <button
                type="button"
                onClick={() => onNavigate('faq')}
                className="px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-[#C59B63]/40 transition-colors cursor-pointer"
              >
                پرسش‌های متداول
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-[#C59B63] hover:text-white hover:border-[#C59B63]/60 transition-colors cursor-pointer"
              >
                تماس و مشاوره
              </button>
            </div>
          </div>

          {/* Col 1: Discovery (Col Span 3) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold text-[#C59B63] uppercase tracking-wider mb-4">
              کشف و ایده‌پردازی
            </h3>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('styles')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  ژورنال مدل‌های شینیون
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('techniques')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  تکنیک‌های گام‌به‌گام
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('mag')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  مجله تخصصی مو و استایل
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('styles')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  شینیون‌های خطی و عروس
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Education (Col Span 3) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold text-[#C59B63] uppercase tracking-wider mb-4">
              آموزش و آکادمی
            </h3>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('courses')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  دوره‌های آنلاین تخصصی
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('instructors')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  مربیان و اساتید تاییدشده
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('cities')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  کارگاه‌های حضوری در شهرها
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('cities')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  درخواست برگزاری ورکشاپ
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Commerce (Col Span 2) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-[#C59B63] uppercase tracking-wider mb-4">
              فروشگاه و ابزار
            </h3>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  اسپری‌ها و فیکساتورها
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  سنجاق، گیره و پین مات
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  برس‌ها و ابزار حرارتی
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-all duration-300 ease-out cursor-pointer hover:translate-x-[-2px] inline-block text-right"
                >
                  کیت‌های تخصصی سالنی
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* 3. COPYRIGHT & BRAND CREDENTIALS (With Left Floating Safety)     */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-8 sm:mt-12 pt-6 border-t border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 text-center sm:text-right pl-0 md:pl-24">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <p className="leading-relaxed">
              تمامی حقوق مادی و معنوی متعلق به آکادمی تخصصی «گیس‌آرا (GisAra)» است.
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('gisara_cookie_consent_v1');
                window.location.reload();
              }}
              className="text-xs text-[#C59B63] hover:underline cursor-pointer sm:mr-2"
            >
              • تنظیمات حریم خصوصی و کوکی‌ها
            </button>
          </div>
          <div className="flex items-center gap-2 text-stone-400 text-xs shrink-0">
            <span>آکادمی و جامعه شینیون‌کاران حرفه‌ای ایران</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
