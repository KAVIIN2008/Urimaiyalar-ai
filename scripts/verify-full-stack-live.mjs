// scripts/verify-full-stack-live.mjs
// Comprehensive End-to-End Live Full-Stack Verification Suite

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🚀 URIMAIYALAR OS — FULL-STACK LIVE CONNECTIVITY & CRUD AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? ': ' + detail : ''}`);
      failed++;
    }
  }

  // 1. HEALTH & SUMMARY CHECK
  console.log('\n--- 1. Backend ↔ Database Health Check ---');
  const summaryRes = await request('/api/financial/summary');
  assert('Financial & Business Summary API (/api/financial/summary)', summaryRes.ok, `Status: ${summaryRes.status}`);
  const hasStats = summaryRes.data && (typeof summaryRes.data.summary?.todaySales === 'number' || typeof summaryRes.data.summary?.monthlySales === 'number');
  assert('Database returns financial metrics & health scores', Boolean(hasStats), `Health Score: ${summaryRes.data?.health?.overall}/100`);

  // 2. CUSTOMER CRUD
  console.log('\n--- 2. Customer Full CRUD Verification ---');
  const testCustName = `AuditCustomer_${Date.now()}`;
  const createCust = await request('/api/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: testCustName,
      phone: '9842109876',
      address: 'Madurai East',
      creditLimit: 7500,
      outstandingBalance: 1200,
    }),
  });
  assert('Customer CREATE (POST)', createCust.ok && createCust.data?.id, `ID: ${createCust.data?.id}`);
  const custId = createCust.data?.id;

  if (custId) {
    const listCust = await request('/api/customers');
    const found = Array.isArray(listCust.data) && listCust.data.some((c) => c.id === custId);
    assert('Customer READ (GET list)', found, `Found in list of ${listCust.data?.length} records`);

    const updateCust = await request(`/api/customers/${custId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: `${testCustName}_Updated`,
        address: 'Madurai West',
      }),
    });
    assert('Customer UPDATE (PUT)', updateCust.ok && updateCust.data?.name?.includes('Updated'));

    // Record payment
    const payRes = await request(`/api/customers/${custId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount: 500, notes: 'Audit partial payment' }),
    });
    assert('Customer Record Payment (POST)', payRes.ok);

    const delCust = await request(`/api/customers/${custId}`, { method: 'DELETE' });
    assert('Customer DELETE (DELETE)', delCust.ok);
  }

  // 3. PRODUCT CRUD
  console.log('\n--- 3. Inventory / Products CRUD Verification ---');
  const testProdName = `AuditProduct_${Date.now()}`;
  const createProd = await request('/api/products', {
    method: 'POST',
    body: JSON.stringify({
      name: testProdName,
      nameTa: 'தணிக்கை பொருள்',
      category: 'Grains',
      unit: 'kg',
      currentStock: 50,
      minStock: 10,
      purchasePrice: 40,
      sellingPrice: 55,
    }),
  });
  assert('Product CREATE (POST)', createProd.ok && createProd.data?.id, `ID: ${createProd.data?.id}`);
  const prodId = createProd.data?.id;

  if (prodId) {
    const listProd = await request('/api/products');
    const found = Array.isArray(listProd.data) && listProd.data.some((p) => p.id === prodId);
    assert('Product READ (GET list)', found);

    const updateProd = await request(`/api/products/${prodId}`, {
      method: 'PUT',
      body: JSON.stringify({ currentStock: 75, sellingPrice: 60 }),
    });
    assert('Product UPDATE (PUT)', updateProd.ok);

    const delProd = await request(`/api/products/${prodId}`, { method: 'DELETE' });
    assert('Product DELETE (DELETE)', delProd.ok);
  }

  // 4. SUPPLIER CRUD
  console.log('\n--- 4. Supplier CRUD Verification ---');
  const testSupName = `AuditSupplier_${Date.now()}`;
  const createSup = await request('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify({
      name: testSupName,
      phone: '9443219876',
      address: 'Erode Mandi',
      outstandingBalance: 5000,
    }),
  });
  assert('Supplier CREATE (POST)', createSup.ok && createSup.data?.id);
  const supId = createSup.data?.id;

  if (supId) {
    const updateSup = await request(`/api/suppliers/${supId}`, {
      method: 'PUT',
      body: JSON.stringify({ address: 'Salem Mandi' }),
    });
    assert('Supplier UPDATE (PUT)', updateSup.ok);

    const paySup = await request(`/api/suppliers/${supId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount: 1000 }),
    });
    assert('Supplier Payment (POST)', paySup.ok);

    const delSup = await request(`/api/suppliers/${supId}`, { method: 'DELETE' });
    assert('Supplier DELETE (DELETE)', delSup.ok);
  }

  // 5. EXPENSES CRUD
  console.log('\n--- 5. Expenses CRUD Verification ---');
  const createExp = await request('/api/expenses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Audit Electricity Bill',
      category: 'electricity',
      amount: 450,
      paymentMode: 'upi',
    }),
  });
  assert('Expense CREATE (POST)', createExp.ok && createExp.data?.id);
  const expId = createExp.data?.id;

  if (expId) {
    const listExp = await request('/api/expenses');
    assert('Expense READ (GET)', Array.isArray(listExp.data) && listExp.data.some((e) => e.id === expId));

    const delExp = await request(`/api/expenses/${expId}`, { method: 'DELETE' });
    assert('Expense DELETE (DELETE)', delExp.ok);
  }

  // 6. SALES WORKFLOW
  console.log('\n--- 6. Sales Workflow Verification ---');
  const createSale = await request('/api/sales', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'Audit Walk-in',
      paymentType: 'cash',
      total: 350,
      amountPaid: 350,
      balanceDue: 0,
      items: [
        {
          productId: 'custom-item',
          productName: 'Sample Rice',
          quantity: 5,
          unit: 'kg',
          unitPrice: 70,
          total: 350,
        },
      ],
    }),
  });
  assert('Sale CREATE (POST)', createSale.ok && createSale.data?.id);
  const saleId = createSale.data?.id;

  if (saleId) {
    const delSale = await request(`/api/sales/${saleId}`, { method: 'DELETE' });
    assert('Sale DELETE (DELETE)', delSale.ok);
  }

  // 7. AI ASSISTANT CONVERSATION & AGENT EXECUTION
  console.log('\n--- 7. AI Multi-Agent & Orchestrator Check ---');
  const aiChat = await request('/api/assistant/query', {
    method: 'POST',
    body: JSON.stringify({
      message: 'வணக்கம், இன்றைய வியாபாரம் எப்படி உள்ளது?',
      language: 'ta',
      conversationHistory: [],
    }),
  });
  assert('AI Assistant /api/assistant/query', aiChat.ok, `Responded: ${Boolean(aiChat.data?.answer || aiChat.data?.response)}`);

  console.log('\n================================================================');
  console.log(`📊 FINAL AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite exception:', err);
  process.exit(1);
});
