/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StyleQuickViewModal - Heavy Component Lazy Loaded on Demand in Styles Hub
 * Provides immediate detailed inspection of styles without full page navigation.
 */

import React from 'react';
import { StyleModel } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { X, Clock, Eye, Sparkles, Check, ArrowRight } from 'lucide-react';

interface StyleQuickViewModalProps {
  styleItem: StyleModel | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDetail: (style: StyleModel) => void;
  onOpenConsultation?: () => void;
}

export const StyleQuickViewModal: React.FC<StyleQuickViewModalProps> = ({
  styleItem,
  isOpen,
  onClose,
  onOpenDetail,
  onOpenConsultation,
}) => {
  if (!isOpen || !styleItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-style-title"
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
          aria-label="بستن پیش‌نمایش"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Visual Column */}
          <div className="relative">
            <EditorialImage
              src={styleItem.primaryImage}
              alt={styleItem.name}
              aspectRatio="4:5"
              priority={true}
              categoryLabel={styleItem.occasion}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#87553B] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>شینیون {styleItem.occasion}</span>
              </div>

              <h2 id="quick-view-style-title" className="text-xl font-bold text-[#171614] leading-snug">
                {styleItem.name}
              </h2>

              <div className="mt-3 flex items-center gap-3 text-xs text-[#59524A] pb-3 border-b border-[#EAE2D5]">
                <span className="font-medium">سطح مهارت: {styleItem.difficulty}</span>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3 text-[#87553B]" />
                  <span>{styleItem.approxMinutes} دقیقه</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1 tabular-nums">
                  <Eye className="w-3 h-3 text-[#59524A]/70" />
                  <span>{styleItem.viewsCount} بازدید</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#59524A] leading-relaxed">
                {styleItem.summary}
              </p>

              {/* Recommended Faces */}
              <div className="mt-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] space-y-1.5">
                <span className="text-xs font-bold text-[#171614] block">
                  سازگار با فرم چهره و مراسم:
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs text-[#87553B]">
                  {['صورت بیضی', 'صورت گرد', 'مراسم رسمی و عروسی', 'لباس یقه باز'].map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#EAE2D5]">
                      <Check className="w-3 h-3 text-emerald-600" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetail(styleItem);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#171614] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#87553B] transition-colors cursor-pointer shadow-xs"
              >
                <span>مشاهده مشخصات کامل و آموزش</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>

              {onOpenConsultation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenConsultation();
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-[#FAF7F2] text-[#87553B] text-xs font-semibold hover:bg-[#EAE2D5] transition-colors cursor-pointer border border-[#EAE2D5]"
                >
                  بررسی هماهنگی با فرم صورت من
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StyleQuickViewModal;
