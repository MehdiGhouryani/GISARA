/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AboutPage - Dedicated, Elegant, Minimalist About Us Page for گیس‌آرا
 * Cleanly renders the academy profile, story, mission, founder, headquarters, and key pillars.
 * All content is dynamically driven by state and fully editable in the Admin CMS.
 */

import React from 'react';
import { AboutContent } from '../types/domain';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EditorialImage } from '../components/common/EditorialImage';
import {
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  Award,
  GraduationCap,
  Users,
  Compass,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface AboutPageProps {
  content: AboutContent;
  onNavigateHome: () => void;
  onNavigateCourses: () => void;
  onNavigateStyles: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  content,
  onNavigateHome,
  onNavigateCourses,
  onNavigateStyles,
}) => {
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 sm:space-y-16 text-right font-sans">
      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'درباره ما', isCurrent: true },
        ]}
      />

      {/* 2. Hero Header */}
      <header className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#87553B] bg-[#C59B63]/10 px-3 py-1.5 rounded-lg border border-[#C59B63]/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>آکادمی و سالن بین‌المللی شینیون مو</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>تأسیس ۱۳۹۴</span>
        </div>

        <h1
          data-speakable="headline"
          className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#171614] tracking-tight leading-[1.25]"
        >
          {content.title}
        </h1>

        <p
          data-speakable="summary"
          className="text-sm sm:text-base text-[#59524A] leading-relaxed font-medium"
        >
          {content.subtitle}
        </p>
      </header>

      {/* 3. Hero Visual & Key Stats Banner */}
      <div className="space-y-6">
        <div className="rounded-3xl overflow-hidden border border-[#EAE2D5] shadow-sm max-h-[480px]">
          <EditorialImage
            src={content.heroImage}
            alt={content.title}
            aspectRatio="16:9"
          />
        </div>

        {/* 4 Stat Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] text-center sm:text-right space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#87553B] font-semibold">
              <Users className="w-4 h-4 text-[#C59B63]" />
              <span>هنرجویان و فارغ‌التحصیلان</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#171614] tabular-nums">
              +{content.stats.studentsCount.toLocaleString('fa-IR')} نفر
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] text-center sm:text-right space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#87553B] font-semibold">
              <Award className="w-4 h-4 text-[#C59B63]" />
              <span>سابقه آموزش و سالن‌داری</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#171614] tabular-nums">
              {content.stats.yearsExperience.toLocaleString('fa-IR')} سال
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] text-center sm:text-right space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#87553B] font-semibold">
              <Compass className="w-4 h-4 text-[#C59B63]" />
              <span>شهرهای دارای کارگاه فعال</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#171614] tabular-nums">
              {content.stats.citiesCovered.toLocaleString('fa-IR')} استان
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] text-center sm:text-right space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#87553B] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>رضایت هنرجویان و سالن‌ها</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 tabular-nums">
              ٪{content.stats.satisfactionRate.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Story & Mission Section (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 bg-[#FFFCF8] rounded-3xl border border-[#EAE2D5] space-y-4 shadow-2xs">
            <h2 className="text-xl sm:text-2xl font-bold text-[#171614] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#87553B]" />
              <span>داستان و رسالت گیس‌آرا</span>
            </h2>

            <div className="text-xs sm:text-sm text-[#2A231C] leading-relaxed space-y-4">
              {content.story.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#C59B63]/30 space-y-2 mt-4">
              <span className="text-xs font-bold text-[#87553B]">چشم‌انداز و مأموریت:</span>
              <p className="text-xs sm:text-sm text-[#171614] leading-relaxed">
                {content.mission}
              </p>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#171614]">
              ارکان کیفیت و استانداردهای آموزشی گیس‌آرا
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#171614]">
                    <span className="w-6 h-6 rounded-full bg-[#87553B]/10 text-[#87553B] flex items-center justify-center text-xs font-bold tabular-nums">
                      {(idx + 1).toLocaleString('fa-IR')}
                    </span>
                    <span>{feature.title}</span>
                  </div>
                  <p className="text-xs text-[#59524A] leading-relaxed pr-8">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Founder & Headquarters Cards (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Founder Profile Card */}
          <div className="p-6 bg-[#FFFCF8] rounded-3xl border border-[#EAE2D5] shadow-xs space-y-4 text-center sm:text-right">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0 rounded-2xl overflow-hidden border-2 border-[#C59B63]/40 bg-stone-100 shadow-xs">
              <EditorialImage
                src={content.founderImage}
                alt={content.founderName}
                aspectRatio="1:1"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#87553B] uppercase tracking-wider">
                مؤسس و مدیر آکادمی
              </span>
              <h3 className="text-lg font-black text-[#171614]">
                {content.founderName}
              </h3>
              <p className="text-xs text-[#59524A] font-medium">
                {content.founderRole}
              </p>
            </div>

            <p className="text-xs text-[#59524A] leading-relaxed pt-2 border-t border-[#EAE2D5]/60 text-right">
              {content.founderBio}
            </p>
          </div>

          {/* Headquarters & Contact Card */}
          <div className="p-6 bg-[#171614] text-white rounded-3xl border border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#C59B63]">
              <MapPin className="w-4 h-4" />
              <span>شعبه مرکزی و آدرس حضوری</span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {content.headquartersAddress}
            </p>

            <div className="space-y-2.5 pt-3 border-t border-stone-800 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C59B63]" />
                <span className="tabular-nums">تلفن: {content.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C59B63]" />
                <span>ایمیل: {content.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C59B63]" />
                <span>ساعات کاری: {content.workingHours}</span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="p-5 bg-[#FAF6F0] rounded-2xl border border-[#EAE2D5] space-y-3">
            <span className="text-xs font-bold text-[#171614] block">
              می‌خواهید با ما همراه شوید؟
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onNavigateCourses}
                className="w-full py-2.5 px-4 bg-[#87553B] hover:bg-[#6E422C] text-white text-xs font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-xs"
              >
                <span>مشاهده دوره‌های آنلاین شینیون</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onNavigateStyles}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F4EFE7] border border-[#EAE2D5] text-[#171614] text-xs font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>مشاهده ژورنال مدل‌های روز</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
