/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SystemSettingsManager - Payment Gateway & SMS Provider Live Configuration
 * Allows Admin to configure production Zarinpal Merchant ID and SMS API Keys at runtime.
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, MessageSquare, Key, ShieldCheck, CheckCircle2, AlertCircle, Save, TestTube } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

export const SystemSettingsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [paymentProvider, setPaymentProvider] = useState<'zarinpal' | 'idpay' | 'nextpay' | 'mock'>('zarinpal');
  const [merchantId, setMerchantId] = useState('');
  const [maskedMerchant, setMaskedMerchant] = useState(''); // e.g. ••••1234 - the real value never reaches the browser
  const [maskedSmsKey, setMaskedSmsKey] = useState('');
  const [sandbox, setSandbox] = useState(true);

  const [smsProvider, setSmsProvider] = useState<'kavenegar' | 'farazsms' | 'ghasedak' | 'mock'>('kavenegar');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsPatternCode, setSmsPatternCode] = useState('otp_verify');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getAdminSettings();
      if (res) {
        if (res.payment) {
          setPaymentProvider(res.payment.provider || 'zarinpal');
          setMerchantId('');
          setMaskedMerchant(res.payment.merchantId || '');
          setSandbox(res.payment.sandbox !== undefined ? res.payment.sandbox : true);
        }
        if (res.sms) {
          setSmsProvider(res.sms.provider || 'kavenegar');
          setSmsApiKey('');
          setMaskedSmsKey(res.sms.apiKey || '');
          setSmsPatternCode(res.sms.patternCode || 'otp_verify');
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'خطا در بارگذاری تنظیمات سیستم' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        payment: {
          provider: paymentProvider,
          merchantId: merchantId.trim(),
          sandbox
        },
        sms: {
          provider: smsProvider,
          apiKey: smsApiKey.trim(),
          patternCode: smsPatternCode.trim()
        }
      };

      const res = await ApiClient.updateAdminSettings(payload);
      if (res.success) {
        if (merchantId.trim()) setMaskedMerchant(`••••${merchantId.trim().slice(-4)}`);
        if (smsApiKey.trim()) setMaskedSmsKey(`••••${smsApiKey.trim().slice(-4)}`);
        setMerchantId('');
        setSmsApiKey('');
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره گردید.' });
      } else {
        setMessage({ type: 'error', text: res.message || 'خطا در ذخیره تنظیمات' });
      }
    } catch {
      setMessage({ type: 'error', text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-500 font-medium animate-pulse">
        در حال بارگذاری تنظیمات درگاه و پنل پیامک...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Payment Gateway Settings */}
        <div className="bg-white rounded-2xl p-6 border border-[#DED7CD] shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-lg">تنظیمات درگاه پرداخت آنلاین شاپرک / زرین‌پال</h3>
              <p className="text-xs text-stone-500">پیکربندی کلید Merchant ID درگاه شتاب بدون نیاز به تغییر در کد برنامه</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">انتخاب ارائه‌دهنده درگاه</label>
              <select
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value as any)}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="zarinpal">زرین‌پال (ZarinPal v4)</option>
                <option value="idpay">آیدی پی (IDPay)</option>
                <option value="nextpay">نکست پی (NextPay)</option>
                <option value="mock">درگاه شبیه‌ساز آزمایشی (بدون کد)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">کلید مرچنت (Merchant ID)</label>
              <div className="relative">
                <input
                  type="text"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder={maskedMerchant ? `کلید فعلی: ${maskedMerchant} (برای تغییر، مقدار جدید را وارد کنید)` : 'مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                  autoComplete="off"
                  className="w-full h-11 pr-10 pl-3 bg-stone-50 border border-stone-200 rounded-xl text-sm dir-ltr font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <Key className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
              </div>
              <p className="text-xs text-stone-500 mt-1">{maskedMerchant ? 'کلید ذخیره شده است و از دید مرورگر پنهان می‌ماند؛ فیلد خالی = بدون تغییر.' : 'کد ۳۶ کاراکتری دریافتی از پنل زرین‌پال خود را وارد کنید.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="sandbox_toggle"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="sandbox_toggle" className="text-xs font-semibold text-stone-700 cursor-pointer">
              حالت آزمایشگاهی درگاه (ZarinPal Sandbox Mode)
            </label>
          </div>
        </div>

        {/* Section 2: SMS Provider Settings */}
        <div className="bg-white rounded-2xl p-6 border border-[#DED7CD] shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-lg">تنظیمات سامانه و وب‌سرویس پیامکی (SMS)</h3>
              <p className="text-xs text-stone-500">پیکربندی کلید API پنل کاوه‌نگار یا فراز اس‌ام‌اس جهت ارسال واقعی OTP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">انتخاب سامانه پیامکی</label>
              <select
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value as any)}
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="kavenegar">کاوه‌نگار (Kavenegar Lookup)</option>
                <option value="farazsms">فراز اس‌ام‌اس / آی‌پنل (FarazSMS)</option>
                <option value="ghasedak">قاصدک (Ghasedak)</option>
                <option value="mock">شبیه‌ساز پیامک (نمایش در کنسول)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">کلید ارتباطی (API Key)</label>
              <div className="relative">
                <input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder={maskedSmsKey ? `کلید فعلی: ${maskedSmsKey} (برای تغییر، مقدار جدید را وارد کنید)` : 'کلید اختصاصی وب‌سرویس پیامک'}
                  autoComplete="new-password"
                  className="w-full h-11 pr-10 pl-3 bg-stone-50 border border-stone-200 rounded-xl text-sm dir-ltr font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Key className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">کد قالب پیامک (Pattern Code)</label>
              <input
                type="text"
                value={smsPatternCode}
                onChange={(e) => setSmsPatternCode(e.target.value)}
                placeholder="مثال: otp_verify"
                className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono dir-ltr focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>تنظیمات ذخیره‌شده به صورت رمزنگاری‌شده در پایگاه‌داده دائم نگه داشته می‌شوند.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#A98570] hover:bg-[#8F6C57] text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره و فعال‌سازی سرویس‌ها'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
