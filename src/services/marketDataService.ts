// ============================================================================
// URIMAIYALAR OS — LIVE INDIAN MARKET PRICE SERVICE
// Official Source: data.gov.in AGMARKNET API (Directorate of Marketing & Inspection)
// API Resource: 9ef84268-d588-465a-a308-a864a43d0070
// ============================================================================

export type FreshnessStatus = 'LIVE' | 'RECENT' | 'STALE' | 'NO_DATA' | 'SOURCE_ERROR';

export interface MarketPriceRecord {
  id: string;
  source: 'AGMARKNET_OGD' | 'ENAM' | 'STATE_APMC';
  sourceUrl: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  minPrice: number;   // ₹ per quintal
  maxPrice: number;
  modalPrice: number;
  arrivalQty: number | null;
  priceUnit: string;
  arrivalUnit: string;
  reportedDate: string;       // YYYY-MM-DD
  reportedTime: string | null;
  ingestedAt: string;
  freshnessStatus: FreshnessStatus;
  freshnessLabel: string;
  dataQualityFlags: string[];
  rawMetadata?: Record<string, unknown>;
}

export interface MarketSyncStatus {
  source: string;
  lastSuccessfulSync: string | null;
  lastError: string | null;
  recordsFetched: number;
  isHealthy: boolean;
}

// In-memory cache — keyed by cacheKey
interface CacheEntry {
  records: MarketPriceRecord[];
  cachedAt: number; // unix ms
}
const priceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// OGD/AGMARKNET RAW API RECORD
// ============================================================================
interface OGDRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  min_price?: string | number;
  max_price?: string | number;
  modal_price?: string | number;
  arrival_date?: string;
  [key: string]: unknown;
}

// ============================================================================
// FRESHNESS ENGINE
// ============================================================================
function computeFreshness(reportedDateStr: string): { status: FreshnessStatus; label: string } {
  try {
    const reported = new Date(reportedDateStr);
    const now = new Date();
    const diffHours = (now.getTime() - reported.getTime()) / 3_600_000;

    if (diffHours < 24)  return { status: 'LIVE',   label: '🟢 LIVE — Reported Today' };
    if (diffHours < 72)  return { status: 'RECENT', label: '🟡 RECENT — Within 3 Days' };
    if (diffHours < 168) return { status: 'STALE',  label: '🟠 STALE — Older than 3 Days' };
    return { status: 'STALE', label: '🔴 STALE — Very Old Data' };
  } catch {
    return { status: 'NO_DATA', label: '⚪ NO DATA' };
  }
}

// ============================================================================
// DATA VALIDATION + QUALITY FLAGS
// ============================================================================
function validateRecord(rec: OGDRecord): string[] {
  const flags: string[] = [];
  const min = parseFloat(String(rec.min_price || 0));
  const max = parseFloat(String(rec.max_price || 0));
  const modal = parseFloat(String(rec.modal_price || 0));

  if (min < 0 || max < 0 || modal < 0) flags.push('NEGATIVE_PRICE');
  if (modal < min)                       flags.push('MODAL_BELOW_MIN');
  if (modal > max)                       flags.push('MODAL_ABOVE_MAX');
  if (max > 50_000)                      flags.push('OUTLIER_HIGH — FLAG FOR REVIEW');
  if (!rec.state)                        flags.push('MISSING_STATE');
  if (!rec.district)                     flags.push('MISSING_DISTRICT');
  if (!rec.market)                       flags.push('MISSING_MARKET');
  if (!rec.commodity)                    flags.push('MISSING_COMMODITY');
  if (!rec.arrival_date)                 flags.push('MISSING_DATE');
  return flags;
}

// ============================================================================
// NORMALIZE DATE from AGMARKNET DD/MM/YYYY → YYYY-MM-DD
// ============================================================================
function normalizeDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  // DD/MM/YYYY
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const m = ddmmyyyy.exec(raw.trim());
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // Already ISO-ish
  return raw.trim();
}

// ============================================================================
// COMMODITY NAME NORMALIZATION (common aliases)
// ============================================================================
const COMMODITY_ALIASES: Record<string, string> = {
  'onion': 'Onion', 'tomato': 'Tomato', 'potato': 'Potato',
  'brinjal': 'Brinjal', 'cabbage': 'Cabbage', 'carrot': 'Carrot',
  'green chilli': 'Green Chilli', 'bitter gourd': 'Bitter Gourd',
  'snake gourd': 'Snake Gourd', 'drumstick': 'Drumstick',
  'green gram': 'Green Gram', 'black gram': 'Black Gram',
  'groundnut': 'Groundnut', 'coconut': 'Coconut', 'banana': 'Banana',
  'rice': 'Rice', 'wheat': 'Wheat', 'maize': 'Maize',
  'cotton': 'Cotton', 'turmeric': 'Turmeric', 'ginger': 'Ginger',
  'garlic': 'Garlic', 'arhar (tur)': 'Tur Dal', 'moong (green gram)': 'Moong Dal',
};

function normalizeCommodity(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return COMMODITY_ALIASES[lower] || raw.trim();
}

