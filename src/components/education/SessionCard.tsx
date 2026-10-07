/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SessionCard - In-Person Workshop Session Card
 * Strictly enforcing "درخواست شرکت" CTA language (no fake "رزرو قطعی")
 */

import React from 'react';
import { WorkshopSession } from '../../types/domain';
import { StatusBadge } from '../common/StatusBadge';
import { Calendar, Clock, MapPin, Users, Send } from 'lucide-react';
import { EditorialImage } from '../common/EditorialImage';

interface SessionCardProps {
  session: WorkshopSession;
  onRequestJoin: (session: WorkshopSession) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onRequestJoin }) => {
  const isFull = session.status === 'FULL' || session.registeredCount >= session.capacity;
  const remainingSeats = Math.max(0, session.capacity - session.registeredCount);

  return (
    <div className="bg-[#FFFCF8] rounded-xl p-5 sm:p-6 border border-[#DED7CD] hover:border-[#A98570]/70 transition-all duration-300 shadow-xs flex flex-col justify-between">
      <div>
        {/* Top bar: City & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A5E4D] bg-[#A98570]/10 px-2.5 py-1 rounded-md">
            <MapPin className="w-3.5 h-3.5" />
            <span>شهر {session.cityName}</span>
          </div>

          <StatusBadge status={session.status} size="sm" />
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-[#171614] leading-snug">
          {session.courseName}
        </h3>

        {/* Instructor info */}
        <div className="mt-3 flex items-center gap-3 py-2.5 px-3 bg-[#EEE8DF]/40 rounded-lg border border-[#DED7CD]/50">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#DED7CD]">
            <EditorialImage
              src={session.instructorPortrait}
              alt={session.instructorName}
              aspectRatio="1:1"
            />
          </div>
          <div>
            <div className="text-xs text-[#5E5A54]">مدرس کارگاه:</div>
            <div className="text-xs sm:text-sm font-bold text-[#171614]">
              {session.instructorName}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-4 space-y-2 text-xs text-[#5E5A54]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7A5E4D] shrink-0" />
            <span className="font-medium text-[#171614]">{session.dateJalali}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7A5E4D] shrink-0" />
            <span>ساعت: {session.timeSlot}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7A5E4D] shrink-0" />
            <span className="truncate">{session.venueName}</span>
          </div>

          <div className="flex items-center gap-2 tabular-nums">
            <Users className="w-4 h-4 text-[#7A5E4D] shrink-0" />
            <span>
              ظرفیت کارگاه: {session.capacity} نفر ({remainingSeats} صندلی خالی)
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Primary Action */}
      <div className="mt-6 pt-4 border-t border-[#DED7CD]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-[#5E5A54] block">شهریه کارگاه حضوری:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-[#171614] tabular-nums">
              {session.priceToman.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-[#5E5A54]">تومان</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isFull}
          onClick={() => onRequestJoin(session)}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isFull
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
              : 'bg-[#7A5E4D] text-white hover:bg-[#5E4435] shadow-xs'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isFull ? 'تکمیل ظرفیت' : 'درخواست شرکت در این جلسه'}</span>
        </button>
      </div>
    </div>
  );
};
