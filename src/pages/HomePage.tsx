/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HomePage - Screen 01 (Homepage) from UI Workbench Blueprint
 * Hero + 4 Quick Routes + Styles + Techniques + Magazine + Shop + Courses & Instructors
 * Ultra-optimized for mobile screens (<480px) and seamless vertical cadence.
 */

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, BookOpen, ShoppingBag, Layers, MapPin, ArrowLeft, GitFork, Network } from 'lucide-react';
import { StyleModel, Technique, Article, Product, Course } from '../types/domain';
import { StyleCard } from '../components/discovery/StyleCard';
import { TechniqueCard } from '../components/discovery/TechniqueCard';
import { ArticleCard } from '../components/discovery/ArticleCard';
import { ProductCard } from '../components/commerce/ProductCard';
import { CourseCard } from '../components/education/CourseCard';
import { EditorialImage } from '../components/common/EditorialImage';
import { HorizontalCarousel } from '../components/common/HorizontalCarousel';
import { mockCities } from '../data/mockData';

interface HomePageProps {
  styles: StyleModel[];
  techniques: Technique[];
  articles: Article[];
  products: Product[];
  courses: Course[];
  onNavigate: (route: string) => void;
  onSelectStyle: (style: StyleModel) => void;
  onSelectTechnique: (technique: Technique) => void;
  onSelectArticle: (article: Article) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCourse: (course: Course) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onRequestWorkshop: () => void;
  onOpenConsultation?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  styles,
  techniques,
  articles,
  products,
  courses,
  onNavigate,
  onSelectStyle,
  onSelectTechnique,
  onSelectArticle,
  onSelectProduct,
  onSelectCourse,
  onAddToCart,
  onRequestWorkshop,
  onOpenConsultation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Customized Visual Assets from Visual Asset Manager
  const [heroCustomImage, setHeroCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('shanyoon_hero_custom_image') || null;
  });
  const [shopCustomBanner, setShopCustomBanner] = useState<string | null>(() => {
    return localStorage.getItem('shanyoon_shop_custom_banner') || null;
  });
  const [workshopCustomImage, setWorkshopCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('shanyoon_workshop_custom_image') || null;
  });
  const [classicStyleCustomImage, setClassicStyleCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('shanyoon_classic_style_custom_image') || null;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setHeroCustomImage(localStorage.getItem('shanyoon_hero_custom_image') || null);
      setShopCustomBanner(localStorage.getItem('shanyoon_shop_custom_banner') || null);
      setWorkshopCustomImage(localStorage.getItem('shanyoon_workshop_custom_image') || null);
      setClassicStyleCustomImage(localStorage.getItem('shanyoon_classic_style_custom_image') || null);
    };
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('shanyoon_assets_updated', handleUpdate);
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('shanyoon_assets_updated', handleUpdate);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-10 sm:space-y-20 lg:space-y-24 pb-12 sm:pb-20">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: HERO & 4 QUICK DISCOVERY PATHS                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-[#171614] text-white pt-4 pb-8 sm:pt-16 sm:pb-24">
        {/* Subtle background ambient styling with warm golden glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#C59B63_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#C59B63]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#87553B]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-3.5 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Text & Search Column */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C59B63]/20 border border-[#C59B63]/30 text-[#EAE2D5] text-[11px] sm:text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B63] shrink-0" />
                <span className="truncate">آکادمی و مرجع هنر استایلینگ مو گیس‌آرا (GisAra)</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#FFFCF8] leading-[1.25]">
                گیس‌آرا؛ هنر اصیل <span className="text-[#C59B63]">پیرایش و استایل مو</span>
              </h1>

              <p className="text-xs sm:text-base text-stone-300 max-w-xl leading-relaxed">
                از کشف صدها مدل ژورنالی و تکنیک‌های بین‌المللی تا آموزش حرفه‌ای آنلاین، کارگاه‌های عملی در شهرهای مختلف و خرید ابزار استاندارد سالنی.
              </p>

              {/* Prominent Mobile-Tight Search Bar */}
              <form onSubmit={handleSearchSubmit} className="pt-1 sm:pt-2 max-w-xl">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی مدل (اروپایی، خطی...)، تکنیک یا ابزار..."
                    className="w-full pl-22 sm:pl-28 pr-9 sm:pr-12 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/12 backdrop-blur-md border border-stone-600 focus:bg-white/20 text-xs sm:text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#C59B63] focus:ring-1 focus:ring-[#C59B63] transition-all"
                  />
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 absolute right-3 sm:right-4 pointer-events-none" />
                  <button
                    type="submit"
                    className="absolute left-1.5 sm:left-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-l from-[#87553B] to-[#A36D4C] hover:from-[#6E422C] hover:to-[#87553B] text-white text-xs font-bold rounded-lg sm:rounded-xl transition-all duration-300 shadow-md hover:shadow-[#87553B]/40 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    جستجو
                  </button>
                </div>
              </form>
            </div>

            {/* Visual Hero Split Column */}
            <div className="lg:col-span-5 relative mt-2 sm:mt-0">
              <div className="relative mx-auto max-w-[340px] sm:max-w-[420px] rounded-2xl overflow-hidden border border-stone-800 shadow-xl">
                <EditorialImage
                  src={heroCustomImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=85&fm=webp'}
                  alt="شینیون کلاسیک و عروس ژورنالی با خطوط ظریف و تزئینات مروارید"
                  aspectRatio={isMobile ? '16:10' : '4:5'}
                  priority={true}
                  sizes="(max-width: 640px) 340px, 420px"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#171614] via-[#171614]/65 to-transparent p-3.5 sm:p-5 pointer-events-none">
                  <div className="text-[10px] sm:text-xs text-[#C59B63] font-bold">سبک برگزیده ماه</div>
                  <div className="text-xs sm:text-base font-bold text-white mt-0.5 line-clamp-1">
                    شینیون تلفیقی بافت و خطی عروس با مروارید
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Quick Discovery Paths */}
          <div className="mt-6 pt-5 sm:mt-14 sm:pt-10 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate('styles')}
              className="p-3 sm:p-4 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800/90 hover:border-[#C59B63]/40 transition-all duration-350 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 text-right group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C59B63]/15 group-hover:bg-[#C59B63]/25 flex items-center justify-center text-[#C59B63] mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C59B63] transition-colors">
                ژورنال مدل‌ها
              </div>
              <div className="text-[10px] sm:text-xs text-stone-400 mt-0.5 truncate">مشاهده صدها سبک</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="p-3 sm:p-4 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800/90 hover:border-[#C59B63]/40 transition-all duration-350 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 text-right group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C59B63]/15 group-hover:bg-[#C59B63]/25 flex items-center justify-center text-[#C59B63] mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C59B63] transition-colors">
                فروشگاه ابزار
              </div>
              <div className="text-[10px] sm:text-xs text-stone-400 mt-0.5 truncate">خرید ابزار سالنی</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="p-3 sm:p-4 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800/90 hover:border-[#C59B63]/40 transition-all duration-350 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 text-right group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C59B63]/15 group-hover:bg-[#C59B63]/25 flex items-center justify-center text-[#C59B63] mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C59B63] transition-colors">
                دوره‌های آنلاین
              </div>
              <div className="text-[10px] sm:text-xs text-stone-400 mt-0.5 truncate">آموزش تخصصی</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('techniques')}
              className="p-3 sm:p-4 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800/90 hover:border-[#C59B63]/40 transition-all duration-350 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 text-right group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C59B63]/15 group-hover:bg-[#C59B63]/25 flex items-center justify-center text-[#C59B63] mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C59B63] transition-colors">
                بانک تکنیک‌ها
              </div>
              <div className="text-[10px] sm:text-xs text-stone-400 mt-0.5 truncate">آموزش گام‌به‌گام</div>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: CURATED STYLES SHOWCASE (ژورنال جدیدترین مدل‌ها)         */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#87553B] uppercase tracking-wider block">
              ژورنال شنیون مو
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#171614] mt-0.5">
              محبوب‌ترین مدل‌های مو
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('styles')}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#87553B] hover:text-[#6E422C] transition-colors group cursor-pointer shrink-0"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        <HorizontalCarousel colsDesktop={4}>
          {styles.slice(0, 4).map((item) => {
            const displayItem =
              item.id === 'style-1' && classicStyleCustomImage
                ? { ...item, primaryImage: classicStyleCustomImage }
                : item;
            return <StyleCard key={displayItem.id} styleItem={displayItem} onSelect={onSelectStyle} />;
          })}
        </HorizontalCarousel>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* INTERACTIVE STYLE CONSULTATION BANNER (دستیار هوشمند انتخاب شینیون) */}
      {/* ------------------------------------------------------------------ */}
      {onOpenConsultation && (
        <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1C1A17] via-[#2A231C] to-[#171614] border border-[#87553B]/40 p-6 sm:p-10 shadow-xl">
            {/* Background luxury glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#87553B]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-right max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#87553B]/25 border border-[#87553B]/40 text-[#F5E3C9] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B63]" />
                  <span>دستیار هوشمند انتخاب مدل شینیون</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  نمی‌دانید چه شینیونی برازنده چهره شماست؟
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  بر اساس فرم صورت (گرد، بیضی، مربع)، قد و تراکم مو، یقه لباس مجلسی یا عروس، در کمتر از ۱ دقیقه بهترین مدل‌ها، تکنیک‌های زیرسازی و ابزار لازم را کشف کنید.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#87553B] to-[#C59B63] hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#87553B]/30 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                  aria-label="شروع مشاوره تخصصی شینیون"
                >
                  <Sparkles className="w-4 h-4 text-[#F5E3C9]" />
                  <span>شروع رایگان مشاوره هوشمند</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: TECHNIQUES HIGHLIGHT (تکنیک‌های کلیدی شینیون)            */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#87553B] uppercase tracking-wider block">
              آموزش تکنیکال
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#171614] mt-0.5">
              تکنیک‌های گام‌به‌گام
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('techniques')}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#87553B] hover:text-[#6E422C] transition-colors group cursor-pointer shrink-0"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        <HorizontalCarousel colsDesktop={3}>
          {techniques.slice(0, 3).map((tech) => (
            <TechniqueCard key={tech.id} technique={tech} onSelect={onSelectTechnique} />
          ))}
        </HorizontalCarousel>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3.5: TOPICAL AUTHORITY & SEMANTIC GRAPH                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6 [content-visibility:auto] [contain-intrinsic-size:0_400px]">
        <div className="bg-[#FFFCF8] rounded-2xl sm:rounded-3xl p-5 sm:p-10 border border-[#DED7CD] shadow-xs space-y-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#87553B] uppercase tracking-wider block">
              ساختار موضوعی و معماری معنایی
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#171614] mt-0.5">
              درخت دانش و خوشه‌های معنایی گیس‌آرا
            </h2>
            <p className="text-xs sm:text-sm text-[#5E5A54] mt-2 leading-relaxed max-w-3xl">
              در آکادمی گیس‌آرا، هر مدل مو یک هنر تصادفی نیست؛ بلکه محصولی قانونمند از تلفیق تکنیک‌های پایه، متریال سالنی مهندسی‌شده و دانش علمی مدرسین تاییدشده است. روابط معنایی این خوشه‌ها را در زیر دنبال کنید:
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Styles Cluster */}
            <div className="p-5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#87553B]/10 flex items-center justify-center text-[#87553B]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#171614]">۱. خوشه سبک‌های شینیون</h3>
              <p className="text-xs text-[#5E5A54] leading-relaxed">
                دسته‌بندی ژورنالی بر اساس مناسبت‌ها (عروس، مجلسی، فرمالیته) و سطوح سختی. متصل به تکنیک‌های بکاررفته.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('styles')}
                className="text-[11px] font-bold text-[#87553B] hover:text-[#6E422C] flex items-center gap-1 cursor-pointer text-right"
              >
                <span>مشاهده کاتالوگ سبک‌ها</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            {/* Techniques Cluster */}
            <div className="p-5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#167C55]/10 flex items-center justify-center text-[#167C55]">
                <Network className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#171614]">۲. خوشه تکنیک‌های عملی</h3>
              <p className="text-xs text-[#5E5A54] leading-relaxed">
                مراحل گام‌به‌گام ریزتکنیک‌ها مانند وزگیری، لاین‌بندی، زیرسازی پروتز و فر هالیوودی با جزئیات زوایا.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('techniques')}
                className="text-[11px] font-bold text-[#167C55] hover:text-[#0F5A3E] flex items-center gap-1 cursor-pointer text-right"
              >
                <span>مشاهده بانک تکنیک‌ها</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            {/* Products Cluster */}
            <div className="p-5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#C59B63]/10 flex items-center justify-center text-[#C59B63]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#171614]">۳. خوشه محصولات و ابزار</h3>
              <p className="text-xs text-[#5E5A54] leading-relaxed">
                متریال استاندارد موردنیاز برای اجرای پایدار هر مدل (تافت، سنجاق مات، پودر حجم‌دهنده، برس سرامیکی).
              </p>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-[11px] font-bold text-[#C59B63] hover:text-[#A47F4F] flex items-center gap-1 cursor-pointer text-right"
              >
                <span>مشاهده ابزار سالنی</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            {/* Courses Cluster */}
            <div className="p-5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#7A5E4D]/10 flex items-center justify-center text-[#7A5E4D]">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#171614]">۴. خوشه دانش و آموزش</h3>
              <p className="text-xs text-[#5E5A54] leading-relaxed">
                اتصال مستقیم مدل‌ها و تکنیک‌ها به دوره‌های آموزشی ویدیویی و مسترکلاس‌های عملی مدرسین ارشد گیس‌آرا.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('courses')}
                className="text-[11px] font-bold text-[#7A5E4D] hover:text-[#5E4537] flex items-center gap-1 cursor-pointer text-right"
              >
                <span>مشاهده دوره‌های آنلاین</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Semantic Flow Diagram */}
          <div className="p-4 sm:p-6 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-[#171614] flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#87553B]" />
              <span>جریان اجرای یک شینیون اصولی و مهندسی‌شده</span>
            </h3>
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-center">
              <div className="flex-1 p-3 bg-white rounded-lg border border-[#EAE2D5]/70">
                <div className="text-[10px] text-[#87553B] font-bold">گام اول: سبک هدف</div>
                <div className="text-xs font-semibold mt-1">انتخاب مدل (مثلاً کلاسیک اروپایی)</div>
              </div>
              <div className="hidden md:block text-[#DED7CD]">➔</div>
              <div className="flex-1 p-3 bg-white rounded-lg border border-[#EAE2D5]/70">
                <div className="text-[10px] text-[#167C55] font-bold">گام دوم: زنجیره مهارت</div>
                <div className="text-xs font-semibold mt-1">تکنیک وزگیری و لاین‌بندی رگه‌ای</div>
              </div>
              <div className="hidden md:block text-[#DED7CD]">➔</div>
              <div className="flex-1 p-3 bg-white rounded-lg border border-[#EAE2D5]/70">
                <div className="text-[10px] text-[#C59B63] font-bold">گام سوم: ابزار استاندارد</div>
                <div className="text-xs font-semibold mt-1">تافت Silhouette + پودر حجم‌دهنده مات</div>
              </div>
              <div className="hidden md:block text-[#DED7CD]">➔</div>
              <div className="flex-1 p-3 bg-white rounded-lg border border-[#EAE2D5]/70">
                <div className="text-[10px] text-[#7A5E4D] font-bold">گام چهارم: تسلط کامل</div>
                <div className="text-xs font-semibold mt-1">دوره جامع شینیون عروس سارا محمدی</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: CURATED SHOP (فروشگاه تخصصی ابزار و متریال)               */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#87553B] uppercase tracking-wider block">
              تجهیزات سالنی
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#171614] mt-0.5">
              ابزار و متریال حرفه‌ای
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#87553B] hover:text-[#6E422C] transition-colors group cursor-pointer shrink-0"
          >
            <span>ورود به فروشگاه</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Featured Custom Shop Banner if uploaded */}
        {shopCustomBanner && (
          <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden border border-[#EAE2D5] relative h-36 sm:h-64 shadow-xs">
            <img
              src={shopCustomBanner}
              alt="تجهیزات و متریال تخصصی شینیون"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#171614]/85 via-[#171614]/50 to-transparent p-4 sm:p-8 flex flex-col justify-end text-white text-right">
              <span className="text-[11px] sm:text-xs font-bold text-[#C59B63]">ابزار و فیکساتورهای استاندارد</span>
              <h3 className="text-base sm:text-2xl font-bold mt-0.5">تجهیزات تخصصی مورد تأیید مدرسین برتر</h3>
            </div>
          </div>
        )}

        <HorizontalCarousel colsDesktop={4}>
          {products.slice(0, 4).map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </HorizontalCarousel>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5: ONLINE COURSES & ACADEMY BANNER                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6 [content-visibility:auto] [contain-intrinsic-size:0_450px]">
        <div className="bg-[#F4EFE7]/70 rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-[#EAE2D5]">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-8">
            <div>
              <span className="text-[11px] sm:text-xs font-bold text-[#87553B] uppercase tracking-wider block">
                آکادمی تخصصی
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#171614] mt-0.5">
                دوره‌های آموزش آنلاین
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#87553B] hover:text-[#6E422C] transition-colors cursor-pointer shrink-0"
            >
              <span>مشاهده دوره‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <HorizontalCarousel colsDesktop={3}>
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} onSelect={onSelectCourse} />
            ))}
          </HorizontalCarousel>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 6: IN-PERSON CITY WORKSHOP CTA (کارگاه‌های حضوری در شهرها)  */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6 [content-visibility:auto] [contain-intrinsic-size:0_320px]">
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#171614] text-white p-6 sm:p-10 border border-[#C59B63]/30 shadow-xl"
          style={
            workshopCustomImage
              ? {
                  backgroundImage: `url(${workshopCustomImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {/* Subtle Ambient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#171614] via-[#171614]/90 to-[#171614]/75 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Content Text */}
            <div className="space-y-3 text-right max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#F5E3C9] bg-[#87553B]/30 border border-[#C59B63]/30 px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-[#C59B63]" />
                <span>کارگاه‌های حضوری در ۱۶ مرکز استان</span>
              </div>

              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                تکنیک‌ها را زنده و عملی زیر نظر مربی تمرین کنید
              </h2>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                ورکشاپ‌های تخصصی با رفع اشکال مستقیم ۱۰۰٪ تضمینی روی مدل زنده در تهران، اصفهان، شیراز، مشهد، تبریز، اهواز، رشت، کرج و سایر استان‌ها.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={onRequestWorkshop}
                className="px-6 py-3.5 bg-gradient-to-r from-[#87553B] to-[#C59B63] hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer text-center shadow-lg shadow-[#87553B]/30 hover:scale-102 active:scale-98 whitespace-nowrap"
              >
                ثبت درخواست کارگاه در شهر من
              </button>

              <button
                type="button"
                onClick={() => onNavigate('cities')}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-stone-600 hover:border-[#C59B63] text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer text-center active:scale-98 whitespace-nowrap"
              >
                مشاهده همه ۱۶ استان فعال
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 7: EDITORIAL MAGAZINE HIGHLIGHT (مجله و راهنماها)           */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[1240px] mx-auto px-3.5 sm:px-6 space-y-6 [content-visibility:auto] [contain-intrinsic-size:0_450px]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#87553B] uppercase tracking-wider block">
              ژورنالیسم و آکادمی
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#171614] mt-0.5">
              مجله تخصصی و مقالات تحلیلی
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('mag')}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#87553B] hover:text-[#6E422C] transition-colors group cursor-pointer shrink-0"
          >
            <span>مشاهده همه مقالات</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {articles.length > 0 && (
          <div className="space-y-6">
            {/* Lead Featured Magazine Cover */}
            <ArticleCard article={articles[0]} onSelect={onSelectArticle} isFeatured={true} />

            {/* Secondary Articles Carousel */}
            {articles.length > 1 && (
              <HorizontalCarousel colsDesktop={3} variant="secondary">
                {articles.slice(1, 4).map((article) => (
                  <ArticleCard key={article.id} article={article} onSelect={onSelectArticle} />
                ))}
              </HorizontalCarousel>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
