import http from 'http';
import fs from 'fs';
import path from 'path';

const targetPort = process.env.PORT || 3000;
const host = `http://localhost:${targetPort}`;

const testRoutes = [
  '/',
  '/styles',
  '/techniques',
  '/courses',
  '/shop',
  '/cities',
  '/instructors',
  '/mag',
  '/course-detail?slug=master-bridal-chignon-european',
  '/product-detail?slug=professional-strong-hold-hairspray',
  '/instructor-detail?id=inst-1',
  '/mag?slug=complete-hair-care-guide-for-styling'
];

function benchmarkRoute(urlPath) {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    let ttfbTime = null;

    const req = http.get(`${host}${urlPath}`, (res) => {
      res.once('data', () => {
        const ttfbEnd = process.hrtime.bigint();
        ttfbTime = Number(ttfbEnd - startTime) / 1000000; // in ms
      });

      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
      });

      res.on('end', () => {
        const totalEnd = process.hrtime.bigint();
        const totalTime = Number(totalEnd - startTime) / 1000000; // in ms
        resolve({
          statusCode: res.statusCode,
          ttfb: ttfbTime || totalTime,
          totalTime,
          sizeBytes: size
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        ttfb: 0,
        totalTime: 0,
        sizeBytes: 0,
        error: err.message
      });
    });
  });
}

async function runBenchmark() {
  console.log('\n⚡ Starting Performance Benchmark & TTFB Audit...');
  console.log('===================================================');

  let totalTtfb = 0;
  let count = 0;

  for (const route of testRoutes) {
    // Run 3 iterations to warm up cache and get average
    let sumTtfb = 0;
    let sumTotal = 0;
    let size = 0;
    let statusCode = 200;

    for (let i = 0; i < 3; i++) {
      const res = await benchmarkRoute(route);
      sumTtfb += res.ttfb;
      sumTotal += res.totalTime;
      size = res.sizeBytes;
      statusCode = res.statusCode;
    }

    const avgTtfb = sumTtfb / 3;
    const avgTotal = sumTotal / 3;

    console.log(`Route: ${route}`);
    console.log(`   ├─ Status: ${statusCode}`);
    console.log(`   ├─ TTFB: ${avgTtfb.toFixed(2)} ms`);
    console.log(`   ├─ Total Load: ${avgTotal.toFixed(2)} ms`);
    console.log(`   └─ Raw HTML Size: ${(size / 1024).toFixed(2)} KB`);

    if (statusCode === 200) {
      totalTtfb += avgTtfb;
      count++;
    }
  }

  // Measure Bundle sizes from /dist
  console.log('\n📦 Compiled Client Asset Sizes Audit (Vite Output):');
  console.log('===================================================');
  const distPath = './dist/assets';
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    let totalJsSize = 0;
    let totalCssSize = 0;

    files.forEach((file) => {
      const stats = fs.statSync(path.join(distPath, file));
      if (file.endsWith('.js')) {
        totalJsSize += stats.size;
      } else if (file.endsWith('.css')) {
        totalCssSize += stats.size;
      }
    });

    console.log(`   ├─ Total Bundled JS Size: ${(totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`   └─ Total Bundled CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB`);
  } else {
    console.log('   ⚠️ dist/assets not found. Run "npm run build" first.');
  }

  console.log('\n===================================================');
  console.log('🚀 BENCHMARK COMPLETE!\n');
}

runBenchmark();
