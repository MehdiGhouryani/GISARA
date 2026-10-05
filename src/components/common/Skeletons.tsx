/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Skeletons - High-Performance, Zero-CLS Suspense Loaders
 * Beautiful shimmering placeholders matching GisAra's luxury warm-stone aesthetic.
 */

import React from 'react';

interface CardGridSkeletonProps {
  count?: number;
  aspectRatio?: '4:5' | '4:3' | '1:1';
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  aspectRatio = '4:5',
}) => {
  const aspectClass =
    aspectRatio === '4:5'
      ? 'aspect-[4/5]'
      : aspectRatio === '4:3'
      ? 'aspect-[4/3]'
      : 'aspect-square';

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-label="در حال بارگذاری محتوا..."
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#FFFCF8] rounded-xl overflow-hidden border border-[#EAE2D5] shadow-xs flex flex-col animate-pulse"
        >
          {/* Image placeholder with shimmer */}
          <div className={`w-full ${aspectClass} bg-gradient-to-br from-[#F4EFE7] via-[#EAE2D5] to-[#F4EFE7] relative overflow-hidden`} />

          {/* Text lines placeholder */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-3 bg-[#EAE2D5] rounded-sm w-1/3" />
              <div className="h-4 bg-[#E2D8C9] rounded-sm w-3/4" />
              <div className="h-3 bg-[#EAE2D5] rounded-sm w-full" />
              <div className="h-3 bg-[#EAE2D5] rounded-sm w-2/3" />
            </div>
            <div className="pt-3 border-t border-[#EAE2D5]/60 flex items-center justify-between">
              <div className="h-3 bg-[#EAE2D5] rounded-sm w-1/4" />
              <div className="h-3 bg-[#EAE2D5] rounded-sm w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const DetailHeroSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-[#EAE2D5] rounded-sm w-48" />

      {/* Hero grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-6 aspect-[4/5] sm:aspect-square bg-gradient-to-br from-[#F4EFE7] via-[#EAE2D5] to-[#F4EFE7] rounded-2xl border border-[#EAE2D5]" />
        <div className="lg:col-span-6 space-y-6">
          <div className="h-4 bg-[#EAE2D5] rounded-sm w-32" />
          <div className="h-8 bg-[#E2D8C9] rounded-md w-3/4" />
          <div className="h-4 bg-[#EAE2D5] rounded-sm w-1/2" />
          <div className="space-y-2 pt-4 border-t border-[#EAE2D5]">
            <div className="h-3.5 bg-[#EAE2D5] rounded-sm w-full" />
            <div className="h-3.5 bg-[#EAE2D5] rounded-sm w-5/6" />
            <div className="h-3.5 bg-[#EAE2D5] rounded-sm w-4/6" />
          </div>
          <div className="h-12 bg-[#E2D8C9] rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
};

export const ReviewsSkeleton: React.FC = () => {
  return (
    <div className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-6 sm:p-8 space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE2D5]">
        <div className="space-y-2">
          <div className="h-6 bg-[#E2D8C9] rounded-sm w-48" />
          <div className="h-3.5 bg-[#EAE2D5] rounded-sm w-64" />
        </div>
        <div className="h-10 bg-[#EAE2D5] rounded-xl w-36" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5]/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EAE2D5]" />
                <div className="space-y-1">
                  <div className="h-3.5 bg-[#E2D8C9] rounded-sm w-28" />
                  <div className="h-2.5 bg-[#EAE2D5] rounded-sm w-20" />
                </div>
              </div>
              <div className="h-3 bg-[#EAE2D5] rounded-sm w-16" />
            </div>
            <div className="h-3 bg-[#EAE2D5] rounded-sm w-full" />
            <div className="h-3 bg-[#EAE2D5] rounded-sm w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ModalFallback: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-6 max-w-md w-full shadow-2xl space-y-4 animate-pulse">
        <div className="h-5 bg-[#E2D8C9] rounded-md w-1/2" />
        <div className="h-32 bg-[#F4EFE7] rounded-xl" />
        <div className="space-y-2">
          <div className="h-3 bg-[#EAE2D5] rounded-sm w-full" />
          <div className="h-3 bg-[#EAE2D5] rounded-sm w-3/4" />
        </div>
      </div>
    </div>
  );
};
