/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unified Slider Control System for GisAra
 * 
 * Design Principles:
 * 1. Visual Size ≠ Touch Size: Visual capsule is 160x40 (desktop) / 120x32 (mobile), but touch target is expanded to 44x44px minimum for arrows.
 * 2. Luxury Dark Capsule > Heavy Glassmorphism: Dark semi-opaque background (#171614 / 90%) with subtle golden border (#C59B63/30) for pristine readability on light or dark imagery.
 * 3. Adaptive Pagination: Maximum 5-7 dots visible with sliding window algorithm to handle large datasets cleanly.
 * 4. Three Distinct Variants:
 *    - 'primary': Hero / Workshop / Featured (Prominent luxury capsule)
 *    - 'secondary': Model / Course / Product (Compact section capsule)
 *    - 'minimal': Article / Inside Cards (Minimalist arrows + dots)
 */

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export type SliderControlVariant = 'primary' | 'secondary' | 'minimal';

export interface SliderControlProps {
  currentIndex: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  variant?: SliderControlVariant;
  className?: string;
  showHelperText?: boolean;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  currentIndex,
  totalItems,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  variant = 'secondary',
  className = '',
  showHelperText = false,
}) => {
  // If 1 or 0 items, no need for control bar
  if (totalItems <= 1) return null;

  // 1. Adaptive Pagination Calculation (Max 5 visible dots)
  const MAX_VISIBLE_DOTS = 5;
  let startDot = 0;
  let endDot = totalItems;

  if (totalItems > MAX_VISIBLE_DOTS) {
    const half = Math.floor(MAX_VISIBLE_DOTS / 2);
    if (currentIndex <= half) {
      startDot = 0;
      endDot = MAX_VISIBLE_DOTS;
    } else if (currentIndex >= totalItems - half - 1) {
      startDot = totalItems - MAX_VISIBLE_DOTS;
      endDot = totalItems;
    } else {
      startDot = currentIndex - half;
      endDot = currentIndex + half + 1;
    }
  }

  const visibleDots = Array.from(
    { length: endDot - startDot },
    (_, i) => startDot + i
  );

  // ---------------------------------------------------------------------------
  // VARIANT 1: MINIMAL VARIANT (Articles / Small Cards)
  // ---------------------------------------------------------------------------
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Next Arrow (Right in RTL) */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`relative p-2.5 rounded-full text-[#171614] hover:text-[#87553B] transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]`}
          aria-label="کارت بعدی"
          title="بعدی"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5 px-1 dir-ltr">
          {visibleDots.map((idx) => {
            const isActive = idx === currentIndex;
            return (
              <span
                key={idx}
                className={`transition-all duration-200 rounded-full ${
                  isActive
                    ? 'w-3.5 h-1.5 bg-[#87553B]'
                    : 'w-1.5 h-1.5 bg-[#171614]/20'
                }`}
              />
            );
          })}
        </div>

        {/* Prev Arrow (Left in RTL) */}
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className={`relative p-2.5 rounded-full text-[#171614] hover:text-[#87553B] transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]`}
          aria-label="کارت قبلی"
          title="قبلی"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 2 & 3: PRIMARY & SECONDARY LUXURY DARK CAPSULE
  // ---------------------------------------------------------------------------
  // Visual capsule sizes:
  // Primary: 160x40 (desktop) / 120x32 (mobile)
  // Secondary: 140x36 (desktop) / 116x30 (mobile)
  const capsuleSizeClasses =
    variant === 'primary'
      ? 'h-[32px] sm:h-[40px] px-1 sm:px-1.5 shadow-md border border-[#C59B63]/30 bg-[#171614]/90'
      : 'h-[30px] sm:h-[36px] px-1 shadow-sm border border-[#C59B63]/25 bg-[#171614]/85';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      {showHelperText && (
        <div className="text-xs font-medium text-[#87553B] flex items-center gap-1.5 dir-rtl">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C59B63] animate-pulse" />
          <span>برای دیدن سایر موارد ورق بزنید</span>
        </div>
      )}

      {/* Main Luxury Dark Capsule */}
      <div
        className={`inline-flex items-center justify-between rounded-full backdrop-blur-xs text-white transition-all duration-200 ${capsuleSizeClasses}`}
      >
        {/* Next Arrow (Right in RTL): Visual 24px icon inside 44px hit-target padding */}
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-[#87553B] text-[#F5E3C9] hover:text-white flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer group"
            aria-label="کارت بعدی"
            title="بعدی"
          >
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          {/* Expanded 44x44px Touch Target Overlay */}
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute -inset-2.5 sm:-inset-1.5 min-w-[44px] min-h-[44px] opacity-0 cursor-pointer disabled:pointer-events-none"
          />
        </div>

        {/* Adaptive Dots Indicator */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 dir-ltr">
          {visibleDots.map((idx) => {
            const isActive = idx === currentIndex;
            return (
              <span
                key={idx}
                className={`transition-all duration-200 rounded-full ${
                  isActive
                    ? 'w-3.5 sm:w-4 h-1 sm:h-1.5 bg-gradient-to-r from-[#C59B63] to-[#87553B] shadow-xs'
                    : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/25'
                }`}
              />
            );
          })}
        </div>

        {/* Prev Arrow (Left in RTL): Visual 24px icon inside 44px hit-target padding */}
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-[#87553B] text-[#F5E3C9] hover:text-white flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer group"
            aria-label="کارت قبلی"
            title="قبلی"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          {/* Expanded 44x44px Touch Target Overlay */}
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute -inset-2.5 sm:-inset-1.5 min-w-[44px] min-h-[44px] opacity-0 cursor-pointer disabled:pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
