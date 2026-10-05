# راهنمای جامع استقرار و بهره‌برداری پلتفرم گیس‌آرا در محیط تولید (Production Deployment Guide)
## دستورالعمل فنی انتقال، بیلد و نگهداری مستمر پلتفرم (Operational Runbook)

این سند رسمی، راهنمای گام‌به‌گام استقرار و بهره‌برداری پلتفرم تخصصی **گیس‌آرا (GisAra)** در محیط لایو تولید (Production) بر اساس الگوهای نوین سال ۲۰۲۶ است. تمامی فرآیندهای راه‌اندازی، بک‌آپ، امنیت، بازیابی و پایش سئو در این سند شرح داده شده‌اند.

---

## ۱. پیش‌نیازهای محیط استقرار (Prerequisites)

برای اجرای پایدار و بدون خطای پلتفرم در لایه تولید، سرور هدف باید دارای پیکربندی‌های زیر باشد:

* **سیستم‌عامل پیشنهادی:** توزیع‌های سازمانی لینوکس (مانند Ubuntu 22.04 LTS / Debian 12).
* **نسخه رانتایم Node.js:** نسخه پایدار `Node.js v20.11.0` یا بالاتر (`v22 LTS` پیشنهاد می‌شود).
* **مدیریت پکیج‌ها:** `npm v10+` (تعبیه‌شده در پکیج Node.js).
* **شبکه و وب‌سرور معکوس:** Nginx یا درگاه‌های معکوس بومی پلتفرم‌های ابری (لود بالانسرها).
* **شبکه توزیع محتوا (CDN):** کلودفلر یا ابر آروان مجهز به قوانین ریدایرکت ۳۰۱ و فعال‌سازی SSL.

---

## ۲. متغیرهای محیطی تولید (Environment Variables)

پیش از راه‌اندازی سرور، یک فایل پیکربندی امنیتی با نام `.env` در روت اصلی پروژه بر روی سرور مستقر کنید. این متغیرها برای پردازش‌های سمت سرور و رندر کردن آدرس‌های متعارف الزامی هستند:

```env
# پیکربندی عمومی پورت و حالت سرور
PORT=3000
NODE_ENV=production

# آدرس دامنه اصلی و رسمی برای سئو و ساخت تگ‌های متعارف
APP_URL=https://gisara.ir

# کلید رمزنگاری جلسات JWT (باید یک رشته غیرقابل پیش‌بینی در تولید باشد)
JWT_SECRET=super_secure_and_unpredictable_key_generator_for_gisara_production_2026
```

---

## ۳. مراحل نصب، ساخت و اجرا (Install, Build & Start)

در محیط تمیز سرور تولید، دستورات زیر را به ترتیب برای راه‌اندازی پلتفرم اجرا نمایید:

### گام اول: دریافت کدهای منبع و نصب وابستگی‌ها
کدهای پروژه را به سرور منتقل کرده و وابستگی‌ها را بدون کدهای اضافی توسعه (Production Mode) نصب کنید:
```bash
# نصب پکیج‌های موردنیاز
npm ci --only=production
```

### گام دوم: کامپایل دارایی‌های کلاینت (Client Compiling)
کدهای فرانت‌اند وب‌سایت کلاینت را برای کارکرد پرسرعت به دارایی‌های فوق بهینه‌ساز استاتیک در پوشه `/dist` بیلد کنید:
```bash
npm run build
```

### گام سوم: راه‌اندازی سرور فول‌استک
برای استقرار مداوم و همیشگی سرور در پس‌زمینه لینوکس، استفاده از یک پکیج مدیریت رانتایم مانند **PM2** الزامی است:
```bash
# نصب عمومی PM2 (در صورت عدم نصب قبلی)
npm install -g pm2

# شروع به کار سرور با پیکربندی پس‌زمینه و نام اختصاصی
pm2 start server.ts --name "gisara-platform" --interpreter tsx

# تنظیم خودکار بالا آمدن سرور پس از ریبوت سخت‌افزاری سیستم‌عامل
pm2 save
pm2 startup
```

---

## ۴. پیکربندی وب‌سرور معکوس (Reverse Proxy Setup)

استفاده از وب‌سرور معکوس **Nginx** به عنوان پروکسی جهت اتصال پورت داخلی ۳۰۰۰ سرور به خروجی پورت استاندارد ۸۰ و ۴۴۳ شبکه پیشنهاد می‌شود. نمونه فایل پیکربندی به شرح زیر است:

```nginx
server {
    listen 80;
    server_name gisara.ir www.gisara.ir;
    
    # هدایت خودکار تمامی درخواست‌های HTTP به کانال متعارف و ایمن HTTPS
    return 301 https://gisara.ir$request_uri;
}

server {
    listen 444 ssl http2;
    server_name www.gisara.ir;
    
    # هدایت خودکار ساب‌دامنه www به دامنه ریشه متعارف بدون www
    return 301 https://gisara.ir$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gisara.ir;

    # پیکربندی گواهینامه SSL ایمن
    ssl_certificate /etc/letsencrypt/live/gisara.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gisara.ir/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # فشرده‌سازی متن خروجی برای افزایش سرعت بارگذاری
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ۵. فرآیند پایش سلامت و آزمون لایو (Live Health Check)

پس از بالا آمدن سرور، برای مانیتورینگ خودکار پایداری سیستم، از آدرس لایو زیر جهت پایش وضعیت (Uptime) پلتفرم استفاده کنید:

* **آدرس پایش سلامتی:** `https://gisara.ir/api/health` یا بررسی پاسخ HTTP `200 OK` در درخواست به صفحه اصلی `https://gisara.ir`.
* سیستم مانیتورینگ (مانند UptimeRobot یا Grafana) باید در صورت دریافت پاسخ خطای ۵xx یا عدم پاسخ‌دهی بیش از ۵ ثانیه‌ای، فوراً هشدار اضطراری به ادمین ارسال کند.

---

## ۶. فرآیند بازگشت سریع به نسخه قبل (Rollback & Backup Procedure)

در صورت به وجود آمدن باگ یا تداخل بلافاصله پس از آپدیت‌های تولید، فرآیند رول‌بک (بازگشت سریع) به شکل زیر پیاده‌سازی می‌گردد:

### ۱. پشتیبان‌گیری دیتابیس لوکال
پایگاه داده لوکال و سریع گیس‌آرا در مسیر `server/data/db.json` قرار دارد. برای بک‌آپ‌گیری روزانه، اجرای کرون‌جاب زیر روی سرور لینوکس الزامی است تا فایل دیتابیس را به یک Object Storage امن انتقال دهد:
```bash
# کرون جاب روزانه ساعت ۳ نصف شب جهت کپی کردن دیتابیس
0 3 * * * cp /app/server/data/db.json /backups/db-$(date +\%F).json
```

### ۲. دستورالعمل رول‌بک سریع نرم‌افزاری
برای بازگردانی پلتفرم به بیلد پایدار قبلی در چند ثانیه:
```bash
# بازگشت کامیت به نسخه پایدار قبلی در Git
git checkout master-stable

# بیلد مجدد و ری‌استارت سرویس PM2
npm run build
pm2 restart "gisara-platform"
```

---
**با اجرای این راهنما، استقرار پلتفرم گیس‌آرا در تمام طول عمر مأموریتی خود در لایه تولید بدون خطا و با بالاترین ثبات و پایداری تضمین می‌گردد.**
