/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CitiesPage - Dedicated In-Person Workshops Network Hub for All 16 Provinces
 */

import React, { useState } from 'react';
import { City, WorkshopSession, Instructor } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import { MapPin, Search, Users, Calendar, ArrowLeft, Sparkles } from 'lucide-react';

interface CitiesPageProps {
  cities: City[];
  sessions: WorkshopSession[];
  instructors: Instructor[];
  onSelectCity: (city: City) => void;
  onRequestWorkshop: () => void;
  onNavigateHome: () => void;
}

export const CitiesPage: React.FC<CitiesPageProps> = ({
  cities,
  sessions,
  instructors,
  onSelectCity,
  onRequestWorkshop,
  onNavigateHome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const filteredCities = cities.filter((city) => {
    const matchesSearch =
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'شبکه کارگاه‌های حضوری استانی', isCurrent: true },
        ]}
      />

      {/* Hero Header Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#EAE2D5] pb-6">
        <div>
          <span className="text-xs font-bold text-[#87553B] uppercase tracking-wider block">
            ورکشاپ‌های رفع اشکال و تمرین عملی روی مدل زنده
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#171614] mt-1">
            شبکه کارگاه‌های حضوری در ۱۶ استان کشور
          </h1>
          <p className="text-xs sm:text-sm text-[#59524A] mt-2 max-w-2xl leading-relaxed">
            کارگاه‌های فشرده و تخصصی شینیون با حضور اساتید برتر آکادمی گیس‌آرا در سالن‌های مجهز پایتخت و مراکز استان‌ها. تاریخ و ظرفیت شهر خود را انتخاب کنید.
          </p>
        </div>

        <button
          type="button"
          onClick={onRequestWorkshop}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#87553B] to-[#C59B63] hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#F5E3C9]" />
          <span>ثبت درخواست کارگاه جدید در شهر شما</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#87553B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نام شهر یا استان (مثلا: اهواز، گیلان)..."
            className="w-full pl-3 pr-10 py-2.5 bg-white border border-[#EAE2D5] rounded-xl text-xs text-[#171614] placeholder-[#59524A]/60 focus:outline-none focus:border-[#87553B]"
          />
        </div>

        <div className="text-xs font-bold text-[#59524A] self-end sm:self-center">
          نمایش {filteredCities.length} مرکز استان فعال
        </div>
      </div>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredCities.map((city) => {
          const citySessions = sessions.filter((s) => s.cityId === city.id);
          const activeSessions = citySessions.filter((s) => s.status === 'OPEN');

          return (
            <article
              key={city.id}
              onClick={() => onSelectCity(city)}
              className="group bg-[#FFFCF8] rounded-2xl overflow-hidden border border-[#EAE2D5] hover:border-[#C59B63]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#87553B]/10 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* City Image Cover */}
                <div className="relative overflow-hidden h-40">
                  <EditorialImage
                    src={city.image}
                    alt={city.name}
                    aspectRatio="16:10"
                    className="group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Province Badge */}
                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/20">
                    استان {city.province}
                  </span>

                  {/* Sessions status badge */}
                  <span
                    className={`absolute bottom-3 right-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      activeSessions.length > 0
                        ? 'bg-emerald-500/90 text-white border-emerald-300'
                        : 'bg-stone-800/90 text-stone-300 border-stone-600'
                    }`}
                  >
                    {activeSessions.length > 0 ? `${activeSessions.length} جلسه ثبت‌نام فعال` : 'آماده ثبت درخواست'}
                  </span>
                </div>

                {/* City Info */}
                <div className="p-4 sm:p-5 space-y-2">
                  <h3 className="text-lg font-black text-[#171614] group-hover:text-[#87553B] transition-colors flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C59B63]" />
                    <span>{city.name}</span>
                  </h3>

                  <p className="text-xs text-[#59524A] line-clamp-2 leading-relaxed">
                    {city.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 sm:p-5 pt-3 border-t border-[#EAE2D5]/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-[#59524A]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#87553B]" />
                    <span>{city.activeInstructorsCount} مربی</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#87553B]" />
                    <span>{city.activeSessionsCount} جلسه</span>
                  </span>
                </div>

                <span className="text-[#87553B] font-bold text-[11px] group-hover:translate-x-[-3px] transition-transform inline-flex items-center gap-0.5">
                  <span>مشاهده تاریخ‌ها</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Request CTA Card */}
      <section className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 border border-[#C59B63]/30 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-[#171614]">
          شهر خود را در لیست بالا پیدا نکردید؟
        </h2>
        <p className="text-xs sm:text-sm text-[#59524A] max-w-xl mx-auto leading-relaxed">
          می‌توانید با ثبت مشخصات و شماره تماس خود، اولین درخواست تشکیل کارگاه حضوری در شهر و سالن اختصاصی خود را ارسال کنید تا آکادمی برنامه برگزاری را هماهنگ کند.
        </p>
        <button
          type="button"
          onClick={onRequestWorkshop}
          className="px-8 py-3.5 bg-[#171614] hover:bg-[#87553B] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md hover:scale-102 active:scale-98"
        >
          ثبت فوری درخواست کارگاه جدید
        </button>
      </section>
    </div>
  );
};
