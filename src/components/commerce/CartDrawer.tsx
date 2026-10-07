/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CartDrawer - Slide-over Cart with Physical/Digital Separation
 * Strictly server-authoritative totals and no fake assumptions
 */

import React, { useRef } from 'react';
import { X, Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Tag, Truck } from 'lucide-react';
import { CartItem, Coupon } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { useCartTotals } from '../../hooks/useCartTotals';
import { useDialogA11y } from '../../hooks/useDialogA11y';

const MAX_LINE_QTY = 20;

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  /** A coupon is ENTERED only on the checkout page; the drawer just shows (and lets you drop) an applied one. */
  appliedCoupon?: Coupon | null;
  onRemoveCoupon?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  appliedCoupon = null,
  onRemoveCoupon,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(isOpen, onClose, panelRef);
  const totals = useCartTotals(items, appliedCoupon);

  if (!isOpen) return null;

  const physicalItems = items.filter((i) => i.type === 'PHYSICAL_PRODUCT');
  const digitalItems = items.filter((i) => i.type === 'ONLINE_COURSE');
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs gisara-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="gisara-drawer-in fixed inset-y-0 end-0 max-w-[420px] w-full bg-[#FFFCF8] shadow-2xl flex flex-col justify-between overflow-hidden z-10 border-s border-[#EAE2D5] focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#87553B]" />
            <h2 id="cart-drawer-title" className="text-base font-bold text-[#171614]">سبد خرید شما</h2>
            {itemCount > 0 && <span className="text-xs text-[#59524A] tabular-nums">({itemCount.toLocaleString('fa-IR')} عدد)</span>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -m-2 flex items-center justify-center text-[#59524A] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
            aria-label="بستن سبد خرید"
          >
            <X className="w-5 h-5" aria-hidden="true" />
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
                          {item.quantity > 1 && (
                            <div className="mt-0.5 text-xs text-[#59524A] tabular-nums">
                              قیمت واحد: {item.priceToman.toLocaleString('fa-IR')} تومان
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between gap-2">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-[#EAE2D5] rounded-lg bg-white" role="group" aria-label={`تعداد ${item.title}`}>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                disabled={item.quantity >= MAX_LINE_QTY}
                                className="w-10 h-10 flex items-center justify-center hover:bg-[#F4EFE7] disabled:opacity-40 disabled:cursor-not-allowed text-[#171614] rounded-e-lg cursor-pointer"
                                aria-label={`افزایش تعداد ${item.title}`}
                              >
                                <Plus className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <span className="min-w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
                                {item.quantity.toLocaleString('fa-IR')}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-[#F4EFE7] text-[#171614] rounded-s-lg cursor-pointer"
                                aria-label={item.quantity === 1 ? `حذف ${item.title} از سبد` : `کاهش تعداد ${item.title}`}
                              >
                                {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-[#C54636]" aria-hidden="true" /> : <Minus className="w-4 h-4" aria-hidden="true" />}
                              </button>
                            </div>

                            <span className="text-xs font-bold text-[#171614] tabular-nums">
                              {(item.priceToman * item.quantity).toLocaleString('fa-IR')} تومان
                            </span>
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
                          <span className="text-xs text-amber-900 font-medium block mt-0.5">
                            فعال‌سازی پس از تأیید پرداخت
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-[#C54636] transition-colors cursor-pointer"
                          aria-label={`حذف ${item.title} از سبد`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
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
            {appliedCoupon && (
              <div className="mb-3 flex items-center justify-between gap-2 p-2.5 bg-[#167C55]/10 border border-[#167C55]/30 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-[#167C55] font-bold">
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>کد {appliedCoupon.code} فعال است</span>
                </div>
                {onRemoveCoupon && (
                  <button type="button" onClick={onRemoveCoupon} className="min-h-9 px-2 text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer underline">
                    حذف کد
                  </button>
                )}
              </div>
            )}

            <dl className="space-y-2 text-xs text-[#59524A] mb-4">
              <div className="flex justify-between">
                <dt>مجموع اقلام</dt>
                <dd className="font-semibold text-[#171614] tabular-nums">{totals.subtotalToman.toLocaleString('fa-IR')} تومان</dd>
              </div>

              {totals.discountToman > 0 && (
                <div className="flex justify-between text-[#167C55] font-bold">
                  <dt>تخفیف ({appliedCoupon?.code})</dt>
                  <dd className="tabular-nums"><bdi>‎−{totals.discountToman.toLocaleString('fa-IR')}</bdi> تومان</dd>
                </div>
              )}

              {totals.hasPhysical && (
                <div className="flex justify-between">
                  <dt>هزینه ارسال</dt>
                  <dd className="font-semibold text-[#171614] tabular-nums">
                    {totals.shippingToman === 0 ? <span className="text-[#167C55]">رایگان</span> : `${totals.shippingToman.toLocaleString('fa-IR')} تومان`}
                  </dd>
                </div>
              )}

              {totals.remainingForFreeShippingToman > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-[#87553B] bg-[#87553B]/10 rounded-lg px-2.5 py-1.5">
                  <Truck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>با {totals.remainingForFreeShippingToman.toLocaleString('fa-IR')} تومان خرید کالای بیشتر، ارسال رایگان می‌شود.</span>
                </p>
              )}

              <div className="pt-2 border-t border-[#EAE2D5] flex justify-between text-sm font-bold text-[#171614]">
                <dt>مبلغ قابل پرداخت</dt>
                <dd className="text-base text-[#87553B] tabular-nums">{totals.payableToman.toLocaleString('fa-IR')} تومان</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={onCheckout}
              className="w-full min-h-12 py-3 px-4 bg-[#171614] hover:bg-[#87553B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>ادامه و تکمیل سفارش</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
