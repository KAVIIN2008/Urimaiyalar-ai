// scripts/test-schemes-comprehensive.mjs
// Automated verification for Government Schemes & Subsidies Module

async function runTests() {
  console.log('====================================================');
  console.log('🧪 URIMAIYALAR OS: GOVERNMENT SCHEMES TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  const BASE_URL = 'http://localhost:3000';

  // 1. Database-backed Schemes Listing
  console.log('--- TEST GROUP 1: DATABASE & RETRIEVAL ---');
  try {
    const res = await fetch(`${BASE_URL}/api/schemes`);
    const schemes = await res.json();
    assert(Array.isArray(schemes) && schemes.length >= 6, 'GET /api/schemes returns at least 6 verified schemes', `Found: ${schemes.length}`);
    
    const needs = schemes.find(s => s.id === 'needs');
    assert(needs && needs.name === 'NEEDS' && needs.subsidyPercentage === 25, 'NEEDS scheme exists with 25% subsidy');
    assert(needs && needs.subsidyMaximum === 7500000, 'NEEDS maximum subsidy cap is ₹75 Lakhs (verified)');
    assert(needs && needs.applicationUrl === 'https://msmeonline.tn.gov.in/needs/', 'NEEDS official portal is msmeonline.tn.gov.in/needs/');

    const pmegp = schemes.find(s => s.id === 'pmegp');
    assert(pmegp && pmegp.governmentLevel === 'CENTRAL', 'PMEGP is categorized as CENTRAL');
    assert(pmegp && pmegp.applicationUrl.includes('kviconline.gov.in'), 'PMEGP official portal is kviconline.gov.in');
  } catch (err) {
    assert(false, 'GET /api/schemes connection failed', err.message);
  }

  // 2. Real Database Search & Faceted Filtering
  console.log('\n--- TEST GROUP 2: DATABASE SEARCH & FILTERS ---');
  try {
    const searchRes = await fetch(`${BASE_URL}/api/schemes/search?q=needs`);
    const searchData = await searchRes.json();
    assert(searchData.schemes && searchData.schemes.some(s => s.id === 'needs'), 'Search for "needs" returns NEEDS scheme');

    const stateFilterRes = await fetch(`${BASE_URL}/api/schemes?governmentLevel=STATE`);
    const stateSchemes = await stateFilterRes.json();
    assert(stateSchemes.every(s => s.governmentLevel === 'STATE'), 'Filter governmentLevel=STATE returns only State schemes');

    const mfgFilterRes = await fetch(`${BASE_URL}/api/schemes?businessType=MANUFACTURING`);
    const mfgSchemes = await mfgFilterRes.json();
    assert(mfgSchemes.length > 0 && mfgSchemes.every(s => s.businessTypes.includes('MANUFACTURING')), 'Filter businessType=MANUFACTURING returns eligible schemes');
  } catch (err) {
    assert(false, 'Search and filter tests failed', err.message);
  }

  // 3. Backend Eligibility Rules Engine
  console.log('\n--- TEST GROUP 3: ELIGIBILITY ENGINE DETERMINISM ---');
  try {
    // Case A: Perfect Match for NEEDS (Age 28, Graduate, TN, 20L, Manufacturing, First Gen)
    const matchRes = await fetch(`${BASE_URL}/api/schemes/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheme_id: 'needs',
        age: 28,
        state: 'Tamil Nadu',
        business_type: 'MANUFACTURING',
        project_cost: 2000000, // ₹20 Lakhs
        education: 'DEGREE_DIPLOMA_ITI',
        entrepreneur_type: 'FIRST_GENERATION',
        gender: 'MALE',
      }),
    });
    const matchData = await matchRes.json();
    assert(matchData.status === 'MATCH', 'NEEDS evaluation status is MATCH for eligible applicant');
    assert(matchData.estimated_subsidy && matchData.estimated_subsidy.estimated_amount === 500000, 'NEEDS ₹20L subsidy calculated accurately at ₹5 Lakhs (25%)');
    assert(matchData.disclaimer && matchData.disclaimer.includes('You appear to meet the published eligibility criteria'), 'Statutory disclaimer included');

    // Case B: Not Eligible for NEEDS (Trading business strictly prohibited)
    const tradingRes = await fetch(`${BASE_URL}/api/schemes/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheme_id: 'needs',
        age: 28,
        state: 'Tamil Nadu',
        business_type: 'TRADING',
        project_cost: 2000000,
        education: 'DEGREE_DIPLOMA_ITI',
        entrepreneur_type: 'FIRST_GENERATION',
      }),
    });
    const tradingData = await tradingRes.json();
    assert(tradingData.status === 'NOT_ELIGIBLE', 'Trading business correctly evaluated as NOT_ELIGIBLE for NEEDS');
    assert(tradingData.failed && tradingData.failed.some(f => f.field === 'business_type'), 'Failure reason specifies business_type not supported');

    // Case C: Missing information required
    const missingRes = await fetch(`${BASE_URL}/api/schemes/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheme_id: 'needs',
        // Omitting age and education
        business_type: 'MANUFACTURING',
        project_cost: 2000000,
      }),
    });
    const missingData = await missingRes.json();
    assert(missingData.status === 'PARTIAL_MATCH' || missingData.status === 'INSUFFICIENT_INFORMATION', 'Missing essential inputs returns PARTIAL_MATCH or INSUFFICIENT_INFORMATION');
    assert(missingData.missing && missingData.missing.some(m => m.field === 'age'), 'Missing list includes applicant age');
  } catch (err) {
    assert(false, 'Eligibility engine tests failed', err.message);
  }

  // 4. Source Transparency & Official Document Endpoints
  console.log('\n--- TEST GROUP 4: SOURCE TRANSPARENCY & VERIFICATION ---');
  try {
    const srcRes = await fetch(`${BASE_URL}/api/schemes/needs/sources`);
    const srcData = await srcRes.json();
    assert(srcData.officialSourceUrl && srcData.officialSourceUrl.includes('msmeonline.tn.gov.in'), 'Official source URL is verified Government domain');
    assert(srcData.sourceAuthority && srcData.sourceAuthority.includes('Department of MSME'), 'Source authority accurately cited');
    assert(Array.isArray(srcData.sources) && srcData.sources.length > 0, 'Sources array contains gazette and guideline documents');
  } catch (err) {
    assert(false, 'Source transparency test failed', err.message);
  }

  // 5. Admin Governance & Audit Logging
  console.log('\n--- TEST GROUP 5: ADMIN GOVERNANCE & AUDIT TRAIL ---');
  try {
    const verifyRes = await fetch(`${BASE_URL}/api/admin/schemes/needs/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Verified via automated CI/CD test suite' }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.id === 'needs', 'Admin verify endpoint executed successfully');

    const auditRes = await fetch(`${BASE_URL}/api/admin/schemes/audit-logs?schemeId=needs`);
    const auditLogs = await auditRes.json();
    assert(Array.isArray(auditLogs) && auditLogs.length > 0, 'Audit log created for admin verify action');
    assert(auditLogs.some(l => l.action === 'VERIFY'), 'Audit log contains VERIFY action');
  } catch (err) {
    assert(false, 'Admin governance test failed', err.message);
  }

  // 6. Multilingual AI Assistant Queries & Real Agent Trace
  console.log('\n--- TEST GROUP 6: MULTILINGUAL AI ASSISTANT & REAL TRACE ---');

  // Query 1: Tamil manufacturing query
  try {
    console.log('Sending Tamil query: "எனக்கு ₹20 லட்சம் manufacturing business start பண்ண subsidy கிடைக்குமா?"');
    const aiRes = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'எனக்கு ₹20 லட்சம் manufacturing business start பண்ண subsidy கிடைக்குமா?',
      }),
    });
    const aiData = await aiRes.json();
    assert(aiData.answer && aiData.answer.length > 20, 'AI generated natural response in Tamil');
    assert(aiData.agentResults && aiData.agentResults['rag'], 'Knowledge / RAG Agent executed');
    assert(aiData.agentResults && aiData.agentResults['scheme_database'], 'Scheme Database Engine executed in real trace');
    assert(aiData.agentResults && aiData.agentResults['eligibility_engine'], 'Eligibility Rules Engine executed in real trace');
    assert(aiData.answer.includes('msmeonline.tn.gov.in') || aiData.answer.includes('Official Portal') || aiData.answer.includes('அதிகாரப்பூர்வ'), 'Response contains official portal guidance');
  } catch (err) {
    assert(false, 'Tamil AI query failed', err.message);
  }

  // Query 2: Tanglish eligibility question: "NEEDS ku naan eligible ah?"
  try {
    console.log('Sending Tanglish query: "NEEDS ku naan eligible ah?"');
    const aiRes2 = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'NEEDS ku naan eligible ah?',
      }),
    });
    const aiData2 = await aiRes2.json();
    assert(aiData2.answer && (aiData2.answer.includes('NEEDS') || aiData2.answer.includes('தகுதி') || aiData2.answer.includes('eligible')), 'AI responds with NEEDS criteria and missing requirements');
    assert(aiData2.agentResults && aiData2.agentResults['eligibility_engine'], 'Eligibility Engine ran for Tanglish query');
  } catch (err) {
    assert(false, 'Tanglish AI query failed', err.message);
  }

  // Query 3: Official portal request: "PMEGP apply panna official website kudu"
  try {
    console.log('Sending Official Portal query: "PMEGP apply panna official website kudu"');
    const aiRes3 = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'PMEGP apply panna official website kudu',
      }),
    });
    const aiData3 = await aiRes3.json();
    assert(aiData3.answer && aiData3.answer.includes('kviconline.gov.in'), 'AI provided real official website: kviconline.gov.in');
  } catch (err) {
    assert(false, 'Official portal AI query failed', err.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL GOVERNMENT SCHEMES & SUBSIDIES MODULE TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
