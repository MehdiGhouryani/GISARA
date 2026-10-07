/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CityDetailPage - Screen 10 (City Ecosystem & Local Workshops)
 */

import React from 'react';
import { City, WorkshopSession, Instructor } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { SessionCard } from '../components/education/SessionCard';
import { MapPin, Users, Send } from 'lucide-react';
import { EditorialImage } from '../components/common/EditorialImage';

interface CityDetailPageProps {
  city: City;
  sessions: WorkshopSession[];
  instructors: Instructor[];
  onNavigateHome: () => void;
  onNavigateCourses: () => void;
  onRequestJoinSession: (session: WorkshopSession) => void;
  onRequestNewSession: (city: City) => void;
  onSelectInstructor: (instructor: Instructor) => void;
}

export const CityDetailPage: React.FC<CityDetailPageProps> = ({
  city,
  sessions,
  instructors,
  onNavigateHome,
  onNavigateCourses,
  onRequestJoinSession,
  onRequestNewSession,
  onSelectInstructor,
}) => {
  const citySessions = sessions.filter((s) => s.cityId === city.id);
  const cityInstructors = instructors.filter((inst) => inst.coveredCityIds.includes(city.id));

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'دوره‌های آموزشی', onClick: onNavigateCourses },
          { label: `کارگاه‌های حضوری در ${city.name}`, isCurrent: true },
        ]}
      />

      {/* Hero Banner */}
      <div className="bg-[#171614] text-white rounded-3xl p-6 sm:p-10 border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#A98570]">
            <MapPin className="w-4 h-4" />
            <span>استان {city.province}</span>
          </div>

          <h1 data-speakable="headline" className="text-2xl sm:text-4xl font-bold text-white">
            دوره‌های تخصصی و کارگاه‌های حضوری در {city.name}
          </h1>

          <p data-speakable="description" className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {city.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRequestNewSession(city)}
          className="px-6 py-3 bg-[#7A5E4D] hover:bg-[#5E4435] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
          <span>درخواست برگزاری تاریخ جدید در {city.name}</span>
        </button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            جلسات و کارگاه‌های دارای ظرفیت در {city.name}
          </h2>
          <span className="text-xs text-[#5E5A54] tabular-nums">
            {citySessions.length} جلسه
          </span>
        </div>

        {citySessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {citySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRequestJoin={onRequestJoinSession}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-[#FFFCF8] rounded-2xl border border-[#DED7CD] text-center space-y-3">
            <p className="text-sm font-bold text-[#171614]">
              در حال حاضر جلسه جدیدی برای شهر {city.name} منتشر نشده است.
            </p>
            <p className="text-xs text-[#5E5A54]">
              شما می‌توانید با ثبت درخواست، زمان پیشنهادی خود را اعلام کنید تا با حدنصاب رسیدن کلاس، جلسه جدید تشکیل شود.
            </p>
            <button
              type="button"
              onClick={() => onRequestNewSession(city)}
              className="mt-2 px-5 py-2.5 bg-[#7A5E4D] hover:bg-[#5E4435] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              درخواست تشکیل جلسه در {city.name}
            </button>
          </div>
        )}
      </div>

      {/* Local Instructors */}
      {cityInstructors.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-[#DED7CD]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            مربیان تاییدشده مستقر یا فعال در {city.name}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cityInstructors.map((inst) => (
              <div
                key={inst.id}
                onClick={() => onSelectInstructor(inst)}
                className="group bg-[#FFFCF8] p-5 rounded-2xl border border-[#DED7CD] hover:border-[#7A5E4D] transition-all flex items-center gap-4 cursor-pointer shadow-xs"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-[#DED7CD]">
                  <EditorialImage src={inst.portrait} alt={inst.name} aspectRatio="1:1" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171614] group-hover:text-[#7A5E4D]">
                    {inst.name}
                  </h3>
                  <div className="text-xs text-[#5E5A54] mt-0.5">{inst.specialty}</div>
                  <div className="text-xs text-[#7A5E4D] font-medium mt-2">
                    مشاهده رزومه و دوره‌ها ←
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
