/**
 * URIMAIYALAR OS — Concurrent Load Test
 * Waves: 50 / 200 / 500 concurrent virtual users
 * Run: node scripts/load-test-concurrent.mjs
 */

const BASE_URL = "http://localhost:3000";
const SHOP_ID = "default";

async function timedFetch(url, opts = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(10000) });
    const latency = Date.now() - start;
    return { ok: res.ok, status: res.status, latency, error: null };
  } catch (err) {
    return { ok: false, status: 0, latency: Date.now() - start, error: err.message };
  }
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(latencies) {
  if (!latencies.length) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0], max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
    p50: percentile(sorted, 50), p95: percentile(sorted, 95), p99: percentile(sorted, 99),
  };
}

const SCENARIOS = [
  { name: "Customer List", fn: () => timedFetch(`${BASE_URL}/api/customers?shopId=${SHOP_ID}&page=1&limit=20`) },
  { name: "Dashboard Summary", fn: () => timedFetch(`${BASE_URL}/api/financial/summary?shopId=${SHOP_ID}`) },
  { name: "Product List", fn: () => timedFetch(`${BASE_URL}/api/products?shopId=${SHOP_ID}`) },
  { name: "Sales List", fn: () => timedFetch(`${BASE_URL}/api/sales?shopId=${SHOP_ID}&page=1&limit=20`) },
];

async function runWave(concurrency, durationMs) {
  const results = [];
  const deadline = Date.now() + durationMs;
  async function worker() {
    while (Date.now() < deadline) {
      const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      const r = await s.fn();
      results.push({ ...r, scenario: s.name });
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function buildReport(waveName, concurrency, durationMs, results) {
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  const failed = total - passed;
  const errorRate = total ? ((failed / total) * 100).toFixed(2) : "0.00";
  const throughput = (total / (durationMs / 1000)).toFixed(1);
  const latencies = results.filter(r => r.ok).map(r => r.latency);
  const s = stats(latencies);
  const breakdown = {};
  for (const r of results) {
    if (!breakdown[r.scenario]) breakdown[r.scenario] = { pass: 0, fail: 0 };
    r.ok ? breakdown[r.scenario].pass++ : breakdown[r.scenario].fail++;
  }
  return { waveName, concurrency, total, passed, failed,
    errorRate: `${errorRate}%`, throughput: `${throughput} req/s`,
    latency: s, scenarioBreakdown: breakdown,
    pass: parseFloat(errorRate) < 5 && s.p95 < 3000 };
}

async function main() {
  console.log("=".repeat(70));
  console.log("  URIMAIYALAR OS — CONCURRENT LOAD TEST");
  console.log("=".repeat(70));
  console.log(`  Target: ${BASE_URL}  |  Date: ${new Date().toISOString()}`);
  console.log("=".repeat(70));

  console.log("\n[WARM-UP]");
  for (const s of SCENARIOS) {
    const r = await s.fn();
    console.log(`  ${r.ok ? "OK" : "FAIL"} ${s.name} — ${r.status} ${r.latency}ms`);
  }

  const waves = [
    { name: "WAVE-1: 50 VU  (Target A baseline)", concurrency: 50, duration: 15000 },
    { name: "WAVE-2: 200 VU (Stress)", concurrency: 200, duration: 15000 },
    { name: "WAVE-3: 500 VU (Peak)", concurrency: 500, duration: 15000 },
  ];

  const reports = [];
  for (const wave of waves) {
    console.log(`\n--- ${wave.name} ---`);
    const raw = await runWave(wave.concurrency, wave.duration);
    const report = buildReport(wave.name, wave.concurrency, wave.duration, raw);
    reports.push(report);
    console.log(`  Total: ${report.total} | Pass: ${report.passed} | Fail: ${report.failed} | Err: ${report.errorRate}`);
    console.log(`  Throughput: ${report.throughput} | p50: ${report.latency.p50}ms | p95: ${report.latency.p95}ms | p99: ${report.latency.p99}ms`);
    console.log(`  VERDICT: ${report.pass ? "PASS" : "FAIL"}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("__LOAD_TEST_JSON__");
  console.log(JSON.stringify(reports, null, 2));
  console.log("__END_JSON__");
}

main().catch(err => { console.error(err); process.exit(1); });
