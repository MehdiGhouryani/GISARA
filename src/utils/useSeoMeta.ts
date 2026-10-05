/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dynamic SEO, AEO & GEO Meta Handler
 * Synchronizes document.title, meta descriptions, canonical URLs,
 * OpenGraph cards, Twitter cards, Speakable Specifications (AEO),
 * automatic dynamic BreadcrumbList schemas, and rich Schema.org JSON-LD graph.
 */

import { useEffect } from 'react';
import { StyleModel, Technique, Product, Course, Article, City, Instructor } from '../types/domain';

interface SeoProps {
  route: string;
  selectedStyle?: StyleModel | null;
  selectedTechnique?: Technique | null;
  selectedProduct?: Product | null;
  selectedCourse?: Course | null;
  selectedArticle?: Article | null;
  selectedCity?: City | null;
  selectedInstructor?: Instructor | null;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&h=630&q=80&fm=webp';
const BASE_URL = 'https://gisara.ir';

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function useSeoMeta({
  route,
  selectedStyle,
  selectedTechnique,
  selectedProduct,
  selectedCourse,
  selectedArticle,
  selectedCity,
  selectedInstructor,
}: SeoProps) {
  useEffect(() => {
    let title = 'گیس‌آرا (GisAra) – مرجع تخصصی آموزش شینیون، ابزار و مدل‌های مو';
    let description =
      'مرجع جامع شینیون مو در ایران؛ مسترکلاس‌های تخصصی آنلاین، ژورنال مدل‌های روز، معرفی ابزار حرفه‌ای و کارگاه‌های استانی با مدرسان تراز اول.';
    let ogImage = DEFAULT_IMAGE;
    let canonicalPath = '';

    // Array of breadcrumbs for automatic Schema.org BreadcrumbList generation
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'خانه', url: `${BASE_URL}/` },
    ];

    switch (route) {
      case 'home':
        title = 'گیس‌آرا – آکادمی و فروشگاه برتر شینیون';
        description =
          'گیس‌آرا آکادمی تخصصی شینیون مو در ایران است. دوره‌های آنلاین و ورکشاپ حضوری آموزش شینیون، ژورنال مدل‌ها و فروش آنلاین ابزار حرفه‌ای شینیون را در گیس‌آرا تجربه کنید.';
        canonicalPath = '';
        break;

      case 'styles':
        title = 'ژورنال تخصصی مدل‌های شینیون مو | گیس‌آرا';
        description =
          'مجموعه جدیدترین مدل‌های شینیون عروس، اروپایی، خطی، کلاسیک و کاغذی به همراه تحلیل ساختار مو و سطح مهارت.';
        canonicalPath = '/styles';
        breadcrumbs.push({ name: 'ژورنال مدل‌ها', url: `${BASE_URL}/styles` });
        break;

      case 'style-detail':
        breadcrumbs.push({ name: 'ژورنال مدل‌ها', url: `${BASE_URL}/styles` });
        if (selectedStyle) {
          title = `${selectedStyle.name} | ژورنال مدل‌های شینیون گیس‌آرا`;
          description = selectedStyle.summary || description;
          ogImage = selectedStyle.primaryImage || DEFAULT_IMAGE;
          canonicalPath = `/styles/${selectedStyle.slug}`;
          breadcrumbs.push({ name: selectedStyle.name, url: `${BASE_URL}/styles/${selectedStyle.slug}` });
        }
        break;

      case 'techniques':
        title = 'بانک تکنیک‌های تخصصی شینیون و موآرایی | گیس‌آرا';
        description =
          'آموزش گام‌به‌گام تکنیک‌های پایه‌ای و پیشرفته شینیون شامل وزگیری، لاین‌بندی، پوش دادن و فونداسیون‌سازی مو.';
        canonicalPath = '/techniques';
        breadcrumbs.push({ name: 'بانک تکنیک‌ها', url: `${BASE_URL}/techniques` });
        break;

      case 'technique-detail':
        breadcrumbs.push({ name: 'بانک تکنیک‌ها', url: `${BASE_URL}/techniques` });
        if (selectedTechnique) {
          title = `آموزش تکنیک ${selectedTechnique.name} | گیس‌آرا`;
          description = selectedTechnique.summary || description;
          canonicalPath = `/techniques/${selectedTechnique.slug}`;
          breadcrumbs.push({ name: selectedTechnique.name, url: `${BASE_URL}/techniques/${selectedTechnique.slug}` });
        }
        break;

      case 'courses':
        title = 'دوره آنلاین شینیون – آموزش ویدیویی و مدرک بین‌المللی';
        description =
          'آموزش قدم‌به‌قدم شینیون مو از پایه تا پیشرفته به صورت دوره ویدیویی. مدرسین حرفه‌ای، گواهی معتبر، دسترسی مادام‌العمر. مهارت شینیون را در منزل یاد بگیرید!';
        canonicalPath = '/courses';
        breadcrumbs.push({ name: 'دوره‌های آنلاین', url: `${BASE_URL}/courses` });
        break;

      case 'course-detail':
        breadcrumbs.push({ name: 'دوره‌های آنلاین', url: `${BASE_URL}/courses` });
        if (selectedCourse) {
          title = `دوره آموزشی ${selectedCourse.name} | آکادمی گیس‌آرا`;
          description = selectedCourse.summary || description;
          ogImage = selectedCourse.heroImage || DEFAULT_IMAGE;
          canonicalPath = `/courses/${selectedCourse.slug}`;
          breadcrumbs.push({ name: selectedCourse.name, url: `${BASE_URL}/courses/${selectedCourse.slug}` });
        }
        break;

      case 'learn-player':
        breadcrumbs.push({ name: 'دوره‌های آنلاین', url: `${BASE_URL}/courses` });
        breadcrumbs.push({ name: 'کلاس درس مجازی', url: `${BASE_URL}/learn` });
        title = 'کلاس درس مجازی و پخش ویدیوهای آموزشی | آکادمی گیس‌آرا';
        description = 'پخش آنلاین درس‌های آموزشی شینیون با وضوح بالا، جزوات تمرینی و پشتیبانی مدرسین.';
        canonicalPath = '/learn';
        break;

      case 'shop':
        title = 'فروشگاه ابزار شینیون – اسپری، تافت، سنجاق و تجهیزات سالنی';
        description =
          'خرید آنلاین ابزار حرفه‌ای شینیون (اسپری فیکساتور، تافت، سنجاق و ...) از گیس‌آرا. ضمانت اصالت و کیفیت بالا، ارسال سریع و قیمت مناسب برای آرایشگرها و علاقه‌مندان.';
        canonicalPath = '/shop';
        breadcrumbs.push({ name: 'فروشگاه ابزار', url: `${BASE_URL}/shop` });
        break;

      case 'product-detail':
        breadcrumbs.push({ name: 'فروشگاه ابزار', url: `${BASE_URL}/shop` });
        if (selectedProduct) {
          title = `خرید ${selectedProduct.name} | فروشگاه گیس‌آرا`;
          description = selectedProduct.summary || description;
          ogImage = selectedProduct.image || DEFAULT_IMAGE;
          canonicalPath = `/shop/${selectedProduct.slug}`;
          breadcrumbs.push({ name: selectedProduct.name, url: `${BASE_URL}/shop/${selectedProduct.slug}` });
        }
        break;

      case 'mag':
        if (selectedArticle) {
          breadcrumbs.push({ name: 'مجله تخصصی مو', url: `${BASE_URL}/mag` });
          title = `${selectedArticle.title} | مجله تخصصی مو گیس‌آرا`;
          description = selectedArticle.summary || description;
          ogImage = selectedArticle.heroImage || DEFAULT_IMAGE;
          canonicalPath = `/mag/${selectedArticle.slug}`;
          breadcrumbs.push({ name: selectedArticle.title, url: `${BASE_URL}/mag/${selectedArticle.slug}` });
        } else {
          title = 'مجله تخصصی شینیون، نکات استایلینگ و ترندهای مو | گیس‌آرا';
          description =
            'جدیدترین مقالات آموزشی پیرامون مراقبت از مو قبل از شینیون، تکنیک‌های دوام استایل و معرفی ترندهای بین‌المللی.';
          canonicalPath = '/mag';
          breadcrumbs.push({ name: 'مجله تخصصی مو', url: `${BASE_URL}/mag` });
        }
        break;

      case 'instructors':
        title = 'اساتید و مربیان رسمی شینیون | گیس‌آرا';
        description = 'آشنایی با برترین مدرسان کشوری شینیون و متدهای تدریس تخصصی در آکادمی گیس‌آرا.';
        canonicalPath = '/instructors';
        breadcrumbs.push({ name: 'اساتید و مربیان', url: `${BASE_URL}/instructors` });
        break;

      case 'instructor-detail':
        breadcrumbs.push({ name: 'اساتید و مربیان', url: `${BASE_URL}/instructors` });
        if (selectedInstructor) {
          title = `استاد ${selectedInstructor.name} | مربیان گیس‌آرا`;
          description = selectedInstructor.bio || description;
          ogImage = selectedInstructor.portrait || DEFAULT_IMAGE;
          canonicalPath = `/instructors/${selectedInstructor.id}`;
          breadcrumbs.push({ name: selectedInstructor.name, url: `${BASE_URL}/instructors/${selectedInstructor.id}` });
        }
        break;

      case 'cities':
        title = 'ورکشاپ حضوری شینیون – کارگاه تخصصی استانی';
        description =
          'کارگاه عملی شینیون مو در تهران و سایر شهرها توسط اساتید حرفه‌ای. آموزش حضوری تکنیک‌های روز، تمرین عملی و دریافت گواهی. بهترین فرصت رشد مهارت را از دست ندهید!';
        canonicalPath = '/cities';
        breadcrumbs.push({ name: 'ورکشاپ‌های حضوری', url: `${BASE_URL}/cities` });
        break;

      case 'city-detail':
        breadcrumbs.push({ name: 'ورکشاپ‌های حضوری', url: `${BASE_URL}/cities` });
        if (selectedCity) {
          title = `ورکشاپ حضوری شینیون در ${selectedCity.name} | آکادمی گیس‌آرا`;
          description = `کارگاه عملی آموزش حضوری شینیون مو در شهر ${selectedCity.name} توسط اساتید حرفه‌ای. ثبت‌نام و رزرو ظرفیت تمرین عملی به همراه مدرک معتبر.`;
          ogImage = selectedCity.image || DEFAULT_IMAGE;
          canonicalPath = `/cities/${selectedCity.slug}`;
          breadcrumbs.push({ name: `ورکشاپ ${selectedCity.name}`, url: `${BASE_URL}/cities/${selectedCity.slug}` });
        }
        break;

      case 'about':
        title = 'درباره ما – آکادمی و سالن تخصصی شینیون گیس‌آرا';
        description =
          'مرجع تخصصی آموزش شینیون مو در ایران، معرفی مؤسس، کادر آموزشی، ارزش‌ها، استانداردهای سالنی و آدرس شعب حضوری گیس‌آرا.';
        canonicalPath = '/about';
        breadcrumbs.push({ name: 'درباره ما', url: `${BASE_URL}/about` });
        break;

      case 'faq':
        title = 'مرکز پرسش‌های متداول (FAQ) و راهنمای هنرجویان | گیس‌آرا';
        description =
          'پاسخ‌های دقیق و سریع به متداول‌ترین پرسش‌های هنرجویان پیرامون دوره‌های آنلاین، مدرک معتبر و ابزار تخصصی شینیون.';
        canonicalPath = '/faq';
        breadcrumbs.push({ name: 'پرسش‌های متداول (FAQ)', url: `${BASE_URL}/faq` });
        break;

      case 'about-contact':
        title = 'درباره ما – آکادمی و سالن تخصصی شینیون گیس‌آرا';
        description =
          'اطلاعات تماس، آدرس شعب و کارگاه‌ها، فرم پشتیبانی و پاسخ به متداول‌ترین پرسش‌های هنرجویان و همکاران.';
        canonicalPath = '/about';
        breadcrumbs.push({ name: 'درباره ما', url: `${BASE_URL}/about` });
        break;

      case 'account':
        title = 'پیشخوان کاربری و دوره‌های آموزشی من | گیس‌آرا';
        description =
          'مشاهده سوابق سفارش‌ها، دسترسی به ویدیوهای دوره‌های خریداری‌شده و وضعیت درخواست‌های کارگاهی.';
        canonicalPath = '/account';
        breadcrumbs.push({ name: 'پیشخوان کاربری', url: `${BASE_URL}/account` });
        break;

      case 'checkout':
        title = 'تکمیل سفارش و تسویه‌حساب امن | گیس‌آرا';
        description = 'ثبت اطلاعات ارسال و پرداخت آنلاین مطمئن در فروشگاه تخصصی گیس‌آرا.';
        canonicalPath = '/checkout';
        breadcrumbs.push({ name: 'فروشگاه', url: `${BASE_URL}/shop` });
        breadcrumbs.push({ name: 'تسویه‌حساب', url: `${BASE_URL}/checkout` });
        break;

      case 'search':
        title = 'جستجو در آرشیو مدل‌ها، دوره‌ها و محصولات | گیس‌آرا';
        description = 'جستجوی هوشمند در بین صدها مدل شینیون، تکنیک آموزشی و تجهیزات سالنی.';
        canonicalPath = '/search';
        breadcrumbs.push({ name: 'جستجوی هوشمند', url: `${BASE_URL}/search` });
        break;

      default:
        break;
    }

    // 1. Update Document Title
    document.title = title;

    // Helper to safely set meta attribute
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.replace(/[\[\]]/g, '').split('=');
        el.setAttribute(attrName, attrVal.replace(/['"]/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // 2. Update Standard Meta Description
    setMetaTag('meta[name="description"]', 'content', description);

    // 3. Update OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:image"]', 'content', ogImage);
    const fullUrl = `${BASE_URL}${canonicalPath}`;
    setMetaTag('meta[property="og:url"]', 'content', fullUrl);

    // 4. Update Twitter Card Tags
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage);

    // 5. Update Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // 6. Dynamic BreadcrumbList Schema Generation
    const breadcrumbSchema = {
      '@type': 'BreadcrumbList',
      '@id': `${fullUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: b.name,
        item: b.url,
      })),
    };

    // 7. Dynamic Schema.org JSON-LD Injection for Google Rich Snippets & AEO Speakable
    let schemaScript = document.getElementById('gisara-dynamic-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'gisara-dynamic-schema');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    let pageEntitySchema: Record<string, unknown> | null = null;

    if (route === 'course-detail' && selectedCourse) {
      pageEntitySchema = {
        '@type': 'Course',
        '@id': `${fullUrl}#course`,
        name: selectedCourse.name,
        description: selectedCourse.summary,
        provider: {
          '@type': 'EducationalOrganization',
          '@id': 'https://gisara.ir/#organization',
          name: 'گیس‌آرا (GisAra)',
          sameAs: 'https://gisara.ir',
        },
        educationalLevel: selectedCourse.level,
        inLanguage: 'fa-IR',
        timeRequired: `PT${selectedCourse.durationMinutes}M`,
        offers: {
          '@type': 'Offer',
          price: selectedCourse.priceToman,
          priceCurrency: 'IRT',
          availability: 'https://schema.org/InStock',
          url: fullUrl,
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: `${selectedCourse.durationMinutes} دقیقه`,
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['[data-speakable="headline"]', '[data-speakable="summary"]', 'h1', 'p.course-summary'],
        },
      };
    } else if (route === 'product-detail' && selectedProduct) {
      pageEntitySchema = {
        '@type': 'Product',
        '@id': `${fullUrl}#product`,
        name: selectedProduct.name,
        image: selectedProduct.image,
        description: selectedProduct.summary,
        sku: selectedProduct.sku,
        inLanguage: 'fa-IR',
        brand: {
          '@type': 'Brand',
          name: selectedProduct.brand,
        },
        offers: {
          '@type': 'Offer',
          price: selectedProduct.priceToman,
          priceCurrency: 'IRT',
          availability:
            selectedProduct.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: fullUrl,
          seller: {
            '@type': 'EducationalOrganization',
            '@id': 'https://gisara.ir/#organization',
            name: 'گیس‌آرا (GisAra)',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: selectedProduct.rating,
          reviewCount: selectedProduct.reviewsCount,
        },
      };
    } else if (route === 'mag' && selectedArticle) {
      pageEntitySchema = {
        '@type': 'Article',
        '@id': `${fullUrl}#article`,
        headline: selectedArticle.title,
        description: selectedArticle.summary,
        image: selectedArticle.heroImage,
        author: {
          '@type': 'Person',
          name: selectedArticle.author?.name || 'تحریریه گیس‌آرا',
          jobTitle: selectedArticle.author?.role || 'مدرس شینیون',
        },
        publisher: {
          '@type': 'EducationalOrganization',
          '@id': 'https://gisara.ir/#organization',
          name: 'گیس‌آرا (GisAra)',
          url: 'https://gisara.ir',
        },
        datePublished: selectedArticle.publishedAt,
        inLanguage: 'fa-IR',
        mainEntityOfPage: fullUrl,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: [
            '[data-speakable="headline"]',
            '[data-speakable="summary"]',
            '.speakable-content',
          ],
        },
      };
    } else if (route === 'technique-detail' && selectedTechnique) {
      pageEntitySchema = {
        '@type': 'HowTo',
        '@id': `${fullUrl}#howto`,
        name: selectedTechnique.name,
        description: selectedTechnique.summary,
        totalTime: `PT${selectedTechnique.videoDurationMinutes || 15}M`,
        inLanguage: 'fa-IR',
        step: selectedTechnique.steps.map((st) => ({
          '@type': 'HowToStep',
          position: st.number,
          name: st.title,
          text: st.description,
        })),
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: [
            '[data-speakable="headline"]',
            '[data-speakable="summary"]',
            '.technique-step-title',
            '.technique-tip',
          ],
        },
      };
    } else if (route === 'style-detail' && selectedStyle) {
      pageEntitySchema = {
        '@type': 'CreativeWork',
        '@id': `${fullUrl}#style`,
        name: selectedStyle.name,
        description: selectedStyle.summary,
        image: selectedStyle.primaryImage,
        genre: selectedStyle.occasion,
        timeRequired: `PT${selectedStyle.approxMinutes}M`,
        inLanguage: 'fa-IR',
        creator: {
          '@type': 'EducationalOrganization',
          '@id': 'https://gisara.ir/#organization',
          name: 'گیس‌آرا (GisAra)',
        },
      };
    } else if (route === 'city-detail' && selectedCity) {
      pageEntitySchema = {
        '@type': 'EducationEvent',
        '@id': `${fullUrl}#event`,
        name: `ورکشاپ حضوری شینیون مو در ${selectedCity.name}`,
        description: selectedCity.description,
        image: selectedCity.image,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        inLanguage: 'fa-IR',
        location: {
          '@type': 'Place',
          name: `مرکز همایش‌ها و کارگاه‌های تخصصی گیس‌آرا شعبه ${selectedCity.name}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: selectedCity.name,
            addressRegion: selectedCity.province,
            addressCountry: 'IR',
          },
        },
        organizer: {
          '@type': 'EducationalOrganization',
          '@id': 'https://gisara.ir/#organization',
          name: 'گیس‌آرا (GisAra)',
          url: 'https://gisara.ir',
        },
        offers: {
          '@type': 'Offer',
          price: '3500000',
          priceCurrency: 'IRT',
          availability: 'https://schema.org/InStock',
          url: fullUrl,
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['[data-speakable="headline"]', '[data-speakable="description"]', 'h1'],
        },
      };
    } else if (route === 'instructor-detail' && selectedInstructor) {
      pageEntitySchema = {
        '@type': 'Person',
        '@id': `${fullUrl}#instructor`,
        name: selectedInstructor.name,
        jobTitle: selectedInstructor.specialty,
        description: selectedInstructor.bio,
        image: selectedInstructor.portrait,
        worksFor: {
          '@type': 'EducationalOrganization',
          '@id': 'https://gisara.ir/#organization',
          name: 'گیس‌آرا (GisAra)',
        },
        knowsAbout: [
          'شینیون تخصصی مو',
          'شینیون‌های ژورنالی و عروس',
          'متدهای نوین استایلینگ مو',
        ],
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          name: 'مستر بین‌المللی شینیون و مربی رسمی آکادمی',
        },
      };
    } else if (route === 'about') {
      pageEntitySchema = {
        '@type': 'AboutPage',
        '@id': `${fullUrl}#about`,
        name: 'درباره آکادمی و سالن تخصصی شینیون گیس‌آرا',
        description: 'مرجع تخصصی و آکادمی پیشرفته آموزش شینیون مو، مسترکلاس‌های بین‌المللی و ملزومات سالنی در ایران.',
        url: fullUrl,
        mainEntity: {
          '@type': 'EducationalOrganization',
          '@id': 'https://gisara.ir/#organization',
          name: 'گیس‌آرا (GisAra)',
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['[data-speakable="headline"]', '[data-speakable="summary"]', 'h1', 'p'],
        },
      };
    } else if (route === 'faq' || route === 'about-contact') {
      pageEntitySchema = {
        '@type': 'FAQPage',
        '@id': `${fullUrl}#faq`,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: [
            '[data-speakable="faq-question"]',
            '[data-speakable="faq-answer"]',
            '.faq-question',
            '.faq-answer',
          ],
        },
        mainEntity: [
          {
            '@type': 'Question',
            name: 'آیا دوره‌های آنلاین گیس‌آرا دارای مدرک بین‌المللی هستند؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'بله، پس از پایان تمرینات هر دوره آنلاین و تأیید مربی مربوطه، مدرک دیجیتال دارای کد رهگیری اختصاصی و QR معتبر از آکادمی گیس‌آرا صادر می‌گردد.',
            },
          },
          {
            '@type': 'Question',
            name: 'نحوه ارسال ابزار و مواد مصرفی به شهرستان‌ها چگونه است؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'کلیه سفارش‌های فروشگاه به وسیله پست پیشتاز و تیپاکس با بسته‌بندی ضدضربه در سراسر کشور ارسال می‌گردد و کد رهگیری پستی به شماره همراه خریدار پیامک می‌شود.',
            },
          },
          {
            '@type': 'Question',
            name: 'شرایط برگزاری ورکشاپ‌های حضوری در شهرهای مختلف چیست؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'با رسیدن درخواست‌های ثبت‌شده در هر شهر به حدنصاب ۲۰ نفر، هماهنگی‌های لازم با اساتید کشوری انجام شده و تاریخ دقیق از طریق پیامک به متقاضیان اطلاع‌رسانی می‌گردد.',
            },
          },
        ],
      };
    }

    // 8. Inject combined @graph schema (Breadcrumbs + Route Entity)
    const graphItems: Record<string, unknown>[] = [breadcrumbSchema];
    if (pageEntitySchema) {
      graphItems.push(pageEntitySchema);
    }

    const completeGraph = {
      '@context': 'https://schema.org',
      '@graph': graphItems,
    };

    schemaScript.textContent = JSON.stringify(completeGraph);
  }, [
    route,
    selectedStyle,
    selectedTechnique,
    selectedProduct,
    selectedCourse,
    selectedArticle,
    selectedCity,
    selectedInstructor,
  ]);
}
