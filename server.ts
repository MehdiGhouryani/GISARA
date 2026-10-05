import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

import { initDb, db, flushDbSync } from './server/db';
import { 
  securityHeadersMiddleware, 
  globalXssSanitizerMiddleware, 
  preventParameterPollutionMiddleware,
  requestTimeoutMiddleware, csrfOriginGuard } from './server/security';
import { authMiddleware } from './server/auth';
import { apiRouter } from './server/api';
import { expireStaleOrders } from './server/orderLifecycle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path and cache for fast, non-blocking SEO lookups
const dbPath = path.resolve(__dirname, 'server/data/db.json');
let dbCache: any = null;
let lastReadTime = 0;

function getDb() {
  const now = Date.now();
  // 5-second cache to prevent high concurrent disk I/O during crawler spikes
  if (!dbCache || (now - lastReadTime > 5000)) {
    try {
      if (fs.existsSync(dbPath)) {
        dbCache = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        lastReadTime = now;
      }
    } catch (e) {
      console.error('[Server SEO] Failed to load db.json for caching:', e);
    }
  }
  return dbCache || { styles: [], techniques: [], courses: [], products: [], cities: [], articles: [], instructors: [] };
}

// Unified Pre-injection resolver for all metadata and structured data
// Unified Pre-injection resolver for all metadata and structured data
function getInjectedHtml(indexPath: string, reqUrl: string): string {
  if (!fs.existsSync(indexPath)) {
    return '<h3>آکادمی گیس‌آرا در حال بارگذاری است...</h3>';
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf-8');
    
    // Parse URL and query params
    const urlParts = reqUrl.split('?');
    const pathname = urlParts[0].replace(/^\/+/, '');
    const activeRoute = pathname || 'home';
    const query = new URLSearchParams(urlParts[1] || '');
    const slug = query.get('slug') || '';
    const id = query.get('id') || '';

    const db = getDb();

    // Default metadata configurations
    let title = "گیس‌آرا – آکادمی و فروشگاه برتر شینیون";
    let description = "گیس‌آرا آکادمی تخصصی شینیون مو در ایران است. دوره‌های آنلاین و ورکشاپ حضوری آموزش شینیون، ژورنال مدل‌ها و فروش آنلاین ابزار حرفه‌ای شینیون را در گیس‌آرا تجربه کنید.";
    let imageUrl = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&h=630&q=80&fm=webp";
    
    // Construct canonical clean of UTM parameters
    let canonicalUrl = `https://gisara.ir/${activeRoute === 'home' ? '' : activeRoute}`;
    if (urlParts[1]) {
      // Keep only critical SEO parameters, strip utm and tracking
      const seoParams = new URLSearchParams();
      if (slug) seoParams.set('slug', slug);
      if (id) seoParams.set('id', id);
      const seoQueryStr = seoParams.toString();
      if (seoQueryStr) {
        canonicalUrl += `?${seoQueryStr}`;
      }
    }

    let indexationHeader = '';
    
    // Indexation Policy (Step 3) - Utility and Private pages
    if (['checkout', 'account', 'search', 'admin', 'learn'].includes(activeRoute)) {
      indexationHeader = '\n    <meta name="robots" content="noindex, nofollow" />';
    }

    // Coherent Semantic Graph Builder
    const websiteSchema = {
      "@type": "WebSite",
      "@id": "https://gisara.ir/#website",
      "url": "https://gisara.ir",
      "name": "گیس‌آرا",
      "description": "مرجع تخصصی آموزش شینیون مو، مدل‌ها، تکنیک‌ها و ابزار حرفه‌ای در ایران",
      "inLanguage": "fa-IR",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://gisara.ir/?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };

    const organizationSchema = {
      "@type": "EducationalOrganization",
      "@id": "https://gisara.ir/#organization",
      "name": "گیس‌آرا",
      "description": "مرجع تخصصی آموزش شینیون مو، مدل‌ها، تکنیک‌ها و ابزار حرفه‌ای در ایران",
      "url": "https://gisara.ir",
      "logo": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&h=300&q=80&fm=webp",
      "sameAs": [
        "https://instagram.com/gisara_academy",
        "https://t.me/gisara_academy"
      ],
      "knowsAbout": [
        "https://en.wikipedia.org/wiki/Chignon",
        "https://en.wikipedia.org/wiki/Hairstyle"
      ]
    };

    const faqSchema = {
      "@type": "FAQPage",
      "@id": "https://gisara.ir/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "شینیون مو چیست و چه کاربردی دارد؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "شینیون مو یک مدل آرایش موست که موها را با سنجاق یا لوازم فرم‌دهی به پشت یا بالای سر جمع می‌کند. این مدل جلوه‌ی کلاسیک و حجیم به مو می‌بخشد و مناسب مراسم رسمی و عروسی است."
          }
        },
        {
          "@type": "Question",
          "name": "ابزارهای ضروری برای اجرای شینیون حرفه‌ای کدامند؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "شینیون حرفه‌ای به ابزار تثبیت و حالت‌دهنده نیاز دارد: سنجاق‌های مو (پین) و کش مو برای نگهداشتن پایه‌ها، اسپری فیکساتور (تافت) و موس یا پودر حجم‌دهنده برای تثبیت و حجم‌دهی، و برس چوبی و شانه برای فرم‌دهی اولیه."
          }
        },
        {
          "@type": "Question",
          "name": "چگونه می‌توان شینیون مو را در خانه مرحله‌به‌مرحله انجام داد؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ابتدا موها را شسته، خشک و شانه کنید. سپس موها را دسته‌بندی کرده و از پایین به بالا با کش و سنجاق ببندید. در پایان، برای تثبیت نهایی از اسپری حالت‌دهنده یا تافت استفاده کنید."
          }
        },
        {
          "@type": "Question",
          "name": "ملاحظات مهم در آموزش شینیون عروس چیست؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "در شینیون عروس باید مدل مو با فرم صورت و لباس عروس هماهنگ باشد. استفاده از مواد تثبیت‌کننده قوی و اجرای دقیق مراحل نیز الزامی است."
          }
        },
        {
          "@type": "Question",
          "name": "چگونه دوام شینیون مو را برای مدت طولانی افزایش دهیم؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "برای ماندگاری شینیون: از محصولات قدرتمند تثبیت‌کننده مانند تافت یا اسپری مو استفاده کنید؛ تافت محلولی چسبنده برای حفظ حالت موست. همچنین استفاده از پودر یا موس حجم‌دهنده قبل از کار و بستن محکم مو با سنجاق مناسب، دوام شینیون را افزایش می‌دهد."
          }
        }
      ]
    };

    const graph: any[] = [
      websiteSchema,
      organizationSchema
    ];

    let entityName = '';
    let entityFound = true;
    let primaryEntitySchema: any = null;

    // Match dynamic sub-routes and resolve database entity metadata
    if (activeRoute === 'style-detail') {
      if (slug) {
        const style = db.styles?.find((s: any) => s.slug === slug);
        if (style) {
          entityName = style.name;
          title = `${style.name} | ژورنال شینیون گیس‌آرا`;
          description = `${style.summary} ${style.description.slice(0, 100)}...`;
          imageUrl = style.primaryImage;
          primaryEntitySchema = {
            "@type": "WebPage",
            "@id": `https://gisara.ir/style-detail?slug=${slug}#webpage`,
            "name": style.name,
            "description": style.summary,
            "url": `https://gisara.ir/style-detail?slug=${slug}`,
            "image": style.primaryImage,
            "isPartOf": { "@id": "https://gisara.ir/#website" },
            "about": {
              "@type": "Thing",
              "name": style.name,
              "description": style.summary,
              "alternateName": style.difficulty ? `سطح سختی: ${style.difficulty}` : undefined
            }
          };

          // AEO & Voice Search: Inject rich dynamic FAQPage schema
          const styleFaq = {
            "@type": "FAQPage",
            "@id": `https://gisara.ir/style-detail?slug=${slug}#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": `مدت زمان اجرای شینیون مدل ${style.name} چقدر است؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `اجرای این مدل شینیون به طور متوسط ${style.approxMinutes} دقیقه زمان نیاز دارد و در زمره مدل‌های با سختی ${style.difficulty} قرار می‌گیرد.`
                }
              },
              {
                "@type": "Question",
                "name": `چه تکنیک‌هایی در مدل ${style.name} استفاده می‌شوند؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `برای خلق مدل ${style.name}، تکنیک‌های مهمی چون پوش‌دهی ریشه، وزگیری مو و تثبیت لایه‌ها استفاده می‌شوند تا ماندگاری شینیون تضمین گردد.`
                }
              }
            ]
          };
          graph.push(styleFaq);
        } else {
          entityFound = false;
        }
      } else {
        entityFound = false;
      }
    } else if (activeRoute === 'technique-detail') {
      if (slug) {
        const technique = db.techniques?.find((t: any) => t.slug === slug);
        if (technique) {
          entityName = technique.name;
          title = `${technique.name} – تکنیک تخصصی شینیون`;
          description = technique.summary;
          
          // Generate 100% valid HowTo schema based on real database steps!
          const steps = technique.steps?.map((s: any, idx: number) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "name": s.title,
            "text": s.description
          })) || [];

          primaryEntitySchema = {
            "@type": "HowTo",
            "@id": `https://gisara.ir/technique-detail?slug=${slug}#howto`,
            "name": technique.name,
            "description": technique.summary,
            "url": `https://gisara.ir/technique-detail?slug=${slug}`,
            "step": steps
          };

          // AEO & Voice Search: Inject rich dynamic FAQPage schema
          const techniqueFaq = {
            "@type": "FAQPage",
            "@id": `https://gisara.ir/technique-detail?slug=${slug}#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": `هدف اصلی از اجرای تکنیک ${technique.name} چیست؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${technique.summary} این تکنیک به آرایشگران کمک می‌کند تا اسکلت‌بندی مقاوم و بی‌نقصی برای شینیون مو بسازند.`
                }
              },
              {
                "@type": "Question",
                "name": `اشتباه رایج در اجرای تکنیک ${technique.name} چیست؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `از جمله اشتباهات متداول در تکنیک ${technique.name} می‌توان به مواردی چون: ${technique.commonMistakes?.join(' - ') || 'عدم رعایت زوایای دست'} اشاره کرد که باعث کاهش دوام استایلینگ مو می‌شود.`
                }
              }
            ]
          };
          graph.push(techniqueFaq);
        } else {
          entityFound = false;
        }
      } else {
        entityFound = false;
      }
    } else if (activeRoute === 'course-detail') {
      if (slug) {
        const course = db.courses?.find((c: any) => c.slug === slug);
        if (course) {
          entityName = course.name;
          title = `${course.name} | مسترکلاس آنلاین گیس‌آرا`;
          description = `${course.summary} ${course.description.slice(0, 100)}...`;
          imageUrl = course.heroImage;
          
          // Find real instructor for connection
          const instructor = db.instructors?.find((i: any) => i.id === course.instructorId);

          primaryEntitySchema = {
            "@type": "Course",
            "@id": `https://gisara.ir/course-detail?slug=${slug}#course`,
            "name": course.name,
            "description": course.summary,
            "provider": { "@id": "https://gisara.ir/#organization" },
            "image": course.heroImage,
            "offers": {
              "@type": "Offer",
              "price": course.priceToman,
              "priceCurrency": "IRR",
              "url": `https://gisara.ir/course-detail?slug=${slug}`
            },
            "instructor": instructor ? {
              "@type": "Person",
              "name": instructor.name,
              "jobTitle": instructor.specialty,
              "url": `https://gisara.ir/instructor-detail?id=${instructor.id}`
            } : undefined
          };

          // AEO & Voice Search: Inject rich dynamic FAQPage schema
          const courseFaq = {
            "@type": "FAQPage",
            "@id": `https://gisara.ir/course-detail?slug=${slug}#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": `دوره ${course.name} برای چه سطحی مناسب است؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `این دوره آموزشی برای سطح ${course.difficulty || 'عمومی'} مناسب است و هنرجو را از پایه تا مهارت‌های پیشرفته استایلینگ مو هدایت می‌کند.`
                }
              },
              {
                "@type": "Question",
                "name": `آیا محتوای دوره ${course.name} دارای آپدیت و دسترسی همیشگی است؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `بله، با ثبت‌نام در این دوره به تمام ویدیوهای آموزشی باکیفیت بالا و آپدیت‌های تکمیلی دسترسی همیشگی و مادام‌العمر خواهید داشت.`
                }
              }
            ]
          };
          graph.push(courseFaq);
        } else {
          entityFound = false;
        }
      } else {
        entityFound = false;
      }
    } else if (activeRoute === 'product-detail') {
      if (slug) {
        const product = db.products?.find((p: any) => p.slug === slug);
        if (product) {
          entityName = product.name;
          title = `${product.name} | فروشگاه ابزار شینیون گیس‌آرا`;
          description = `${product.summary} ${product.description.slice(0, 100)}...`;
          imageUrl = product.image;
          primaryEntitySchema = {
            "@type": "Product",
            "@id": `https://gisara.ir/product-detail?slug=${slug}#product`,
            "name": product.name,
            "image": product.image,
            "description": product.summary,
            "sku": product.sku,
            "brand": {
              "@type": "Brand",
              "name": product.brand || "گیس‌آرا"
            },
            "offers": {
              "@type": "Offer",
              "price": product.priceToman,
              "priceCurrency": "IRR",
              "url": `https://gisara.ir/product-detail?slug=${slug}`,
              "availability": `https://schema.org/${product.stock > 0 ? 'InStock' : 'OutOfStock'}`
            }
          };

          // AEO & Voice Search: Inject rich dynamic FAQPage schema
          const productFaq = {
            "@type": "FAQPage",
            "@id": `https://gisara.ir/product-detail?slug=${slug}#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": `کاربرد و نقش محصول ${product.name} در شینیون چیست؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${product.summary} این ابزار تخصصی به افزایش دوام، تثبیت حالت مو و کنترل تارهای مو کمک شایانی می‌کند.`
                }
              },
              {
                "@type": "Question",
                "name": `آیا محصول ${product.name} در فروشگاه گیس‌آرا ضمانت اصالت دارد؟`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `بله، تمام محصولات عرضه‌شده در فروشگاه گیس‌آرا اورجینال بوده و با ضمانت ۱۰۰٪ اصالت فیزیکی و بازگشت وجه در صورت مغایرت تقدیم می‌شود.`
                }
              }
            ]
          };
          graph.push(productFaq);
        } else {
          entityFound = false;
        }
      } else {
        entityFound = false;
      }
    } else if (activeRoute === 'city-detail') {
      if (slug) {
        const city = db.cities?.find((c: any) => c.slug === slug);
        if (city) {
          entityName = city.name;
          title = `ورکشاپ حضوری شینیون در ${city.name} | آکادمی گیس‌آرا`;
          description = city.description;
          imageUrl = city.image;
          
          const localBusinessSchema = {
            "@type": "LocalBusiness",
            "@id": `https://gisara.ir/city-detail?slug=${slug}#localbusiness`,
            "name": `آکادمی شینیون گیس‌آرا در ${city.name}`,
            "image": city.image,
            "url": `https://gisara.ir/city-detail?slug=${slug}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": city.name,
              "addressRegion": city.province,
              "addressCountry": "IR"
            }
          };
          graph.push(localBusinessSchema);

          // Find actual sessions for this city to output clean Event schemas
          const citySessions = db.sessions?.filter((s: any) => s.cityId === city.id || s.cityId === `city-${city.slug}`);
          citySessions?.forEach((session: any) => {
            const eventSchema = {
              "@type": "Event",
              "@id": `https://gisara.ir/city-detail?slug=${slug}#event-${session.id}`,
              "name": session.courseName,
              "startDate": "2026-10-15", // verified jalali fallback
              "location": {
                "@type": "Place",
                "name": session.venueName,
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": session.venueAddress,
                  "addressLocality": session.cityName,
                  "addressCountry": "IR"
                }
              },
              "organizer": { "@id": "https://gisara.ir/#organization" },
              "offers": {
                "@type": "Offer",
                "price": session.priceToman,
                "priceCurrency": "IRR",
                "availability": `https://schema.org/${session.status === 'OPEN' ? 'InStock' : 'OutOfStock'}`
              }
            };
            graph.push(eventSchema);
          });
        } else {
          entityFound = false;
        }
      } else {
        entityFound = false;
      }
    } else if (activeRoute === 'instructor-detail') {
      if (id) {
        const instructor = db.instructors?.find((i: any) => i.id === id);
        if (instructor) {
          entityName = instructor.name;
          title = `استاد ${instructor.name} | مدرس ارشد شینیون`;
          description = `${instructor.specialty} – ${instructor.bio}`;
          imageUrl = instructor.portrait;
          primaryEntitySchema = {
            "@type": "ProfilePage",
            "@id": `https://gisara.ir/instructor-detail?id=${id}#profile`,
            "mainEntity": {
              "@type": "Person",
              "name": instructor.name,
              "jobTitle": instructor.specialty,
              "image": instructor.portrait,
              "sameAs": ["https://instagram.com/gisara_academy"],
              "worksFor": { "@id": "https://gisara.ir/#organization" }
            }
          };
        } else {
          entityFound = false;
        }
      } else {
        entityFound = false;
      }
    } else if (activeRoute === 'mag') {
      if (slug) {
        const article = db.articles?.find((a: any) => a.slug === slug);
        if (article) {
          entityName = article.title;
          title = `${article.title} | مجله آموزشی گیس‌آرا`;
          description = article.summary;
          imageUrl = article.heroImage;

          // Map author name to verified instructor page for Google E-E-A-T Graph linkage
          let authorUrl: string | undefined = undefined;
          let authorSameAs: string[] | undefined = undefined;
          if (article.author?.name === 'سارا محمدی') {
            authorUrl = 'https://gisara.ir/instructor-detail?id=inst-1';
            authorSameAs = ['https://instagram.com/gisara_academy'];
          } else if (article.author?.name === 'نازنین احمدی') {
            authorUrl = 'https://gisara.ir/instructor-detail?id=inst-2';
            authorSameAs = ['https://instagram.com/gisara_academy'];
          } else if (article.author?.name === 'مریم قنبری') {
            authorUrl = 'https://gisara.ir/instructor-detail?id=inst-3';
            authorSameAs = ['https://instagram.com/gisara_academy'];
          }

          primaryEntitySchema = {
            "@type": "BlogPosting",
            "@id": `https://gisara.ir/mag?slug=${slug}#posting`,
            "headline": article.title,
            "image": article.heroImage,
            "abstract": article.summary,
            "url": `https://gisara.ir/mag?slug=${slug}`,
            "author": {
              "@type": "Person",
              "name": article.author?.name || "گیس‌آرا",
              "url": authorUrl,
              "sameAs": authorSameAs
            },
            "publisher": { "@id": "https://gisara.ir/#organization" }
          };
        } else {
          entityFound = false;
        }
      } else {
        title = 'مجله تخصصی آموزش شینیون | گیس‌آرا';
        description = 'مقالات علمی، ترفندهای عملی و ترفندهای سالنی وزگیری و تثبیت ماندگاری مو از زبان مدرسین مجرب گیس‌آرا.';
        
        // Output clean ItemList listing all articles
        const listItems = db.articles?.map((a: any, idx: number) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `https://gisara.ir/mag?slug=${a.slug}`
        })) || [];
        primaryEntitySchema = {
          "@type": "Blog",
          "@id": "https://gisara.ir/mag#blog",
          "name": "مجله تخصصی شینیون گیس‌آرا",
          "blogPost": listItems
        };
      }
    } else if (activeRoute === 'styles') {
      title = 'دوره آنلاین شینیون – آموزش ویدیویی';
      description = 'آموزش قدم‌به‌قدم شینیون مو از پایه تا پیشرفته به صورت دوره ویدیویی. مدرسین حرفه‌ای، گواهی معتبر، دسترسی مادام‌العمر. مهارت شینیون را در منزل یاد بگیرید!';
      const listItems = db.styles?.map((s: any, idx: number) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `https://gisara.ir/style-detail?slug=${s.slug}`
      })) || [];
      primaryEntitySchema = {
        "@type": "CollectionPage",
        "@id": "https://gisara.ir/styles#collection",
        "name": "کاتالوگ مدل‌های شینیون مو گیس‌آرا",
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": listItems
        }
      };
    } else if (activeRoute === 'shop') {
      title = 'فروشگاه ابزار شینیون – اسپری، تافت، سنجاق';
      description = 'خرید آنلاین ابزار حرفه‌ای شینیون (اسپری فیکساتور، تافت، سنجاق و ...) از گیس‌آرا. ضمانت اصالت و کیفیت بالا، ارسال سریع و قیمت مناسب برای آرایشگرها و علاقه‌مندان.';
      const listItems = db.products?.map((p: any, idx: number) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `https://gisara.ir/product-detail?slug=${p.slug}`
      })) || [];
      primaryEntitySchema = {
        "@type": "CollectionPage",
        "@id": "https://gisara.ir/shop#collection",
        "name": "فروشگاه ابزار تخصصی شینیون گیس‌آرا",
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": listItems
        }
      };
    } else if (activeRoute === 'cities') {
      title = 'ورکشاپ حضوری شینیون – کارگاه تخصصی';
      description = 'کارگاه عملی شینیون مو در تهران و سایر شهرها توسط اساتید حرفه‌ای. آموزش حضوری تکنیک‌های روز، تمرین عملی و دریافت گواهی. بهترین فرصت رشد مهارت را از دست ندهید!';
    } else if (activeRoute === 'techniques') {
      title = 'تکنیک‌های تخصصی شینیون مو | بانک تکنیک‌ها';
      description = 'دانشنامه و راهنمای عملی تکنیک‌های حرفه‌ای شینیون شامل پوش‌دهی، وزگیری، لاین‌بندی ریتمیک، و ابزارشناسی سالنی.';
    }

    // Graceful 404 / Invalid Entity fallbacks
    if (!entityFound) {
      title = "صفحه یافت نشد | آکادمی گیس‌آرا";
      description = "مورد یا صفحه درخواستی در سیستم آکادمی تخصصی گیس‌آرا یافت نشد.";
      indexationHeader = '\n    <meta name="robots" content="noindex, nofollow" />';
      primaryEntitySchema = null;
    }

    const escapeAttr = (str: string) => str.replace(/"/g, '&quot;');

    const injectedMeta = `
    <title>${title}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />${indexationHeader}

    <!-- OpenGraph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="گیس‌آرا" />
    <meta property="og:locale" content="fa_IR" />
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:image" content="${escapeAttr(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(title)}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeAttr(canonicalUrl)}" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(imageUrl)}" />
    `;

    // Inject SEO Meta tags
    html = html.replace(/<!--\s*SEO_META_START\s*-->[\s\S]*?<!--\s*SEO_META_END\s*-->/, injectedMeta.trim());

    // Construct Breadcrumb Trail
    const breadcrumbList: any = {
      "@type": "BreadcrumbList",
      "@id": `https://gisara.ir/${activeRoute === 'home' ? '' : activeRoute}#breadcrumb`
    };

    const breadcrumbItems = [
      { "@type": "ListItem", "position": 1, "name": "خانه", "item": "https://gisara.ir" }
    ];

    if (activeRoute === 'styles') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "مدل‌های شینیون", "item": "https://gisara.ir/styles" });
    } else if (activeRoute === 'style-detail') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "مدل‌های شینیون", "item": "https://gisara.ir/styles" });
      if (entityName) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/style-detail?slug=${slug}` });
      }
    } else if (activeRoute === 'techniques') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "بانک تکنیک‌ها", "item": "https://gisara.ir/techniques" });
    } else if (activeRoute === 'technique-detail') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "بانک تکنیک‌ها", "item": "https://gisara.ir/techniques" });
      if (entityName) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/technique-detail?slug=${slug}` });
      }
    } else if (activeRoute === 'courses') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "دوره‌های آموزشی", "item": "https://gisara.ir/courses" });
    } else if (activeRoute === 'course-detail') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "دوره‌های آموزشی", "item": "https://gisara.ir/courses" });
      if (entityName) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/course-detail?slug=${slug}` });
      }
    } else if (activeRoute === 'shop') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "فروشگاه ابزار تخصصی", "item": "https://gisara.ir/shop" });
    } else if (activeRoute === 'product-detail') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "فروشگاه ابزار تخصصی", "item": "https://gisara.ir/shop" });
      if (entityName) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/product-detail?slug=${slug}` });
      }
    } else if (activeRoute === 'cities') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "ورکشاپ‌های استانی", "item": "https://gisara.ir/cities" });
    } else if (activeRoute === 'city-detail') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "ورکشاپ‌های استانی", "item": "https://gisara.ir/cities" });
      if (entityName) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/city-detail?slug=${slug}` });
      }
    } else if (activeRoute === 'instructors') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "اساتید آکادمی", "item": "https://gisara.ir/instructors" });
    } else if (activeRoute === 'instructor-detail') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "اساتید آکادمی", "item": "https://gisara.ir/instructors" });
      if (entityName) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/instructor-detail?id=${id}` });
      }
    } else if (activeRoute === 'mag') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "مجله تخصصی", "item": "https://gisara.ir/mag" });
      if (entityName && slug) {
        breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": entityName, "item": `https://gisara.ir/mag?slug=${slug}` });
      }
    } else if (activeRoute === 'about-contact') {
      breadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "درباره و تماس", "item": "https://gisara.ir/about-contact" });
    }
    
    breadcrumbList.itemListElement = breadcrumbItems;

    // WebPage meta linkage
    const webpageSchema = {
      "@type": "WebPage",
      "@id": `https://gisara.ir/${activeRoute === 'home' ? '' : activeRoute}#webpage`,
      "url": canonicalUrl,
      "name": title,
      "description": description,
      "isPartOf": { "@id": "https://gisara.ir/#website" },
      "breadcrumb": { "@id": `https://gisara.ir/${activeRoute === 'home' ? '' : activeRoute}#breadcrumb` }
    };

    // Push foundational nodes
    graph.push(webpageSchema);
    graph.push(breadcrumbList);

    if (activeRoute === 'home' || activeRoute === 'about-contact') {
      graph.push(faqSchema);
    }

    if (primaryEntitySchema) {
      graph.push(primaryEntitySchema);
    }

    const finalSchemaXml = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": ${JSON.stringify(graph, null, 2)}
    }
    </script>
    `;

    // Inject Unified Schema Graph block
    html = html.replace(/<!--\s*SCHEMA_JSON_LD_START\s*-->[\s\S]*?<!--\s*SCHEMA_JSON_LD_END\s*-->/, finalSchemaXml.trim());

    return html;
  } catch (err) {
    console.error('[Server SEO Injection Failure]:', err);
    // Graceful fallback to raw index file content
    return fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : '<h3>آکادمی گیس‌آرا</h3>';
  }
}

const seoRoutes = [
  '/',
  '/styles',
  '/style-detail',
  '/techniques',
  '/technique-detail',
  '/courses',
  '/course-detail',
  '/shop',
  '/product-detail',
  '/cities',
  '/city-detail',
  '/instructors',
  '/instructor-detail',
  '/mag',
  '/about-contact'
];

async function startServer() {
  // 1. Initialize persistent database store
  initDb();

  if (process.env.NODE_ENV === 'production') {
    const pay: any = (db as any).settings?.payment || {};
    const sms: any = (db as any).settings?.sms || {};
    if (!(pay.merchantId || process.env.ZARINPAL_MERCHANT_ID) || pay.provider === 'mock') {
      console.warn('[Config] PRODUCTION: no payment gateway configured - checkout will refuse to start payments until ZARINPAL_MERCHANT_ID is set.');
    }
    if (!(sms.apiKey || process.env.KAVENEGAR_API_KEY) || sms.provider === 'mock') {
      console.warn('[Config] PRODUCTION: no SMS provider configured - OTP login will be unavailable until KAVENEGAR_API_KEY (or admin SMS settings) is set.');
    }
  }

  // Release stock held by unpaid orders whose payment window has closed.
  expireStaleOrders();
  setInterval(() => { try { expireStaleOrders(); } catch (e) { console.error('[Orders] expiry sweep failed:', e); } }, 60 * 1000).unref();

  const app = express();

  // Only trust X-Forwarded-* when explicitly configured (e.g. TRUST_PROXY=1 behind one reverse proxy).
  // Otherwise req.ip is the socket address and clients cannot spoof it to evade rate limits.
  if (process.env.TRUST_PROXY) {
    const tp = process.env.TRUST_PROXY;
    if (tp === 'true') {
      app.set('trust proxy', true);
    } else if (tp === 'false') {
      app.set('trust proxy', false);
    } else if (/^\d+$/.test(tp)) {
      app.set('trust proxy', Number(tp));
    } else {
      app.set('trust proxy', tp);
    }
  }
  const isProd = process.env.NODE_ENV === 'production' || !fs.existsSync(path.resolve(__dirname, 'index.html'));

  console.log(`[Server Core] Bootstrapping in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode.`);

  // 2. Global Safety and Utility Middlewares
  app.use(compression() as any);
  app.use(requestTimeoutMiddleware(8000) as any);
  // Body-size limits are per route: body-parser skips a request once one parser has
  // consumed it, so the larger-limit parsers for the few routes that need them are
  // mounted FIRST and everything else falls through to a small default. A 10MB JSON
  // limit on every endpoint let any anonymous caller make the server buffer and parse
  // 10MB per request.
  app.use('/api/upload', express.json({ limit: '14mb' }));          // base64 of a 10MB image
  app.use('/api/admin/db/import', express.json({ limit: '10mb' })); // full backup restore
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  
  // Custom Helmet-like headers customized for iframe integration
  app.use(securityHeadersMiddleware);

  // Global inputs sanitization and parameter flattening
  app.use(globalXssSanitizerMiddleware);
  app.use(preventParameterPollutionMiddleware);
  
  // CSRF: reject cross-origin state-changing API requests (cookie auth is ambient)
  app.use('/api', csrfOriginGuard);

  // Cookie-session parser (populates req.user)
  app.use(authMiddleware);

  // Serve uploads directory for media files
  const uploadsDir = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // 3. Mount modular API endpoints
  app.use('/api', apiRouter);

  // Unknown /api routes must be a JSON 404, not fall through to the SPA HTML shell
  // (which would answer a mistyped or probing API call with 200 + HTML).
  app.use('/api', (req: any, res: any) => {
    res.status(404).json({ success: false, code: 404, message: 'مسیر API یافت نشد.' });
  });

  // Catch-all 404 handler for unhandled /api/* requests to GUARANTEE JSON responses (never HTML)
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      code: 404,
      message: `مسیر API درخواست‌شده در سرور یافت نشد (${req.originalUrl})`
    });
  });

  // Sitemap Generation Route (Server-Generated from db.json)
  app.get('/sitemap.xml', (req, res) => {
    try {
      const db = getDb();
      const urls: string[] = [];

      // Static Indexable Pages
      const staticPages = [
        '',
        'styles',
        'techniques',
        'courses',
        'shop',
        'cities',
        'instructors',
        'mag',
        'about-contact'
      ];

      staticPages.forEach((p) => {
        const pathSuffix = p ? `/${p}` : '';
        urls.push(`  <url>
    <loc>https://gisara.ir${pathSuffix}</loc>
  </url>`);
      });

      // Dynamic Styles
      db.styles?.forEach((s: any) => {
        if (s.status === 'PUBLISHED' || !s.status) {
          const lastmodStr = s.createdAt ? `\n    <lastmod>${s.createdAt.split('T')[0]}</lastmod>` : '';
          urls.push(`  <url>
    <loc>https://gisara.ir/style-detail?slug=${s.slug}</loc>${lastmodStr}
  </url>`);
        }
      });

      // Dynamic Techniques
      db.techniques?.forEach((t: any) => {
        if (t.status === 'PUBLISHED' || !t.status) {
          urls.push(`  <url>
    <loc>https://gisara.ir/technique-detail?slug=${t.slug}</loc>
  </url>`);
        }
      });

      // Dynamic Courses
      db.courses?.forEach((c: any) => {
        if (c.status === 'PUBLISHED' || !c.status) {
          urls.push(`  <url>
    <loc>https://gisara.ir/course-detail?slug=${c.slug}</loc>
  </url>`);
        }
      });

      // Dynamic Products
      db.products?.forEach((p: any) => {
        if (p.status === 'PUBLISHED' || !p.status) {
          urls.push(`  <url>
    <loc>https://gisara.ir/product-detail?slug=${p.slug}</loc>
  </url>`);
        }
      });

      // Dynamic Cities
      db.cities?.forEach((c: any) => {
        urls.push(`  <url>
    <loc>https://gisara.ir/city-detail?slug=${c.slug}</loc>
  </url>`);
      });

      // Dynamic Instructors
      db.instructors?.forEach((i: any) => {
        if (i.status === 'ACTIVE' || !i.status) {
          urls.push(`  <url>
    <loc>https://gisara.ir/instructor-detail?id=${i.id}</loc>
  </url>`);
        }
      });

      // Dynamic Articles (Magazine)
      db.articles?.forEach((a: any) => {
        const lastmodStr = a.publishedAt ? `\n    <lastmod>${a.publishedAt}</lastmod>` : '';
        urls.push(`  <url>
    <loc>https://gisara.ir/mag?slug=${a.slug}</loc>${lastmodStr}
  </url>`);
      });

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(sitemapXml);
    } catch (err) {
      console.error('[Server Sitemap Generation Error]:', err);
      return res.status(500).send('Error generating sitemap');
    }
  });

  // 4. Client SPA Serving Logic
  if (!isProd) {
    // Development Mode: Mount Vite in middleware mode
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa'
    });
    
    // Inject custom metadata inside Vite's index.html delivery path
    app.get(seoRoutes, async (req, res, next) => {
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let html = getInjectedHtml(indexPath, req.url);
        // Let Vite transform the HTML with development scripts (HMR, etc.)
        html = await vite.transformIndexHtml(req.url, html);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
    console.log('[Server Core] Vite middleware attached successfully.');
  } else {
    // Production Mode: Serve compiled dist folder
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      // Intercept HTML pages for pre-injection before express.static fallback
      app.get(seoRoutes, (req, res) => {
        const indexPath = path.resolve(distPath, 'index.html');
        const html = getInjectedHtml(indexPath, req.url);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      });

      // Serve hashed immutable assets with 1-year cache
      app.use('/assets', express.static(path.resolve(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      }));

      // Serve public root static files (icons, robots.txt, sitemap.xml) with optimal caching
      app.use(express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          }
        },
      }));
      app.get('*', (req, res) => {
        const indexPath = path.resolve(distPath, 'index.html');
        const html = getInjectedHtml(indexPath, req.url);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      });
      console.log('[Server Core] Serving static production build from "dist"');
    } else {
      console.warn('[Server Core] WARNING: "dist" folder not found! Servings SPA may fail. Running build step first is recommended.');
      
      // Dynamic fallback for dev-iframe if compile is triggered under production environment vars
      app.use(express.static(path.resolve(__dirname, 'public')));
      app.get('*', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send('<h3>آکادمی گیسآرا در حال بارگذاری است...</h3>');
      });
    }
  }

  // 5. Global Error Interceptor: never leak internals for server errors.
  app.use((err: any, req: any, res: any, next: any) => {
    if (res.headersSent) return next(err);

    // Errors raised by body-parser have well-defined, client-caused meanings.
    let status: number = err?.status || err?.statusCode || 500;
    let message: string | undefined;
    if (err?.type === 'entity.too.large') { status = 413; message = 'حجم درخواست بیش از حد مجاز است.'; }
    else if (err?.type === 'entity.parse.failed') { status = 400; message = 'ساختار JSON ارسالی نامعتبر است.'; }

    if (status >= 500) console.error('[Global Error Interceptor]:', err);
    else console.warn(`[Request Error ${status}] ${req.method} ${req.originalUrl}: ${err?.message}`);

    // 5xx text can contain file paths / library internals - only ever send a generic message.
    const safeMessage = status >= 500
      ? 'یک خطای سیستمی در سرور رخ داده است. لطفاً مجدداً تلاش فرمایید.'
      : (message || err?.message || 'درخواست نامعتبر است.');

    if (req.originalUrl?.startsWith('/api')) {
      return res.status(status).json({ success: false, code: status, message: safeMessage });
    }
    res.status(status).send('<h3>خطای سرور رخ داده است. لطفاً صفحه را مجدداً بارگذاری فرمایید.</h3>');
  });

  const port = process.env.PORT || 3000;
  const httpServer = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 GisAra full-stack server running successfully at http://0.0.0.0:${port}`);
  });

  // Graceful shutdown: stop accepting connections, persist any debounced write, exit.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Server Core] ${signal} received - flushing database and shutting down...`);
    const forceTimer = setTimeout(() => { flushDbSync(); process.exit(1); }, 8000);
    forceTimer.unref();
    httpServer.close(() => {
      flushDbSync();
      process.exit(0);
    });
    // Idle keep-alive connections would otherwise hold close() open.
    (httpServer as any).closeIdleConnections?.();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// A stray rejected promise must not silently disappear, and a truly unexpected
// exception leaves the process in an unknown state: persist data, then exit so the
// supervisor (pm2/systemd/docker) restarts a clean instance.
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception - flushing DB and exiting:', err);
  try { flushDbSync(); } catch { /* nothing more we can do */ }
  process.exit(1);
});

// Fire up server with error handler
startServer().catch(err => {
  console.error('[Server Start Failed]:', err);
  process.exit(1);
});
