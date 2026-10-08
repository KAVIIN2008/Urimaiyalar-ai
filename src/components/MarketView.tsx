import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, MapPin, Calendar, RefreshCw,
  Search, AlertTriangle, ExternalLink, Wifi, WifiOff,
  BarChart3, Filter, ChevronDown, Loader2, Info,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { api } from '../lib/api';

interface MarketPriceRecord {
  id: string;
  source: string;
  sourceUrl: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalQty: number | null;
  priceUnit: string;
  reportedDate: string;
  reportedTime: string | null;
  ingestedAt: string;
  freshnessStatus: 'LIVE' | 'RECENT' | 'STALE' | 'NO_DATA' | 'SOURCE_ERROR';
  freshnessLabel: string;
  dataQualityFlags: string[];
}

interface SyncStatus {
  source: string;
  lastSuccessfulSync: string | null;
  lastError: string | null;
  recordsFetched: number;
  isHealthy: boolean;
}

interface MarketViewProps {
  language: LanguageCode;
}

const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
];

const COMMON_COMMODITIES = [
  'Onion', 'Tomato', 'Potato', 'Brinjal', 'Cabbage', 'Carrot', 'Green Chilli',
  'Bitter Gourd', 'Drumstick', 'Green Gram', 'Black Gram', 'Groundnut',
  'Coconut', 'Banana', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Turmeric',
  'Ginger', 'Garlic', 'Tur Dal', 'Moong Dal',
];

function FreshnessBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    LIVE:         'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700',
    RECENT:       'bg-amber-100  text-amber-800  border-amber-300  dark:bg-amber-950  dark:text-amber-300  dark:border-amber-700',
    STALE:        'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700',
    NO_DATA:      'bg-slate-100  text-slate-600  border-slate-300  dark:bg-slate-800  dark:text-slate-400  dark:border-slate-600',
    SOURCE_ERROR: 'bg-rose-100   text-rose-800   border-rose-300   dark:bg-rose-950   dark:text-rose-300   dark:border-rose-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.NO_DATA}`}>
      {label}
    </span>
  );
}

