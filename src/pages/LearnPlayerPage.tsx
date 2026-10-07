/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnPlayerPage - lesson player.
 * The lesson (incl. its media URL) is fetched from the server, which refuses paid lessons to anyone who has not
 * bought the course. Lessons without a recorded video show an honest "not uploaded yet" state - there is no
 * simulated playback. Progress/notes are stored per account and per course (see utils/courseProgress.ts).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Course } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { CheckCircle2, ChevronRight, ChevronLeft, ArrowRight, Play, Video, Loader2, Lock, RotateCcw, Check } from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import { getAllLessons } from '../utils/course';
import { CourseProgress, loadNotes, loadProgress, progressPercent, saveNotes, saveProgress } from '../utils/courseProgress';

interface LearnPlayerPageProps {
  course: Course;
  activeLessonId: string;
  /** Account mobile: scopes saved progress and notes to this user. */
  userMobile: string;
  onNavigateHome: () => void;
  onNavigateCourse: () => void;
  onSelectLesson: (lessonId: string) => void;
}

type LessonState =
  | { status: 'loading' }
  | { status: 'ready'; videoUrl?: string }
  | { status: 'error'; kind: 'auth' | 'forbidden' | 'notfound' | 'network'; message: string };

const AUTO_COMPLETE_RATIO = 0.9;
const SAVE_POSITION_EVERY_SEC = 5;

