/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProductCard - Clean, Minimalist, Fast-Rendering E-Commerce Card
 */

import React from 'react';
import { Product } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { ShoppingBag, Star, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onSelect,
  onAddToCart,
  onQuickView,
}) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <article
      onClick={() => onSelect(product)}
      className="group bg-white rounded-xl overflow-hidden border border-[#EAE2D5]/80 hover:border-[#87553B]/50 transition-all duration-300 hover:shadow-md flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* 1:1 Image */}
        <div className="relative overflow-hidden bg-[#FAF7F2]">
          <EditorialImage
            src={product.image}
            alt={product.name}
            aspectRatio="1:1"
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 280px"
            className="group-hover:scale-103 transition-transform duration-500 ease-out"
          />

          {/* Minimal Brand Tag */}
          <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-[#59524A] text-xs font-bold px-2 py-0.5 rounded-md border border-[#EAE2D5]/60 shadow-2xs">
            {product.brand}
          </span>
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#59524A]">
            <span className="text-xs font-semibold text-[#87553B]">{product.category}</span>
            <div className="flex items-center gap-1 text-amber-700 font-bold tabular-nums">
              <Star className="w-3 h-3 fill-current text-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-[#171614] group-hover:text-[#87553B] transition-colors leading-snug line-clamp-2 min-h-[2.2rem]">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="pt-1 flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-[#171614] tabular-nums">
              {product.priceToman.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs font-medium text-[#59524A]">تومان</span>

            {product.compareAtPriceToman && (
              <span className="text-xs text-[#59524A]/50 line-through tabular-nums mr-auto">
                {product.compareAtPriceToman.toLocaleString('fa-IR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-3 pt-0 flex items-center gap-1.5">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product, e);
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isOutOfStock
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-[#171614] text-white hover:bg-[#87553B] active:scale-98'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'ناموجود' : 'افزودن به سبد'}</span>
        </button>

        {onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product, e);
            }}
            className="p-2 rounded-lg border border-[#EAE2D5] bg-white hover:bg-[#FAF7F2] text-[#87553B] hover:text-[#171614] transition-colors cursor-pointer text-xs"
            title="مشاهده سریع"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
