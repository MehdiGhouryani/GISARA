/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProductDetailPage - Screen 08 (Product Detail) from UI Workbench Blueprint
 * Contiguous Purchase Module + Specifications + Kit Contents + Related Styles
 */

import React, { useState, Suspense } from 'react';
import { Product, StyleModel } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import { ShoppingBag, Star, ShieldCheck, Truck, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { StyleCard } from '../components/discovery/StyleCard';
import { ReviewsSkeleton } from '../components/common/Skeletons';

// Performance Optimization: Lazy load heavy interactive reviews module
const ReviewsSection = React.lazy(() =>
  import('../components/common/ReviewsSection').then((m) => ({ default: m.ReviewsSection }))
);

interface ProductDetailPageProps {
  product: Product;
  allStyles: StyleModel[];
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onSelectStyle: (style: StyleModel) => void;
  onAddToCartWithQty: (product: Product, quantity: number) => void;
  currentUserName?: string;
  onToast?: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allStyles,
  onNavigateHome,
  onNavigateShop,
  onSelectStyle,
  onAddToCartWithQty,
  currentUserName,
  onToast,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const relatedStyles = allStyles.filter((s) => (product.relatedStyleIds || []).includes(s.id));
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    onAddToCartWithQty(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 sm:space-y-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'فروشگاه ابزار', onClick: onNavigateShop },
          { label: product.name, isCurrent: true },
        ]}
      />

      {/* Above the Fold: Gallery 6 / Purchase Module 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-[#EAE2D5] bg-white shadow-sm p-4 sm:p-6 flex items-center justify-center">
            <EditorialImage
              src={product.image}
              alt={product.name}
              aspectRatio="1:1"
              priority={true}
              categoryLabel={product.category}
              className="max-w-[380px] w-full"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-[#59524A] justify-center">
            <span>کد کالا (SKU): <strong className="font-mono text-[#171614]">{product.sku}</strong></span>
            <span aria-hidden="true">·</span>
            <span>گارانتی سلامت فیزیکی و اصالت کالا</span>
          </div>
        </div>

        {/* Purchase Module Column (Sticky on desktop) */}
        <div className="lg:col-span-6 space-y-6 bg-[#FFFCF8] p-6 sm:p-8 rounded-2xl border border-[#EAE2D5] shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-[#59524A] mb-2">
              <span className="text-[#87553B] font-bold tracking-wide">{product.brand}</span>
              <div className="flex items-center gap-1 text-amber-700 tabular-nums">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-[#59524A]">({product.reviewsCount} نظر هنرجویان)</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#171614] leading-snug">
              {product.name}
            </h1>

            {/* Stock status */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className={isOutOfStock ? 'text-red-700 font-semibold' : 'text-emerald-800 font-semibold'}>
                {isOutOfStock ? 'در حال حاضر ناموجود' : `موجود در انبار مرکزی (${product.stock} عدد)`}
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-[#F4EFE7]/40 rounded-xl border border-[#EAE2D5]/60 space-y-1">
            <span className="text-xs text-[#59524A]">قیمت مصرف‌کننده:</span>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#171614] tabular-nums">
                {product.priceToman.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-[#59524A]">تومان</span>

              {product.compareAtPriceToman && (
                <span className="text-xs text-[#59524A]/60 line-through tabular-nums mr-auto">
                  {product.compareAtPriceToman.toLocaleString('fa-IR')} تومان
                </span>
              )}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#171614]">تعداد:</span>
              <div className="flex items-center border border-[#EAE2D5] rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="p-2 hover:bg-[#F4EFE7] text-[#171614] rounded-r-xl cursor-pointer disabled:opacity-30"
                  aria-label="افزایش"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 hover:bg-[#F4EFE7] text-[#171614] rounded-l-xl cursor-pointer disabled:opacity-30"
                  aria-label="کاهش"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : 'bg-[#171614] hover:bg-[#87553B] text-white active:scale-98'
              }`}
            >
              {addedNotice ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>به سبد خرید اضافه شد!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>افزودن به سبد خرید</span>
                </>
              )}
            </button>
          </div>

          {/* Trust points */}
          <div className="pt-4 border-t border-[#EAE2D5]/70 grid grid-cols-2 gap-3 text-xs text-[#59524A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#167C55]" />
              <span>ضمانت اصالت و سلامت</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#87553B]" />
              <span>ارسال پستی به سراسر کشور</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description */}
      <div className="space-y-6 pt-6 border-t border-[#EAE2D5]">
        <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
          توضیحات و مشخصات فنی محصول
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3 text-xs sm:text-sm text-[#59524A] leading-relaxed">
            <p className="font-semibold text-[#171614]">{product.summary}</p>
            <p>{product.description}</p>
          </div>

          <div className="bg-[#FFFCF8] rounded-xl border border-[#EAE2D5] overflow-hidden">
            <div className="p-3.5 bg-[#F4EFE7]/50 font-bold text-xs text-[#171614] border-b border-[#EAE2D5]">
              مشخصات کالا
            </div>
            <div className="divide-y divide-[#EAE2D5]/60 text-xs">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="p-3 flex justify-between">
                  <span className="text-[#59524A] font-medium">{key}</span>
                  <span className="font-bold text-[#171614]">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Styles */}
      {relatedStyles.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-[#EAE2D5]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
            <Sparkles className="w-4 h-4" />
            <span>کاربرد در مدل‌ها</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            مدل‌هایی که با این محصول اجرا می‌شوند
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedStyles.map((style) => (
              <StyleCard key={style.id} styleItem={style} onSelect={onSelectStyle} />
            ))}
          </div>
        </div>
      )}

      {/* Customer & Stylist Reviews */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsSection
          targetId={product.id}
          targetType="PRODUCT"
          targetTitle={product.name}
          currentUserName={currentUserName}
          onToast={onToast}
        />
      </Suspense>
    </div>
  );
};
