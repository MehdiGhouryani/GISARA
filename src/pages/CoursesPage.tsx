/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CoursesPage - Screen 08 (Courses Hub) from UI Workbench Blueprint
 * Segmented Tabs: آنلاین | حضوری (with Cities & Sessions discovery)
 */

import React, { useState } from 'react';
import { Course, WorkshopSession, City, Instructor } from '../types/domain';
import { CourseCard } from '../components/education/CourseCard';
import { SessionCard } from '../components/education/SessionCard';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Video, MapPin, Sparkles, Send, Users } from 'lucide-react';
import { EditorialImage } from '../components/common/EditorialImage';

interface CoursesPageProps {
  courses: Course[];
  sessions: WorkshopSession[];
  cities: City[];
  instructors: Instructor[];
  onSelectCourse: (course: Course) => void;
  onRequestJoinSession: (session: WorkshopSession) => void;
  onRequestNewCity: () => void;
  onSelectCity: (city: City) => void;
  onNavigateHome: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  courses,
  sessions,
  cities,
  instructors,
  onSelectCourse,
  onRequestJoinSession,
  onRequestNewCity,
  onSelectCity,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'آموزش و دوره‌ها', isCurrent: true },
        ]}
      />

      {/* Header */}
      <div>
        <span className="text-xs font-bold text-[#7A5E4D] uppercase tracking-wider block">
          آکادمی گیس‌آرا
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#171614] mt-1">
          دوره‌های آموزشی شینیون مو
        </h1>
        <p className="text-xs sm:text-sm text-[#5E5A54] mt-2 max-w-2xl leading-relaxed">
          یادگیری تخصصی متناسب با زمان شما: دوره‌های آنلاین ویدیویی با دسترسی مادام‌العمر یا کارگاه‌های عملی حضوری با رفع اشکال مستقیم در شهرهای مختلف.
        </p>
      </div>

      {/* Segmented Control Tabs (Functional buttons per frontend-design) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EEE8DF] rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('ONLINE')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ONLINE'
              ? 'bg-[#FFFCF8] text-[#171614] shadow-xs'
              : 'text-[#5E5A54] hover:text-[#171614]'
          }`}
        >
          <Video className="w-4 h-4 text-[#7A5E4D]" />
          <span>دوره‌های آنلاین تخصصی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IN_PERSON')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'IN_PERSON'
              ? 'bg-[#FFFCF8] text-[#171614] shadow-xs'
              : 'text-[#5E5A54] hover:text-[#171614]'
          }`}
        >
          <MapPin className="w-4 h-4 text-[#7A5E4D]" />
          <span>کارگاه‌های حضوری در شهرها</span>
        </button>
      </div>

      {/* TAB 1: ONLINE COURSES */}
      {activeTab === 'ONLINE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onSelect={onSelectCourse} />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: IN-PERSON SESSIONS & CITIES */}
      {activeTab === 'IN_PERSON' && (
        <div className="space-y-12">
          {/* Active Sessions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-[#171614]">
                جلسات و کارگاه‌های دارای تاریخ مشخص
              </h2>
              <span className="text-xs text-[#5E5A54] tabular-nums">
                ({sessions.length} جلسه فعال)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((sess) => (
                <SessionCard
                  key={sess.id}
                  session={sess}
                  onRequestJoin={onRequestJoinSession}
                />
              ))}
            </div>
          </div>

          {/* Active Cities Grid */}
          <div className="space-y-6 pt-6 border-t border-[#DED7CD]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#171614]">
                  شهرهای تحت پوشش کارگاه‌های حضوری
                </h2>
                <p className="text-xs text-[#5E5A54] mt-1">
                  مشاهده مربیان مستقر و تاریخ جلسات هر شهر
                </p>
              </div>

              <button
                type="button"
                onClick={onRequestNewCity}
                className="px-4 py-2 bg-[#7A5E4D] hover:bg-[#5E4435] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>درخواست تشکیل دوره در شهر من</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {cities.map((city) => (
                <div
                  key={city.id}
                  onClick={() => onSelectCity(city)}
                  className="group bg-[#FFFCF8] p-4 rounded-xl border border-[#DED7CD] hover:border-[#7A5E4D] transition-all text-center cursor-pointer shadow-xs"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#EEE8DF] flex items-center justify-center text-[#7A5E4D] mb-3 group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#171614] group-hover:text-[#7A5E4D]">
                    {city.name}
                  </h3>
                  <div className="text-xs text-[#5E5A54] mt-1 tabular-nums">
                    {city.activeSessionsCount} جلسه فعال
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