export const LearnPlayerPage: React.FC<LearnPlayerPageProps> = ({
  course,
  activeLessonId,
  userMobile,
  onNavigateHome,
  onNavigateCourse,
  onSelectLesson,
}) => {
  const allLessons = useMemo(() => getAllLessons(course), [course]);
  const currentLessonIndex = Math.max(0, allLessons.findIndex((l) => l.id === activeLessonId));
  const currentLesson = allLessons[currentLessonIndex];
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const [progress, setProgress] = useState<CourseProgress>(() => loadProgress(userMobile, course.id, allLessons));
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes(userMobile, course.id));
  const [noteDraft, setNoteDraft] = useState('');
  const [noteStatus, setNoteStatus] = useState<'idle' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'CURRICULUM' | 'NOTES'>('CURRICULUM');
  const [lessonState, setLessonState] = useState<LessonState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedSecRef = useRef(0);

  const percent = progressPercent(progress, allLessons);
  const completedCount = allLessons.filter((l) => progress.completed[l.id]).length;

  // Persist progress whenever it changes.
  useEffect(() => {
    saveProgress(userMobile, course.id, progress);
  }, [progress, userMobile, course.id]);

  // Remember the lesson being watched so "continue" resumes there.
  useEffect(() => {
    if (currentLesson && progress.lastLessonId !== currentLesson.id) {
      setProgress((p) => ({ ...p, lastLessonId: currentLesson.id }));
    }
  }, [currentLesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch the lesson from the server (authoritative access check + media URL).
  useEffect(() => {
    if (!currentLesson) return;
    let cancelled = false;
    setLessonState({ status: 'loading' });
    lastSavedSecRef.current = 0;
    ApiClient.getLesson(course.id, currentLesson.id)
      .then((res: any) => {
        if (cancelled) return;
        setLessonState({ status: 'ready', videoUrl: res?.lesson?.videoUrl || undefined });
      })
      .catch((err: any) => {
        if (cancelled) return;
        const status = err?.status;
        if (status === 401) setLessonState({ status: 'error', kind: 'auth', message: 'برای دیدن این درس ابتدا وارد حساب کاربری خود شوید.' });
        else if (status === 403) setLessonState({ status: 'error', kind: 'forbidden', message: 'برای دیدن این درس باید دوره را خریداری کنید.' });
        else if (status === 404) setLessonState({ status: 'error', kind: 'notfound', message: 'این درس دیگر در دسترس نیست.' });
        else setLessonState({ status: 'error', kind: 'network', message: 'دریافت درس با مشکل روبه‌رو شد. اتصال اینترنت را بررسی و دوباره تلاش کنید.' });
      });
    return () => {
      cancelled = true;
    };
  }, [course.id, currentLesson?.id, reloadToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notes: draft follows the lesson; saved automatically shortly after typing stops.
  useEffect(() => {
    setNoteDraft(notes[activeLessonId] || '');
    setNoteStatus('idle');
  }, [activeLessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentLesson) return;
    if ((notes[currentLesson.id] || '') === noteDraft) return;
    const t = window.setTimeout(() => {
      const next = { ...notes, [currentLesson.id]: noteDraft };
      if (!noteDraft.trim()) delete next[currentLesson.id];
      setNotes(next);
      saveNotes(userMobile, course.id, next);
      setNoteStatus('saved');
    }, 800);
    return () => window.clearTimeout(t);
  }, [noteDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const markCompleted = useCallback((lessonId: string, done: boolean) => {
    setProgress((p) => {
      const completed = { ...p.completed };
      if (done) completed[lessonId] = true;
      else delete completed[lessonId];
      return { ...p, completed };
    });
  }, []);

  // Resume where the viewer stopped.
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    const saved = currentLesson ? progress.positions[currentLesson.id] : 0;
    if (v && saved && saved > 3 && saved < v.duration - 3) v.currentTime = saved;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !currentLesson || !v.duration || !Number.isFinite(v.duration)) return;
    if (Math.abs(v.currentTime - lastSavedSecRef.current) >= SAVE_POSITION_EVERY_SEC) {
      lastSavedSecRef.current = v.currentTime;
      setProgress((p) => ({ ...p, positions: { ...p.positions, [currentLesson.id]: Math.floor(v.currentTime) } }));
    }
    if (v.currentTime / v.duration >= AUTO_COMPLETE_RATIO && !progress.completed[currentLesson.id]) {
      markCompleted(currentLesson.id, true);
    }
  };

  const goTo = (lessonId: string) => {
    onSelectLesson(lessonId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = activeTab === 'CURRICULUM' ? 'NOTES' : 'CURRICULUM';
      setActiveTab(next);
      document.getElementById(`learn-tab-${next}`)?.focus();
    }
  };

  // COURSE WITHOUT LESSONS ----------------------------------------------------
  if (!currentLesson) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-lg font-bold text-[#171614]">محتوای این دوره هنوز آماده نشده است</h1>
        <p className="text-sm text-[#5E5A54]">درس‌ها به‌زودی اضافه می‌شوند. پس از انتشار، دسترسی شما همین‌جا فعال خواهد بود.</p>
        <button type="button" onClick={onNavigateCourse} className="min-h-11 px-6 py-2.5 bg-[#171614] hover:bg-[#7A5E4D] text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">
          بازگشت به معرفی دوره
        </button>
      </div>
    );
  }

  const isDone = !!progress.completed[currentLesson.id];
  const hasVideo = lessonState.status === 'ready' && !!lessonState.videoUrl;

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: 'صفحه اصلی', onClick: onNavigateHome },
            { label: course.name, onClick: onNavigateCourse },
            { label: currentLesson.title, isCurrent: true },
          ]}
        />

        <div className="flex items-center gap-2 text-xs text-[#5E5A54]" aria-label="پیشرفت دوره">
          <span>پیشرفت دوره:</span>
          <span className="font-bold text-[#2F6B51] tabular-nums">{percent.toLocaleString('fa-IR')}٪</span>
          <div className="w-24 h-2 bg-[#EEE8DF] rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="h-full bg-[#2F6B51] rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
          <span className="tabular-nums">({completedCount.toLocaleString('fa-IR')} از {allLessons.length.toLocaleString('fa-IR')} درس)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          {/* Player area */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-stone-800">
            {lessonState.status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-300 text-xs" role="status">
                <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
                در حال آماده‌سازی درس…
              </div>
            )}

            {lessonState.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6 text-stone-200" role="alert">
                <Lock className="w-8 h-8 text-[#A98570]" aria-hidden="true" />
                <p className="text-sm max-w-sm leading-7">{lessonState.message}</p>
                {lessonState.kind === 'network' && (
                  <button type="button" onClick={() => setReloadToken((n) => n + 1)} className="min-h-10 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer">
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    تلاش مجدد
                  </button>
                )}
                {lessonState.kind === 'forbidden' && (
                  <button type="button" onClick={onNavigateCourse} className="min-h-10 px-4 bg-[#7A5E4D] hover:bg-[#946F59] rounded-lg text-xs font-bold cursor-pointer">
                    مشاهده و خرید دوره
                  </button>
                )}
              </div>
            )}

            {lessonState.status === 'ready' && hasVideo && (
              <video
                key={currentLesson.id}
                ref={videoRef}
                className="absolute inset-0 w-full h-full bg-black"
                src={lessonState.videoUrl}
                poster={course.heroImage}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => markCompleted(currentLesson.id, true)}
              >
                مرورگر شما پخش ویدیو را پشتیبانی نمی‌کند.
              </video>
            )}

            {lessonState.status === 'ready' && !hasVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6 text-stone-200">
                <Video className="w-9 h-9 text-[#A98570]" aria-hidden="true" />
                <p className="text-sm font-semibold">ویدیوی این درس هنوز بارگذاری نشده است</p>
                <p className="text-xs text-stone-400 max-w-sm leading-6">به‌محض انتشار، همین‌جا قابل مشاهده می‌شود و نیازی به خرید دوباره نیست.</p>
              </div>
            )}
          </div>

          {/* Lesson header + navigation */}
          <div className="p-4 sm:p-5 bg-[#FFFCF8] rounded-xl border border-[#DED7CD] space-y-4">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#171614]">{currentLesson.title}</h1>
              <div className="text-xs text-[#5E5A54] mt-0.5 tabular-nums">مدت درس: {currentLesson.durationMinutes.toLocaleString('fa-IR')} دقیقه</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Manual toggle: the only way to complete a lesson that has no video, and a correction for the rest */}
              <button
                type="button"
                onClick={() => markCompleted(currentLesson.id, !isDone)}
                aria-pressed={isDone}
                className={`min-h-11 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  isDone ? 'bg-[#2F6B51] text-white' : 'bg-[#EEE8DF] text-[#171614] hover:bg-[#DED7CD]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{isDone ? 'دیده‌شده (برای لغو بزنید)' : 'این درس را دیدم'}</span>
              </button>

              <div className="flex items-center gap-2 ms-auto">
                {prevLesson && (
                  <button type="button" onClick={() => goTo(prevLesson.id)} className="min-h-11 px-3.5 bg-[#FFFCF8] border border-[#DED7CD] hover:bg-[#EEE8DF] text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    <span>درس قبل</span>
                  </button>
                )}
                {nextLesson && (
                  <button type="button" onClick={() => goTo(nextLesson.id)} className="min-h-11 px-4 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-colors">
                    <span>درس بعدی</span>
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button type="button" onClick={onNavigateCourse} className="text-xs font-semibold text-[#7A5E4D] hover:underline inline-flex items-center gap-1 cursor-pointer min-h-9">
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span>بازگشت به معرفی دوره</span>
          </button>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] shadow-xs overflow-hidden flex flex-col lg:min-h-[480px]">
          <div role="tablist" aria-label="بخش‌های درس" onKeyDown={handleTabKeys} className="flex border-b border-[#DED7CD] bg-[#EEE8DF]/40 text-xs">
            {([['CURRICULUM', 'سرفصل‌ها'], ['NOTES', 'یادداشت‌های من']] as const).map(([id, label]) => (
              <button
                key={id}
                id={`learn-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`learn-panel-${id}`}
                tabIndex={activeTab === id ? 0 : -1}
                onClick={() => setActiveTab(id)}
                className={`flex-1 min-h-12 px-2 font-bold transition-colors text-center cursor-pointer ${
                  activeTab === id ? 'bg-[#FFFCF8] text-[#171614] border-b-2 border-[#7A5E4D]' : 'text-[#5E5A54] hover:text-[#171614]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'CURRICULUM' && (
            <div id="learn-panel-CURRICULUM" role="tabpanel" aria-labelledby="learn-tab-CURRICULUM" className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
              {course.modules.map((m, mIdx) => (
                <div key={m.id} className="space-y-2">
                  <div className="text-xs font-bold text-[#7A5E4D]">
                    فصل {(mIdx + 1).toLocaleString('fa-IR')}: {m.title}
                  </div>
                  <ul className="space-y-1 list-none p-0 m-0">
                    {m.lessons.map((les) => {
                      const isCurrent = les.id === currentLesson.id;
                      const done = !!progress.completed[les.id];
                      return (
                        <li key={les.id}>
                          <button
                            type="button"
                            onClick={() => goTo(les.id)}
                            aria-current={isCurrent ? 'true' : undefined}
                            className={`w-full min-h-11 p-2.5 rounded-xl text-xs text-start flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isCurrent ? 'bg-[#171614] text-white font-bold shadow-xs' : 'hover:bg-[#EEE8DF]/60 text-[#171614]'
                            }`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {done ? (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-emerald-400' : 'text-[#2F6B51]'}`} aria-label="دیده‌شده" />
                              ) : (
                                <Play className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-[#A98570]' : 'text-stone-500'}`} aria-hidden="true" />
                              )}
                              <span className="truncate">{les.title}</span>
                            </span>
                            <span className={`text-xs tabular-nums shrink-0 ${isCurrent ? 'text-stone-300' : 'text-[#5E5A54]'}`}>{les.durationMinutes.toLocaleString('fa-IR')} دقیقه</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'NOTES' && (
            <div id="learn-panel-NOTES" role="tabpanel" aria-labelledby="learn-tab-NOTES" className="p-4 space-y-3">
              <label htmlFor="lesson-note" className="block text-xs font-bold text-[#171614]">
                یادداشت شما برای «{currentLesson.title}»
              </label>
              <textarea
                id="lesson-note"
                rows={9}
                maxLength={2000}
                value={noteDraft}
                onChange={(e) => { setNoteDraft(e.target.value); setNoteStatus('idle'); }}
                placeholder="نکته‌ها، زمان‌بندی‌ها یا سؤال‌هایتان را اینجا بنویسید…"
                className="w-full p-3 bg-white border border-[#DED7CD] rounded-xl text-sm leading-7 text-[#171614] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A5E4D]/40"
              />
              <div className="flex items-center justify-between text-xs text-[#5E5A54]" aria-live="polite">
                <span className="tabular-nums">{noteDraft.length.toLocaleString('fa-IR')} / ۲٬۰۰۰</span>
                <span className="inline-flex items-center gap-1 text-[#2F6B51] min-h-5">
                  {noteStatus === 'saved' && (<><Check className="w-3.5 h-3.5" aria-hidden="true" />ذخیره شد</>)}
                </span>
              </div>
              <p className="text-xs text-[#5E5A54] leading-5">یادداشت‌ها فقط روی همین دستگاه و برای حساب شما نگه‌داری می‌شوند.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
