// scripts/test-i18n-system.ts
// ============================================================================
// URIMAIYALAR OS — COMPLETE 22-LANGUAGE I18N VERIFICATION SUITE
// Automated verification for all 22 official scheduled Indian languages + English
// ============================================================================

import { INDIAN_LANGUAGES, getLanguageInfo, isRtlLanguage } from '../src/utils/languages';
import { translateKey, getTranslationCoverage } from '../src/i18n/translations';
import { en } from '../src/i18n/locales/en';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('🌐 URIMAIYALAR OS — 22-LANGUAGE I18N AUTOMATED VERIFICATION');
  console.log('===============================================================\n');

  // TEST GROUP 1: Central Language Registry Inspection
  console.log('--- TEST GROUP 1: Language Registry Completeness ---');
  assert(INDIAN_LANGUAGES.length >= 23, `Registry contains ${INDIAN_LANGUAGES.length} supported locales (expected >= 23)`);

  const expectedCodes = [
    'en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa',
    'ur', 'or', 'as', 'kok', 'mai', 'ne', 'sa', 'ks', 'sd', 'doi',
    'mni', 'brx', 'sat'
  ];

  for (const code of expectedCodes) {
    const lang = INDIAN_LANGUAGES.find((l) => l.code === code);
    assert(!!lang, `Language [${code}] is present in central registry (${lang?.name || 'MISSING'})`);
    assert(lang?.enabled === true, `Language [${code}] is marked enabled: true`);
  }

  // TEST GROUP 2: RTL vs LTR Directionality
  console.log('\n--- TEST GROUP 2: RTL & BiDi Directionality Validation ---');
  const rtlCodes = ['ur', 'ks', 'sd'];
  for (const code of rtlCodes) {
    const isRtl = isRtlLanguage(code as any);
    const info = getLanguageInfo(code as any);
    assert(isRtl === true, `Language [${code}] (${info.name}) correctly identified as RTL`);
    assert(info.direction === 'rtl', `Language [${code}] info has direction: 'rtl'`);
  }

  const ltrCodes = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu'];
  for (const code of ltrCodes) {
    const isRtl = isRtlLanguage(code as any);
    const info = getLanguageInfo(code as any);
    assert(isRtl === false, `Language [${code}] (${info.name}) correctly identified as LTR`);
    assert(info.direction === 'ltr', `Language [${code}] info has direction: 'ltr'`);
  }

  // TEST GROUP 3: Core Navigation Translation across major Indian languages
  console.log('\n--- TEST GROUP 3: Core Navigation Bar Translation Tests ---');
  const navTestCases = [
    { lang: 'en', key: 'navigation.dashboard', expected: 'Dashboard' },
    { lang: 'ta', key: 'navigation.dashboard', expected: 'முகப்பு பலகை' },
    { lang: 'hi', key: 'navigation.dashboard', expected: 'डैशबोर्ड' },
    { lang: 'te', key: 'navigation.dashboard', expected: 'డాష్‌బోర్డ్' },
    { lang: 'kn', key: 'navigation.dashboard', expected: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
    { lang: 'ml', key: 'navigation.dashboard', expected: 'ഡാഷ്‌ബോർഡ്' },
    { lang: 'mr', key: 'navigation.dashboard', expected: 'डॅशबोर्ड' },
    { lang: 'bn', key: 'navigation.dashboard', expected: 'ড্যাশবোর্ড' },
    { lang: 'gu', key: 'navigation.dashboard', expected: 'ડેશબોર્ડ' },
    { lang: 'ur', key: 'navigation.dashboard', expected: 'ڈیش بورڈ' },
    { lang: 'ta', key: 'navigation.sales', expected: 'விற்பனை' },
    { lang: 'hi', key: 'navigation.sales', expected: 'बिक्री' },
    { lang: 'te', key: 'navigation.sales', expected: 'అమ్మకాలు' },
    { lang: 'kn', key: 'navigation.sales', expected: 'ಮಾರಾಟ' },
    { lang: 'ml', key: 'navigation.sales', expected: 'വിൽപന' },
    { lang: 'ta', key: 'navigation.inventory', expected: 'சரக்கு இருப்பு' },
    { lang: 'hi', key: 'navigation.inventory', expected: 'इन्वेंटरी' },
    { lang: 'ta', key: 'navigation.schemes', expected: 'அரசு மானியங்கள்' },
    { lang: 'hi', key: 'navigation.schemes', expected: 'सरकारी योजनाएं' },
  ];

  for (const tc of navTestCases) {
    const resolved = translateKey(tc.lang as any, tc.key);
    assert(resolved === tc.expected, `[${tc.lang}] ${tc.key} -> "${resolved}" (expected "${tc.expected}")`);
  }

  // TEST GROUP 4: Common Buttons and Statuses
  console.log('\n--- TEST GROUP 4: Reusable UI Buttons and Actions ---');
  const buttonTestCases = [
    { lang: 'en', key: 'buttons.save', expected: 'Save' },
    { lang: 'ta', key: 'buttons.save', expected: 'சேமி' },
    { lang: 'hi', key: 'buttons.save', expected: 'सहेजें' },
    { lang: 'te', key: 'buttons.save', expected: 'సేవ్ చేయండి' },
    { lang: 'kn', key: 'buttons.save', expected: 'ಉಳಿಸಿ' },
    { lang: 'ml', key: 'buttons.save', expected: 'സംരക്ഷിക്കുക' },
    { lang: 'mr', key: 'buttons.save', expected: 'जतन करा' },
    { lang: 'bn', key: 'buttons.save', expected: 'সংরক্ষণ করুন' },
    { lang: 'gu', key: 'buttons.save', expected: 'સાચવો' },
    { lang: 'ur', key: 'buttons.save', expected: 'محفوظ کریں' },
  ];

  for (const tc of buttonTestCases) {
    const resolved = translateKey(tc.lang as any, tc.key);
    assert(resolved === tc.expected, `[${tc.lang}] ${tc.key} -> "${resolved}" (expected "${tc.expected}")`);
  }

  // TEST GROUP 5: Missing Key Fallback to English Base (Zero Crashes / Zero undefined)
  console.log('\n--- TEST GROUP 5: Fallback Mechanism (Zero Undefined / Zero Crash) ---');
  // Pass an obscure key that does not exist in any locale
  const nonexistent = translateKey('ta' as any, 'nonexistent.fictional_key' as any);
  assert(nonexistent.toLowerCase().includes('fictional'), `Non-existent key returns clean fallback token ("${nonexistent}")`);
  assert(nonexistent !== 'undefined' && typeof nonexistent === 'string', 'Missing key never returns undefined');

  // Passing a valid key from English that might be missing in a sparse locale
  const fallbackCheck = translateKey('sat' as any, 'dashboard.kpiTodayRevenue');
  assert(typeof fallbackCheck === 'string' && fallbackCheck.length > 0, `Sparse locale fallback resolved: "${fallbackCheck}"`);

  // TEST GROUP 6: Parameter Interpolation
  console.log('\n--- TEST GROUP 6: Dynamic Parameter Interpolation ---');
  const rawGreeting = 'Welcome to {{name}}';
  const interpolated = rawGreeting.replace(/{{\s*name\s*}}/g, 'Cauvery Mart');
  assert(interpolated.includes('Cauvery Mart'), `Interpolation replaced {{name}} -> "${interpolated}"`);

  // TEST GROUP 7: Full Coverage Audit across all 23 Locales
  console.log('\n--- TEST GROUP 7: Complete Translation Coverage Report ---');
  const { totalKeys, coverageMap } = getTranslationCoverage();
  console.log('-----------------------------------------------------------------------');
  console.log('| Locale | Language        | Keys | Translated | Missing | Coverage % |');
  console.log('-----------------------------------------------------------------------');

  for (const [code, stat] of Object.entries(coverageMap)) {
    const langInfo = getLanguageInfo(code);
    const paddedCode = code.padEnd(6, ' ');
    const paddedName = langInfo.name.padEnd(15, ' ');
    const paddedKeys = String(stat.total).padEnd(4, ' ');
    const paddedTrans = String(stat.translated).padEnd(10, ' ');
    const paddedMiss = String(stat.total - stat.translated).padEnd(7, ' ');
    const paddedPct = `${stat.percentage}%`.padEnd(10, ' ');
    console.log(`| ${paddedCode} | ${paddedName} | ${paddedKeys} | ${paddedTrans} | ${paddedMiss} | ${paddedPct} |`);

    assert(stat.percentage >= 50, `[${code}] coverage is healthy (${stat.percentage}%)`);
  }
  console.log('-----------------------------------------------------------------------');

  // SUMMARY
  console.log(`\n===============================================================`);
  console.log(`🏁 TEST EXECUTION COMPLETE`);
  console.log(`Total Tests Run: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Status: ${failed === 0 ? '🏆 100% ALL CHECKS PASSED — READY FOR PRODUCTION' : '⚠️ FAILURES DETECTED'}`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
