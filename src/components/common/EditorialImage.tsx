/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EditorialImage - High Performance, Responsive, WebP-Optimized Image Component
 * Features:
 * - IntersectionObserver-based lazy viewport detection + Native loading="lazy" & decoding="async"
 * - Instant LCP optimization: priority={true} bypasses observer with fetchPriority="high" & loading="eager"
 * - Zero CLS (Cumulative Layout Shift) guaranteed through strict aspect-ratio containers
 * - Automatic Responsive WebP srcSet generation (400w, 800w, 1200w)
 * - Shimmer skeleton pulse while loading
 * - Zero-Broken-Image Policy: Elegant Persian aesthetic fallback with high WCAG contrast
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface EditorialImageProps {
  src?: string;
  alt: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '4:5' | '16:10' | '3:4';
  className?: string;
  objectFit?: 'cover' | 'contain';
  categoryLabel?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
}

const aspectRatioClasses = {
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:10': 'aspect-[16/10]',
  '3:4': 'aspect-[3/4]',
};

// Curated high-performance WebP photography for hair styling domain
const ASSET_WEBP_MAP: Record<string, string> = {
  // Styles
  '/assets/styles/classic-european.jpg': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/styles/romantic-textured.jpg': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/styles/braided-french.jpg': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/styles/low-bun.jpg': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/styles/hollywood-waves.jpg': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/styles/minimal-casual.jpg': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80&fm=webp',

  // Products
  '/assets/products/hairspray.jpg': 'https://images.unsplash.com/photo-1608248597359-57753e18a8ea?auto=format&fit=crop&w=800&q=80&fm=webp',
  '/assets/products/hairspray-angle.jpg': 'https://images.unsplash.com/photo-1608248597359-57753e18a8ea?auto=format&fit=crop&w=800&q=80&fm=webp',
  '/assets/products/pins.jpg': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80&fm=webp',
  '/assets/products/brush.jpg': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80&fm=webp',
  '/assets/products/powder.jpg': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80&fm=webp',
  '/assets/products/clips.jpg': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80&fm=webp',

  // Courses
  '/assets/courses/bridal-course.jpg': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/courses/hollywood-course.jpg': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/courses/braids-course.jpg': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=80&fm=webp',

  // Articles
  '/assets/articles/hair-care-guide.jpg': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/articles/bridal-longevity.jpg': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/articles/technique-mistakes.jpg': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80&fm=webp',
  '/assets/articles/pins-guide.jpg': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80&fm=webp',

  // Avatars
  '/assets/avatars/sara-mohammadi.jpg': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80&fm=webp',
  '/assets/avatars/mahsa-kazemi.jpg': 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80&fm=webp',
  '/assets/avatars/niloufar-rad.jpg': 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=600&q=80&fm=webp',
  '/assets/avatars/elham-afshar.jpg': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80&fm=webp',
  '/assets/avatars/author-1.jpg': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80&fm=webp',
  '/assets/avatars/nazanin-ahmadi.jpg': 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80&fm=webp',
  '/assets/avatars/maryam-ghanbari.jpg': 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=600&q=80&fm=webp',
};

// Generates an ultra-compressed AVIF source set for modern browsers
function generateAvifSrcSet(url: string): string | null {
  if (!url) return null;
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=format&fit=crop&w=360&q=70&fm=avif 360w, ${base}?auto=format&fit=crop&w=480&q=75&fm=avif 480w, ${base}?auto=format&fit=crop&w=720&q=75&fm=avif 720w, ${base}?auto=format&fit=crop&w=960&q=80&fm=avif 960w, ${base}?auto=format&fit=crop&w=1200&q=80&fm=avif 1200w`;
  }
  return null;
}

// Generates an optimized WebP source set for Unsplash or WebP images
function generateWebpSrcSet(url: string): string | null {
  if (!url) return null;
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=format&fit=crop&w=360&q=70&fm=webp 360w, ${base}?auto=format&fit=crop&w=480&q=75&fm=webp 480w, ${base}?auto=format&fit=crop&w=720&q=75&fm=webp 720w, ${base}?auto=format&fit=crop&w=960&q=80&fm=webp 960w, ${base}?auto=format&fit=crop&w=1200&q=80&fm=webp 1200w`;
  }
  return null;
}

