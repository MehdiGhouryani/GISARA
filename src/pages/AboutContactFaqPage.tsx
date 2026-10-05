/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AboutContactFaqPage - Rebuilt as a Dedicated FAQ Page
 * Displays the complete categorized search and accordion list of frequently asked questions.
 */

import React, { useState, useMemo } from 'react';
import { Breadcrumb } from '../components/common/Breadcrumb';
import {
  Sparkles,
  HelpCircle,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Certificate } from '../types/domain';

interface AboutContactFaqPageProps {
  onNavigateHome: () => void;
  faqs?: any[];
}

export const AboutContactFaqPage: React.FC<AboutContactFaqPageProps> = ({
  onNavigateHome,
  faqs = [],
}) => {
  const [activeSection, setActiveSection] = useState<'ABOUT' | 'CONTACT' | 'FAQ' | 'VERIFY'>('ABOUT');

  // Sync active section with URL query parameters for direct deep-linking
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'faq') {
        setActiveSection('FAQ');
      } else if (tabParam === 'contact') {
        setActiveSection('CONTACT');
      } else if (tabParam === 'verify') {
        setActiveSection('VERIFY');
      } else if (tabParam === 'about') {
        setActiveSection('ABOUT');
      }
    }
  }, [window.location.search]);

  const faqItems = [
    {
      category: 'COURSES',
      question: 'شینیون مو چیست و چه کاربردی دارد؟',
      answer: (
        <div className="space-y-2">
          <p>شینیون مو یک مدل آرایش موست که موها را با سنجاق یا لوازم فرم‌دهی به پشت یا بالای سر جمع می‌کند. این مدل جلوه‌ی کلاسیک و حجیم به مو می‌بخشد و مناسب مراسم رسمی و عروسی است.</p>
          <ul className="list-disc pr-4 space-y-1 text-[#87553B]">
            <li>زیبایی و جلوه‌ی خاص موها</li>
            <li>حفظ حالت مو با تثبیت‌کننده‌ها</li>
            <li>مناسب مهمانی‌ها و عروسی‌ها</li>
          </ul>
        </div>
      ),
      searchText: 'شینیون مو چیست و چه کاربردی دارد آرایش مو سنجاق فرم دهی کلاسیک حجیم مراسم رسمی عروسی زیبایی جلوه خاص تثبیت کننده مهمانی'
    },
    {
      category: 'SHOP',
      question: 'ابزارهای ضروری برای اجرای شینیون حرفه‌ای کدامند؟',
      answer: (
        <div className="space-y-2">
          <p>شینیون حرفه‌ای به ابزار تثبیت و حالت‌دهنده نیاز دارد: سنجاق‌های مو (پین) و کش مو برای نگهداشتن پایه‌ها، اسپری فیکساتور (تافت) و موس یا پودر حجم‌دهنده برای تثبیت و حجم‌دهی، و برس چوبی و شانه برای فرم‌دهی اولیه.</p>
          <ul className="list-disc pr-4 space-y-1 text-[#87553B]">
            <li>سنجاق مو و کلیپس برای ثابت نگه داشتن مو</li>
            <li>اسپری یا تافت تثبیت‌کننده مو برای دوام بیشتر</li>
            <li>شانه و برس چوبی برای تقسیم‌بندی و حالت‌دهی</li>
            <li>موس یا پودر حجم‌دهنده برای پُرپشت کردن مو</li>
          </ul>
        </div>
      ),
      searchText: 'ابزارهای ضروری برای اجرای شینیون حرفه ای کدامند تثبیت حالت دهنده سنجاق مو پین کش مو پایه اسپری فیکساتور تافت موس پودر حجم دهنده برس چوبی شانه تقسیم بندی'
    },
    {
      category: 'COURSES',
      question: 'چگونه می‌توان شینیون مو را در خانه مرحله‌به‌مرحله انجام داد؟',
      answer: (
        <div className="space-y-2">
          <p>ابتدا موها را شسته، خشک و شانه کنید. سپس موها را دسته‌بندی کرده و از پایین به بالا با کش و سنجاق ببندید. در پایان، برای تثبیت نهایی از اسپری حالت‌دهنده یا تافت استفاده کنید.</p>
          <ul className="list-disc pr-4 space-y-1 text-[#87553B]">
            <li>شستن و خشک کردن کامل موها</li>
            <li>تفکیک موها به بخش‌های مورد نظر</li>
            <li>جمع کردن و بستن پایه‌ها با سنجاق یا گیره</li>
            <li>اسپری کردن فیکساتور یا تافت برای حفظ حالت</li>
          </ul>
        </div>
      ),
      searchText: 'چگونه میتوان شینیون مو را در خانه مرحله به مرحله انجام داد شستن خشک شانه دسته بندی کش سنجاق تافت فیکساتور پایه گیره حفظ حالت'
    },
    {
      category: 'COURSES',
      question: 'ملاحظات مهم در آموزش شینیون عروس چیست؟',
      answer: (
        <div className="space-y-2">
          <p>در شینیون عروس باید مدل مو با فرم صورت و لباس عروس هماهنگ باشد. استفاده از مواد تثبیت‌کننده قوی و اجرای دقیق مراحل نیز الزامی است.</p>
          <ul className="list-disc pr-4 space-y-1 text-[#87553B]">
            <li>آماده‌سازی کامل موها (شامپو، خشک‌کردن با حجم مناسب)</li>
            <li>انتخاب مدل متناسب با فرم صورت و لباس عروس</li>
            <li>استفاده از اسپری یا تافت برای ماندگاری مدل</li>
            <li>توجه به جزئیات نهایی (اکسسوری، گل تزئینی)</li>
          </ul>
        </div>
      ),
      searchText: 'ملاحظات مهم در آموزش شینیون عروس چیست مدل مو فرم صورت لباس عروس تثبیت کننده قوی آماده سازی شامپو ماندگاری تافت اکسسوری گل تزئینی'
    },
    {
      category: 'SHOP',
      question: 'چگونه دوام شینیون مو را برای مدت طولانی افزایش دهیم؟',
      answer: (
        <div className="space-y-2">
          <p>برای ماندگاری شینیون: از محصولات قدرتمند تثبیت‌کننده مانند تافت یا اسپری مو استفاده کنید؛ تافت محلولی چسبنده برای حفظ حالت موست. همچنین استفاده از پودر یا موس حجم‌دهنده قبل از کار و بستن محکم مو با سنجاق مناسب، دوام شینیون را افزایش می‌دهد.</p>
          <ul className="list-disc pr-4 space-y-1 text-[#87553B]">
            <li>اسپری یا تافت تثبیت‌کننده پس از اتمام شینیون</li>
            <li>پودر یا موس حجم‌دهنده قبل از شینیون</li>
            <li>سنجاق‌گذاری کافی و دقیق (سنجاق‌های بزرگ و کوچک)</li>
            <li>حفظ موها تمیز و خشک در حین کار</li>
          </ul>
        </div>
      ),
      searchText: 'چگونه دوام شینیون مو را برای مدت طولانی افزایش دهیم ماندگاری تثبیت کننده تافت اسپری مو پودر موس حجم دهنده سنجاق بزرگ کوچک تمیز خشک'
    },
    {
      category: 'COURSES',
      question: 'آیا دسترسی به ویدیوهای دوره‌های آنلاین محدودیت زمانی دارد؟',
      answer: 'خیر، پس از ثبت‌نام در هر یک از دوره‌های آنلاین شنیون مو، دسترسی به تمام قسمت‌ها، ویدیوهای باکیفیت Full-HD و آپدیت‌های تکمیلی دوره به صورت مادام‌العمر در پنل یادگیری شما باقی می‌ماند.',
      searchText: 'آیا دسترسی به ویدیوهای دوره های آنلاین محدودیت زمانی دارد خرید تماشا همیشگی مادام العمر پنل یادگیری ویدیو آپدیت'
    },
    {
      category: 'COURSES',
      question: 'آیا برای شرکت در دوره‌ها به پیش‌نیاز یا سابقه قبلی نیاز است؟',
      answer: 'خیر، دوره‌ها به صورت سطح‌بندی‌شده (از مبانی فونداسیون، پوش‌دهی اصولی و وزگیری مو تا تکنیک‌های پیشرفته خطی و اروپایی) طراحی شده‌اند. در صفحه هر دوره، پیش‌نیازهای پیشنهادی ذکر شده است.',
      searchText: 'آیا برای شرکت در دوره ها به پیش نیاز یا سابقه قبلی نیاز است مبانی فونداسیون پوش دهی اصولی وزگیری مو خطی اروپایی مبتدی پیشرفته'
    },
    {
      category: 'CERTIFICATES',
      question: 'گواهینامه پایان دوره چگونه صادر می‌شود و چطور قابل استعلام است؟',
      answer: 'پس از تکمیل جلسات دوره، گواهینامه معتبر دیجیتال آکادمی با شناسه یکتای اعتبارسنجی در حساب کاربری شما صادر می‌گردد. گواهینامه‌ها دارای بارکد و شناسه استعلام برخط غیرقابل جعل هستند.',
      searchText: 'گواهینامه پایان دوره چگونه صادر میشود و چطور قابل استعلام است مدرک دیپلم معتبر دیجیتال شناسه یکتا اعتبارسنجی استعلام آنلاین سالن داران کارفرمایان'
    },
    {
      category: 'SHOP',
      question: 'زمان ارسال سفارش‌های ابزار فیزیکی چقدر است؟',
      answer: 'سفارش‌های شهر تهران در همان روز کاری یا نهایتاً ۲۴ ساعت با پیک ویژه ارسال می‌گردند. برای شهرستان‌ها، مرسولات با پست پیشتاز و بسته‌بندی ایمن ضدضربه طی ۲ الی ۳ روز کاری تحویل می‌گردند.',
      searchText: 'زمان ارسال سفارش های ابزار فیزیکی چقدر است پست پیشتاز پیک تهران شهرستان باربری ضدضربه تحویل سریع'
    },
    {
      category: 'SHOP',
      question: 'آیا ابزارها و اسپری‌های مو دارای ضمانت اصالت هستند؟',
      answer: 'بله، تمامی محصولات موجود در فروشگاه شنیون مو (از برندهای معتبر نظیر Osis+، Silhouette و شانه و پین‌های حرفه‌ای) با ضمانت ۱۰۰٪ اورجینال بودن و تاریخ انقضای معتبر ارائه می‌شوند.',
      searchText: 'آیا ابزارها و اسپری های مو دارای ضمانت اصالت هستند اورجینال برند معتبر اوسیس تافت Silhouette شانه پین حرفه ای اصلی'
    },
    {
      category: 'WORKSHOPS',
      question: 'چگونه می‌توانم درخواست برگزاری ورکشاپ در شهر خودم را ثبت کنم؟',
      answer: 'در بخش کارگاه‌های حضوری یا از طریق دکمه «درخواست ورکشاپ»، می‌توانید شهر مورد نظرتان را به همراه تعداد نفرات انتخاب کنید. به محض رسیدن به حد نصاب، تیم هماهنگی آکادمی تاریخ و سالن را برنامه‌ریزی و به شما پیامک می‌فرستد.',
      searchText: 'چگونه میتوانم درخواست برگزاری ورکشاپ در شهر خودم را ثبت کنم کارگاه حضوری استانی حد نصاب تاریخ سالن پیامک مربی اصفهان شیراز مشهد تبریز'
    }
  ];

  // FAQ State
  const [faqCategory, setFaqCategory] = useState<'ALL' | 'COURSES' | 'SHOP' | 'CERTIFICATES' | 'WORKSHOPS'>('ALL');
  const [faqQuery, setFaqQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqList = useMemo(() => {
    return faqs && faqs.length > 0 ? faqs : faqItems;
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqList.filter((item) => {
      const matchCat = faqCategory === 'ALL' || item.category === faqCategory;
      const sText = item.searchText || '';
      const matchQuery =
        !faqQuery.trim() ||
        item.question.toLowerCase().includes(faqQuery.toLowerCase()) ||
        sText.toLowerCase().includes(faqQuery.toLowerCase()) ||
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(faqQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [faqCategory, faqQuery, faqList]);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 font-sans text-right">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'صفحه اصلی', onClick: onNavigateHome },
          { label: 'پرسش‌های متداول (FAQ)', isCurrent: true },
        ]}
      />

      {/* Hero Header */}
      <div className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-10 border border-[#EAE2D5] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#C59B63]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#87553B]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>پشتیبانی و راهنمای گیس‌آرا</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="text-[#59524A] font-medium">مرجع هنر استایلینگ مو در ایران</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#171614] tracking-tight leading-tight">
            مرکز پرسش‌های متداول و راهنمای هنرجویان
          </h1>
          <p className="text-xs sm:text-sm text-[#59524A] leading-relaxed">
            به دنبال پاسخ سریع برای انتخاب دوره‌ها، نحوه برگزاری کارگاه‌ها یا ارسال محصولات فروشگاه هستید؟ پاسخ‌های زیر بر اساس پرتکرارترین پرسش‌های هنرجویان آکادمی تدوین شده است.
          </p>
        </div>
      </div>

      {/* FAQ Filter & Search Bar */}
      <div className="p-4 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#968A7C] absolute right-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={faqQuery}
            onChange={(e) => setFaqQuery(e.target.value)}
            placeholder="جستجو در سوالات متداول..."
            className="w-full pr-9 pl-3 py-2 bg-white border border-[#EAE2D5] rounded-xl text-xs focus:outline-none focus:border-[#87553B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFaqCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              faqCategory === 'ALL' ? 'bg-[#87553B] text-white' : 'bg-[#F4EFE7] text-[#59524A] hover:text-[#171614]'
            }`}
          >
            همه سوالات
          </button>
          <button
            type="button"
            onClick={() => setFaqCategory('COURSES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              faqCategory === 'COURSES' ? 'bg-[#87553B] text-white' : 'bg-[#F4EFE7] text-[#59524A] hover:text-[#171614]'
            }`}
          >
            دوره‌ها
          </button>
          <button
            type="button"
            onClick={() => setFaqCategory('SHOP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              faqCategory === 'SHOP' ? 'bg-[#87553B] text-white' : 'bg-[#F4EFE7] text-[#59524A] hover:text-[#171614]'
            }`}
          >
            ابزار و ارسال
          </button>
          <button
            type="button"
            onClick={() => setFaqCategory('CERTIFICATES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              faqCategory === 'CERTIFICATES' ? 'bg-[#87553B] text-white' : 'bg-[#F4EFE7] text-[#59524A] hover:text-[#171614]'
            }`}
          >
            گواهینامه
          </button>
          <button
            type="button"
            onClick={() => setFaqCategory('WORKSHOPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              faqCategory === 'WORKSHOPS' ? 'bg-[#87553B] text-white' : 'bg-[#F4EFE7] text-[#59524A] hover:text-[#171614]'
            }`}
          >
            کارگاه‌های حضوری
          </button>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] p-6 text-xs text-[#59524A]">
            موردی مطابق با جستجوی شما یافت نشد. می‌توانید با پشتیبانی تلفنی مستقیم ما تماس حاصل فرمایید.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                  className="w-full min-h-[44px] p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer hover:bg-[#FAF6F0]/50 focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#171614] pr-2 faq-question" data-speakable="faq-question">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#87553B] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    data-speakable="faq-answer"
                    className="px-4 sm:px-5 pb-5 pt-1 text-xs text-[#59524A] leading-relaxed border-t border-[#EAE2D5]/40 faq-answer"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
