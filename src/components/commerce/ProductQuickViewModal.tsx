/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProductQuickViewModal - Heavy Component Lazy Loaded on Demand in Shop Hub
 * Instant e-commerce product inspection, quantity selector, and cart addition.
 */

import React, { useState } from 'react';
import { Product } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { X, Star, ShoppingBag, Plus, Minus, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onOpenDetail,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-prod-title"
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
          aria-label="بستن پیش‌نمایش محصول"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Visual Column */}
          <div className="relative bg-white flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-l border-[#EAE2D5]">
            <EditorialImage
              src={product.image}
              alt={product.name}
              aspectRatio="1:1"
              priority={true}
              categoryLabel={product.category}
              className="max-w-[260px] w-full"
            />
          </div>

          {/* Details Column */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[#59524A] mb-1">
                <span className="text-[#87553B] font-bold tracking-wide">{product.brand}</span>
                <div className="flex items-center gap-1 text-amber-700 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{product.rating}</span>
                </div>
              </div>

              <h2 id="quick-view-prod-title" className="text-lg font-bold text-[#171614] leading-snug">
                {product.name}
              </h2>

              <p className="mt-2 text-xs text-[#59524A] line-clamp-3 leading-relaxed">
                {product.description}
              </p>

              {/* Price & SKU */}
              <div className="mt-4 pt-3 border-t border-[#EAE2D5] flex items-baseline justify-between">
                <div>
                  <span className="text-xl font-bold text-[#171614] tabular-nums">
                    {product.priceToman.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-xs text-[#59524A] mr-1">تومان</span>
                </div>
                <span className="text-[11px] text-[#59524A]">
                  کد: <code className="font-mono text-[#171614]">{product.sku}</code>
                </span>
              </div>

              {/* Quantity Changer */}
              {!isOutOfStock && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-medium text-[#171614]">تعداد:</span>
                  <div className="flex items-center border border-[#EAE2D5] rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-[#59524A] hover:text-[#171614] transition-colors cursor-pointer"
                      aria-label="کاهش تعداد"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#171614] tabular-nums min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-1.5 text-[#59524A] hover:text-[#171614] transition-colors cursor-pointer"
                      aria-label="افزایش تعداد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-[#59524A]">
                    (موجودی انبار: {product.stock} عدد)
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAdd}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isOutOfStock
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : justAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#171614] text-white hover:bg-[#87553B]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isOutOfStock
                    ? 'ناموجود'
                    : justAdded
                    ? 'به سبد خرید افزوده شد!'
                    : `افزودن ${quantity > 1 ? `${quantity} عدد ` : ''}به سبد خرید`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetail(product);
                }}
                className="w-full py-2 px-4 rounded-xl bg-transparent text-[#87553B] text-xs font-semibold hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>مشاهده صفحه کامل و مشخصات فنی</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductQuickViewModal;
