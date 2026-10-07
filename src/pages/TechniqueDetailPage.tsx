/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TechniqueDetailPage - Step-by-Step Instruction & Common Mistakes
 */

import React, { useState, useEffect } from 'react';
import { Technique, Product, StyleModel, Course } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import {
  Layers,
  AlertTriangle,
  Lightbulb,
  Play,
  Wrench,
  Sparkles,
  CheckCircle2,
  Timer,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  FileEdit,
  Save,
  Check,
} from 'lucide-react';
import { ProductCard } from '../components/commerce/ProductCard';
import { StyleCard } from '../components/discovery/StyleCard';

interface TechniqueDetailPageProps {
  technique: Technique;
  allProducts: Product[];
  allStyles: StyleModel[];
  allCourses: Course[];
  onNavigateHome: () => void;
  onNavigateTechniques: () => void;
  onSelectStyle: (style: StyleModel) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export const TechniqueDetailPage: React.FC<TechniqueDetailPageProps> = ({
  technique,
  allProducts,
  allStyles,
  onNavigateHome,
  onNavigateTechniques,
  onSelectStyle,
  onSelectProduct,
  onAddToCart,
}) => {
  const relatedProducts = allProducts.filter((p) => technique.toolIds.includes(p.id));
  const relatedStyles = allStyles.filter((s) => technique.styleIds.includes(s.id));

  // Practice checklist state
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Practice timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Stylist notes scratchpad state
  const storageNotesKey = `gisara_technique_notes_${technique.id}`;
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem(storageNotesKey) || '';
  });
  const [notesSaved, setNotesSaved] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const toggleStepCompleted = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((n) => n !== stepNum) : [...prev, stepNum]
    );
  };

  const handleSaveNotes = () => {
    localStorage.setItem(storageNotesKey, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '۰')}:${s.toString().padStart(2, '۰')}`;
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'تکنیک‌های آموزشی', onClick: onNavigateTechniques },
          { label: technique.name, isCurrent: true },
        ]}
      />

      {/* Header */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-bold text-[#87553B] uppercase tracking-wider mb-2">
          <Layers className="w-4 h-4" />
          <span>تکنیک آموزشی · سطح {technique.difficulty}</span>
        </div>
        <h1 data-speakable="headline" className="text-2xl sm:text-4xl font-bold text-[#171614] leading-tight">
          {technique.name}
        </h1>
        <p data-speakable="summary" className="mt-3 text-sm sm:text-base text-[#59524A] leading-relaxed">
          {technique.summary}
        </p>
      </div>

      {/* Main 8 / Aside 4 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Step-by-Step Sections */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#171614] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#167C55]" />
                <span>مراحل اجرای استاندارد تکنیک</span>
              </h2>

              {/* Progress counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#87553B] bg-[#87553B]/10 px-3 py-1 rounded-full tabular-nums">
                  تکمیل {completedSteps.length.toLocaleString('fa-IR')} از {technique.steps.length.toLocaleString('fa-IR')} مرحله ({Math.round((completedSteps.length / technique.steps.length) * 100).toLocaleString('fa-IR')}٪)
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {technique.steps.map((step: any) => {
                const isDone = completedSteps.includes(step.number);
                return (
                  <div
                    key={step.number}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden ${
                      isDone
                        ? 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
                        : 'bg-[#FFFCF8] border-[#EAE2D5] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Interactive Step Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleStepCompleted(step.number)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 tabular-nums transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-[#167C55] text-white shadow-xs'
                            : 'bg-[#171614] text-white hover:bg-[#87553B]'
                        }`}
                        title={isDone ? 'علامت به عنوان تکمیل‌نشده' : 'علامت به عنوان تمرین‌شده'}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                      </button>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-base font-bold leading-snug technique-step-title ${isDone ? 'text-emerald-950 line-through opacity-85' : 'text-[#171614]'}`}>
                            {step.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleStepCompleted(step.number)}
                            className="text-xs font-semibold text-[#87553B] hover:text-[#381F13] flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {isDone ? (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>تمرین شد</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[#59524A]">
                                <Square className="w-3.5 h-3.5" />
                                <span>ثبت تمرین</span>
                              </span>
                            )}
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-[#59524A] leading-relaxed">
                          {step.description}
                        </p>

                        {step.tip && (
                          <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-semibold">نکته حرفه‌ای:</strong> {step.tip}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-200/70 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-[#C54636]" />
              <span>اشتباهات رایج هنرجویان در این تکنیک</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-rose-950/80 leading-relaxed list-disc list-inside">
              {technique.commonMistakes.map((mistake: string, idx: number) => (
                <li key={idx}>{mistake}</li>
              ))}
            </ul>
          </div>

          {/* Video Preview Box */}
          {technique.videoDurationMinutes && (
            <div className="p-6 bg-[#171614] text-white rounded-2xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#C59B63] font-bold">
                  <Play className="w-4 h-4 fill-current" />
                  <span>ویدیوی تحلیل تکنیک</span>
                </div>
                <span className="text-xs text-stone-400 tabular-nums">
                  مدت: {technique.videoDurationMinutes} دقیقه
                </span>
              </div>
              <h3 className="text-base font-bold">مشاهده اجرای عملی با زوایای ماکرو</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                این ویدیو به همراه جزئیات زاویه‌بندی دست و برس در دوره جامع شینیون نیز موجود است.
              </p>
            </div>
          )}
        </div>

        {/* Aside Rail (4 cols) */}
        <aside className="lg:col-span-4 space-y-6 sticky top-24">
          {/* Practice Timer Widget */}
          <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171614]">
                <Timer className="w-4 h-4 text-[#87553B]" />
                <span>تایمر تمرین عملی هنرجو</span>
              </div>
              <span className="text-xs text-[#59524A] font-semibold">هدف: ۱۵ دقیقه</span>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE2D5] text-center space-y-3">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#171614] tabular-nums tracking-widest">
                {formatTimer(timerSeconds)}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    isTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#87553B] hover:bg-[#724530] text-white'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>توقف موقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>شروع تمرین</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="p-2 rounded-xl border border-[#EAE2D5] hover:bg-stone-200/50 text-[#59524A] hover:text-[#171614] transition-colors cursor-pointer"
                  title="بازنشانی زمان"
                  aria-label="بازنشانی زمان"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-[#59524A] leading-relaxed">
              سرعت دست خود را در زیرسازی و خط‌اندازی بسنجید تا برای روزهای شلوغ سالن آماده شوید.
            </p>
          </div>

          {/* Stylist Notes Scratchpad */}
          <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171614]">
                <FileEdit className="w-4 h-4 text-[#87553B]" />
                <span>یادداشت‌های اختصاصی هنرجو</span>
              </div>
              <span className="text-xs text-[#59524A]">ذخیره در مرورگر</span>
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="نکات شخصی، زاویه سنجاق U، فرمول تافت یا پوش مناسب..."
              className="w-full p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] text-xs text-[#171614] focus:outline-none focus:ring-2 focus:ring-[#87553B] resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                {notesSaved && (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>یادداشت ذخیره شد</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-3 py-1.5 bg-[#171614] hover:bg-[#87553B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره نکته</span>
              </button>
            </div>
          </div>

          {/* Required Tools */}
          {relatedProducts.length > 0 && (
            <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171614] border-b border-[#EAE2D5] pb-3">
                <Wrench className="w-4 h-4 text-[#87553B]" />
                <span>ابزارهای موردنیاز این تکنیک</span>
              </div>

              <div className="space-y-3">
                {relatedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-[#F4EFE7]/40 rounded-xl border border-[#EAE2D5]/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#171614] line-clamp-1">{prod.name}</div>
                      <div className="text-xs text-[#87553B] font-semibold tabular-nums mt-0.5">
                        {prod.priceToman.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => onAddToCart(prod, e)}
                      className="px-3 py-1.5 bg-[#171614] hover:bg-[#87553B] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      خرید
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Styles */}
          {relatedStyles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171614]">
                <Sparkles className="w-4 h-4 text-[#87553B]" />
                <span>مدل‌های اجراشده با این تکنیک</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {relatedStyles.map((style) => (
                  <StyleCard key={style.id} styleItem={style} onSelect={onSelectStyle} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
