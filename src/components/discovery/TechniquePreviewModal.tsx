/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TechniquePreviewModal - Heavy Component Lazy Loaded on Demand in Techniques Hub
 * Quick step-by-step interactive preview for hair styling techniques.
 */

import React from 'react';
import { Technique } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { X, Play, Layers, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';

interface TechniquePreviewModalProps {
  technique: Technique | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDetail: (technique: Technique) => void;
}

export const TechniquePreviewModal: React.FC<TechniquePreviewModalProps> = ({
  technique,
  isOpen,
  onClose,
  onOpenDetail,
}) => {
  if (!isOpen || !technique) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-tech-title"
    >
      <div
        className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] max-w-2xl w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs border border-[#EAE2D5] flex items-center justify-center text-[#59524A] hover:text-[#171614] hover:bg-white transition-colors cursor-pointer shadow-xs"
          aria-label="بستن پیش‌نمایش تکنیک"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Visual Column */}
          <div className="relative">
            <EditorialImage
              src={technique.videoThumbnail}
              alt={technique.name}
              aspectRatio="4:3"
              priority={true}
              categoryLabel="تکنیک آموزشی"
              className="h-full w-full object-cover"
            />
            {technique.videoDurationMinutes && (
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 tabular-nums">
                <Play className="w-3.5 h-3.5 fill-current text-[#C59B63]" />
                <span>{technique.videoDurationMinutes} دقیقه آموزش ویدیویی</span>
              </div>
            )}
          </div>

          {/* Content Column */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#87553B] font-bold uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>سطح {technique.difficulty}</span>
              </div>

              <h2 id="quick-view-tech-title" className="text-xl font-bold text-[#171614] leading-snug">
                {technique.name}
              </h2>

              <p className="mt-2 text-xs text-[#59524A] leading-relaxed">
                {technique.summary}
              </p>

              {/* Steps Overview */}
              <div className="mt-4 space-y-2">
                <span className="text-xs font-bold text-[#171614] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#87553B]" />
                  <span>مراحل اجرای تکنیک ({technique.steps.length} گام):</span>
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {technique.steps.map((st, i) => (
                    <div key={st.number || i} className="text-xs bg-[#FAF7F2] p-2 rounded-lg border border-[#EAE2D5] flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#87553B] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {st.number || i + 1}
                      </span>
                      <p className="text-[#171614] leading-relaxed line-clamp-2">
                        {st.title ? `${st.title}: ` : ''}{st.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetail(technique);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#171614] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#87553B] transition-colors cursor-pointer shadow-xs"
              >
                <span>مشاهده ویدیوی کامل و ابزارهای لازم</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TechniquePreviewModal;
