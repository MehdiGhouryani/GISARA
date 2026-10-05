/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LearnPlayerPage - Enhanced Interactive LMS Video Environment
 * Video playback controls, speed selector, personal notes with persistence & lesson resources
 */

import React, { useState, useEffect } from 'react';
import { Course } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import {
  Play,
  Pause,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  Volume2,
  Maximize2,
  Settings,
  Edit3,
  Save,
  Wrench,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface LearnPlayerPageProps {
  course: Course;
  activeLessonId: string;
  onNavigateHome: () => void;
  onNavigateCourse: () => void;
  onSelectLesson: (lessonId: string) => void;
}

export const LearnPlayerPage: React.FC<LearnPlayerPageProps> = ({
  course,
  activeLessonId,
  onNavigateHome,
  onNavigateCourse,
  onSelectLesson,
}) => {
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`course_progress_${course.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [activeTab, setActiveTab] = useState<'CURRICULUM' | 'NOTES' | 'RESOURCES'>('CURRICULUM');
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`course_notes_${course.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [currentNote, setCurrentNote] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const currentLesson = allLessons[currentLessonIndex] || allLessons[0];

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const totalDurationSec = (currentLesson?.durationMinutes || 15) * 60;

  // Sync progress
  useEffect(() => {
    localStorage.setItem(`course_progress_${course.id}`, JSON.stringify(completedLessons));
  }, [completedLessons, course.id]);

  // Sync notes
  useEffect(() => {
    setCurrentNote(lessonNotes[activeLessonId] || '');
  }, [activeLessonId, lessonNotes]);

  // Video timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= totalDurationSec) {
            setIsPlaying(false);
            return totalDurationSec;
          }
          return prev + playbackSpeed;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalDurationSec]);

  const toggleCompleted = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = { ...prev, [lessonId]: !prev[lessonId] };
      return next;
    });
  };

  const handleSaveNote = () => {
    setLessonNotes((prev) => {
      const updated = { ...prev, [activeLessonId]: currentNote };
      localStorage.setItem(`course_notes_${course.id}`, JSON.stringify(updated));
      return updated;
    });
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2000);
  };

  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / (allLessons.length || 1)) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Bar with Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: 'صفحه اصلی', onClick: onNavigateHome },
            { label: course.name, onClick: onNavigateCourse },
            { label: currentLesson?.title || 'پخش درس', isCurrent: true },
          ]}
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5E5A54]">
            <span>پیشرفت دوره:</span>
            <span className="font-bold text-[#2F6B51] tabular-nums">{progressPercent}٪</span>
            <div className="w-24 h-2 bg-[#EEE8DF] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2F6B51] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateCourse}
            className="text-xs font-semibold text-[#7A5E4D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>معرفی دوره</span>
          </button>
        </div>
      </div>

      {/* Main Player & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (Player 8 cols in RTL) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Interactive Simulated Video Player */}
          <div className="relative aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col justify-between group select-none">
            {/* Ambient Dark Poster & Header */}
            <div className="absolute inset-0 bg-radial from-stone-900/80 via-black to-black opacity-95" />

            {/* Top Bar overlay in video */}
            <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between text-white/90 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium truncate max-w-sm">{currentLesson?.title}</span>
              </div>
              <span className="text-[11px] text-[#A98570] font-semibold bg-white/10 px-2 py-0.5 rounded-sm">
                کیفیت 1080p Full HD
              </span>
            </div>

            {/* Center Play Button Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center p-4">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#7A5E4D] hover:bg-[#946F59] text-white flex items-center justify-center mx-auto transition-transform hover:scale-105 shadow-2xl cursor-pointer"
                aria-label={isPlaying ? 'توقف' : 'پخش'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                ) : (
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                )}
              </button>
              <div className="mt-3 text-xs text-stone-300 font-medium">
                {isPlaying ? 'در حال پخش ویدیو آموزشی' : 'برای شروع پخش کلیک کنید'}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="relative z-10 bg-gradient-to-t from-black via-black/90 to-transparent p-4 sm:p-5 space-y-2.5">
              {/* Scrubbing timeline bar */}
              <div
                className="w-full h-1.5 hover:h-2.5 bg-stone-700/80 rounded-full overflow-hidden cursor-pointer transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  // In RTL: adjust pos
                  const normalizedPos = 1 - pos;
                  setCurrentTimeSec(normalizedPos * totalDurationSec);
                }}
              >
                <div
                  className="h-full bg-[#7A5E4D] rounded-full"
                  style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 hover:text-[#A98570] transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTimeSec(0)}
                    className="p-1 hover:text-[#A98570] transition-colors cursor-pointer"
                    title="پخش مجدد از ابتدا"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 tabular-nums text-stone-300">
                    <span>{formatTime(currentTimeSec)}</span>
                    <span>/</span>
                    <span>{formatTime(totalDurationSec)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-stone-800/80 px-2 py-0.5 rounded-md text-[11px]">
                    <span className="text-stone-400">سرعت:</span>
                    {[1, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-1.5 rounded-sm transition-colors cursor-pointer ${
                          playbackSpeed === spd ? 'bg-[#7A5E4D] text-white font-bold' : 'text-stone-300 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  <Volume2 className="w-4 h-4 text-stone-300 cursor-pointer hover:text-white" />
                  <Maximize2 className="w-4 h-4 text-stone-300 cursor-pointer hover:text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row & Navigation */}
          <div className="p-4 sm:p-5 bg-[#FFFCF8] rounded-xl border border-[#DED7CD] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#171614]">{currentLesson?.title}</h1>
              <div className="text-xs text-[#5E5A54] mt-0.5 tabular-nums">
                مدت درس: {currentLesson?.durationMinutes} دقیقه · فرمت HD
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleCompleted(currentLesson.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  completedLessons[currentLesson.id]
                    ? 'bg-[#2F6B51] text-white'
                    : 'bg-[#EEE8DF] text-[#171614] hover:bg-[#DED7CD]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedLessons[currentLesson.id] ? 'این درس تکمیل شد' : 'علامت‌گذاری به عنوان مشاهده‌شده'}
                </span>
              </button>

              {prevLesson && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTimeSec(0);
                    onSelectLesson(prevLesson.id);
                  }}
                  className="px-3 py-2 bg-[#FFFCF8] border border-[#DED7CD] hover:bg-[#EEE8DF] text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>درس قبل</span>
                </button>
              )}

              {nextLesson && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTimeSec(0);
                    onSelectLesson(nextLesson.id);
                  }}
                  className="px-3.5 py-2 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>درس بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar (4 cols) with Curriculum / Personal Notes / Resources */}
        <aside className="lg:col-span-4 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] shadow-xs overflow-hidden flex flex-col min-h-[500px]">
          {/* Tabs */}
          <div className="flex border-b border-[#DED7CD] bg-[#EEE8DF]/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('CURRICULUM')}
              className={`flex-1 py-3 px-2 font-bold transition-colors text-center cursor-pointer ${
                activeTab === 'CURRICULUM'
                  ? 'bg-[#FFFCF8] text-[#171614] border-b-2 border-[#7A5E4D]'
                  : 'text-[#5E5A54] hover:text-[#171614]'
              }`}
            >
              سرفصل‌ها
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NOTES')}
              className={`flex-1 py-3 px-2 font-bold transition-colors text-center cursor-pointer ${
                activeTab === 'NOTES'
                  ? 'bg-[#FFFCF8] text-[#171614] border-b-2 border-[#7A5E4D]'
                  : 'text-[#5E5A54] hover:text-[#171614]'
              }`}
            >
              یادداشت‌های من
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RESOURCES')}
              className={`flex-1 py-3 px-2 font-bold transition-colors text-center cursor-pointer ${
                activeTab === 'RESOURCES'
                  ? 'bg-[#FFFCF8] text-[#171614] border-b-2 border-[#7A5E4D]'
                  : 'text-[#5E5A54] hover:text-[#171614]'
              }`}
            >
              ابزار و منابع
            </button>
          </div>

          {/* TAB 1: CURRICULUM */}
          {activeTab === 'CURRICULUM' && (
            <div className="p-4 space-y-4 overflow-y-auto max-h-[550px]">
              {course.modules.map((m, mIdx) => (
                <div key={m.id} className="space-y-2">
                  <div className="text-xs font-bold text-[#7A5E4D]">
                    فصل {mIdx + 1}: {m.title}
                  </div>

                  <div className="space-y-1">
                    {m.lessons.map((les) => {
                      const isCurrent = les.id === activeLessonId;
                      const isDone = completedLessons[les.id];

                      return (
                        <button
                          key={les.id}
                          type="button"
                          onClick={() => {
                            setCurrentTimeSec(0);
                            onSelectLesson(les.id);
                          }}
                          className={`w-full p-2.5 rounded-xl text-xs text-right flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-[#171614] text-white font-bold shadow-xs'
                              : 'hover:bg-[#EEE8DF]/60 text-[#171614]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isDone ? (
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isCurrent ? 'text-emerald-400' : 'text-[#2F6B51]'
                                }`}
                              />
                            ) : (
                              <Play
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isCurrent ? 'text-[#A98570]' : 'text-stone-400'
                                }`}
                              />
                            )}
                            <span className="truncate">{les.title}</span>
                          </div>
                          <span
                            className={`text-[11px] tabular-nums shrink-0 ${
                              isCurrent ? 'text-stone-300' : 'text-[#5E5A54]'
                            }`}
                          >
                            {les.durationMinutes} د
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PERSONAL LESSON NOTES */}
          {activeTab === 'NOTES' && (
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#5E5A54]">
                  <span className="font-semibold text-[#171614]">یادداشت‌های اختصاصی شما برای این درس:</span>
                  <Edit3 className="w-3.5 h-3.5 text-[#7A5E4D]" />
                </div>
                <textarea
                  rows={8}
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="نکات کلیدی زاویه دست، میزان تافت، شماره شانه یا سوالات برای تمرین عملی..."
                  className="w-full p-3 bg-white border border-[#DED7CD] rounded-xl text-xs text-[#171614] focus:outline-none focus:border-[#7A5E4D] leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveNote}
                className="w-full py-2.5 px-4 bg-[#171614] hover:bg-[#7A5E4D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isNoteSaved ? 'یادداشت با موفقیت ذخیره شد!' : 'ذخیره یادداشت درس'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: LESSON RESOURCES */}
          {activeTab === 'RESOURCES' && (
            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[#171614]">ابزارها و وسایل موردنیاز تمرین این بخش:</div>
                <p className="text-[#5E5A54]">
                  برای دستیابی به نتیجه مشابه مدرس در این درس، همراه داشتن اقلام زیر توصیه می‌شود:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#EEE8DF]/40 rounded-xl border border-[#DED7CD]/60 flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-[#7A5E4D]" />
                  <span>اسپری تثبیت‌کننده قوی (بدون ایجاد شوره)</span>
                </div>
                <div className="p-3 bg-[#EEE8DF]/40 rounded-xl border border-[#DED7CD]/60 flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-[#7A5E4D]" />
                  <span>شانه دم‌باریک فلزی مخصوص خط‌اندازی</span>
                </div>
                <div className="p-3 bg-[#EEE8DF]/40 rounded-xl border border-[#DED7CD]/60 flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-[#7A5E4D]" />
                  <span>گیره تقسیم‌بندی کروکودیلی (حداقل ۴ عدد)</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
