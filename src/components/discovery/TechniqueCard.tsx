/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TechniqueCard - 4:3 Aspect Ratio Instructional Card
 */

import React from 'react';
import { Technique } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { Play, Wrench, Layers } from 'lucide-react';

interface TechniqueCardProps {
  technique: Technique;
  onSelect: (technique: Technique) => void;
  onQuickView?: (technique: Technique, e: React.MouseEvent) => void;
}

export const TechniqueCard: React.FC<TechniqueCardProps> = ({ technique, onSelect, onQuickView }) => {
  return (
    <article
      onClick={() => onSelect(technique)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(technique);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`تکنیک آموزشی ${technique.name} با ${technique.steps.length} مرحله`}
      className="group bg-[#FFFCF8] rounded-xl overflow-hidden border border-[#EAE2D5] hover:border-[#C59B63]/60 focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#87553B]/10 flex flex-col cursor-pointer"
    >
      <div className="relative overflow-hidden">
        <EditorialImage
          src={technique.videoThumbnail}
          alt={technique.name}
          aspectRatio="4:3"
          sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 400px"
          categoryLabel="تکنیک آموزشی"
          className="group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Video Duration Tag */}
        {technique.videoDurationMinutes && (
          <div className="absolute bottom-2.5 left-3 bg-black/60 backdrop-blur-xs text-white text-xs font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5 tabular-nums">
            <Play className="w-3 h-3 fill-current text-[#C59B63]" />
            <span>{technique.videoDurationMinutes} دقیقه</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata unboxed text */}
          <div className="flex items-center gap-2 text-xs text-[#59524A] mb-1.5">
            <span>سطح {technique.difficulty}</span>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1 tabular-nums">
              <Layers className="w-3.5 h-3.5 text-[#87553B]" />
              <span>{technique.steps.length} مرحله</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-[#171614] group-hover:text-[#87553B] transition-colors leading-snug line-clamp-1">
            {technique.name}
          </h3>

          <p className="mt-1.5 text-xs text-[#59524A] line-clamp-2 leading-relaxed">
            {technique.summary}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EAE2D5]/60 flex items-center justify-between text-xs text-[#59524A]">
          <div className="flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-[#87553B]" />
            <span className="tabular-nums">{technique.toolIds.length} ابزار تخصصی</span>
          </div>

          <div className="flex items-center gap-2">
            {onQuickView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(technique, e);
                }}
                className="text-xs text-[#87553B] bg-[#F4EFE7] hover:bg-[#87553B] hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="مشاهده خلاصه"
              >
                خلاصه
              </button>
            )}
            <span className="text-[#87553B] font-semibold group-hover:underline">
              مشاهده مراحل ←
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
