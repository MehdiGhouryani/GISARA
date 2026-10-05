/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StylesPage - Screen 02 (Styles Hub) from UI Workbench Blueprint
 */

import React, { useState, useMemo, Suspense } from 'react';
import { StyleModel } from '../types/domain';
import { StyleCard } from '../components/discovery/StyleCard';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Filter, X, Sparkles } from 'lucide-react';
import { ModalFallback } from '../components/common/Skeletons';
import { HorizontalCarousel } from '../components/common/HorizontalCarousel';

// Performance Optimization: Lazy load heavy interactive preview modal via React.lazy
const StyleQuickViewModal = React.lazy(() => import('../components/discovery/StyleQuickViewModal'));

interface StylesPageProps {
  styles: StyleModel[];
  onSelectStyle: (style: StyleModel) => void;
  onNavigateHome: () => void;
  onOpenConsultation?: () => void;
}

export const StylesPage: React.FC<StylesPageProps> = ({
  styles,
  onSelectStyle,
  onNavigateHome,
  onOpenConsultation,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [maxMinutes, setMaxMinutes] = useState<number>(100);
  const [quickViewStyle, setQuickViewStyle] = useState<StyleModel | null>(null);

  const occasions = ['عروس', 'مجلسی', 'نامزدی', 'فرمالیته', 'روزمره'];
  const difficulties = ['مبتدی', 'متوسط', 'پیشرفته'];

  const filteredStyles = useMemo(() => {
    return styles.filter((item) => {
      const matchOccasion = selectedOccasion === 'all' || item.occasion === selectedOccasion;
      const matchDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
      const matchMinutes = item.approxMinutes <= maxMinutes;
      return matchOccasion && matchDifficulty && matchMinutes;
    });
  }, [styles, selectedOccasion, selectedDifficulty, maxMinutes]);

  const hasActiveFilters = selectedOccasion !== 'all' || selectedDifficulty !== 'all' || maxMinutes < 100;

  const resetFilters = () => {
    setSelectedOccasion('all');
    setSelectedDifficulty('all');
    setMaxMinutes(100);
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'ژورنال مدل‌های شینیون', isCurrent: true },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#87553B] uppercase tracking-wider block">
            ژورنال و گالری
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-[#171614] mt-1">
            مدل‌های تخصصی شینیون مو
          </h1>
          <p className="text-xs sm:text-sm text-[#59524A] mt-2 max-w-2xl leading-relaxed">
            مجموعه‌ای از محبوب‌ترین سبک‌های شینیون کلاسیک اروپایی، خطی، بافت و کژوال؛ با تحلیل تکنیک‌ها و ابزارهای موردنیاز برای هر سبک.
          </p>
        </div>

        {onOpenConsultation && (
          <button
            type="button"
            onClick={onOpenConsultation}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#87553B] to-[#C59B63] text-white text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#F5E3C9]" />
            <span>مشاور هوشمند انتخاب مدل (فرم صورت)</span>
          </button>
        )}
      </div>

      {/* Interactive Filters Bar (compliant with frontend-design: buttons with click handlers) */}
      <div className="p-4 sm:p-5 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#171614]">
            <Filter className="w-4 h-4 text-[#87553B]" />
            <span>فیلترهای تخصصی</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#C54636] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>پاک‌کردن فیلترها</span>
            </button>
          )}
        </div>

        {/* Filter Rows */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
          {/* Occasion */}
          <div className="flex items-center gap-2">
            <span className="text-[#59524A] font-medium shrink-0">مناسبت:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedOccasion('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedOccasion === 'all'
                    ? 'bg-[#171614] text-white'
                    : 'bg-[#F4EFE7] text-[#171614] hover:bg-[#EAE2D5]'
                }`}
              >
                همه
              </button>
              {occasions.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setSelectedOccasion(occ)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedOccasion === occ
                      ? 'bg-[#87553B] text-white'
                      : 'bg-[#F4EFE7] text-[#171614] hover:bg-[#EAE2D5]'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-[#59524A] font-medium shrink-0">سطح مهارت:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDifficulty('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedDifficulty === 'all'
                    ? 'bg-[#171614] text-white'
                    : 'bg-[#F4EFE7] text-[#171614] hover:bg-[#EAE2D5]'
                }`}
              >
                همه
              </button>
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-[#87553B] text-white'
                      : 'bg-[#F4EFE7] text-[#171614] hover:bg-[#EAE2D5]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid count summary */}
      <div className="flex items-center justify-between text-xs text-[#59524A]">
        <span>نمایش {filteredStyles.length} مدل از مجموع {styles.length} مدل</span>
      </div>

      {/* Styles Grid */}
      {filteredStyles.length > 0 ? (
        <HorizontalCarousel colsDesktop={4}>
          {filteredStyles.map((item) => (
            <StyleCard
              key={item.id}
              styleItem={item}
              onSelect={onSelectStyle}
              onQuickView={(style) => setQuickViewStyle(style)}
            />
          ))}
        </HorizontalCarousel>
      ) : (
        <div className="text-center py-16 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-6">
          <p className="text-sm font-semibold text-[#171614]">مدلی با فیلترهای انتخابی شما یافت نشد.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-[#171614] text-white text-xs font-semibold rounded-lg hover:bg-[#87553B] cursor-pointer"
          >
            مشاهده همه مدل‌ها
          </button>
        </div>
      )}

      {/* Lazy-Loaded Quick View Modal with Suspense */}
      {quickViewStyle && (
        <Suspense fallback={<ModalFallback />}>
          <StyleQuickViewModal
            isOpen={Boolean(quickViewStyle)}
            styleItem={quickViewStyle}
            onClose={() => setQuickViewStyle(null)}
            onOpenDetail={onSelectStyle}
            onOpenConsultation={onOpenConsultation}
          />
        </Suspense>
      )}
    </div>
  );
};
