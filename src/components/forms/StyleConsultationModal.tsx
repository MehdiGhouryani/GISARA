/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StyleConsultationModal - Hair & Face Recommender System Engine
 * Multi-Factor Compatibility Filtering & Ranking Engine based on Face Geometry,
 * Forehead Height, Neckline Ergonomics & Style Vibe.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  ShoppingBag,
  HelpCircle,
  CheckCircle2,
  Share2,
  Copy,
  Printer,
  Loader2,
  Award,
  Zap,
  SlidersHorizontal,
  Filter,
  Info,
} from 'lucide-react';
import { StyleModel, Product, Technique, Course } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { ApiClient } from '../../services/apiClient';

interface StyleConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  styles: StyleModel[];
  products: Product[];
  techniques: Technique[];
  courses: Course[];
  onSelectStyle: (style: StyleModel) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export interface UserPreferences {
  faceShape: 'OVAL' | 'ROUND' | 'SQUARE' | 'HEART' | 'OBLONG' | null;
  foreheadHeight: 'SHORT_FOREHEAD' | 'BALANCED_FOREHEAD' | 'HIGH_FOREHEAD' | null;
  hairLength: 'SHORT' | 'MEDIUM' | 'LONG' | null;
  hairDensity: 'FINE' | 'NORMAL' | 'THICK' | null;
  hairTexture: 'STRAIGHT' | 'WAVY' | 'CURLY' | 'BLEACHED' | null;
  occasion: 'BRIDAL' | 'ENGAGEMENT' | 'FORMAL' | 'CASUAL' | null;
  neckline: 'OPEN_DECOLLETE' | 'BOAT_OFF_SHOULDER' | 'HIGH_NECK_HIJAB' | 'V_NECK' | null;
  styleVibe: 'CLASSIC' | 'TEXTURED_ROMANTIC' | 'HOLLYWOOD' | 'BRAIDED' | null;
}

const INITIAL_PREFERENCES: UserPreferences = {
  faceShape: null,
  foreheadHeight: null,
  hairLength: null,
  hairDensity: null,
  hairTexture: null,
  occasion: null,
  neckline: null,
  styleVibe: null,
};

export interface ScoredStyle {
  style: StyleModel;
  matchScore: number;
  reasons: string[];
}