// ============================================================================
// FETCH FROM data.gov.in AGMARKNET OGD API
// ============================================================================
const OGD_BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
// The official public sample key from data.gov.in documentation
const OGD_API_KEY = process.env.OGD_API_KEY || '579b464db66ec23bdd000001cdd3947e44ce4aae38d976df3fa7f4c';

export async function fetchMarketPrices(params: {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  date?: string;    // YYYY-MM-DD
  limit?: number;
}): Promise<{ records: MarketPriceRecord[]; syncStatus: MarketSyncStatus }> {
  const limit = params.limit || 100;
  const cacheKey = JSON.stringify(params);
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      records: cached.records,
      syncStatus: {
        source: 'AGMARKNET_OGD (cached)',
        lastSuccessfulSync: new Date(cached.cachedAt).toISOString(),
        lastError: null,
        recordsFetched: cached.records.length,
        isHealthy: true,
      },
    };
  }

  // Build OGD query filters
  const filters: string[] = [];
  if (params.state)     filters.push(`filters[state]=${encodeURIComponent(params.state)}`);
  if (params.district)  filters.push(`filters[district]=${encodeURIComponent(params.district)}`);
  if (params.market)    filters.push(`filters[market]=${encodeURIComponent(params.market)}`);
  if (params.commodity) filters.push(`filters[commodity]=${encodeURIComponent(params.commodity)}`);

  const queryString = [
    `api-key=${OGD_API_KEY}`,
    `format=json`,
    `limit=${limit}`,
    `offset=0`,
    ...filters,
  ].join('&');

  const url = `${OGD_BASE}?${queryString}`;
  const ingestedAt = new Date().toISOString();

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Urimaiyalar-OS/1.0' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`OGD API responded ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
    }

    const json = await res.json() as { records?: OGDRecord[]; total?: number };
    const rawRecords: OGDRecord[] = json.records || [];

    const normalized: MarketPriceRecord[] = rawRecords
      .map((raw, idx): MarketPriceRecord | null => {
        const qFlags = validateRecord(raw);
        // Do NOT drop records — flag them. But skip completely broken ones.
        if (qFlags.includes('NEGATIVE_PRICE') || qFlags.includes('MISSING_STATE')) return null;

        const reportedDate = normalizeDate(String(raw.arrival_date || ''));
        const { status, label } = computeFreshness(reportedDate);

        return {
          id: `ogd-${reportedDate}-${idx}`,
          source: 'AGMARKNET_OGD',
          sourceUrl: 'https://agmarknet.gov.in',
          state:      String(raw.state     || '').trim(),
          district:   String(raw.district  || '').trim(),
          market:     String(raw.market    || '').trim(),
          commodity:  normalizeCommodity(String(raw.commodity || '')),
          variety:    String(raw.variety   || 'General').trim(),
          grade:      String(raw.grade     || 'FAQ').trim(),
          minPrice:   Math.round(parseFloat(String(raw.min_price   || 0))),
          maxPrice:   Math.round(parseFloat(String(raw.max_price   || 0))),
          modalPrice: Math.round(parseFloat(String(raw.modal_price || 0))),
          arrivalQty: null, // OGD standard endpoint doesn't include arrivals
          priceUnit:    'Quintal',
          arrivalUnit:  'Quintal',
          reportedDate,
          reportedTime: null,
          ingestedAt,
          freshnessStatus: status,
          freshnessLabel:  label,
          dataQualityFlags: qFlags,
          rawMetadata: raw as unknown as Record<string, unknown>,
        };
      })
      .filter(Boolean) as MarketPriceRecord[];

    priceCache.set(cacheKey, { records: normalized, cachedAt: Date.now() });

    return {
      records: normalized,
      syncStatus: {
        source: 'AGMARKNET via data.gov.in OGD API',
        lastSuccessfulSync: ingestedAt,
        lastError: null,
        recordsFetched: normalized.length,
        isHealthy: true,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[MarketDataService] OGD API fetch failed:', errMsg);
    return {
      records: [],
      syncStatus: {
        source: 'AGMARKNET via data.gov.in OGD API',
        lastSuccessfulSync: null,
        lastError: errMsg,
        recordsFetched: 0,
        isHealthy: false,
      },
    };
  }
}

// ============================================================================
// COMPARE MARKETS — deterministic backend comparison
// ============================================================================
export function compareMarkets(records: MarketPriceRecord[], commodity: string): MarketPriceRecord[] {
  return records
    .filter(r => r.commodity.toLowerCase().includes(commodity.toLowerCase()))
    .sort((a, b) => b.modalPrice - a.modalPrice);
}

// ============================================================================
// GET STATES COVERED — from OGD metadata (well-known list from AGMARKNET)
// ============================================================================
export const ALL_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // UTs
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const COMMON_COMMODITIES = [
  'Onion', 'Tomato', 'Potato', 'Brinjal', 'Cabbage', 'Carrot', 'Green Chilli',
  'Bitter Gourd', 'Snake Gourd', 'Drumstick', 'Green Gram', 'Black Gram',
  'Groundnut', 'Coconut', 'Banana', 'Rice', 'Wheat', 'Maize', 'Cotton',
  'Turmeric', 'Ginger', 'Garlic', 'Tur Dal', 'Moong Dal',
];
