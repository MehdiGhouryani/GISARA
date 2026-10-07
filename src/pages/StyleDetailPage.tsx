/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StyleDetailPage - Screen 03 (Style Detail) from UI Workbench Blueprint
 * Hero Split 55/45 + Techniques + Required Tools + Related Courses & Articles
 */

import React, { Suspense } from 'react';
import { StyleModel, Technique, Product, Course, Article } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import { Clock, Eye, Sparkles, BookOpen, Wrench, GraduationCap } from 'lucide-react';
import { TechniqueCard } from '../components/discovery/TechniqueCard';
import { ProductCard } from '../components/commerce/ProductCard';
import { CourseCard } from '../components/education/CourseCard';
import { ArticleCard } from '../components/discovery/ArticleCard';
import { ReviewsSkeleton } from '../components/common/Skeletons';

// Performance Optimization: Lazy load heavy interactive reviews module
const ReviewsSection = React.lazy(() =>
  import('../components/common/ReviewsSection').then((m) => ({ default: m.ReviewsSection }))
);

interface StyleDetailPageProps {
  styleItem: StyleModel;
  allTechniques: Technique[];
  allProducts: Product[];
  allCourses: Course[];
  allArticles: Article[];
  onNavigateStyles: () => void;
  onNavigateHome: () => void;
  onSelectTechnique: (technique: Technique) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCourse: (course: Course) => void;
  onSelectArticle: (article: Article) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  currentUserName?: string;
  onToast?: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const StyleDetailPage: React.FC<StyleDetailPageProps> = ({
  styleItem,
  allTechniques,
  allProducts,
  allCourses,
  allArticles,
  onNavigateStyles,
  onNavigateHome,
  onSelectTechnique,
  onSelectProduct,
  onSelectCourse,
  onSelectArticle,
  onAddToCart,
  currentUserName,
  onToast,
}) => {
  const relatedTechniques = allTechniques.filter((t) => styleItem.techniqueIds.includes(t.id));
  const relatedProducts = allProducts.filter((p) => styleItem.productIds.includes(p.id));
  const relatedCourse = allCourses.find((c) => c.id === styleItem.courseId);
  const relatedArticles = allArticles.filter((a) => (styleItem.articleIds || []).includes(a.id));

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 sm:space-y-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'مدل‌های شینیون', onClick: onNavigateStyles },
          { label: styleItem.name, isCurrent: true },
        ]}
      />

      {/* Hero Split 55/45 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Right (Visual in RTL) / Image Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-[#EAE2D5] bg-stone-50 shadow-md">
            <EditorialImage
              src={styleItem.primaryImage}
              alt={styleItem.name}
              aspectRatio="4:5"
              priority={true}
              categoryLabel={styleItem.occasion}
            />
          </div>
          <div className="text-xs text-[#59524A] text-center">
            تصویر ژورنالی اختصاصی گیس‌آرا · ثبت سبک و بافت تارها
          </div>
        </div>

        {/* Left (Text & Meta in RTL) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#87553B] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>شینیون تخصصی {styleItem.occasion}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-[#171614] leading-tight">
              {styleItem.name}
            </h1>

            {/* Unboxed Metadata row */}
            <div className="mt-3 flex items-center gap-4 text-xs text-[#59524A] pb-4 border-b border-[#EAE2D5]/70">
              <div className="flex items-center gap-1.5 tabular-nums">
                <Clock className="w-4 h-4 text-[#87553B]" />
                <span>زمان تقریبی اجرا: {styleItem.approxMinutes} دقیقه</span>
              </div>
              <span aria-hidden="true" className="text-[#EAE2D5]">·</span>
              <span>درجه سختی: {styleItem.difficulty}</span>
              <span aria-hidden="true" className="text-[#EAE2D5]">·</span>
              <div className="flex items-center gap-1 tabular-nums">
                <Eye className="w-4 h-4 text-[#87553B]" />
                <span>{styleItem.viewsCount} بازدید</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3 text-xs sm:text-sm text-[#59524A] leading-relaxed">
            <p className="font-semibold text-[#171614] text-sm sm:text-base">
              {styleItem.summary}
            </p>
            <p>{styleItem.description}</p>
          </div>

          {/* Quick Context Strip */}
          <div className="p-4 bg-[#FFFCF8] rounded-xl border border-[#EAE2D5] space-y-2 text-xs">
            <div className="font-bold text-[#171614]">مناسب برای:</div>
            <div className="text-[#59524A] leading-relaxed">
              عروس‌های سبک اروپایی، مجالس شب، مراسم فرمالیته و بانوانی با موهای متوسط تا بلند.
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: TECHNIQUES USED (تکنیک‌های به کار رفته)                  */}
      {/* ------------------------------------------------------------------ */}
      {relatedTechniques.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[#EAE2D5]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
                <BookOpen className="w-4 h-4" />
                <span>آموزش‌های پایه‌ای</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#171614] mt-1">
                تکنیک‌های لازم برای اجرای این مدل
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedTechniques.map((tech) => (
              <TechniqueCard key={tech.id} technique={tech} onSelect={onSelectTechnique} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: REQUIRED TOOLS & PRODUCTS (ابزارهای موردنیاز)            */}
      {/* ------------------------------------------------------------------ */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[#EAE2D5]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
                <Wrench className="w-4 h-4" />
                <span>متریال سالنی</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#171614] mt-1">
                ابزارها و محصولات موردنیاز برای این مدل
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: RELATED ONLINE COURSE (دوره آموزشی مرتبط)                */}
      {/* ------------------------------------------------------------------ */}
      {relatedCourse && (
        <section className="space-y-6 pt-6 border-t border-[#EAE2D5]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
            <GraduationCap className="w-4 h-4" />
            <span>آکادمی آنلاین</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            دوره آموزشی مرتبط با این سبک
          </h2>

          <div className="max-w-md">
            <CourseCard course={relatedCourse} onSelect={onSelectCourse} />
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: RELATED ARTICLES                                         */}
      {/* ------------------------------------------------------------------ */}
      {relatedArticles.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[#EAE2D5]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            مقالات و راهنماهای مرتبط
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedArticles.map((art) => (
              <ArticleCard key={art.id} article={art} onSelect={onSelectArticle} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5: STYLIST & USER REVIEWS                                   */}
      {/* ------------------------------------------------------------------ */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsSection
          targetId={styleItem.id}
          targetType="STYLE"
          targetTitle={styleItem.name}
          currentUserName={currentUserName}
          onToast={onToast}
        />
      </Suspense>
    </div>
  );
};
