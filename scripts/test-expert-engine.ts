/**
 * Test script for GisAra Expert Styling & Resilient Failover Engine
 */
import { generateExpertStylingAdvice } from '../server/expertStylingEngine';

function runTests() {
  console.log('🧪 Starting Expert Styling Engine Unit Tests...\n');

  // Test 1: Round face + Strapless (دکلته) + Low density + Curly
  const r1 = generateExpertStylingAdvice({
    faceShape: 'گرد',
    foreheadHeight: 'بلند',
    hairDensity: 'کم‌پشت',
    hairTexture: 'فر',
    neckline: 'دکلته',
    occasion: 'عروس',
    styleVibe: 'خطی اروپایی'
  });

  console.log('Test 1 (Round Face + Strapless + Low Density):');
  console.log(`- Match Score: ${r1.matchScore}%`);
  console.log(`- Recommended Styles: ${r1.recommendedStyleIds.join(', ')}`);
  console.log(`- Recommended Techniques: ${r1.recommendedTechniqueIds.join(', ')}`);
  console.log(`- Key Advice Points (${r1.keyAdvicePoints.length}):\n  * ${r1.keyAdvicePoints.join('\n  * ')}`);
  console.log(`- Advice Sample:\n${r1.aiAdvice}\n`);

  if (!r1.aiAdvice.includes('گرد') || !r1.aiAdvice.includes('دکلته')) {
    throw new Error('Test 1 failed: Expected keywords not found');
  }

  // Test 2: Oblong / Long face + High neck (بسته) + High density
  const r2 = generateExpertStylingAdvice({
    faceShape: 'کشیده',
    foreheadHeight: 'کوتاه',
    hairDensity: 'پرپشت',
    hairTexture: 'لخت',
    neckline: 'بسته',
    occasion: 'مجلسی',
    styleVibe: 'کلاسیک'
  });

  console.log('Test 2 (Long Face + High Neck + High Density):');
  console.log(`- Match Score: ${r2.matchScore}%`);
  console.log(`- Advice Sample:\n${r2.aiAdvice}\n`);

  if (!r2.aiAdvice.includes('کشیده') || !r2.aiAdvice.includes('بسته')) {
    throw new Error('Test 2 failed: Expected keywords not found');
  }

  console.log('✅ ALL EXPERT STYLING ENGINE TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests();
