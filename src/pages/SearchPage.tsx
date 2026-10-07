/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SearchPage - Smart Fuzzy Live Search Engine
 * Real-time unified search across Styles (مدل‌ها), Techniques (تکنیک‌ها), Products (محصولات), Courses & Articles.
 * Powered by Levenshtein typo-tolerance, Persian character normalization, and multi-field relevance scoring.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Zap,
  SlidersHorizontal,
  ChevronLeft,
  BookOpen,
  ShoppingBag,
  GraduationCap,
  Layers,
  FileText,
} from 'lucide-react';
import { StyleModel, Technique, Article, Product, Course } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import {
  fuzzySearchEntities,
  SearchableEntity,
  ScoredEntity,
} from '../utils/fuzzySearch';

interface SearchPageProps {
  initialQuery?: string;
  allStyles: StyleModel[];
  allTechniques: Technique[];
  allArticles: Article[];
  allProducts: Product[];
  allCourses: Course[];
  onNavigateHome: () => void;
  onSelectStyle: (style: StyleModel) => void;
  onSelectTechnique: (technique: Technique) => void;
  onSelectArticle: (article: Article) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCourse: (course: Course) => void;
}

type CategoryFilter = 'ALL' | 'مدل' | 'تکنیک' | 'محصول' | 'دوره' | 'مقاله';

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  allStyles,
  allTechniques,
  allArticles,
  allProducts,
  allCourses,
  onNavigateHome,
  onSelectStyle,
  onSelectTechnique,
  onSelectArticle,
  onSelectProduct,
  onSelectCourse,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');

  React.useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Convert raw entities into a normalized searchable collection
  const searchableDataset = useMemo<SearchableEntity[]>(() => {
    const dataset: SearchableEntity[] = [];

    // 1. Styles (مدل‌های شینیون)
    allStyles.forEach((s) => {
      dataset.push({
        id: s.id,
        type: 'مدل',
        title: s.name,
        desc: s.summary,
        thumbnail: s.primaryImage,
        badge: s.occasion ? `مناسبت: ${s.occasion}` : undefined,
        tags: [s.occasion, s.difficulty].filter(Boolean) as string[],
        rawItem: s,
      });
    });

    // 2. Techniques (تکنیک‌های آموزشی)
    allTechniques.forEach((t) => {
      dataset.push({
        id: t.id,
        type: 'تکنیک',
        title: t.name,
        desc: t.summary,
        thumbnail: t.videoThumbnail,
        badge: `${t.videoDurationMinutes || 15} دقیقه • درجه ${t.difficulty}`,
        tags: [t.difficulty, 'تکنیک', 'آموزش'],
        rawItem: t,
      });
    });

    // 3. Products (محصولات و ابزارها)
    allProducts.forEach((p) => {
      dataset.push({
        id: p.id,
        type: 'محصول',
        title: p.name,
        desc: `${p.brand} • موجودی: ${p.stock > 0 ? `${p.stock} عدد` : 'ناموجود'} • ${p.priceToman.toLocaleString('fa-IR')} تومان`,
        thumbnail: p.image || p.images?.[0],
        badge: `${p.priceToman.toLocaleString('fa-IR')} تومان`,
        tags: [p.brand, p.category, 'ابزار', 'فروشگاه'],
        rawItem: p,
      });
    });

    // 4. Courses (دوره‌های آموزشی)
    allCourses.forEach((c) => {
      dataset.push({
        id: c.id,
        type: 'دوره',
        title: c.name,
        desc: c.summary,
        thumbnail: c.heroImage,
        badge: c.kind === 'ONLINE' ? 'دوره آنلاین ویدیویی' : 'کارگاه حضوری',
        tags: [c.kind === 'ONLINE' ? 'آنلاین' : 'حضوری', c.level, 'دوره', 'آکادمی'],
        rawItem: c,
      });
    });

    // 5. Articles (مقالات و وبلاگ)
    allArticles.forEach((a) => {
      dataset.push({
        id: a.id,
        type: 'مقاله',
        title: a.title,
        desc: a.summary,
        thumbnail: a.heroImage,
        badge: `${a.readTimeMinutes} دقیقه مطالعه • ${a.category}`,
        tags: [a.category, 'مقاله', 'مجله', 'آموزش'],
        rawItem: a,
      });
    });

    return dataset;
  }, [allStyles, allTechniques, allProducts, allCourses, allArticles]);

  // Real-time Live Fuzzy Search Execution
  const rawResults = useMemo<ScoredEntity[]>(() => {
    if (!query.trim()) return [];
    return fuzzySearchEntities(query, searchableDataset, 30);
  }, [query, searchableDataset]);

  // Category Filter applied to fuzzy results
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'ALL') return rawResults;
    return rawResults.filter((r) => r.type === selectedCategory);
  }, [rawResults, selectedCategory]);

  // Quick stats by category for smart tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: rawResults.length,
      مدل: 0,
      تکنیک: 0,
      محصول: 0,
      دوره: 0,
      مقاله: 0,
    };
    rawResults.forEach((r) => {
      if (counts[r.type] !== undefined) {
        counts[r.type]++;
      }
    });
    return counts;
  }, [rawResults]);

  const handleItemClick = (r: ScoredEntity) => {
    switch (r.type) {
      case 'مدل':
        onSelectStyle(r.rawItem);
        break;
      case 'تکنیک':
        onSelectTechnique(r.rawItem);
        break;
      case 'محصول':
        onSelectProduct(r.rawItem);
        break;
      case 'دوره':
        onSelectCourse(r.rawItem);
        break;
      case 'مقاله':
        onSelectArticle(r.rawItem);
        break;
    }
  };

  // Trending & Recommended Quick Queries
  const trendingQueries = [
    'شینیون خطی عروس',
    'اسپری شاین و فیکساتور',
    'تکنیک کرول مو',
    'شینیون اروپایی باز',
    'پوش دادن اصولی',
    'سشوار حرفه‌ای',
    'بافت هلندی',
  ];

  const categoryIcons: Record<string, any> = {
    مدل: Sparkles,
    تکنیک: Layers,
    محصول: ShoppingBag,
    دوره: GraduationCap,
    مقاله: FileText,
  };

  return (
    <div className="max-w-[1040px] mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6">
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'جستجوی هوشمند در سامانه', isCurrent: true },
        ]}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAE2D5]/70">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C59B63]/15 text-[#87553B] text-xs font-bold mb-1">
            <Zap className="w-3.5 h-3.5 text-[#87553B]" />
            <span>موتور جستجوی فازی زنده (Live Fuzzy Search)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171614]">
            جستجوی هوشمند مدل‌ها، ابزارها و تکنیک‌ها
          </h1>
          <p className="text-xs text-[#59524A] mt-0.5">
            همزمان با تایپ، الگوریتم فازی خطاهای تایپی را پوشش داده و مرتبط‌ترین نتایج را استخراج می‌کند.
          </p>
        </div>

        {query.trim() && (
          <div className="flex items-center gap-1.5 text-xs text-[#87553B] font-bold bg-[#FFFCF8] px-3 py-1.5 rounded-xl border border-[#EAE2D5] shrink-0 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{filteredResults.length} نتیجه یافت شد</span>
          </div>
        )}
      </div>

      {/* Main Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی مدل (خطی، اروپایی، بافت)، نام ابزار، تکنیک، دوره..."
          className="w-full pr-12 pl-12 py-3.5 sm:py-4 bg-[#FFFCF8] border-2 border-[#EAE2D5] focus:border-[#87553B] rounded-2xl text-xs sm:text-sm text-[#171614] placeholder-[#968A7C] focus:outline-none shadow-sm transition-all"
          autoFocus
        />
        <Search className="w-5 h-5 text-[#87553B] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-[#968A7C] hover:text-[#171614] hover:bg-[#F4EFE7] rounded-xl transition-colors cursor-pointer"
            aria-label="پاک کردن متن جستجو"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Keywords Chips (when query is empty or for inspiration) */}
      {!query.trim() && (
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#F4EFE7]/50 border border-[#EAE2D5]/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#87553B]">
            <Sparkles className="w-4 h-4" />
            <span>کلمات کلیدی پرتکرار و پیشنهادی:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingQueries.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 rounded-xl bg-[#FFFCF8] border border-[#EAE2D5] hover:border-[#87553B] hover:bg-[#C59B63]/10 text-xs font-medium text-[#171614] transition-all cursor-pointer shadow-2xs"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Category Filter Tabs (Active when query is typed) */}
      {query.trim().length > 0 && rawResults.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { key: 'ALL', label: 'همه بخش‌ها' },
              { key: 'مدل', label: 'مدل‌ها' },
              { key: 'تکنیک', label: 'تکنیک‌ها' },
              { key: 'محصول', label: 'محصولات' },
              { key: 'دوره', label: 'دوره‌ها' },
              { key: 'مقاله', label: 'مقالات' },
            ] as const
          ).map((tab) => {
            const count = categoryCounts[tab.key] || 0;
            const isSelected = selectedCategory === tab.key;
            if (tab.key !== 'ALL' && count === 0) return null;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#87553B] text-white border-[#87553B] shadow-xs'
                    : 'bg-[#FFFCF8] text-[#59524A] border-[#EAE2D5] hover:bg-[#F4EFE7]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#F4EFE7] text-[#87553B]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results Section */}
      <div>
        {filteredResults.length > 0 ? (
          <div className="space-y-3">
            {filteredResults.map((r) => {
              const Icon = categoryIcons[r.type] || Sparkles;
              const isHighMatch = r.score >= 80;
              const isFuzzyTypo = r.matchQuality === 'FUZZY_TYPO';

              return (
                <div
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleItemClick(r)}
                  className="p-3.5 sm:p-4 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] hover:border-[#87553B] transition-all flex items-center justify-between gap-3 sm:gap-4 cursor-pointer shadow-xs group hover:shadow-md"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Thumbnail if present */}
                    {r.thumbnail ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#EAE2D5]/60">
                        <img
                          src={r.thumbnail}
                          alt={r.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#C59B63]/10 border border-[#C59B63]/20 flex items-center justify-center text-[#87553B] shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                    )}

                    {/* Metadata Column */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-xs font-bold px-2 py-0.5 rounded-md bg-[#C59B63]/15 text-[#87553B] flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <span>{r.type}</span>
                        </span>

                        {isFuzzyTypo && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300/60">
                            تطابق هوشمند
                          </span>
                        )}

                        {isHighMatch && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300/60 hidden sm:inline-block">
                            ارتباط بالا
                          </span>
                        )}

                        {r.badge && (
                          <span className="text-xs text-[#968A7C] font-medium hidden xs:inline-block truncate">
                            {r.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#171614] group-hover:text-[#87553B] transition-colors truncate">
                        {r.title}
                      </h3>

                      <p className="text-xs text-[#59524A] line-clamp-1 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center gap-1 text-xs font-bold text-[#87553B] group-hover:text-[#6E422C] shrink-0 whitespace-nowrap pl-1">
                    <span className="hidden sm:inline">مشاهده جزئیات</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : query.trim() ? (
          <div className="text-center py-14 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-[#87553B]">
              <Search className="w-6 h-6 text-[#968A7C]" />
            </div>
            <p className="text-sm font-bold text-[#171614]">
              نتیجه‌ای برای عبارت «{query}» پیدا نشد.
            </p>
            <p className="text-xs text-[#59524A] max-w-md mx-auto leading-relaxed">
              لطفاً املای کلمه را بررسی کرده یا از کلمات جایگزین مانند «شینیون خطی»، «عروس»، «بافت»، «اسپری» یا «تکنیک» استفاده کنید.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-4 py-2 text-xs font-bold text-[#87553B] bg-[#C59B63]/15 hover:bg-[#C59B63]/25 rounded-xl transition-colors cursor-pointer"
              >
                پاک کردن جستجو و مشاهده پیشنهادات
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
