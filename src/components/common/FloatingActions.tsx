/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FloatingActions - Back to Top & Discreet WhatsApp Support Button
 * Responsive positioning to avoid conflict with Mobile Bottom Navigation.
 */

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface FloatingActionsProps {
  whatsAppNumber?: string;
  defaultMessage?: string;
  onOpenConsultation?: () => void;
  onOpenOrderTracking?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  whatsAppNumber = '989121234567',
  defaultMessage = 'سلام، جهت مشاوره و راهنمایی دوره‌ها و ابزارهای شینیون گیس‌آرا پیام می‌دهم.',
}) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div
      className="fixed z-40 left-4 sm:left-6 bottom-20 md:bottom-6 flex flex-col items-center gap-2.5 transition-all duration-300"
      aria-label="ابزارهای شناور دسترسی سریع"
    >
      {/* 1. Back to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="بازگشت به بالای صفحه"
        title="بازگشت به بالای صفحه"
        className={`w-10 h-10 rounded-full bg-[#1C1A17]/90 text-[#F4EFE7] hover:text-[#C59B63] hover:bg-[#1C1A17] flex items-center justify-center border border-stone-700/60 shadow-lg backdrop-blur-md transition-all duration-300 cursor-pointer group ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
            : 'opacity-0 translate-y-4 pointer-events-none scale-75'
        }`}
      >
        <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>

      {/* 2. Discreet WhatsApp Support Button */}
      <div className="relative flex items-center">
        {isTooltipOpen && (
          <div className="absolute right-full ml-0 mr-3 px-3 py-1.5 bg-[#1C1A17] text-white text-[11px] font-medium rounded-lg shadow-xl border border-stone-700/60 whitespace-nowrap pointer-events-none animate-in fade-in duration-200">
            پشتیبانی در واتساپ
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1C1A17]" />
          </div>
        )}

        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsTooltipOpen(true)}
          onMouseLeave={() => setIsTooltipOpen(false)}
          aria-label="ارتباط و مشاوره در واتساپ"
          title="پشتیبانی واتساپ"
          className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 group border border-emerald-400/30"
        >
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </div>
  );
};
