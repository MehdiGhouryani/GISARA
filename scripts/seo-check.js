import http from 'http';

const targetPort = process.env.PORT || 3000;
const host = `http://localhost:${targetPort}`;

const testUrls = [
  { path: '/', expectedTitle: 'گیس‌آرا – آکادمی و فروشگاه برتر شینیون' },
  { path: '/styles', expectedTitle: 'دوره آنلاین شینیون – آموزش ویدیویی' },
  { path: '/shop', expectedTitle: 'فروشگاه ابزار شینیون – اسپری، تافت، سنجاق' },
  { path: '/course-detail?slug=master-bridal-chignon-european', expectedTitle: 'دوره جامع شینیون عروس و تکنیک‌های اروپایی | مسترکلاس آنلاین گیس‌آرا' },
  { path: '/product-detail?slug=professional-strong-hold-hairspray', expectedTitle: 'اسپری تثبیت‌کننده قوی مو (شاین و مات) ۵۰۰ میل | فروشگاه ابزار شینیون گیس‌آرا' },
  { path: '/sitemap.xml', expectedType: 'xml' },
  { path: '/robots.txt', expectedTitle: 'User-agent:' }
];

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${host}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runCheck() {
  console.log('\n🔍 Starting Automated SEO & Pre-Injection Validation...');
  console.log('===================================================');

  let passed = true;

  for (const test of testUrls) {
    try {
      const res = await fetchPage(test.path);
      const isXml = test.expectedType === 'xml' || test.path.endsWith('.xml');
      const isTxt = test.path.endsWith('.txt');

      if (res.statusCode !== 200) {
        console.error(`❌ [FAIL] ${test.path} returned status ${res.statusCode}`);
        passed = false;
        continue;
      }

      console.log(`\n💚 [PASS] ${test.path} resolved with HTTP 200`);

      if (isXml) {
        if (res.body.includes('<urlset') && res.body.includes('</urlset>')) {
          console.log(`   └─ Valid XML Sitemap structure found.`);
        } else {
          console.error(`   └─ ❌ [FAIL] Invalid Sitemap XML content.`);
          passed = false;
        }
      } else if (isTxt) {
        if (res.body.includes('Sitemap:') && res.body.includes('Disallow:')) {
          console.log(`   └─ Valid robots.txt directives found.`);
        } else {
          console.error(`   └─ ❌ [FAIL] Invalid robots.txt content.`);
          passed = false;
        }
      } else {
        // Parse metadata using regex
        const titleMatch = res.body.match(/<title>([\s\S]*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].trim() : '';

        const descMatch = res.body.match(/<meta name="description" content="([\s\S]*?)"/);
        const description = descMatch ? descMatch[1].trim() : '';

        const canonicalMatch = res.body.match(/<link rel="canonical" href="([\s\S]*?)"/);
        const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';

        const schemaMatch = res.body.includes('application/ld+json');

        console.log(`   ├─ Title: "${title}"`);
        if (test.expectedTitle && !title.includes(test.expectedTitle.split('|')[0].trim())) {
          console.error(`   │  ❌ [FAIL] Expected title to contain "${test.expectedTitle}"`);
          passed = false;
        }

        console.log(`   ├─ Description: "${description.slice(0, 60)}..."`);
        if (!description) {
          console.error(`   │  ❌ [FAIL] Missing meta description.`);
          passed = false;
        }

        console.log(`   ├─ Canonical: "${canonical}"`);
        if (!canonical.startsWith('https://gisara.ir')) {
          console.error(`   │  ❌ [FAIL] Invalid canonical URL.`);
          passed = false;
        }

        console.log(`   └─ JSON-LD: ${schemaMatch ? 'Found ✅' : 'Missing ❌'}`);
        if (!schemaMatch && test.path.includes('detail')) {
          console.error(`   │  ❌ [FAIL] Detail pages must contain dynamic JSON-LD schema.`);
          passed = false;
        }
      }
    } catch (err) {
      console.error(`❌ [ERROR] Failed to fetch ${test.path}. Make sure the server is running on port ${targetPort}.`);
      console.error(`   Detail: ${err.message}`);
      passed = false;
    }
  }

  console.log('\n===================================================');
  if (passed) {
    console.log('🎉 ALL TECHNICAL SEO CHECKS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME SEO CHECKS FAILED. Please review the output above.\n');
    process.exit(1);
  }
}

runCheck();
