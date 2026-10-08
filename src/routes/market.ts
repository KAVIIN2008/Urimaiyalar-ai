// ============================================================================
// URIMAIYALAR OS — LIVE MARKET PRICE API ROUTES
// Official Source: data.gov.in / AGMARKNET (Govt of India)
// ============================================================================

import express, { Request, Response } from 'express';
import {
  fetchMarketPrices,
  compareMarkets,
  ALL_INDIAN_STATES,
  COMMON_COMMODITIES,
} from '../services/marketDataService';

const router = express.Router();

// ── GET /api/markets/states ──────────────────────────────────────────────────
router.get('/states', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: ALL_INDIAN_STATES,
    source: 'AGMARKNET coverage — Government of India',
    note: 'Actual data availability varies by state and reporting date. Query /prices to verify.',
  });
});

// ── GET /api/markets/commodities ─────────────────────────────────────────────
router.get('/commodities', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: COMMON_COMMODITIES,
    source: 'AGMARKNET commodity list',
  });
});

// ── GET /api/markets/prices ───────────────────────────────────────────────────
// Query params: state, district, market, commodity, date, limit
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const { state, district, market, commodity, date, limit } = req.query;
    const { records, syncStatus } = await fetchMarketPrices({
      state:     state     ? String(state)     : undefined,
      district:  district  ? String(district)  : undefined,
      market:    market    ? String(market)     : undefined,
      commodity: commodity ? String(commodity) : undefined,
      date:      date      ? String(date)       : undefined,
      limit:     limit     ? parseInt(String(limit), 10) : 100,
    });

    res.json({
      success: true,
      count: records.length,
      records,
      syncStatus,
      sourceInfo: {
        name: 'AGMARKNET (Directorate of Marketing & Inspection, Govt of India)',
        portal: 'https://agmarknet.gov.in',
        dataPortal: 'https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
        note: 'Prices in ₹ per Quintal unless otherwise noted.',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/markets/prices] Error:', msg);
    res.status(500).json({
      success: false,
      error: msg,
      records: [],
      syncStatus: {
        source: 'AGMARKNET OGD API',
        isHealthy: false,
        lastError: msg,
        lastSuccessfulSync: null,
        recordsFetched: 0,
      },
    });
  }
});

// ── GET /api/markets/prices/latest ─────────────────────────────────────────
// Latest available record for a commodity + location
router.get('/prices/latest', async (req: Request, res: Response) => {
  try {
    const { state, district, commodity } = req.query;
    const { records, syncStatus } = await fetchMarketPrices({
      state:     state     ? String(state)     : 'Tamil Nadu',
      district:  district  ? String(district)  : undefined,
      commodity: commodity ? String(commodity) : undefined,
      limit: 50,
    });

    // Sort by most recent date and return top record per market
    const sorted = records.sort((a, b) =>
      new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()
    );

    const seen = new Set<string>();
    const latest = sorted.filter(r => {
      const key = `${r.market}-${r.commodity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ success: true, count: latest.length, records: latest, syncStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg, records: [] });
  }
});

// ── GET /api/markets/compare ─────────────────────────────────────────────────
// Compare commodity prices across markets
// Query: commodity (required), state
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { commodity, state } = req.query;
    if (!commodity) {
      res.status(400).json({ success: false, error: 'commodity is required' });
      return;
    }

    const { records, syncStatus } = await fetchMarketPrices({
      state:     state ? String(state) : undefined,
      commodity: String(commodity),
      limit: 100,
    });

    const compared = compareMarkets(records, String(commodity));

    res.json({
      success: true,
      commodity: String(commodity),
      count: compared.length,
      ranking: compared.map((r, i) => ({
        rank: i + 1,
        market: r.market,
        district: r.district,
        state: r.state,
        modalPrice: r.modalPrice,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        reportedDate: r.reportedDate,
        freshnessLabel: r.freshnessLabel,
        sourceUrl: r.sourceUrl,
      })),
      syncStatus,
      note: 'Comparison is deterministic — performed in backend, not by LLM.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ── GET /api/markets/sync-status ─────────────────────────────────────────────
router.get('/sync-status', async (_req: Request, res: Response) => {
  try {
    const { syncStatus } = await fetchMarketPrices({ limit: 1 });
    res.json({
      success: true,
      sources: [syncStatus],
      cachedDataAvailable: true,
      note: 'Live data from AGMARKNET via data.gov.in OGD API.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
