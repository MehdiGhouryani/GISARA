/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Simulated Gateway Page - Realistic ZarinPal Gateway Simulator
 * Allows sandbox/demo payment completion during development and testing
 */

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

interface Props {
  authority: string;
  orderId: string;
  amountToman: number;
  onCancel?: () => void;
}

export const SimulatedGatewayPage: React.FC<Props> = ({
  authority,
  orderId,
  amountToman,
  onCancel
}) => {
  const [processing, setProcessing] = useState(false);

  const handleCompletePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      window.location.href = `/api/payments/verify?Authority=${authority}&orderId=${orderId}&Status=OK`;
    }, 800);
  };

  const handleCancelPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      window.location.href = `/api/payments/verify?Authority=${authority}&orderId=${orderId}&Status=NOK`;
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-stone-900 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Gateway Header */}
        <div className="bg-[#FFD600] text-stone-900 px-6 py-4 flex items-center justify-between border-b border-amber-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-sm">
              Z
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">درگاه پرداخت اینترنتی زرین‌پال</div>
              <div className="text-[10px] text-stone-700">محیط شبیه‌ساز امن (Sandbox Gateway)</div>
            </div>
          </div>
          <div className="text-[11px] bg-stone-900/10 px-2 py-0.5 rounded font-mono">
            SSL 256-bit
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-6">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-center space-y-1">
            <div className="text-xs text-amber-800">مبلغ قابل پرداخت</div>
            <div className="text-2xl font-black text-stone-900 dir-ltr">
              {amountToman.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-stone-100">
            <div className="flex justify-between py-1.5">
              <span className="text-stone-500">پذیرنده:</span>
              <span className="font-bold text-stone-800">آکادمی و فروشگاه آنلاین گیس‌آرا</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-500">شماره سفارش:</span>
              <span className="font-mono text-stone-800 dir-ltr">{orderId}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-500">کد پیگیری تراکنش (Authority):</span>
              <span className="font-mono text-stone-800 text-[11px] dir-ltr">{authority}</span>
            </div>
          </div>

          {/* Fake Card Form Inputs */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">شماره کارت ۱۶ رقمی</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value="6037 •••• •••• 9284"
                  className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-600 dir-ltr"
                />
                <CreditCard className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">رمز دوم (CVV2)</label>
                <input
                  type="password"
                  disabled
                  value="1234"
                  className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-600 dir-ltr"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">تاریخ انقضا</label>
                <input
                  type="text"
                  disabled
                  value="08 / 08"
                  className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-600 dir-ltr"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleCompletePayment}
              disabled={processing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processing ? 'در حال تایید پرداخت...' : 'تکمیل پرداخت و صدور فاکتور'}</span>
            </button>

            <button
              onClick={handleCancelPayment}
              disabled={processing}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-stone-500" />
              <span>انصراف و بازگشت به سایت</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-100 px-6 py-3 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>پرداخت شما توسط شبکه الکترونیکی پرداخت کارت (شاپرک) تضمین می‌شود.</span>
        </div>
      </div>
    </div>
  );
};
