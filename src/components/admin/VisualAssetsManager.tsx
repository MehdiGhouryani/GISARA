/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VisualAssetsManager Component
 * Admin Console Module for Managing the 5 Key Brand & Editorial Visuals:
 * 1. Header Background (Photo 5: Silk hair wave on travertine)
 * 2. Hero Section Main Banner (Photo 4: Textured bridal updo by window with pearls)
 * 3. Shop & Tools Banner (Photo 1: Amber spray, comb & rose-gold clips on travertine)
 * 4. In-Person City Workshops (Photo 2: Authentic Iranian training salon with mannequin)
 * 5. Classic European Style Model (Photo 3: Sleek twisted chignon)
 */

import React, { useState, useEffect, useRef } from 'react';
import { ImageUploader } from '../common/ImageUploader';
import {
  Sparkles,
  Camera,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sliders,
  Eye,
  Info,
  Layers,
  ShoppingBag,
  MapPin,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { ASSET_KEYS } from '../layout/Header';

interface AssetSlot {
  key: string;
  id: string;
  title: string;
  recommendedPhoto: string;
  description: string;
  aspectRatioLabel: string;
  previewAspect: string;
  icon: React.ElementType;
  hasOpacityControl?: boolean;
}

const ASSET_SLOTS: AssetSlot[] = [
  {
    key: ASSET_KEYS.HEADER_BG,
    id: 'header',
    title: 'تصویر پس‌زمینه هدر وب‌سایت',
    recommendedPhoto: 'عکس ۵ (موج ابریشمی مو روی سنگ تراورتن)',
    description: 'پس‌زمینه ملایم و لوکس نوار ناوبری بالای صفحه؛ با قابلیت تنظیم درجه محوکنندگی و پوشش روی عکس.',
    aspectRatioLabel: '۱۶:۹ افقی پانوراما',
    previewAspect: 'aspect-[16/5]',
    icon: ImageIcon,
    hasOpacityControl: true,
  },
  {
    key: ASSET_KEYS.HERO_IMAGE,
    id: 'hero',
    title: 'بنر اصلی هیرو سکشن (صفحه اول)',
    recommendedPhoto: 'عکس ۴ (شینیون خطی عروس با مروارید کنار پنجره)',
    description: 'تصویر شاخص و بزرگ بالای صفحه اول سایت که توجه اولیه مخاطبان را به شینیون ژورنالی عروس جلب می‌کند.',
    aspectRatioLabel: '۴:۵ یا ۱۶:۹ پرتره ژورنالی',
    previewAspect: 'aspect-[4/5] max-h-64',
    icon: Sparkles,
  },
  {
    key: ASSET_KEYS.SHOP_BANNER,
    id: 'shop',
    title: 'بنر تجهیزات و فروشگاه تخصصی ابزار',
    recommendedPhoto: 'عکس ۱ (شیشه اسپری کهربایی، شانه و گیره‌ها روی تراورتن)',
    description: 'بنر سربرگ بخش فروشگاه ابزارها، متریال فیکساتور و تجهیزات سالنی مورد تأیید مدرسین آکادمی.',
    aspectRatioLabel: '۱۶:۹ افقی عریض',
    previewAspect: 'aspect-[16/7]',
    icon: ShoppingBag,
  },
  {
    key: ASSET_KEYS.WORKSHOP_IMAGE,
    id: 'workshop',
    title: 'کاور کارگاه‌های حضوری در شهرهای ایران',
    recommendedPhoto: 'عکس ۲ (مربی و هنرجویان با مانکن آموزشی سالنی)',
    description: 'پس‌زمینه مستند و معتبر برای کادر ثبت‌نام و تشکیل دوره‌های حضوری شینیون در استان‌ها.',
    aspectRatioLabel: '۱۶:۹ افقی سالنی',
    previewAspect: 'aspect-[16/7]',
    icon: MapPin,
  },
  {
    key: ASSET_KEYS.CLASSIC_STYLE_IMAGE,
    id: 'classic',
    title: 'تصویر مدل شینیون کلاسیک اروپایی',
    recommendedPhoto: 'عکس ۳ (شینیون صیقلی پشت سر با بافت درهم‌تنیده)',
    description: 'کارت معرفی شینیون کلاسیک اروپایی و تکنیک وزگیری در ویترین مدل‌های ژورنالی صفحه اصلی.',
    aspectRatioLabel: '۴:۳ یا ۱:۱ ژورنالی',
    previewAspect: 'aspect-[4/3] max-h-64',
    icon: Layers,
  },
];

export const VisualAssetsManager: React.FC = () => {
  // Store values in state
  const [assetImages, setAssetImages] = useState<Record<string, string | null>>({
    [ASSET_KEYS.HEADER_BG]: localStorage.getItem(ASSET_KEYS.HEADER_BG) || null,
    [ASSET_KEYS.HERO_IMAGE]: localStorage.getItem(ASSET_KEYS.HERO_IMAGE) || null,
    [ASSET_KEYS.SHOP_BANNER]: localStorage.getItem(ASSET_KEYS.SHOP_BANNER) || null,
    [ASSET_KEYS.WORKSHOP_IMAGE]: localStorage.getItem(ASSET_KEYS.WORKSHOP_IMAGE) || null,
    [ASSET_KEYS.CLASSIC_STYLE_IMAGE]: localStorage.getItem(ASSET_KEYS.CLASSIC_STYLE_IMAGE) || null,
  });

  const [headerOpacity, setHeaderOpacity] = useState<number>(() => {
    const saved = localStorage.getItem(ASSET_KEYS.HEADER_OPACITY);
    return saved ? Number(saved) : 85;
  });

  const [activeUploadSlotKey, setActiveUploadSlotKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if changed externally
  useEffect(() => {
    const handleUpdate = () => {
      setAssetImages({
        [ASSET_KEYS.HEADER_BG]: localStorage.getItem(ASSET_KEYS.HEADER_BG) || null,
        [ASSET_KEYS.HERO_IMAGE]: localStorage.getItem(ASSET_KEYS.HERO_IMAGE) || null,
        [ASSET_KEYS.SHOP_BANNER]: localStorage.getItem(ASSET_KEYS.SHOP_BANNER) || null,
        [ASSET_KEYS.WORKSHOP_IMAGE]: localStorage.getItem(ASSET_KEYS.WORKSHOP_IMAGE) || null,
        [ASSET_KEYS.CLASSIC_STYLE_IMAGE]: localStorage.getItem(ASSET_KEYS.CLASSIC_STYLE_IMAGE) || null,
      });
      const savedOpacity = localStorage.getItem(ASSET_KEYS.HEADER_OPACITY);
      if (savedOpacity) setHeaderOpacity(Number(savedOpacity));
    };
    window.addEventListener('shanyoon_assets_updated', handleUpdate);
    return () => window.removeEventListener('shanyoon_assets_updated', handleUpdate);
  }, []);

  const triggerUploadForSlot = (slotKey: string) => {
    setUploadError(null);
    setActiveUploadSlotKey(slotKey);
    fileInputRef.current?.click();
  };

  /**
   * Security & Performance Hardened File Upload:
   * 1. Validates strict image MIME types (blocks SVG with possible embedded script, executables, HTML)
   * 2. Rejects files larger than 4MB
   * 3. Scales and compresses image via Canvas to < 180KB to protect browser localStorage quota
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadSlotKey) return;

    setUploadError(null);

    // 1. Strict MIME Type Validation
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('فرمت فایل نامعتبر است. تنها تصاویر با پسوند JPG، PNG یا WEBP مجاز هستند.');
      e.target.value = '';
      setActiveUploadSlotKey(null);
      return;
    }

    // 2. Strict File Size Validation (Max 3MB raw)
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('حجم تصویر بیشتر از حد مجاز (حداکثر ۳ مگابایت) است.');
      e.target.value = '';
      setActiveUploadSlotKey(null);
      return;
    }

    const currentSlot = activeUploadSlotKey;
    const reader = new FileReader();

    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result as string;
      if (!rawDataUrl) return;

      // 3. Client-side Canvas Compression to prevent QuotaExceededError
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          saveToLocalStorage(currentSlot, rawDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as clean JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        saveToLocalStorage(currentSlot, compressedDataUrl);
      };

      img.onerror = () => {
        setUploadError('بارگذاری تصویر با خطا مواجه شد. لطفاً فایل سالمی را انتخاب کنید.');
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
    setActiveUploadSlotKey(null);
  };

  const saveToLocalStorage = (slotKey: string, dataUrl: string) => {
    try {
      localStorage.setItem(slotKey, dataUrl);
      setAssetImages((prev) => ({ ...prev, [slotKey]: dataUrl }));
      window.dispatchEvent(new Event('shanyoon_assets_updated'));
      setUploadError(null);
    } catch {
      setUploadError('حافظه محلی مرورگر پر شده است. لطفاً برخی تصاویر را حذف یا به حالت پیش‌فرض بازگردانید.');
    }
  };

  const handleRemoveImage = (slotKey: string) => {
    localStorage.removeItem(slotKey);
    setAssetImages((prev) => ({ ...prev, [slotKey]: null }));
    window.dispatchEvent(new Event('shanyoon_assets_updated'));
  };

  const handleOpacityChange = (value: number) => {
    setHeaderOpacity(value);
    localStorage.setItem(ASSET_KEYS.HEADER_OPACITY, value.toString());
    window.dispatchEvent(new Event('shanyoon_assets_updated'));
  };

  const handleResetAll = () => {
    if (window.confirm('آیا از بازنشانی تمامی ۵ تصویر ژورنالی به حالت پیش‌فرض اطمینان دارید؟')) {
      ASSET_SLOTS.forEach((slot) => {
        localStorage.removeItem(slot.key);
      });
      localStorage.setItem(ASSET_KEYS.HEADER_OPACITY, '85');
      setHeaderOpacity(85);
      setAssetImages({
        [ASSET_KEYS.HEADER_BG]: null,
        [ASSET_KEYS.HERO_IMAGE]: null,
        [ASSET_KEYS.SHOP_BANNER]: null,
        [ASSET_KEYS.WORKSHOP_IMAGE]: null,
        [ASSET_KEYS.CLASSIC_STYLE_IMAGE]: null,
      });
      window.dispatchEvent(new Event('shanyoon_assets_updated'));
    }
  };

  const activeCount = Object.values(assetImages).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Security & Validation Error Alert */}
      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold px-2 py-1 cursor-pointer"
          >
            متوجه شدم
          </button>
        </div>
      )}

      {/* Header and Summary Card */}
      <div className="bg-[#FFFCF8] rounded-2xl p-6 border border-[#EAE2D5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#87553B]" />
            <h2 className="text-xl font-bold text-[#171614]">
              مدیریت تصاویر و بنرهای ژورنالی وب‌سایت
            </h2>
          </div>
          <p className="text-xs text-[#59524A] mt-1 leading-relaxed">
            تنظیم و فعال‌سازی ۵ تصویر شاخص برند (هدر، بنر هیرو، فروشگاه، کارگاه‌های استانی و مدل کلاسیک) که از هوش مصنوعی خروجی گرفته‌اید.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#EAE2D5] text-xs font-semibold text-[#171614] flex items-center gap-2">
            <span className="text-[#968A7C]">وضعیت فعال‌سازی:</span>
            <span className="font-bold text-[#87553B] tabular-nums">
              {activeCount} از ۵ تصویر
            </span>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-200"
              title="بازنشانی تمام عکس‌ها به حالت پیش‌فرض سامانه"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی همه</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Guide Banner */}
      <div className="bg-[#F4EFE7]/70 rounded-xl p-4 border border-[#EAE2D5] flex items-start gap-3 text-xs text-[#59524A]">
        <Info className="w-4 h-4 text-[#87553B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#171614]">
            راهنمای تطبیق فایل‌های تصویری (.jfif یا .jpg):
          </p>
          <p className="leading-relaxed">
            کافی است روی دکمه «آپلود / تغییر فایل» در هر ردیف کلیک کنید و فایل تصویر متناظر را از پوشه دانلود سیستم خود انتخاب فرمایید. تغییرات بلافاصله ذخیره شده و در ویترین وب‌سایت اعمال می‌شود.
          </p>
        </div>
      </div>

      {/* Grid of 5 Visual Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ASSET_SLOTS.map((slot, index) => {
          const Icon = slot.icon;
          const currentImg = assetImages[slot.key];
          const isHeader = slot.key === ASSET_KEYS.HEADER_BG;

          return (
            <div
              key={slot.key}
              className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#87553B]/40 transition-colors"
            >
              <div className="space-y-3">
                {/* Slot Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#C59B63]/15 text-[#87553B] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#171614]">
                        {index + 1}. {slot.title}
                      </h3>
                      <span className="text-[11px] font-bold text-[#87553B] bg-[#C59B63]/10 px-2 py-0.5 rounded-sm inline-block mt-0.5">
                        {slot.recommendedPhoto}
                      </span>
                    </div>
                  </div>

                  {currentImg ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      اختصاصی فعال
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#968A7C] bg-[#F4EFE7] px-2.5 py-0.5 rounded-full shrink-0">
                      پیش‌فرض سیستم
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#59524A] leading-relaxed">
                  {slot.description}
                </p>

                {/* Aspect Ratio Hint */}
                <div className="text-[11px] text-[#968A7C] flex items-center gap-1.5">
                  <span>ابعاد پیشنهادی:</span>
                  <span className="font-semibold text-[#171614]">{slot.aspectRatioLabel}</span>
                </div>

                {/* Image Preview Box */}
                <div
                  className={`w-full ${slot.previewAspect} rounded-xl overflow-hidden border border-[#EAE2D5] bg-[#F4EFE7] relative flex items-center justify-center`}
                >
                  {currentImg ? (
                    <>
                      <img
                        src={currentImg}
                        alt={slot.title}
                        className="w-full h-full object-cover"
                      />
                      {isHeader && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: `rgba(255, 252, 248, ${headerOpacity / 100})`,
                          }}
                        />
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                        پیش‌نمایش {isHeader ? `(پوشش: ${headerOpacity}٪)` : ''}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-1.5 text-[#968A7C]">
                      <Camera className="w-7 h-7 mx-auto text-[#C59B63]" />
                      <p className="text-xs font-semibold text-[#171614]">
                        هنوز تصویری بارگذاری نشده است
                      </p>
                      <p className="text-[11px]">از دکمه زیر برای بارگذاری عکس استفاده کنید.</p>
                    </div>
                  )}
                </div>

                {/* Header Opacity Slider */}
                {isHeader && currentImg && (
                  <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#EAE2D5] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#171614]">
                        درجه محوکنندگی و پوشش روی عکس هدر:
                      </span>
                      <span className="font-mono text-[#87553B] tabular-nums font-bold">
                        {headerOpacity}٪
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="95"
                      step="5"
                      value={headerOpacity}
                      onChange={(e) => handleOpacityChange(Number(e.target.value))}
                      className="w-full accent-[#87553B] cursor-pointer"
                    />
                    <p className="text-[10px] text-[#968A7C]">
                      پوشش بیشتر باعث ایجاد کنتراست مناسب و خوانایی فوق‌العاده منوها می‌شود.
                    </p>
                  </div>
                )}
              </div>

              {/* Image Uploader Control */}
              <ImageUploader
                value={currentImg || ''}
                onChange={(url) => {
                  if (url) {
                    saveToLocalStorage(slot.key, url);
                  } else {
                    handleRemoveImage(slot.key);
                  }
                }}
                label="انتخاب یا آپلود مستقیم عکس برند:"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
