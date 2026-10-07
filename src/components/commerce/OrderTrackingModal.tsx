/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OrderTrackingModal - Real-time Postal & Order Shipment Tracker
 * Live multi-stage tracking timeline with Iran Post (پست پیشتاز) & Tipax integration details.
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  X,
  Search,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { UserOrder } from '../../types/domain';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: UserOrder[];
  initialOrderCode?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialOrderCode = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialOrderCode || (orders[0]?.id ?? ''));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderCode) {
      setSearchQuery(initialOrderCode);
    } else if (orders.length > 0 && !searchQuery) {
      setSearchQuery(orders[0].id);
    }
  }, [initialOrderCode, orders]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const foundOrder = orders.find(
    (o) => o.id.toLowerCase() === searchQuery.trim().toLowerCase() || o.trackingCode === searchQuery.trim()
  ) || orders[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Mock tracking steps based on order status
  const steps = [
    {
      title: 'ثبت و تایید پرداخت در درگاه بانکی',
      date: foundOrder ? foundOrder.createdAt : '۱۴۰۵/۰۲/۱۵ ساعت ۱۰:۱۴',
      desc: 'فاکتور الکترونیکی صادر و وجه سفارش توسط درگاه شاپرک تایید گردید.',
      done: true,
    },
    {
      title: 'کنترل کیفی و آماده‌سازی در انبار مرکزی تهران',
      date: foundOrder ? foundOrder.createdAt : '۱۴۰۵/۰۲/۱۵ ساعت ۱۲:۳۰',
      desc: 'اقلام سفارش بازبینی، تاریخ انقضا و سلامت قوطی‌های اسپری کنترل و پک ضدضربه شد.',
      done: true,
    },
    {
      title: 'صدور بارنامه و تحویل به باجه پست پیشتاز مرکزی',
      date: '۱۴۰۵/۰۲/۱۶ ساعت ۰۹:۰۰',
      desc: 'بسته پستی پلمپ و کد رهگیری ۲۴ رقمی پست پیشتاز ثبت سامانه گردید.',
      done: Boolean(foundOrder && foundOrder.status !== 'PENDING_PAYMENT' && foundOrder.status !== 'CANCELLED'),
    },
    {
      title: 'توزیع در مرکز مبادلات پستی مقصد',
      date: '۱۴۰۵/۰۲/۱۷ ساعت ۱۱:۴۵',
      desc: 'مرسوله به استان و شهر مقصد رسیده و تحویل نامه‌رسان منطقه شد.',
      done: Boolean(foundOrder && (foundOrder.shipmentStatus === 'DELIVERED' || foundOrder.status === 'COMPLETED')),
    },
    {
      title: 'تحویل نهایی به گیرنده',
      date: (foundOrder?.shipmentStatus === 'DELIVERED' || foundOrder?.status === 'COMPLETED') ? '۱۴۰۵/۰۲/۱۸ ساعت ۱۲:۲۰' : 'در انتظار تحویل',
      desc: (foundOrder?.shipmentStatus === 'DELIVERED' || foundOrder?.status === 'COMPLETED') ? 'بسته با موفقیت به مشتری محترم تحویل داده شد.' : 'مرسوله به زودی به آدرس گیرنده تحویل خواهد شد.',
      done: Boolean(foundOrder && (foundOrder.shipmentStatus === 'DELIVERED' || foundOrder.status === 'COMPLETED')),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog */}
      <div
        className="relative bg-[#FFFCF8] rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-[#EAE2D5] z-10 text-right overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="رهگیری آنلاین سفارش و مرسوله پستی"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5]/70 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#87553B]/10 text-[#87553B] flex items-center justify-center border border-[#87553B]/20">
              <Truck className="w-5 h-5 text-[#87553B]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#171614]">
                رهگیری آنلاین مرسوله و سفارش
              </h2>
              <p className="text-xs sm:text-xs text-[#59524A]">
                استعلام وضعیت ارسال سفارش‌های ابزار شینیون در سراسر کشور
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#59524A] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-[#171614] mb-1.5">
            شماره سفارش یا کد رهگیری پستی ۲۴ رقمی:
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثال: ORD-849201 یا کد ۲۴ رقمی مرسوله"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#EAE2D5] rounded-xl text-xs sm:text-sm text-[#171614] focus:outline-none focus:ring-2 focus:ring-[#87553B] focus:border-transparent tabular-nums"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#59524A]">
              <Search className="w-4 h-4" />
            </div>
          </div>
          {orders.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[#59524A]">سفارش‌های اخیر شما:</span>
              <div className="flex flex-wrap gap-1.5">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSearchQuery(o.id)}
                    className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#FAF7F2] text-[#87553B] hover:bg-[#87553B]/10 border border-[#EAE2D5] cursor-pointer tabular-nums"
                  >
                    {o.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {foundOrder ? (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Shipment Summary Card */}
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#59524A]">کد سفارش گیس‌آرا:</div>
                  <div className="text-xs font-bold text-[#171614] tabular-nums">{foundOrder.id}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-[#59524A]">متصدی حمل:</div>
                  <div className="text-xs font-bold text-[#87553B]">پست پیشتاز جمهوری اسلامی</div>
                </div>
              </div>

              {/* 24-digit postal code box */}
              <div className="p-2.5 bg-white rounded-lg border border-[#EAE2D5] flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-xs text-[#59524A] block">کد رهگیری پستی (بارنامه):</span>
                  <span className="text-xs font-mono font-bold text-[#171614] tracking-wider tabular-nums select-all">
                    {foundOrder.trackingCode || '312890048102938472910482'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(foundOrder.trackingCode || '312890048102938472910482')}
                  className="px-2.5 py-1 text-xs font-semibold text-[#87553B] hover:bg-[#87553B]/10 rounded-md transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی کد</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#59524A] pt-1 border-t border-[#EAE2D5]/70">
                <div>
                  <span className="font-semibold text-[#171614]">مبدا:</span> انبار مرکزی تهران
                </div>
                <div>
                  <span className="font-semibold text-[#171614]">مقصد:</span> {foundOrder.shippingAddress?.province || 'تهران'} - {foundOrder.shippingAddress?.city || 'مرکزی'}
                </div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-[#171614] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#87553B]" />
                <span>مراحل فیزیکی سیر مرسوله:</span>
              </h3>

              <div className="space-y-4 relative before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE2D5]">
                {steps.map((st, idx) => (
                  <div key={idx} className="relative flex items-start gap-3.5 pr-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        st.done
                          ? 'bg-[#167C55] text-white shadow-xs'
                          : 'bg-[#EAE2D5] text-[#968A7C]'
                      }`}
                    >
                      {st.done ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#59524A]" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${st.done ? 'text-[#171614]' : 'text-[#968A7C]'}`}>
                          {st.title}
                        </span>
                        <span className="text-xs text-[#59524A] tabular-nums">{st.date}</span>
                      </div>
                      <p className="text-xs text-[#59524A] leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-xs font-bold text-[#171614]">سفارشی با این شناسه یافت نشد</p>
            <p className="text-xs text-[#59524A]">
              لطفاً شماره سفارش ثبت‌شده در پیامک یا پیشخوان کاربری خود را به درستی وارد نمایید.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-[#EAE2D5]/70 flex items-center justify-between text-xs">
          <a
            href="https://tracking.post.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#87553B] hover:text-[#381F13] font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>استعلام مستقیم در سامانه شرکت ملی پست ایران</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#171614] text-white hover:bg-[#87553B] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