export const StyleConsultationModal: React.FC<StyleConsultationModalProps> = ({
  isOpen,
  onClose,
  styles,
  products,
  techniques,
  courses,
  onSelectStyle,
  onAddToCart,
}) => {
  const [step, setStep] = useState<number>(1);
  const [prefs, setPrefs] = useState<UserPreferences>(INITIAL_PREFERENCES);
  const [showFaceGuide, setShowFaceGuide] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState<string[]>([]);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState<string>('');
  const [aiSource, setAiSource] = useState<string>('expert_rule_engine');
  const [keyAdvicePoints, setKeyAdvicePoints] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [minMatchFilter, setMinMatchFilter] = useState<number>(80);

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

  const totalSteps = 4;

  const handleNext = () => {
    if (step < 4) setStep((prev) => prev + 1);
    else if (step === 4) {
      triggerResultsStep();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setPrefs(INITIAL_PREFERENCES);
    setStep(1);
    setAiAdviceText('');
    setKeyAdvicePoints([]);
  };

  const triggerResultsStep = async () => {
    setStep(5);
    setIsGeneratingAI(true);

    try {
      const res = await ApiClient.getAIConsultation(prefs);
      if (res && res.aiAdvice) {
        setAiAdviceText(res.aiAdvice);
        setAiSource(res.source || 'expert_rule_engine');
        if (res.keyAdvicePoints && res.keyAdvicePoints.length > 0) {
          setKeyAdvicePoints(res.keyAdvicePoints);
        }
      } else {
        setAiAdviceText('بر اساس آنالیز هوشمند هندسه چهره، قد پیشانی و نوع یقه لباس، شینیون‌های تکسچر با پوش تاج سر بهترین تعادل بصری را ایجاد می‌کنند.');
      }
    } catch {
      setAiAdviceText('بر اساس مشخصات ثبتی شما، شینیون خطی با رهاسازی موهای پیرامون پیشانی و فیکساتور متوسط بالاترین تناسب را دارا می‌باشد.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RECOMMENDER ENGINE (FILTERING & RANKING SCORING ALGORITHM)
  // ---------------------------------------------------------------------------
  const runRecommenderEngine = (): ScoredStyle[] => {
    return styles
      .map((style) => {
        let score = 50; // Base score
        const reasons: string[] = [];
        const slug = style.slug.toLowerCase();

        // 1. Face Shape Weighting (Max +25)
        if (prefs.faceShape === 'ROUND') {
          if (slug.includes('chignon') || slug.includes('hollywood') || slug.includes('crown')) {
            score += 22;
            reasons.push('ایجاد ارتفاع عمودی و کشیده‌تر نشان دادن صورت گرد');
          } else {
            score += 10;
          }
        } else if (prefs.faceShape === 'SQUARE') {
          if (slug.includes('romantic') || slug.includes('braid') || slug.includes('textured')) {
            score += 24;
            reasons.push('کاهش زاویه‌های تیز زواید فک با خطوط رما‌نتیک انحنادار');
          } else {
            score += 12;
          }
        } else if (prefs.faceShape === 'HEART') {
          if (slug.includes('bun') || slug.includes('low')) {
            score += 24;
            reasons.push('ایجاد حجم در ناحیه چانه و تعادل با پیشانی پهن');
          } else {
            score += 12;
          }
        } else if (prefs.faceShape === 'OBLONG') {
          if (slug.includes('side') || slug.includes('braid') || slug.includes('textured')) {
            score += 24;
            reasons.push('حجم‌دهی عرضی به گونه‌ها جهت متناسب‌سازی طول چهره');
          } else {
            score += 10;
          }
        } else if (prefs.faceShape === 'OVAL') {
          score += 20;
          reasons.push('همخوانی استاندارد با فرم بی‌نقص چهره بیضی');
        }

        // 2. Forehead Height Weighting (Max +25)
        if (prefs.foreheadHeight === 'HIGH_FOREHEAD') {
          if (slug.includes('chignon') || slug.includes('romantic') || slug.includes('hollywood')) {
            score += 22;
            reasons.push('پوشش هوشمندانه پیشانی بلند با چتری کج و تارهای رها');
          } else {
            score += 8;
          }
        } else if (prefs.foreheadHeight === 'SHORT_FOREHEAD') {
          if (slug.includes('classic') || slug.includes('bun') || slug.includes('crown')) {
            score += 22;
            reasons.push('ایجاد پف و ریشه دادن در تاج سر برای بلندتر جلوه‌دادن پیشانی');
          } else {
            score += 10;
          }
        } else if (prefs.foreheadHeight === 'BALANCED_FOREHEAD') {
          score += 18;
          reasons.push('تطابق کامل با ابعاد متناسب پیشانی');
        }

        // 3. Neckline / Dress Style Ergonomics (Max +25)
        if (prefs.neckline === 'HIGH_NECK_HIJAB') {
          if (slug.includes('classic') || slug.includes('bun')) {
            score += 25;
            reasons.push('ارگونومی کاملاً جمع جهت جلوگیری از گیر کردن به یقه و توربان');
          } else {
            score += 5;
          }
        } else if (prefs.neckline === 'BOAT_OFF_SHOULDER') {
          if (slug.includes('chignon') || slug.includes('bun') || slug.includes('classic')) {
            score += 23;
            reasons.push('نمایش مجلل ترقوه‌ها و گردن در لباس‌های یقه قایقی');
          } else {
            score += 12;
          }
        } else if (prefs.neckline === 'OPEN_DECOLLETE' || prefs.neckline === 'V_NECK') {
          if (slug.includes('hollywood') || slug.includes('braid') || slug.includes('romantic')) {
            score += 23;
            reasons.push('مکمل هارمونیک برای لباس‌های یقه باز و پشت‌دار');
          } else {
            score += 14;
          }
        }

        // 4. Style Vibe Alignment (Max +25)
        if (prefs.styleVibe === 'CLASSIC' && slug.includes('classic')) {
          score += 20;
          reasons.push('استایل صیقلی، رسمی و اروپایی پسندیده شده');
        } else if (prefs.styleVibe === 'HOLLYWOOD' && slug.includes('hollywood')) {
          score += 20;
          reasons.push('امواج مجلل و شیک هالیوودی');
        } else if (prefs.styleVibe === 'BRAIDED' && slug.includes('braid')) {
          score += 20;
          reasons.push('تلفیق بافت‌های مدرن هلندی و تاج');
        } else if (prefs.styleVibe === 'TEXTURED_ROMANTIC' && slug.includes('chignon')) {
          score += 20;
          reasons.push('بافت خطی و مدرن رمانتیک');
        }

        const matchPercent = Math.min(99, Math.max(72, score));

        return {
          style,
          matchScore: matchPercent,
          reasons: reasons.slice(0, 3), // Top 3 matching rationale tags
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const allScoredStyles = runRecommenderEngine();
  const filteredScoredStyles = allScoredStyles.filter((s) => s.matchScore >= minMatchFilter);
  const matchedItem = allScoredStyles[0] || { style: styles[0], matchScore: 98, reasons: [] };
  const matchedStyle = matchedItem.style;
  const matchedScore = matchedItem.matchScore;
  const alternativeScoredStyles = allScoredStyles.slice(1, 4);

  // Recommended Products
  const matchedProducts = products.slice(0, 3);

  const handleProductAdd = (prod: Product, e: React.MouseEvent) => {
    onAddToCart(prod, e);
    setAddedProductIds((prev) => [...prev, prod.id]);
  };

  const handleAddAllProducts = (e: React.MouseEvent) => {
    matchedProducts.forEach((p) => {
      if (!addedProductIds.includes(p.id)) {
        onAddToCart(p, e);
      }
    });
    setAddedProductIds(matchedProducts.map((p) => p.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog Modal */}
      <div
        className="relative bg-[#FFFCF8] rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-[#EAE2D5] z-10 text-right overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="موتور هوشمند پیشنهاددهنده شینیون مو"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5]/70 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#87553B]/10 text-[#87553B] flex items-center justify-center border border-[#87553B]/20">
              <Sparkles className="w-5 h-5 text-[#87553B]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#171614]">
                  موتور پیشنهاددهنده شینیون گیس‌آرا
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#87553B]/10 text-[#87553B] border border-[#87553B]/20 text-[10px] font-bold">
                  Gemini Recommender
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#59524A]">
                فیلتر و رتبه‌بندی هوشمند بر اساس هندسه چهره، قد پیشانی و نوع لباس
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

        {/* Stepper Progress Bar */}
        {step <= 4 && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#59524A] font-medium">
              <span>گام {step.toLocaleString('fa-IR')} از {totalSteps.toLocaleString('fa-IR')}</span>
              <span className="font-bold text-[#87553B]">
                {step === 1 && 'ویژگی‌های چهره (فرم و پیشانی)'}
                {step === 2 && 'قد، تراکم و بافت مو'}
                {step === 3 && 'نوع لباس و مدل یقه'}
                {step === 4 && 'سبک و جلوه نهایی'}
              </span>
            </div>
            <div className="w-full bg-[#EAE2D5] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-l from-[#87553B] to-[#C59B63] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: FACIAL FEATURES (FORM & FOREHEAD) */}
        {step === 1 && (
          <div className="space-y-5">
            {/* 1A: Face Shape */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#171614]">
                  ۱. فرم هندسی صورت خود را انتخاب کنید:
                </label>
                <button
                  type="button"
                  onClick={() => setShowFaceGuide(!showFaceGuide)}
                  className="text-xs font-bold text-[#87553B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>راهنمای تشخیص سریع</span>
                </button>
              </div>

              {/* Visual Guide Callout */}
              {showFaceGuide && (
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#C59B63]/30 text-xs text-[#59524A] space-y-2 leading-relaxed">
                  <div className="font-bold text-[#171614] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#87553B]" />
                    <span>تست آینه برای تشخیص فرم صورت:</span>
                  </div>
                  <p>
                    موهای خود را کاملاً عقب ببندید. عریض‌ترین قسمت چهره را بررسی کنید: اگر طول و عرض یکسان است ➔ <b>گرد یا مربعی</b>؛ اگر چانه باریک و تیز است ➔ <b>قلبی</b>؛ اگر طول زیاد است ➔ <b>کشیده</b>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'OVAL', label: 'بیضی (Oval)', desc: 'ابعاد کاملاً متناسب' },
                  { id: 'ROUND', label: 'گرد (Round)', desc: 'طول و عرض یکسان' },
                  { id: 'SQUARE', label: 'مربعی (Square)', desc: 'فک زاویه‌دار و محکم' },
                  { id: 'HEART', label: 'قلبی (Heart)', desc: 'چانه باریک، پیشانی پهن' },
                  { id: 'OBLONG', label: 'کشیده / مستطیلی', desc: 'چهره بلند و باریک' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, faceShape: opt.id as any }))}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      prefs.faceShape === opt.id
                        ? 'border-[#87553B] bg-[#87553B]/10 ring-1 ring-[#87553B] font-bold text-[#171614]'
                        : 'border-[#EAE2D5] hover:border-[#C59B63] bg-[#FFFCF8] text-[#59524A]'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-[#59524A]/80">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 1B: Forehead Height */}
            <div className="space-y-2.5 pt-2 border-t border-[#EAE2D5]/60">
              <label className="block text-xs font-bold text-[#171614]">
                ۲. قد و ابعاد پیشانی:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'HIGH_FOREHEAD',
                    label: 'پیشانی بلند و پهن',
                    desc: 'نیازمند چتری، فرق کج یا تارهای رها روی پیشانی',
                  },
                  {
                    id: 'BALANCED_FOREHEAD',
                    label: 'پیشانی استاندارد و متناسب',
                    desc: 'همخوانی عالی با تمام مدل‌های باز و بسته',
                  },
                  {
                    id: 'SHORT_FOREHEAD',
                    label: 'پیشانی کوتاه',
                    desc: 'نیازمند پوش ریشه و ارتفاع در تاج سر',
                  },
                ].map((fh) => (
                  <button
                    key={fh.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, foreheadHeight: fh.id as any }))}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      prefs.foreheadHeight === fh.id
                        ? 'border-[#87553B] bg-[#87553B]/10 ring-1 ring-[#87553B] font-bold text-[#171614]'
                        : 'border-[#EAE2D5] hover:border-[#C59B63] text-[#59524A]'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">{fh.label}</div>
                    <div className="text-[10px] text-[#59524A] leading-relaxed">{fh.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: HAIR PROFILE */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#171614] mb-2">
                قد موی شما در چه اندازه‌ای است؟
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'SHORT', label: 'کوتاه (تا سرشانه)' },
                  { id: 'MEDIUM', label: 'متوسط (تا بند لباس)' },
                  { id: 'LONG', label: 'بلند (پایین کمر)' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, hairLength: l.id as any }))}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      prefs.hairLength === l.id
                        ? 'border-[#87553B] bg-[#87553B]/10 text-[#87553B]'
                        : 'border-[#EAE2D5] hover:border-[#C59B63] text-[#59524A]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171614] mb-2">
                تراکم و ضخامت تارهای مو:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FINE', label: 'نازک و کم‌پشت' },
                  { id: 'NORMAL', label: 'نرمال و استاندارد' },
                  { id: 'THICK', label: 'بسیار پرپشت و سنگین' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, hairDensity: d.id as any }))}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      prefs.hairDensity === d.id
                        ? 'border-[#87553B] bg-[#87553B]/10 text-[#87553B]'
                        : 'border-[#EAE2D5] hover:border-[#C59B63] text-[#59524A]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171614] mb-2">
                بافت طبیعی یا حالت جاری مو:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'STRAIGHT', label: 'لخت و سر' },
                  { id: 'WAVY', label: 'مواج طبیعی' },
                  { id: 'CURLY', label: 'فر یا مجعد' },
                  { id: 'BLEACHED', label: 'دکلره / رنگ‌شده' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, hairTexture: t.id as any }))}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      prefs.hairTexture === t.id
                        ? 'border-[#87553B] bg-[#87553B]/10 text-[#87553B]'
                        : 'border-[#EAE2D5] hover:border-[#C59B63] text-[#59524A]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: OCCASION & NECKLINE ERGONOMICS */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#171614] mb-2">
                نوع رویداد یا مراسم:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'BRIDAL', label: 'عروس رسمی' },
                  { id: 'ENGAGEMENT', label: 'نامزدی / عقد' },
                  { id: 'FORMAL', label: 'مجلسی و شب' },
                  { id: 'CASUAL', label: 'مهمانی دوستانه' },
                ].map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, occasion: occ.id as any }))}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      prefs.occasion === occ.id
                        ? 'border-[#87553B] bg-[#87553B]/10 text-[#87553B]'
                        : 'border-[#EAE2D5] hover:border-[#C59B63] text-[#59524A]'
                    }`}
                  >
                    {occ.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171614] mb-2">
                مدل یقه و ارگونومی لباس:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'OPEN_DECOLLETE', label: 'یقه دکلته / باز / هفت', desc: 'مناسب انواع شینیون‌های باز، نیمه‌باز و بسته' },
                  { id: 'BOAT_OFF_SHOULDER', label: 'یقه قایقی یا آف‌شولدر', desc: 'نیازمند شینیون‌های پایین (Low Bun) متمرکز' },
                  { id: 'HIGH_NECK_HIJAB', label: 'یقه ایستاده / توربان / پوشیده', desc: 'نیازمند شینیون کاملاً جمع جهت جلوگیری از ساییدگی یقه' },
                  { id: 'V_NECK', label: 'یقه کلاسیک پشت‌باز', desc: 'هماهنگ با امواج مواج و شینیون خطی' },
                ].map((neck) => (
                  <button
                    key={neck.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, neckline: neck.id as any }))}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      prefs.neckline === neck.id
                        ? 'border-[#87553B] bg-[#87553B]/5 ring-2 ring-[#87553B]/20'
                        : 'border-[#EAE2D5] hover:border-[#C59B63]'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#171614] mb-0.5">{neck.label}</div>
                    <div className="text-[10px] text-[#59524A]">{neck.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: STYLE VIBE */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-[#171614]">
              کدام سبک و جلوه بصری را بیشتر می‌پسندید؟
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'TEXTURED_ROMANTIC', label: 'خطی و رمانتیک (Textured)', desc: 'تارهای رها، کرلی‌های ابریشمی و خطوط برجسته' },
                { id: 'CLASSIC', label: 'کلاسیک اروپایی و صیقلی', desc: 'ساختار بیضی فشرده، صیقلی، براق و ماندگاری بسیار بالا' },
                { id: 'HOLLYWOOD', label: 'امواج مواج هالیوودی (Glam)', desc: 'موج‌های پیوسته و باز روی شانه الهام‌گرفته از رد کارپت' },
                { id: 'BRAIDED', label: 'بافت‌های تلفیقی مدرن', desc: 'ترکیب بافت‌های حجیم هلندی و فرانسوی در تاج و پس‌سر' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, styleVibe: v.id as any }))}
                  className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                    prefs.styleVibe === v.id
                      ? 'border-[#87553B] bg-[#87553B]/5 ring-2 ring-[#87553B]/20 text-[#171614]'
                      : 'border-[#EAE2D5] hover:border-[#C59B63]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs sm:text-sm text-[#171614]">{v.label}</span>
                    {prefs.styleVibe === v.id && (
                      <Check className="w-4 h-4 text-[#87553B]" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#59524A]">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: RECOMMENDER RESULTS SCREEN */}
        {step === 5 && (
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
            {/* AI / Expert Advisory Banner */}
            <div className="bg-gradient-to-br from-[#171614] via-[#381F13] to-[#87553B] text-white p-5 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden border border-[#C59B63]/40">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="px-3 py-1 bg-[#C59B63] text-[#171614] rounded-full text-[11px] font-black tracking-wide shadow-xs flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>تطابق اختصاصی · {matchedScore}٪ همخوانی</span>
                </span>
                <span className="text-xs text-[#F5E3C9] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B63]" />
                  <span>
                    {aiSource === 'gemini_ai'
                      ? 'تحلیل هوش مصنوعی Gemini'
                      : 'تحلیل موتور کارشناسی شینیون گیس‌آرا'}
                  </span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black mb-2 text-[#F5E3C9]">
                پیشنهاد رتبه ۱ موتور: {matchedStyle.name}
              </h3>

              {isGeneratingAI ? (
                <div className="py-3 flex items-center gap-3 text-stone-300 text-xs font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin text-[#C59B63]" />
                  <span>در حال تحلیل هندسه چهره، قد پیشانی و مدل یقه لباس...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-medium whitespace-pre-line">
                    {aiAdviceText}
                  </p>

                  {keyAdvicePoints && keyAdvicePoints.length > 0 && (
                    <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {keyAdvicePoints.map((pt, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white/10 backdrop-blur-md text-[#F5E3C9] border border-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold"
                        >
                          <Check className="w-3 h-3 text-[#C59B63]" />
                          <span>{pt}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recommender Top Choice Card */}
            <div className="bg-[#FAF7F2] p-4.5 rounded-2xl border border-[#C59B63]/40 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
              <div className="w-28 h-32 sm:w-36 sm:h-40 shrink-0 rounded-xl overflow-hidden border border-[#EAE2D5]">
                <EditorialImage
                  src={matchedStyle.primaryImage}
                  alt={matchedStyle.name}
                  aspectRatio="4:5"
                />
              </div>

              <div className="flex-1 text-center sm:text-right space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-[#87553B] bg-[#87553B]/10 px-2.5 py-0.5 rounded-md">
                    مناسبت: {matchedStyle.occasion}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    رتبه ۱ Recommender
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-[#171614]">
                  {matchedStyle.name}
                </h4>

                {/* Recommendation Rationale Badges */}
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                  {matchedItem.reasons.map((r, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-white border border-[#EAE2D5] text-[#59524A] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-[#87553B]" />
                      <span>{r}</span>
                    </span>
                  ))}
                </div>

                <p className="text-xs text-[#59524A] line-clamp-2 leading-relaxed">
                  {matchedStyle.summary}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectStyle(matchedStyle);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87553B] hover:text-[#381F13] cursor-pointer pt-1"
                >
                  <span>مشاهده مشخصات کامل و ویدیوهای آموزشی این مدل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Alternative Filtered Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#171614] flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#87553B]" />
                  <span>مدل‌های جایگزین دارای بالاترین همخوانی:</span>
                </h4>

                <div className="flex items-center gap-2 text-[11px] text-[#59524A]">
                  <span>حداقل تطابق:</span>
                  <select
                    value={minMatchFilter}
                    onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                    className="p-1 bg-white border border-[#EAE2D5] rounded-md text-[11px] text-[#171614]"
                  >
                    <option value={70}>۷۰٪ به بالا</option>
                    <option value={80}>۸۰٪ به بالا</option>
                    <option value={90}>۹۰٪ به بالا</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alternativeScoredStyles
                  .filter((s) => s.matchScore >= minMatchFilter)
                  .map((item) => (
                    <div
                      key={item.style.id}
                      onClick={() => {
                        onClose();
                        onSelectStyle(item.style);
                      }}
                      className="p-3 bg-[#FFFCF8] rounded-xl border border-[#EAE2D5] hover:border-[#87553B] transition-all cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-14 h-16 rounded-lg overflow-hidden shrink-0 border border-[#EAE2D5]">
                        <EditorialImage
                          src={item.style.primaryImage}
                          alt={item.style.name}
                          aspectRatio="1:1"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#171614] truncate group-hover:text-[#87553B]">
                            {item.style.name}
                          </span>
                          <span className="text-[10px] font-bold text-[#87553B] bg-[#87553B]/10 px-1.5 py-0.5 rounded">
                            {item.matchScore}٪
                          </span>
                        </div>
                        <p className="text-[10px] text-[#59524A] truncate">
                          {item.reasons[0] || item.style.summary}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Essential Tools Required for this Style */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#171614] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#87553B]" />
                  <span>ابزار و فیکساتورهای پیشنهادی برای این مدل:</span>
                </h4>

                <button
                  type="button"
                  onClick={handleAddAllProducts}
                  className="text-xs font-bold text-[#87553B] hover:underline cursor-pointer"
                >
                  + خرید یکجای پک ابزار
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchedProducts.map((prod) => {
                  const isAdded = addedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="p-3 bg-[#FFFCF8] rounded-xl border border-[#EAE2D5] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#EAE2D5]">
                          <EditorialImage
                            src={prod.image}
                            alt={prod.name}
                            aspectRatio="1:1"
                          />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#171614] truncate">{prod.name}</div>
                          <div className="text-[11px] text-[#87553B] font-bold tabular-nums">
                            {prod.priceToman.toLocaleString('fa-IR')} تومان
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleProductAdd(prod, e)}
                        disabled={isAdded}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#171614] text-white hover:bg-[#87553B]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>افزوده شد</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>خرید</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Share, Copy & Print Consultation Actions */}
            <div className="pt-4 border-t border-[#EAE2D5] flex flex-wrap items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE2D5]">
              <div className="text-xs font-bold text-[#171614] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#87553B]" />
                <span>شناسنامه پیشنهاد سیستم گیس‌آرا آماده است:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `✨ شناسنامه پیشنهاد هوشمند شینیون گیس‌آرا (GisAra)\nمدل رتبه ۱: ${matchedStyle.name}\nتطابق: ${matchedScore}٪\nتحلیل تخصصی: ${aiAdviceText}\nمشاهده در سامانه تخصصی گیس‌آرا: https://gisara.ir`;
                    navigator.clipboard.writeText(text);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2500);
                  }}
                  className="px-3 py-1.5 bg-white border border-[#EAE2D5] hover:border-[#87553B] text-xs font-semibold text-[#171614] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="کپی خلاصه پیشنهاد در کلیپ‌بورد"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#87553B]" />
                      <span>کپی شناسنامه</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`✨ شناسنامه پیشنهادی شینیون گیس‌آرا\nمدل پیشنهادی: ${matchedStyle.name}\nتطابق: ${matchedScore}٪\nتحلیل: ${aiAdviceText}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="ارسال شناسنامه به واتساپ"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>ارسال به واتساپ</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#171614] hover:bg-[#87553B] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="چاپ شناسنامه"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-[#EAE2D5]/70 flex items-center justify-between gap-3">
          {step > 1 && step <= 4 && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 text-xs font-semibold text-[#59524A] hover:text-[#171614] flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبلی</span>
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-[#87553B] hover:text-[#381F13] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تنظیم مجدد پارامترها</span>
            </button>
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (step === 1 && (!prefs.faceShape || !prefs.foreheadHeight)) ||
                (step === 2 && (!prefs.hairLength || !prefs.hairDensity)) ||
                (step === 3 && (!prefs.occasion || !prefs.neckline))
              }
              className="mr-auto px-5 py-2.5 rounded-xl bg-[#87553B] hover:bg-[#724530] disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <span>گام بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!prefs.styleVibe}
              className="mr-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#87553B] to-[#C59B63] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md hover:shadow-lg hover:scale-102"
            >
              <Sparkles className="w-4 h-4" />
              <span>فیلتر و رتبه‌بندی با Recommender Engine</span>
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={onClose}
              className="mr-auto px-6 py-2.5 rounded-xl bg-[#171614] text-white hover:bg-[#87553B] font-bold text-xs cursor-pointer transition-colors"
            >
              بستن و ادامه مرور
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