export const MarketView: React.FC<MarketViewProps> = ({ language }) => {
  const [records, setRecords] = useState<MarketPriceRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'modal_desc' | 'modal_asc' | 'date'>('date');
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedState)     params.set('state', selectedState);
      if (selectedDistrict)  params.set('district', selectedDistrict);
      if (selectedCommodity) params.set('commodity', selectedCommodity);
      params.set('limit', '100');

      const res = await api(`/api/markets/prices?${params.toString()}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();

      setRecords(json.records || []);
      setSyncStatus(json.syncStatus || null);
      setLastFetchedAt(new Date().toISOString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedCommodity]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // Client-side filter + sort memoized for fast UI responsiveness
  const displayed = React.useMemo(() => {
    return records
      .filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          r.commodity.toLowerCase().includes(q) ||
          r.market.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.variety.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'modal_desc') return b.modalPrice - a.modalPrice;
        if (sortBy === 'modal_asc')  return a.modalPrice - b.modalPrice;
        return new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime();
      });
  }, [records, searchQuery, sortBy]);

  const isLang = (en: string, ta: string) => language === 'ta' ? ta : en;

  return (
    <div id="market-intel-view-container" className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-800 via-orange-900 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-transparent to-slate-900/80" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                🇮🇳 {isLang('India — Live AGMARKNET Prices', 'இந்தியா — நேரலை சந்தை விலை')}
              </span>
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              {syncStatus?.isHealthy ? (
                <span className="flex items-center gap-1 text-xs text-emerald-300 font-semibold">
                  <Wifi className="h-3.5 w-3.5" /> {isLang('Official Data Live', 'நேரலை அரசு தரவு')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-rose-300 font-semibold">
                  <WifiOff className="h-3.5 w-3.5" /> {isLang('Source Unavailable', 'மூல தரவு கிடைக்கவில்லை')}
                </span>
              )}
            </div>
          </div>

          <h2 className="mt-3 text-xl font-black sm:text-2xl lg:text-3xl">
            {isLang('Live Mandi Price Intelligence', 'நேரலை மண்டி விலை நிலவரம்')}
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-amber-200/80 sm:text-sm">
            {isLang(
              'Real-time wholesale mandi prices — sourced from AGMARKNET (Directorate of Marketing & Inspection, Govt of India) via data.gov.in official API. Prices in ₹ per Quintal.',
              'மத்திய அரசின் AGMARKNET தரவுத்தளத்திலிருந்து நேரடியாக பெறப்பட்ட அரிசி, காய்கறி மற்றும் தானியங்களின் மண்டி விலைகள். ₹/குவிண்டால்.'
            )}
          </p>

          {/* Sync info bar */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-amber-300/80">
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              {isLang('Source:', 'மூலம்:')} AGMARKNET / data.gov.in
            </span>
            {syncStatus?.lastSuccessfulSync && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isLang('Synced:', 'புதுப்பிக்கப்பட்டது:')} {new Date(syncStatus.lastSuccessfulSync).toLocaleTimeString('en-IN')}
              </span>
            )}
            {lastFetchedAt && (
              <span>{isLang('Records:', 'பதிவுகள்:')} {records.length}</span>
            )}
            <a
              href="https://agmarknet.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 underline hover:text-white transition"
            >
              <ExternalLink className="h-3 w-3" />
              agmarknet.gov.in
            </a>
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* State */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              🗺️ {isLang('State', 'மாநிலம்')}
            </label>
            <div className="relative">
              <select
                id="market-state-filter"
                value={selectedState}
                onChange={e => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">{isLang('All India', 'அனைத்து இந்தியா')}</option>
                {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* District */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              📍 {isLang('District', 'மாவட்டம்')}
            </label>
            <input
              id="market-district-filter"
              type="text"
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              placeholder={isLang('e.g. Erode', 'எ.கா. ஈரோடு')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Commodity */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              🌾 {isLang('Commodity', 'பொருள்')}
            </label>
            <div className="relative">
              <select
                id="market-commodity-filter"
                value={selectedCommodity}
                onChange={e => setSelectedCommodity(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">{isLang('All Commodities', 'அனைத்து பொருட்களும்')}</option>
                {COMMON_COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-end gap-2">
            <button
              id="market-fetch-btn"
              onClick={fetchPrices}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {loading ? isLang('Fetching...', 'பெறுகிறது...') : isLang('Fetch Live Prices', 'நேரலை விலை பெறு')}
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="market-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isLang('Search commodity, market, district…', 'பொருள், சந்தை தேடுக…')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              id="market-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="date">{isLang('Most Recent', 'சமீபத்திய')}</option>
              <option value="modal_desc">{isLang('Highest Price', 'அதிக விலை')}</option>
              <option value="modal_asc">{isLang('Lowest Price', 'குறைந்த விலை')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Source Error Banner ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <WifiOff className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
              {isLang('Official Source Unavailable', 'அரசு தரவு இல்லை')}
            </p>
            <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-400">
              {isLang(
                'Could not reach the AGMARKNET API. No mock data is shown. Please try again or check your internet connection.',
                'AGMARKNET API-ஐ அணுக முடியவில்லை. போலி தரவு காட்டப்படவில்லை. மீண்டும் முயற்சிக்கவும்.'
              )}
            </p>
            <p className="mt-1 text-[10px] font-mono text-rose-500">{error}</p>
          </div>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 py-12 dark:border-amber-900 dark:bg-amber-950/20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {isLang('Fetching live prices from AGMARKNET…', 'AGMARKNET-லிருந்து நேரலை விலை பெறுகிறது…')}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            {isLang('Official Government of India Market Data', 'மத்திய அரசின் அதிகாரப்பூர்வ சந்தை தரவு')}
          </p>
        </div>
      )}

      {/* ── No Data ─────────────────────────────────────────────────── */}
      {!loading && !error && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/50">
          <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isLang('No official price report available', 'அதிகாரப்பூர்வ விலை அறிக்கை இல்லை')}
          </p>
          <p className="max-w-xs text-center text-xs text-slate-500">
            {isLang(
              'No official market report was found for the selected filters. Try a different state, commodity, or date. We do NOT show mock data.',
              'தேர்ந்தெடுத்த வடிகட்டிகளுக்கு அதிகாரப்பூர்வ அறிக்கை எதுவும் கிடைக்கவில்லை. வேறு மாநிலம் அல்லது பொருளை முயற்சிக்கவும். போலி தரவு காட்டப்படவில்லை.'
            )}
          </p>
        </div>
      )}

      {/* ── Price Cards Grid ─────────────────────────────────────────── */}
      {!loading && displayed.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isLang('Showing', 'காட்டுகிறது')} {displayed.length} {isLang('official records', 'அதிகாரப்பூர்வ பதிவுகள்')}
            </p>
            <span className="text-[10px] text-slate-400">
              {isLang('Source: AGMARKNET / data.gov.in', 'மூலம்: AGMARKNET / data.gov.in')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map(item => (
              <div
                key={item.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700"
              >
                {/* Commodity + Freshness */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                      🌾 {item.commodity}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {item.variety} {item.grade !== 'FAQ' ? `· ${item.grade}` : ''}
                    </p>
                  </div>
                  <FreshnessBadge status={item.freshnessStatus} label={item.freshnessLabel.split('—')[0].trim()} />
                </div>

                {/* Modal Price (large) */}
                <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {isLang('Modal Price', 'முக்கிய விலை')}
                  </p>
                  <p className="mt-1 text-2xl font-black text-amber-800 dark:text-amber-300">
                    ₹{item.modalPrice.toLocaleString('en-IN')}
                    <span className="ml-1 text-xs font-medium text-amber-600">/{item.priceUnit}</span>
                  </p>
                </div>

                {/* Min / Max */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> {isLang('Min', 'குறைந்தபட்சம்')}
                    </p>
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                      ₹{item.minPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/30">
                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {isLang('Max', 'அதிகபட்சம்')}
                    </p>
                    <p className="text-sm font-black text-rose-800 dark:text-rose-300">
                      ₹{item.maxPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Location + Date */}
                <div className="mt-3 border-t border-slate-100 pt-3 space-y-1.5 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                    <span className="font-semibold">{item.market}</span>
                    <span className="text-slate-400">·</span>
                    <span>{item.district}, {item.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {isLang('Reported:', 'அறிக்கை:')} {new Date(item.reportedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-amber-600 hover:underline dark:text-amber-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {isLang('Source', 'மூலம்')}
                    </a>
                  </div>
                </div>

                {/* Data quality flags */}
                {item.dataQualityFlags.length > 0 && (
                  <div className="mt-2 flex items-start gap-1 rounded-lg bg-rose-50 px-2 py-1.5 dark:bg-rose-950/30">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500 mt-0.5" />
                    <p className="text-[10px] text-rose-600 dark:text-rose-400">
                      {isLang('Data flag:', 'தரவு குறிப்பு:')} {item.dataQualityFlags.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Source Transparency Footer ───────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          🏛️ {isLang('Data Source Transparency', 'தரவு மூல வெளிப்படைத்தன்மை')}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div><span className="font-bold text-slate-700 dark:text-slate-300">{isLang('Primary Source:', 'முதன்மை மூலம்:')}</span> AGMARKNET (Directorate of Marketing & Inspection, Govt of India)</div>
          <div><span className="font-bold text-slate-700 dark:text-slate-300">{isLang('API:', 'API:')}</span> <a href="https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070" className="underline hover:text-amber-600" target="_blank" rel="noopener noreferrer">data.gov.in OGD API</a></div>
          <div><span className="font-bold text-slate-700 dark:text-slate-300">{isLang('Unit:', 'அலகு:')}</span> ₹ per Quintal (100 kg)</div>
          <div><span className="font-bold text-slate-700 dark:text-slate-300">{isLang('Coverage:', 'உள்ளடக்கம்:')}</span> {isLang('All states where AGMARKNET data is available', 'AGMARKNET தரவு கிடைக்கும் அனைத்து மாநிலங்களும்')}</div>
          <div><span className="font-bold text-slate-700 dark:text-slate-300">{isLang('Freshness:', 'புத்துணர்வு:')}</span> 🟢 {isLang('Today', 'இன்று')} · 🟡 {isLang('≤3 days', '≤3 நாட்கள்')} · 🟠 {isLang('Older', 'பழையது')}</div>
          <div><span className="font-bold text-slate-700 dark:text-slate-300">{isLang('Mock data:', 'போலி தரவு:')}</span> ❌ {isLang('Never shown', 'ஒருபோதும் காட்டப்படவில்லை')}</div>
        </div>
      </div>
    </div>
  );
};
