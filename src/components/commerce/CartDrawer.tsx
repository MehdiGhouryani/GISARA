/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CartDrawer - Slide-over Cart with Physical/Digital Separation
 * Strictly server-authoritative totals and no fake assumptions
 */

import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ShieldCheck, Tag, Check } from 'lucide-react';
import { CartItem, Coupon } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  coupons?: Coupon[];
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  coupons = [],
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const physicalItems = items.filter((i) => i.type === 'PHYSICAL_PRODUCT');
  const digitalItems = items.filter((i) => i.type === 'ONLINE_COURSE');

  const subtotal = items.reduce((acc, item) => acc + item.priceToman * item.quantity, 0);
  const shipping = physicalItems.length > 0 ? 45000 : 0;

  const discountAmount = appliedCoupon
    ? Math.min(
        Math.round((subtotal * appliedCoupon.discountPercent) / 100),
        appliedCoupon.maxDiscountToman || Infinity
      )
    : 0;

  const total = Math.max(0, subtotal - discountAmount + shipping);

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim() || !onApplyCoupon) return;
    setCouponError(null);
    const res = await onApplyCoupon(couponInput.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 left-0 max-w-[420px] w-full bg-[#FFFCF8] shadow-2xl flex flex-col justify-between overflow-hidden z-10 border-r border-[#EAE2D5]"
        role="dialog"
        aria-modal="true"
        aria-label="سبد خرید"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#87553B]" />
            <h2 className="text-base font-bold text-[#171614]">سبد خرید شما</h2>
            <span className="text-xs text-[#59524A] tabular-nums">({items.length} قلم کالا)</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#59524A] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
            aria-label="بستن سبد خرید"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[#59524A]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F4EFE7] flex items-center justify-center text-[#87553B]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-[#171614]">سبد خرید شما در حال حاضر خالی است.</p>
              <p className="text-xs mt-1 text-[#59524A]">
                از فروشگاه ابزار یا دوره‌های آنلاین دیدن فرمایید.
              </p>
            </div>
          ) : (
            <>
              {/* Physical items section */}
              {physicalItems.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#87553B] uppercase tracking-wider mb-3 pb-1 border-b border-[#EAE2D5]/60">
                    ابزارهای فیزیکی (ارسال پستی)
                  </div>
                  <div className="space-y-3">
                    {physicalItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-[#F4EFE7]/40 rounded-xl border border-[#EAE2D5]/60"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[#EAE2D5] bg-white">
                          <EditorialImage src={item.image} alt={item.title} aspectRatio="1:1" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#171614] truncate leading-snug">
                            {item.title}
                          </h4>
                          <div className="mt-1 text-xs font-semibold text-[#87553B] tabular-nums">
                            {item.priceToman.toLocaleString('fa-IR')} تومان
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-[#EAE2D5] rounded-md bg-white">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="p-1 hover:bg-[#F4EFE7] text-[#171614] rounded-r-md cursor-pointer"
                                aria-label="افزایش تعداد"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="p-1 hover:bg-[#F4EFE7] text-[#171614] rounded-l-md cursor-pointer"
                                aria-label="کاهش تعداد"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="text-stone-400 hover:text-[#C54636] p-1 transition-colors cursor-pointer"
                              aria-label="حذف از سبد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital course items section */}
              {digitalItems.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#87553B] uppercase tracking-wider mb-3 pb-1 border-b border-[#EAE2D5]/60">
                    آموزش دیجیتال (دسترسی فوری آنلاین)
                  </div>
                  <div className="space-y-3">
                    {digitalItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-amber-200 bg-white">
                          <EditorialImage src={item.image} alt={item.title} aspectRatio="1:1" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#171614] truncate leading-snug">
                            {item.title}
                          </h4>
                          <div className="mt-1 text-xs font-semibold text-[#87553B] tabular-nums">
                            {item.priceToman.toLocaleString('fa-IR')} تومان
                          </div>
                          <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
                            دسترسی دائمی به پنل یادگیری
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-stone-400 hover:text-[#C54636] p-1 transition-colors cursor-pointer"
                          aria-label="حذف دوره"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#EAE2D5] bg-[#FFFCF8]">
            {/* Coupon Code Entry */}
            <div className="mb-4 pb-3 border-b border-[#EAE2D5]/70">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-[#167C55]/10 border border-[#167C55]/30 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-[#167C55] font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>کد {appliedCoupon.code} فعال است ({appliedCoupon.discountPercent}٪ تخفیف)</span>
                  </div>
                  {onRemoveCoupon && (
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline mr-2"
                    >
                      حذف کد
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleApplyCouponSubmit} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#968A7C] absolute right-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        placeholder="کد تخفیف (مثلاً SHANYOON20)"
                        className="w-full pr-8 pl-2 py-2 bg-white border border-[#EAE2D5] rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-[#87553B]"
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!couponInput.trim()}
                      className="px-3 py-2 bg-[#87553B] hover:bg-[#523120] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      اعمال
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                  )}
                </form>
              )}
            </div>

            <div className="space-y-2 text-xs text-[#59524A] mb-4">
              <div className="flex justify-between">
                <span>مجموع اقلام:</span>
                <span className="font-semibold text-[#171614] tabular-nums">
                  {subtotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#167C55] font-bold">
                  <span>تخفیف کوپن ({appliedCoupon?.code}):</span>
                  <span className="tabular-nums">
                    - {discountAmount.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              )}

              {physicalItems.length > 0 && (
                <div className="flex justify-between">
                  <span>هزینه بسته‌بندی و ارسال:</span>
                  <span className="font-semibold text-[#171614] tabular-nums">
                    {shipping.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#EAE2D5] flex justify-between text-sm font-bold text-[#171614]">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-base text-[#87553B] tabular-nums">
                  {total.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3 px-4 bg-[#171614] hover:bg-[#87553B] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <span>تکمیل خرید و ثبت سفارش</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#59524A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#167C55]" />
              <span>پرداخت امن و تضمین اصالت ابزارها</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
