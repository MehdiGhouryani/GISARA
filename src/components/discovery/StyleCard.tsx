/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StyleCard - 4:5 Aspect Ratio Editorial Hair Style Card
 * Compliant with Zero-Pill & Metadata Discipline
 */

import React from 'react';
import { StyleModel } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { Clock, Eye } from 'lucide-react';

interface StyleCardProps {
  styleItem: StyleModel;
  onSelect: (style: StyleModel) => void;
  onQuickView?: (style: StyleModel, e: React.MouseEvent) => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ styleItem, onSelect, onQuickView }) => {
  return (
    <article
      onClick={() => onSelect(styleItem)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(styleItem);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`مدل شینیون ${styleItem.name}، مناسب ${styleItem.occasion}`}
      className="group bg-[#FFFCF8] rounded-xl overflow-hidden border border-[#EAE2D5] hover:border-[#C59B63]/60 focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#87553B]/10 flex flex-col cursor-pointer"
    >
      {/* 4:5 Portrait Hair Image */}
      <div className="relative overflow-hidden">
        <EditorialImage
          src={styleItem.primaryImage}
          alt={styleItem.name}
          aspectRatio="4:5"
          sizes="(max-width: 640px) 260px, (max-width: 1024px) 280px, 300px"
          categoryLabel={styleItem.occasion}
          className="group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Subtle Gradient Scrim at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Occasion / Time subtle metadata */}
        <div className="absolute bottom-2.5 right-3 left-3 flex items-center justify-between text-[11px] text-white/90">
          <span className="font-medium bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-sm">
            {styleItem.occasion}
          </span>
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-sm tabular-nums">
            <Clock className="w-3 h-3 text-[#C59B63]" />
            <span>{styleItem.approxMinutes} دقیقه</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata without pills: unboxed with separators */}
          <div className="flex items-center gap-1.5 text-xs text-[#59524A] mb-1.5">
            <span>سطح {styleItem.difficulty}</span>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1 tabular-nums">
              <Eye className="w-3 h-3 text-[#59524A]/70" />
              <span>{styleItem.viewsCount}</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-[#171614] group-hover:text-[#87553B] transition-colors leading-snug line-clamp-1">
            {styleItem.name}
          </h3>

          <p className="mt-1.5 text-xs text-[#59524A] line-clamp-2 leading-relaxed">
            {styleItem.summary}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EAE2D5]/60 flex items-center justify-between text-xs">
          <span className="text-[#87553B] font-semibold group-hover:underline">
            مشاهده جزئیات مدل
          </span>
          {onQuickView ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(styleItem, e);
              }}
              className="text-[11px] text-[#87553B] bg-[#F4EFE7] hover:bg-[#87553B] hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
              title="پیش‌نمایش سریع"
            >
              پیش‌نمایش سریع
            </button>
          ) : (
            <span className="text-[11px] text-[#59524A]/80">
              {styleItem.techniqueIds.length} تکنیک مرتبط
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
