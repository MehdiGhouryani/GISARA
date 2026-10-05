/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * InstructorDetailPage - Screen 11 (Instructor Profile & Workshops)
 */

import React from 'react';
import { Instructor, Course, WorkshopSession } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import { Star, Award, BookOpen, Calendar, Instagram, Globe } from 'lucide-react';
import { CourseCard } from '../components/education/CourseCard';
import { SessionCard } from '../components/education/SessionCard';

interface InstructorDetailPageProps {
  instructor: Instructor;
  instructorCourses: Course[];
  instructorSessions: WorkshopSession[];
  onNavigateHome: () => void;
  onNavigateCourses: () => void;
  onSelectCourse: (course: Course) => void;
  onRequestJoinSession: (session: WorkshopSession) => void;
  onRequestWorkshop: () => void;
}

export const InstructorDetailPage: React.FC<InstructorDetailPageProps> = ({
  instructor,
  instructorCourses,
  instructorSessions,
  onNavigateHome,
  onNavigateCourses,
  onSelectCourse,
  onRequestJoinSession,
  onRequestWorkshop,
}) => {
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'مربیان و اساتید', onClick: onNavigateCourses },
          { label: instructor.name, isCurrent: true },
        ]}
      />

      {/* Profile Header */}
      <div className="bg-[#FFFCF8] rounded-3xl p-6 sm:p-10 border border-[#DED7CD] shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-right">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden shrink-0 border-2 border-[#7A5E4D] shadow-md">
            <EditorialImage src={instructor.portrait} alt={instructor.name} aspectRatio="1:1" />
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-[#7A5E4D] mb-1">
                <Award className="w-4 h-4" />
                <span>مدرس تاییدشده شنیون مو</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#171614]">
                {instructor.name}
              </h1>

              <div className="text-xs sm:text-sm text-[#7A5E4D] font-medium mt-1">
                {instructor.specialty}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#5E5A54] leading-relaxed max-w-2xl">
              {instructor.bio}
            </p>

            {/* Verified Credentials & E-E-A-T Social Linkage */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs">
              <a
                href="https://instagram.com/gisara_academy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#87553B] hover:text-[#5E4537] font-semibold transition-colors cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
                <span>صفحه اینستاگرام تأییدشده</span>
              </a>
              <span aria-hidden="true" className="text-[#DED7CD] hidden sm:inline">·</span>
              <a
                href="https://gisara.ir"
                className="inline-flex items-center gap-1.5 text-[#5E5A54] hover:text-[#171614] font-semibold transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>پورتفولیو و آدرس سالن</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-[#5E5A54]">
              <div className="flex items-center gap-1 text-amber-700 font-bold tabular-nums">
                <Star className="w-4 h-4 fill-current" />
                <span>امتیاز {instructor.rating} از ۵</span>
              </div>
              <span aria-hidden="true" className="text-[#DED7CD]">·</span>
              <div className="flex items-center gap-1 tabular-nums">
                <Calendar className="w-4 h-4 text-[#7A5E4D]" />
                <span>{instructor.experienceYears} سال سابقه تدریس تخصصی</span>
              </div>
              <span aria-hidden="true" className="text-[#DED7CD]">·</span>
              <div className="flex items-center gap-1 tabular-nums">
                <BookOpen className="w-4 h-4 text-[#7A5E4D]" />
                <span>{instructor.coursesCount} دوره آنلاین</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses by this instructor */}
      {instructorCourses.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            دوره‌های آنلاین تدریس‌شده توسط {instructor.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructorCourses.map((c) => (
              <CourseCard key={c.id} course={c} onSelect={onSelectCourse} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      {instructorSessions.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-[#DED7CD]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
            کارگاه‌های حضوری پیش رو با این مربی
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructorSessions.map((sess) => (
              <SessionCard
                key={sess.id}
                session={sess}
                onRequestJoin={onRequestJoinSession}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
