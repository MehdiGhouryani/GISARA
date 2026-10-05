/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TechniquesPage - Screen 04 (Techniques Hub) from UI Workbench Blueprint
 * Performance Optimization: Lazy-loaded interactive technique modal via React.lazy & Suspense
 */

import React, { useState, useMemo, Suspense } from 'react';
import { Technique } from '../types/domain';
import { TechniqueCard } from '../components/discovery/TechniqueCard';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { ModalFallback } from '../components/common/Skeletons';

// Performance Optimization: Lazy loaded interactive technique inspector
const TechniquePreviewModal = React.lazy(() => import('../components/discovery/TechniquePreviewModal'));

interface TechniquesPageProps {
  techniques: Technique[];
  onSelectTechnique: (technique: Technique) => void;
  onNavigateHome: () => void;
}

export const TechniquesPage: React.FC<TechniquesPageProps> = ({
  techniques,
  onSelectTechnique,
  onNavigateHome,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [quickViewTech, setQuickViewTech] = useState<Technique | null>(null);

  const filtered = useMemo(() => {
    if (selectedDifficulty === 'all') return techniques;
    return techniques.filter((t) => t.difficulty === selectedDifficulty);
  }, [techniques, selectedDifficulty]);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'تکنیک‌های آموزشی شینیون', isCurrent: true },
        ]}
      />

      {/* Header */}
      <div>
        <span className="text-xs font-bold text-[#87553B] uppercase tracking-wider block">
          آکادمی و مهارت
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#171614] mt-1">
          تکنیک‌های تخصصی اجرای شینیون
        </h1>
        <p className="text-xs sm:text-sm text-[#59524A] mt-2 max-w-2xl leading-relaxed">
          آموزش گام‌به‌گام ریزتکنیک‌های حیاتی: از نحوه اصولی پوش‌دهی ریشه و زیرسازی با پروتز تا انواع بافت‌های مدرن، بابلیس و خط‌اندازی سه‌بعدی.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#59524A] font-medium">سطح سختی:</span>
        <div className="flex items-center gap-1.5">
          {['all', 'مبتدی', 'متوسط', 'پیشرفته'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedDifficulty(lvl)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedDifficulty === lvl
                  ? 'bg-[#171614] text-white'
                  : 'bg-[#F4EFE7] text-[#171614] hover:bg-[#EAE2D5]'
              }`}
            >
              {lvl === 'all' ? 'همه سطوح' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tech) => (
          <TechniqueCard
            key={tech.id}
            technique={tech}
            onSelect={onSelectTechnique}
            onQuickView={(t) => setQuickViewTech(t)}
          />
        ))}
      </div>

      {/* Lazy-Loaded Technique Preview Modal with Suspense */}
      {quickViewTech && (
        <Suspense fallback={<ModalFallback />}>
          <TechniquePreviewModal
            isOpen={Boolean(quickViewTech)}
            technique={quickViewTech}
            onClose={() => setQuickViewTech(null)}
            onOpenDetail={onSelectTechnique}
          />
        </Suspense>
      )}
    </div>
  );
};
