/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CourseCard - Online & In-person Academy Course Card
 */

import React from 'react';
import { Course } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { Clock, BookOpen, GraduationCap } from 'lucide-react';
import { mockInstructors } from '../../data/mockData';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  const instructor = mockInstructors.find((i) => i.id === course.instructorId);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <article
      onClick={() => onSelect(course)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(course);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`دوره آموزشی ${course.name}، سطح ${course.level}`}
      className="group bg-[#FFFCF8] rounded-xl overflow-hidden border border-[#EAE2D5] hover:border-[#C59B63]/60 focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#87553B]/10 flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="relative overflow-hidden">
          <EditorialImage
            src={course.heroImage}
            alt={course.name}
            aspectRatio="16:9"
            sizes="(max-width: 640px) 320px, (max-width: 1024px) 360px, 380px"
            categoryLabel={course.kind === 'ONLINE' ? 'دوره آنلاین' : 'دوره حضوری'}
            className="group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          <div className="absolute top-3 right-3 bg-[#171614]/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-sm flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#C59B63]" />
            <span>{course.level}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* Instructor line */}
          {instructor && (
            <div className="text-xs text-[#87553B] font-medium mb-1.5">
              مدرس: {instructor.name}
            </div>
          )}

          <h3 className="text-base font-bold text-[#171614] group-hover:text-[#87553B] transition-colors leading-snug line-clamp-2 min-h-[2.8rem]">
            {course.name}
          </h3>

          <p className="mt-2 text-xs text-[#59524A] line-clamp-2 leading-relaxed">
            {course.summary}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-[#59524A] border-t border-[#EAE2D5]/50 pt-3">
            <div className="flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#87553B]" />
              <span>{Math.round(course.durationMinutes / 60)} ساعت آموزش</span>
            </div>
            <span aria-hidden="true" className="text-[#EAE2D5]">·</span>
            <div className="flex items-center gap-1.5 tabular-nums">
              <BookOpen className="w-3.5 h-3.5 text-[#87553B]" />
              <span>{totalLessons} جلسه ویدیویی</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between">
        <div>
          <div className="text-xs text-[#59524A]">شهریه دوره:</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-[#171614] tabular-nums">
              {course.priceToman.toLocaleString('fa-IR')}
            </span>
            <span className="text-[11px] text-[#59524A]">تومان</span>
          </div>
        </div>

        <button
          type="button"
          className="px-4 py-2 bg-[#171614] text-white hover:bg-[#87553B] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          مشاهده دوره
        </button>
      </div>
    </article>
  );
};
