/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CourseDetailPage - Screen 09 (Online Course Detail & Curriculum)
 * Accordion by Module + Lesson Previews + Lifetime Access Guarantee
 */

import React, { useState } from 'react';
import { Course, Instructor } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import { Play, Lock, CheckCircle2, Clock, BookOpen, GraduationCap, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { ReviewsSection } from '../components/common/ReviewsSection';

interface CourseDetailPageProps {
  course: Course;
  instructor?: Instructor;
  isEnrolled: boolean;
  onNavigateHome: () => void;
  onNavigateCourses: () => void;
  onEnroll: (course: Course) => void;
  onStartLearning: (course: Course, lessonId: string) => void;
  currentUserName?: string;
  onToast?: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  instructor,
  isEnrolled,
  onNavigateHome,
  onNavigateCourses,
  onEnroll,
  onStartLearning,
  currentUserName,
  onToast,
}) => {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    [course.modules[0]?.id || '']: true,
  });

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const totalLessons = course.modules.reduce((acc: number, m) => acc + m.lessons.length, 0);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 sm:space-y-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'دوره‌های آموزشی', onClick: onNavigateCourses },
          { label: course.name, isCurrent: true },
        ]}
      />

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Course Info */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87553B] bg-[#C59B63]/10 px-3 py-1 rounded-md mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>دوره آنلاین تخصصی · سطح {course.level}</span>
            </div>

            <h1 data-speakable="headline" className="text-2xl sm:text-4xl font-bold text-[#171614] leading-tight">
              {course.name}
            </h1>

            <p data-speakable="summary" className="mt-3 text-sm sm:text-base text-[#59524A] leading-relaxed course-summary">
              {course.summary}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] text-xs">
            <div>
              <div className="text-[#59524A]">مدت زمان کل:</div>
              <div className="font-bold text-[#171614] mt-0.5 tabular-nums">
                {Math.round(course.durationMinutes / 60)} ساعت ویدیو
              </div>
            </div>
            <div>
              <div className="text-[#59524A]">تعداد جلسات:</div>
              <div className="font-bold text-[#171614] mt-0.5 tabular-nums">
                {totalLessons} درس آموزشی
              </div>
            </div>
            <div>
              <div className="text-[#59524A]">نوع دسترسی:</div>
              <div className="font-bold text-[#167C55] mt-0.5">مادام‌العمر (همیشگی)</div>
            </div>
          </div>

          {/* Instructor Card */}
          {instructor && (
            <div className="p-4 bg-[#F4EFE7]/40 rounded-2xl border border-[#EAE2D5]/70 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[#EAE2D5]">
                <EditorialImage src={instructor.portrait} alt={instructor.name} aspectRatio="1:1" />
              </div>
              <div>
                <div className="text-[11px] text-[#59524A]">مدرس این دوره:</div>
                <div className="text-sm font-bold text-[#171614]">{instructor.name}</div>
                <div className="text-xs text-[#59524A] mt-0.5">{instructor.specialty}</div>
              </div>
            </div>
          )}
        </div>

        {/* Purchase / Enrollment Card */}
        <div className="lg:col-span-5 bg-[#FFFCF8] p-6 sm:p-8 rounded-2xl border border-[#EAE2D5] shadow-sm space-y-6">
          <div className="rounded-xl overflow-hidden border border-[#EAE2D5]">
            <EditorialImage src={course.heroImage} alt={course.name} aspectRatio="16:9" />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#59524A]">شهریه ثبت‌نام در دوره:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#171614] tabular-nums">
                {course.priceToman.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-[#59524A]">تومان</span>

              {course.compareAtPriceToman && (
                <span className="text-xs text-[#59524A]/60 line-through tabular-nums mr-auto">
                  {course.compareAtPriceToman.toLocaleString('fa-IR')} تومان
                </span>
              )}
            </div>
          </div>

          {isEnrolled ? (
            <button
              type="button"
              onClick={() => onStartLearning(course, course.modules[0].lessons[0].id)}
              className="w-full py-3.5 px-4 bg-[#167C55] hover:bg-[#23523e] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ادامه یادگیری (ورود به پنل آموزش)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEnroll(course)}
              className="w-full py-3.5 px-4 bg-[#171614] hover:bg-[#87553B] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>ثبت‌نام و خرید این دوره آنلاین</span>
            </button>
          )}

          <div className="space-y-2 pt-2 text-xs text-[#59524A] border-t border-[#EAE2D5]/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#167C55]" />
              <span>مشاهده نامحدود ویدیوها روی کلیه دستگاه‌ها</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#167C55]" />
              <span>امکان پرسش و پاسخ تخصصی با مربی در پنل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Accordion */}
      <div className="space-y-6 pt-6 border-t border-[#EAE2D5]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
              سرفصل‌ها و جلسات آموزشی دوره
            </h2>
            <p className="text-xs text-[#59524A] mt-1">
              جلسات دارای برچسب «پیش‌نمایش رایگان» برای عموم قابل پخش هستند.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {course.modules.map((mod, idx: number) => {
            const isOpen = !!openModules[mod.id];
            return (
              <div
                key={mod.id}
                className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] overflow-hidden shadow-xs"
              >
                {/* Module Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-right hover:bg-[#F4EFE7]/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#F4EFE7] flex items-center justify-center font-bold text-xs text-[#171614] tabular-nums">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#171614]">
                      {mod.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#59524A]">
                    <span>{mod.lessons.length} درس</span>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Lessons list */}
                {isOpen && (
                  <div className="divide-y divide-[#EAE2D5]/60 border-t border-[#EAE2D5]/60 bg-[#FFFCF8]">
                    {mod.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3.5 sm:p-4 sm:px-6 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {lesson.isPreview || isEnrolled ? (
                            <Play className="w-4 h-4 text-[#87553B] shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                          )}
                          <span className="font-medium text-[#171614] truncate">
                            {lesson.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[#59524A] tabular-nums">
                            {lesson.durationMinutes} دقیقه
                          </span>

                          {lesson.isPreview ? (
                            <button
                              type="button"
                              onClick={() => onStartLearning(course, lesson.id)}
                              className="px-2.5 py-1 bg-[#167C55]/10 text-[#167C55] hover:bg-[#167C55] hover:text-white rounded-md font-semibold transition-colors cursor-pointer"
                            >
                              مشاهده پیش‌نمایش
                            </button>
                          ) : isEnrolled ? (
                            <button
                              type="button"
                              onClick={() => onStartLearning(course, lesson.id)}
                              className="px-2.5 py-1 bg-[#171614] text-white hover:bg-[#87553B] rounded-md font-semibold transition-colors cursor-pointer"
                            >
                              پخش درس
                            </button>
                          ) : (
                            <span className="text-stone-400">قفل</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Reviews & Discussions */}
      <ReviewsSection
        targetId={course.id}
        targetType="COURSE"
        targetTitle={course.name}
        currentUserName={currentUserName}
        onToast={onToast}
      />
    </div>
  );
};