export const EditorialImage: React.FC<EditorialImageProps> = ({
  src,
  alt,
  aspectRatio = '4:5',
  className = '',
  objectFit = 'cover',
  categoryLabel,
  loading = 'lazy',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}) => {
  // Resolve effective image source (checks curated WebP map if local asset path was passed)
  let resolvedSrc = (src && ASSET_WEBP_MAP[src]) || src || '';
  if (resolvedSrc.startsWith('/assets/')) {
    resolvedSrc = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80&fm=webp';
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  // If priority or eager, consider already in-view
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const [imageError, setImageError] = useState(!resolvedSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lazy loading observer with generous 250px rootMargin for butter-smooth perception
  useEffect(() => {
    if (priority || loading === 'eager' || isInView) return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '250px 0px',
        threshold: 0.01,
      }
    );

    const el = containerRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, loading, isInView]);

  const avifSrcSet = generateAvifSrcSet(resolvedSrc);
  const webpSrcSet = generateWebpSrcSet(resolvedSrc);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#F4EFE7] select-none ${aspectRatioClasses[aspectRatio]} ${className}`}
      role="img"
      aria-label={alt}
    >
      {/* Skeleton Loading Shimmer */}
      {(!isLoaded || !isInView) && !imageError && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-[#F4EFE7] via-[#EAE2D5] to-[#F4EFE7] animate-pulse pointer-events-none"
          aria-hidden="true" 
        />
      )}

      {/* Picture tag with Next-Gen AVIF + WebP sources and Fallback: only rendered when in view */}
      {isInView && !imageError && resolvedSrc ? (
        <picture className="w-full h-full block">
          {avifSrcSet && (
            <source
              type="image/avif"
              srcSet={avifSrcSet}
              sizes={sizes}
            />
          )}
          {webpSrcSet && (
            <source
              type="image/webp"
              srcSet={webpSrcSet}
              sizes={sizes}
            />
          )}
          <img
            src={resolvedSrc}
            alt={alt}
            loading={priority ? 'eager' : loading}
            decoding="async"
            {...(priority ? { fetchPriority: 'high' as const } : {})}
            referrerPolicy="no-referrer"
            className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
          />
        </picture>
      ) : null}

      {/* Styled Fallback Container (Zero-Broken-Image Policy) */}
      {(imageError || (!resolvedSrc && isInView && !isLoaded)) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, #F2ECE3 0%, #E6DED2 50%, #DDD4C6 100%)',
          }}
          aria-hidden="true"
        >
          {/* Subtle decorative hair swirl SVG watermark */}
          <svg
            className="absolute inset-0 w-full h-full opacity-15 stroke-[#C59B63] pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M10,80 Q30,10 60,50 T90,20 M20,95 Q50,30 75,70 T100,40"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />
            <circle cx="50" cy="50" r="30" strokeWidth="0.5" />
          </svg>

          {/* Center visual emblem */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#FFFCF8] shadow-xs flex items-center justify-center text-[#87553B] mb-2 border border-[#EAE2D5]">
              <Sparkles className="w-4 h-4 text-[#87553B]" aria-hidden="true" />
            </div>

            {categoryLabel && (
              <span className="text-xs font-bold tracking-wide text-[#87553B] uppercase mb-1">
                {categoryLabel}
              </span>
            )}

            <p className="text-xs font-semibold text-[#171614] max-w-[85%] line-clamp-2 leading-relaxed">
              {alt}
            </p>
          </div>

          {/* Bottom subtle brand stamp */}
          <span className="absolute bottom-2 text-xs tracking-wider text-[#59524A] font-medium font-sans">
            گیس‌آرا (GisAra) · مرجع موآرایی
          </span>
        </div>
      )}
    </div>
  );
};
