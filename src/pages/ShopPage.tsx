/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ShopPage - Clean, Minimalist, High-Performance Shop Hub
 */

import React, { useState, useMemo, Suspense } from 'react';
import { Product } from '../types/domain';
import { ProductCard } from '../components/commerce/ProductCard';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ModalFallback } from '../components/common/Skeletons';

const ProductQuickViewModal = React.lazy(() => import('../components/commerce/ProductQuickViewModal'));

interface ShopPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onNavigateHome: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onNavigateHome,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULAR'>('POPULAR');
  const [quickViewProd, setQuickViewProd] = useState<Product | null>(null);

  const categories = [
    'تثبیت‌کننده‌ها',
    'گیره و تقسیم‌بندی',
    'کش و سنجاق',
    'ابزار دستی',
    'کیت و ست',
  ];

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchStock = !onlyInStock || p.stock > 0;
      const matchBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      return matchSearch && matchCat && matchStock && matchBrand;
    });

    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => a.priceToman - b.priceToman);
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => b.priceToman - a.priceToman);
    } else if (sortBy === 'POPULAR') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, searchQuery, selectedCategory, onlyInStock, selectedBrand, sortBy]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || onlyInStock || selectedBrand !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setOnlyInStock(false);
    setSelectedBrand('all');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'فروشگاه تخصصی', isCurrent: true },
        ]}
      />

      {/* Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EAE2D5]/70 pb-4">
        <div>
          <span className="text-xs font-bold text-[#87553B] uppercase tracking-wider block">
            فروشگاه تخصصی شینیون
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171614] mt-0.5">
            ابزارها و متریال استاندارد شینیون
          </h1>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#87553B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی ابزار یا برند..."
            className="w-full pl-3 pr-9 py-2 bg-white border border-[#EAE2D5] rounded-xl text-xs text-[#171614] placeholder-[#59524A]/60 focus:outline-none focus:border-[#87553B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Minimal Filter & Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#171614] text-white shadow-2xs'
                : 'bg-white text-[#59524A] border border-[#EAE2D5] hover:border-[#87553B]'
            }`}
          >
            همه ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#87553B] text-white shadow-2xs'
                  : 'bg-white text-[#59524A] border border-[#EAE2D5] hover:border-[#87553B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Options (Brand, Stock, Sort) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#EAE2D5] rounded-lg text-xs text-[#171614] focus:outline-none focus:border-[#87553B]"
          >
            <option value="all">همه برندها</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-[#59524A]">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded text-[#87553B] focus:ring-[#87553B] w-3.5 h-3.5 cursor-pointer"
            />
            <span>موجود در انبار</span>
          </label>

          <div className="flex items-center gap-1 text-xs text-[#59524A]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#87553B]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 bg-white border border-[#EAE2D5] rounded-lg text-xs text-[#171614] focus:outline-none focus:border-[#87553B]"
            >
              <option value="POPULAR">محبوب‌ترین</option>
              <option value="PRICE_ASC">ارزان‌ترین</option>
              <option value="PRICE_DESC">گران‌ترین</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-red-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>حذف فیلتر</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Counter */}
      <div className="text-[11px] text-[#59524A] font-medium flex justify-between items-center pt-1">
        <span>نمایش {filtered.length} محصول</span>
      </div>

      {/* Clean Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
          {filtered.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              onQuickView={(p) => setQuickViewProd(p)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-[#EAE2D5] p-6 space-y-2">
          <p className="text-xs sm:text-sm font-bold text-[#171614]">محصولی با این مشخصات یافت نشد.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 px-4 py-2 bg-[#171614] text-white text-xs font-bold rounded-lg hover:bg-[#87553B] transition-colors cursor-pointer"
          >
            مشاهده همه محصولات
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProd && (
        <Suspense fallback={<ModalFallback />}>
          <ProductQuickViewModal
            isOpen={Boolean(quickViewProd)}
            product={quickViewProd}
            onClose={() => setQuickViewProd(null)}
            onAddToCart={(p, qty) => {
              for (let i = 0; i < qty; i++) {
                onAddToCart(p, { stopPropagation: () => {} } as any);
              }
            }}
            onOpenDetail={onSelectProduct}
          />
        </Suspense>
      )}
    </div>
  );
};
