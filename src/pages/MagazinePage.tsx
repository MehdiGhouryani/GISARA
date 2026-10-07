/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MagazinePage - High-Fashion Beauty Editorial Hub & Article Reader
 */

import React, { useState } from 'react';
import { Article, StyleModel, Product, Course } from '../types/domain';
import { ArticleCard } from '../components/discovery/ArticleCard';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import { HorizontalCarousel } from '../components/common/HorizontalCarousel';
import { Clock, Sparkles, Wrench, GraduationCap, Share2, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StyleCard } from '../components/discovery/StyleCard';
import { CourseCard } from '../components/education/CourseCard';

interface MagazinePageProps {
  articles: Article[];
  selectedArticle?: Article | null;
  allStyles: StyleModel[];
  allProducts: Product[];
  allCourses: Course[];
  onSelectArticle: (article: Article) => void;
  onClearArticleSelection: () => void;
  onNavigateHome: () => void;
  onSelectStyle: (style: StyleModel) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCourse: (course: Course) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export const MagazinePage: React.FC<MagazinePageProps> = ({
  articles,
  selectedArticle,
  allStyles,
  allProducts,
  allCourses,
  onSelectArticle,
  onClearArticleSelection,
  onNavigateHome,
  onSelectStyle,
  onSelectProduct,
  onSelectCourse,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const categories = ['مراقبت از مو', 'آموزش تخصصی', 'ترندهای فصل', 'راهنمای خرید'];

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW 1: INDIVIDUAL ARTICLE DETAIL READER
  // ---------------------------------------------------------------------------
  if (selectedArticle) {
    const relatedStyles = allStyles.filter((s) => (selectedArticle.relatedStyleIds || []).includes(s.id));
    const relatedProducts = allProducts.filter((p) => (selectedArticle.relatedProductIds || []).includes(p.id));
    const relatedCourse = allCourses.find((c) => c.id === selectedArticle.relatedCourseId);

    return (
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE2D5] pb-4">
          <Breadcrumb
            items={[
              { label: 'صفحه اصلی', onClick: onNavigateHome },
              { label: 'مجله تخصصی', onClick: onClearArticleSelection },
              { label: selectedArticle.title, isCurrent: true },
            ]}
          />

          <button
            type="button"
            onClick={onClearArticleSelection}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87553B] hover:text-[#6E422C] cursor-pointer self-start sm:self-auto"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به آرشیو مقالات</span>
          </button>
        </div>

        {/* Main Editorial Article Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <main className="lg:col-span-8 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE2D5]/60 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
                  <span>دسته‌بندی</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArticle.category}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#59524A]">
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#87553B]" />
                    <span>{selectedArticle.readTimeMinutes} دقیقه زمان مطالعه</span>
                  </div>
                  <span aria-hidden="true" className="text-stone-300">|</span>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-1 text-[#87553B] hover:underline cursor-pointer font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'لینک کپی شد!' : 'اشتراک‌گذاری'}</span>
                  </button>
                </div>
              </div>

              <h1 data-speakable="headline" className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#171614] leading-[1.25]">
                {selectedArticle.title}
              </h1>

              {/* Author & Publication Banner */}
              <div className="pt-4 border-t border-[#EAE2D5] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-[#C59B63]/40 bg-stone-200">
                    <EditorialImage src={selectedArticle.author.avatar} alt={selectedArticle.author.name} aspectRatio="1:1" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#171614]">{selectedArticle.author.name}</div>
                    <div className="text-xs text-[#59524A]">{selectedArticle.author.role}</div>
                  </div>
                </div>

                <div className="text-xs text-[#59524A] tabular-nums bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#EAE2D5]">
                  تاریخ انتشار: {selectedArticle.publishedAt}
                </div>
              </div>
            </header>

            {/* Hero Cover Image */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EAE2D5] shadow-md">
              <EditorialImage src={selectedArticle.heroImage} alt={selectedArticle.title} aspectRatio="16:10" />
            </div>

            {/* Key Takeaways Callout Box */}
            <div className="p-5 sm:p-6 bg-[#FAF7F2] rounded-2xl border border-[#C59B63]/30 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
                <CheckCircle2 className="w-4 h-4 text-[#C59B63]" />
                <span>خلاصه و نکات کلیدی مقاله:</span>
              </div>
              <p data-speakable="summary" className="text-xs sm:text-sm font-medium text-[#171614] leading-relaxed">
                {selectedArticle.summary}
              </p>
            </div>

            {/* Article Content Paragraphs */}
            <div className="prose prose-stone max-w-none text-xs sm:text-base leading-relaxed text-[#171614] space-y-5 speakable-content">
              {selectedArticle.content.split('\n\n').map((para: string, i: number) => (
                <p key={i} className="leading-relaxed text-[#2A231C]">
                  {para}
                </p>
              ))}
            </div>
          </main>

          {/* Contextual Sidebar (4 columns) */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            {relatedStyles.length > 0 && (
              <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#171614]">
                  <Sparkles className="w-4 h-4 text-[#87553B]" />
                  <span>مدل‌های مرتبط معرفی‌شده</span>
                </div>
                <div className="space-y-4">
                  {relatedStyles.map((style) => (
                    <StyleCard key={style.id} styleItem={style} onSelect={onSelectStyle} />
                  ))}
                </div>
              </div>
            )}

            {relatedProducts.length > 0 && (
              <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#171614]">
                  <Wrench className="w-4 h-4 text-[#87553B]" />
                  <span>ابزارهای تاییدشده در مقاله</span>
                </div>
                <div className="space-y-3">
                  {relatedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => onSelectProduct(prod)}
                      className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] flex items-center justify-between gap-3 text-xs hover:border-[#C59B63] transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-[#171614] group-hover:text-[#87553B] line-clamp-1">{prod.name}</div>
                        <div className="text-[#87553B] font-semibold tabular-nums mt-0.5">
                          {prod.priceToman.toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(prod, e);
                        }}
                        className="px-3 py-1.5 bg-[#171614] hover:bg-[#87553B] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
                      >
                        خرید
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedCourse && (
              <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#171614]">
                  <GraduationCap className="w-4 h-4 text-[#87553B]" />
                  <span>دوره آموزشی کامل این تکنیک</span>
                </div>
                <CourseCard course={relatedCourse} onSelect={onSelectCourse} />
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: MAIN MAGAZINE EDITORIAL HUB
  // ---------------------------------------------------------------------------
  const leadArticle = articles.length > 0 ? articles[0] : null;
  const secondaryArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'مجله تخصصی و ژورنال مو', isCurrent: true },
        ]}
      />

      {/* Header Title Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAE2D5] pb-6">
        <div>
          <span className="text-xs font-bold text-[#87553B] uppercase tracking-wider block">
            ژورنالیسم تخصصی شینیون و زیبایی GisAra
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#171614] mt-1">
            مجله و مقالات تحلیلی مو
          </h1>
          <p className="text-xs sm:text-sm text-[#59524A] mt-2 max-w-2xl leading-relaxed">
            راهنماهای جامع علمی، تکنیک‌های آماده‌سازی و زیرسازی مو، مراقبت در اقلیم‌های گوناگون و ترندهای بین‌المللی استایلینگ به قلم اساتید ارشد.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] text-xs font-bold text-[#171614] shrink-0">
          <BookOpen className="w-4 h-4 text-[#C59B63]" />
          <span>مجموعاً {articles.length} مقاله تخصصی</span>
        </div>
      </div>

      {/* Featured Lead Editorial Magazine Cover */}
      {leadArticle && (
        <section className="space-y-3">
          <div className="text-xs font-bold text-[#87553B] uppercase tracking-wider">
            سرمقاله و نوشتار ویژه ماه
          </div>
          <ArticleCard article={leadArticle} onSelect={onSelectArticle} isFeatured={true} />
        </section>
      )}

      {/* Filter Categories Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#EAE2D5]/60 pt-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#171614] text-white shadow-xs'
              : 'bg-[#FFFCF8] text-[#171614] border border-[#EAE2D5] hover:bg-[#FAF7F2]'
          }`}
        >
          همه دسته‌بندی‌ها ({articles.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#87553B] text-white shadow-xs'
                : 'bg-[#FFFCF8] text-[#171614] border border-[#EAE2D5] hover:bg-[#FAF7F2]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid & Responsive Carousel */}
      <section className="space-y-4">
        {filteredArticles.length > 0 ? (
          <HorizontalCarousel colsDesktop={3} variant="secondary">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} onSelect={onSelectArticle} />
            ))}
          </HorizontalCarousel>
        ) : (
          <div className="text-center py-12 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-6">
            <p className="text-sm font-semibold text-[#171614]">مقاله‌ای در این دسته‌بندی یافت نشد.</p>
          </div>
        )}
      </section>
    </div>
  );
};
