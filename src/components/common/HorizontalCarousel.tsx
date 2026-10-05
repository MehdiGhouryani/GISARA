/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HorizontalCarousel - Modern Responsive Carousel with Unified GisAra Slider Controls
 */

import React, { useRef, useState, useEffect } from 'react';
import { SliderControl, SliderControlVariant } from './SliderControl';

interface HorizontalCarouselProps {
  children: React.ReactNode[];
  colsDesktop?: 3 | 4;
  variant?: SliderControlVariant;
  className?: string;
  showHelperText?: boolean;
}

export const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({
  children,
  colsDesktop = 4,
  variant = 'secondary',
  className = '',
  showHelperText = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalItems = React.Children.count(children);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth } = el;
    const currentAbs = Math.abs(scrollLeft);
    const index = Math.round(currentAbs / (clientWidth * 0.8));
    setActiveIndex(Math.min(Math.max(0, index), totalItems - 1));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, [totalItems]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.78;
    const offset = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const gridColsClass = colsDesktop === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <div className={`relative group/carousel ${className}`}>
      {/* Slider Control Header for Mobile/Tablet (< lg screens) */}
      <div className="lg:hidden flex items-center justify-between mb-3.5 px-0.5">
        {showHelperText && (
          <div className="text-[11px] font-medium text-[#87553B] flex items-center gap-1.5 dir-rtl">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B63] animate-pulse" />
            <span>برای دیدن سایر موارد ورق بزنید</span>
          </div>
        )}

        <SliderControl
          currentIndex={activeIndex}
          totalItems={totalItems}
          onNext={() => scroll('right')}
          onPrev={() => scroll('left')}
          variant={variant}
          showHelperText={false}
        />
      </div>

      {/* Main Container: Slider on < lg, Grid on >= lg */}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-5 pb-3 pt-1 scrollbar-none scroll-smooth lg:grid ${gridColsClass} lg:overflow-visible lg:pb-0`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {React.Children.map(children, (child, idx) => (
          <div
            key={idx}
            className="shrink-0 w-[82%] sm:w-[48%] md:w-[32%] lg:w-auto snap-start flex flex-col"
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
