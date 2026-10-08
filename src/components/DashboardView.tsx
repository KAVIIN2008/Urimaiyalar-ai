import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Users,
  Boxes,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Mic,
  Plus,
  Package,
  Receipt,
  Brain,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  DownloadCloud,
  Layers,
  BarChart3,
  Calendar,
  Search,
  X,
  FileSpreadsheet,
  Percent,
  Calculator,
  ChevronRight,
  CheckCircle2,
  Truck,
  Check,
  Clock,
  Send,
  MessageCircle,
  Globe,
} from 'lucide-react';
import { Spatial3DCard } from './Spatial3DWidgets';
import { api } from '../lib/api';
import { playSoundEffect } from '../utils/audioSpeech';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { getLanguageInfo } from '../utils/languages';
import { useTranslation } from '../contexts/LanguageContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FinancialSummary,
  BusinessHealthScore,
  Product,
  Customer,
  Sale,
  Purchase,
  BusinessAlert,
  LanguageCode,
} from '../types';
import { formatCurrency } from '../utils/financeEngine';

interface DashboardViewProps {
  summary: FinancialSummary;
  healthScore: BusinessHealthScore;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  purchases?: Purchase[];
  alerts: BusinessAlert[];
  language: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onNavigate: (view: string) => void;
  onOpenVoice: () => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewExpense: () => void;
  onAddPurchase?: (purchaseData: any) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  onLoadSampleData?: () => void;
  userRole?: 'wholesale' | 'retail' | 'customer';
}

const DashboardViewComponent: React.FC<DashboardViewProps> = ({
  summary,
  healthScore,
  products,
  customers,
  sales,
  purchases = [],
  alerts,
  language,
  onLanguageChange,
  onNavigate,
  onOpenVoice,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewExpense,
  onAddPurchase,
  onRefreshData,
  onLoadSampleData,
  userRole = 'retail',
}) => {
  const { t, isRTL } = useTranslation();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const lowStockItems = useMemo(() => products.filter((p) => p.currentStock <= p.minStock), [products]);
  const overdueCustomers = useMemo(() => customers.filter((c) => c.outstandingBalance > 0), [customers]);
  const isZeroState = products.length === 0 && sales.length === 0;

  // Wholesale Fulfillment & Retail Restock State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState(products[0]?.id || '');
  const [restockQuantity, setRestockQuantity] = useState(25);
  const [restockSupplier, setRestockSupplier] = useState('Cauvery Wholesale Mandi');
  const [restockUrgency, setRestockUrgency] = useState('Standard');
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');

  // Wholesale Dispatch Order Handler
  const handleAcceptAndDispatch = async (purchaseId: string) => {
    setDispatchingOrderId(purchaseId);
    try {
      const res = await api(`/api/purchases/${purchaseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISPATCHED' }),
      });
      if (res.ok) {
        playSoundEffect('action_success');
        setDispatchSuccessMsg(
          language === 'ta'
            ? '✓ சில்லறை வர்த்தகரின் ஆர்டர் ஏற்கப்பட்டு அனுப்பப்பட்டது!'
            : '✓ Retailer order accepted and dispatched successfully!'
        );
        setTimeout(() => setDispatchSuccessMsg(''), 4000);
        if (onRefreshData) await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchingOrderId(null);
    }
  };

  // Retail Restock Submit Handler
  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === restockProductId) || products[0];
    if (!prod) return;

    const unitCost = prod.costPrice || 40;
    const totalAmount = unitCost * Number(restockQuantity);

    if (onAddPurchase) {
      await onAddPurchase({
        supplierName: restockSupplier || 'Cauvery Wholesale Mandi',
        invoiceNumber: `RESTOCK-${Date.now().toString().slice(-4)}`,
        items: [
          {
            productId: prod.id,
            productName: language === 'ta' && prod.nameTa ? prod.nameTa : prod.name,
            quantity: Number(restockQuantity),
            unit: prod.unit || 'unit',
            unitCost,
            total: totalAmount,
          },
        ],
        totalAmount,
        paymentStatus: 'credit',
        amountPaid: 0,
        balanceDue: totalAmount,
        notes: `Urgent B2B Retail Restock: ${restockUrgency || 'Standard'}`,
      });
    }
    playSoundEffect('action_success');
    setIsRestockModalOpen(false);
    if (onRefreshData) await onRefreshData();
  };

  // Compute 7-day or recent sales trend for charts
  const salesChartData = useMemo(() => {
    if (!sales || sales.length === 0) {
      return [
        { name: 'Mon', sales: 0, profit: 0 },
        { name: 'Tue', sales: 0, profit: 0 },
        { name: 'Wed', sales: 0, profit: 0 },
        { name: 'Thu', sales: 0, profit: 0 },
        { name: 'Fri', sales: 0, profit: 0 },
        { name: 'Sat', sales: 0, profit: 0 },
        { name: 'Sun', sales: 0, profit: 0 },
      ];
    }
    // Aggregate by date or recent sales
    const dateMap: Record<string, { sales: number; profit: number }> = {};
    sales.slice(-14).forEach((s: any) => {
      const saleTotal = Number(s.total ?? s.totalAmount ?? 0);
      let saleProfit = 0;
      if (s.items && Array.isArray(s.items) && s.items.length > 0) {
        const cost = s.items.reduce((acc: number, item: any) => {
          const matchedProd = products.find((p) => p.id === item.productId);
          const unitCost = Number(item.unitCost || matchedProd?.costPrice || matchedProd?.purchasePrice || (item.unitPrice * 0.8));
          return acc + (unitCost * Number(item.quantity || 1));
        }, 0);
        saleProfit = Math.max(0, saleTotal - cost);
      } else {
        saleProfit = Math.round(saleTotal * 0.2); // Default ~20% retail margin
      }

      // Format Date cleanly: "22 Sep", "28 Sep", etc.
      let dateKey = 'Today';
      if (s.date) {
        const d = new Date(s.date);
        if (!isNaN(d.getTime())) {
          dateKey = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        } else if (typeof s.date === 'string') {
          dateKey = s.date.slice(5, 10);
        }
      }

      if (!dateMap[dateKey]) dateMap[dateKey] = { sales: 0, profit: 0 };
      dateMap[dateKey].sales += saleTotal;
      dateMap[dateKey].profit += saleProfit;
    });

    const entries = Object.entries(dateMap).map(([name, data]) => ({
      name,
      sales: Math.round(data.sales),
      profit: Math.round(data.profit),
    }));

    return entries.length > 0 ? entries : [{ name: 'Today', sales: 0, profit: 0 }];
  }, [sales, products]);

  // Inventory category breakdown for chart
  const categoryStockData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || 'other';
      map[cat] = (map[cat] || 0) + p.currentStock;
    });
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return Object.entries(map).map(([category, stock], idx) => ({
      name: category.toUpperCase(),
      stock,
      color: colors[idx % colors.length],
    }));
  }, [products]);

  // Financial Distribution Pie Chart Data
  const financialPieData = useMemo(() => {
    const cogs = Math.max(0, summary.monthlyCostOfGoods || 0);
    const exp = Math.max(0, summary.monthlyExpenses || 0);
    const net = Math.max(0, summary.monthlyNetProfit || 0);
    const gross = Math.max(0, summary.monthlyGrossProfit || (summary.monthlySales - cogs));
    const items = [
      { name: language === 'ta' ? 'அடக்கவிலை' : 'COGS', value: cogs, color: '#f59e0b' },
      { name: language === 'ta' ? 'செலவுகள்' : 'Expenses', value: exp, color: '#f43f5e' },
      { name: language === 'ta' ? 'மொத்த லாபம்' : 'Gross Margin', value: gross > 0 ? gross : net, color: '#10b981' }
    ].filter((item) => item.value > 0);
    return items.length > 0 ? items : [
      { name: language === 'ta' ? 'விற்பனை' : 'Sales', value: Math.max(1, summary.monthlySales || 1000), color: '#10b981' }
    ];
  }, [summary, language]);

  // Dashboard Universal Search & Filter Pill State
  const [dashSearchQuery, setDashSearchQuery] = useState('');
  const [activePillFilter, setActivePillFilter] = useState<'all' | 'products' | 'customers' | 'credit'>('all');
  const [showPLDetails, setShowPLDetails] = useState(false);

  // Exact P&L Gross & Net Metrics
  const grossProfit = Math.max(0, summary.monthlySales - summary.monthlyCostOfGoods);
  const grossMarginPercent = summary.monthlySales > 0 ? Math.round((grossProfit / summary.monthlySales) * 100) : 0;

  // Real-time matched records for the search pill
  const filteredSearchResults = useMemo(() => {
    const q = dashSearchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedProducts = (activePillFilter === 'all' || activePillFilter === 'products')
      ? products.filter(
          p => p.name.toLowerCase().includes(q) ||
               (p.nameTa && p.nameTa.toLowerCase().includes(q)) ||
               p.category.toLowerCase().includes(q)
        ).slice(0, 6)
      : [];

    const matchedCustomers = (activePillFilter === 'all' || activePillFilter === 'customers' || activePillFilter === 'credit')
      ? customers.filter(
          c => c.name.toLowerCase().includes(q) ||
               c.phone.includes(q) ||
               (activePillFilter === 'credit' && c.outstandingBalance > 0)
        ).slice(0, 6)
      : [];

    const matchedSales = (activePillFilter === 'all')
      ? sales.filter(
          s => s.id.toLowerCase().includes(q) ||
               (s.customerName && s.customerName.toLowerCase().includes(q))
        ).slice(0, 4)
      : [];

    return {
      products: matchedProducts,
      customers: matchedCustomers,
      sales: matchedSales,
      totalCount: matchedProducts.length + matchedCustomers.length + matchedSales.length,
    };
  }, [dashSearchQuery, activePillFilter, products, customers, sales]);

  return (
    <div id="dashboard-view-container" dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Top Banner: Quick Voice Action & Welcome */}
      <div
        id="dashboard-welcome-banner"
        className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-900 p-6 text-white shadow-2xl shadow-blue-950/20 sm:p-8"
      >
        <div className="absolute inset-0 z-0">
          <img src="/auth-hero.jpg" alt="Agri Business AI" className="w-full h-full object-cover opacity-25 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-indigo-950/90 to-[#070b14]/95" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-400/30 backdrop-blur-md">
                  {t('dashboard.title')}
                </span>
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              </div>
              <h1 className="mt-2.5 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl text-white">
                {t('dashboard.welcomeBack')}
              </h1>
              <p className="mt-1 max-w-xl text-xs text-blue-100/80 sm:text-sm leading-relaxed">
                {t('dashboard.businessOverview')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-voice-btn"
              onClick={onOpenVoice}
              className="btn-3d-primary px-5 py-3 text-xs font-black tracking-tight"
            >
              <Mic className="h-4 w-4 mr-2 text-cyan-300 animate-pulse" />
              <span>{t('dashboard.actionVoiceCfo')}</span>
            </button>
            <button
              id="dash-new-sale-btn"
              onClick={onOpenNewSale}
              className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-cyan-500/40 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-slate-800 hover:border-cyan-400 hover:scale-105 active:scale-95 shadow-lg shadow-black/40"
            >
              <Plus className="h-4 w-4 text-cyan-300" />
              <span>+ {t('dashboard.actionNewSale')}</span>
            </button>
            <button
              id="dash-lang-btn"
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-400/40 px-4 py-3 text-xs font-bold text-white transition-all hover:border-cyan-400 hover:scale-105 active:scale-95 shadow-lg shadow-black/30 backdrop-blur-md"
              title="22 Constitutional Indian Languages"
            >
              <Globe className="h-4 w-4 text-cyan-300" />
              <span>{getLanguageInfo(language).nativeName}</span>
              <span className="text-[10px] text-cyan-300/80 bg-blue-500/20 px-1.5 py-0.5 rounded-md font-semibold">22+</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
      </div>

      {/* Universal Search & Quick Filter Pill Bar */}
      <div
        id="dashboard-search-pill-bar"
        className="relative z-20 rounded-3xl border border-blue-500/25 bg-white/95 dark:bg-slate-900/95 p-2.5 sm:p-3 shadow-xl shadow-blue-500/10 transition-all hover:border-blue-500/40"
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
            <input
              id="dash-search-pill-input"
              type="text"
              value={dashSearchQuery}
              onChange={(e) => setDashSearchQuery(e.target.value)}
              placeholder={`${t('common.search')}...`}
              className="w-full rounded-full border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 py-2.5 pl-11 pr-9 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
            />
            {dashSearchQuery && (
              <button
                onClick={() => setDashSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none px-1">
            <button
              onClick={() => setActivePillFilter('all')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                activePillFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'ta' ? 'அனைத்தும்' : 'All'}
            </button>
            <button
              onClick={() => setActivePillFilter('products')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                activePillFilter === 'products'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              📦 {language === 'ta' ? 'பொருட்கள்' : 'Products'} ({products.length})
            </button>
            <button
              onClick={() => setActivePillFilter('customers')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                activePillFilter === 'customers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              👥 {language === 'ta' ? 'வாடிக்கையாளர்' : 'Customers'} ({customers.length})
            </button>
            <button
              onClick={() => setActivePillFilter('credit')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                activePillFilter === 'credit'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              💳 {language === 'ta' ? 'கடன் (உதார்)' : 'Udhar / Credit'} ({overdueCustomers.length})
            </button>
          </div>
        </div>

        {/* Live Dropdown Results when search is typed */}
        {filteredSearchResults && (
          <div className="mt-3 rounded-2xl border border-blue-500/20 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold text-slate-500">
              <span>{language === 'ta' ? `தேடல் முடிவுகள் (${filteredSearchResults.totalCount})` : `Search Matches (${filteredSearchResults.totalCount})`}</span>
              <button onClick={() => setDashSearchQuery('')} className="text-blue-500 hover:underline">{language === 'ta' ? 'மூடு' : 'Close'}</button>
            </div>
            {filteredSearchResults.totalCount === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                {language === 'ta' ? 'எந்தப் பதிவும் பொருந்தவில்லை' : 'No matching records found'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                {filteredSearchResults.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('inventory')}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer border border-transparent hover:border-blue-400 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{language === 'ta' && p.nameTa ? p.nameTa : p.name}</p>
                      <p className="text-[10px] text-slate-500">{formatCurrency(p.sellingPrice)} • {language === 'ta' ? 'இருப்பு' : 'Stock'}: {p.currentStock}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">{language === 'ta' ? 'பொருள்' : 'Product'}</span>
                  </div>
                ))}
                {filteredSearchResults.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('credit')}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer border border-transparent hover:border-amber-400 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{language === 'ta' ? 'கடன் பாக்கி' : 'Due'}: {formatCurrency(c.outstandingBalance)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold">{language === 'ta' ? 'கடன்' : 'Khata'}</span>
                  </div>
                ))}
                {filteredSearchResults.sales.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onNavigate('sales')}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer border border-transparent hover:border-emerald-400 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">#{s.id.slice(-6)} • {formatCurrency((s as any).total ?? (s as any).totalAmount ?? 0)}</p>
                      <p className="text-[10px] text-slate-500">{s.customerName || 'Cash Sale'} • {typeof s.date === 'string' ? s.date.slice(0, 10) : 'Today'}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">{language === 'ta' ? 'விற்பனை' : 'Sale'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zero State / Fresh Store Onboarding Banner */}
      {/* Zero State / Fresh Store Onboarding Banner */}
      {isZeroState && (
        <div
          id="zero-data-clean-banner"
          className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 p-6 text-slate-900 shadow-sm dark:border-blue-900/40 dark:from-[#0c1424] dark:via-[#090d16] dark:to-[#0c1424] dark:text-slate-100"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === 'ta'
                      ? 'வணிகம் ஆரம்ப தயார் நிலையில் உள்ளது (Clean Store - 0 Records)'
                      : 'Clean Store Setup Initialized (0 Records)'}
                  </h3>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {language === 'ta' ? 'புதிய தொடக்கம்' : 'Fresh Start'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {language === 'ta'
                    ? 'உங்கள் கடையில் தற்போது எந்த மாதிரித் தரவும் இல்லை. புதிய விற்பனை, பொருட்கள் மற்றும் வாடிக்கையாளர்களை நீங்களே குரல் அல்லது பொத்தான் வழியாக நேரடியாகப் பதிவு செய்யலாம். விருப்பப்பட்டால் டெமோ தரவையும் ஏற்றலாம்.'
                    : 'No default dummy data is populated. You can record daily counter sales, add stock products, and manage credit either by voice or directly below. You can also load realistic sample data at any time.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {onLoadSampleData && (
                <button
                  id="zero-load-sample-btn"
                  onClick={onLoadSampleData}
                  className="flex items-center gap-2 rounded-2xl border border-blue-300 bg-white px-4 py-2.5 text-xs font-bold text-blue-800 shadow-sm transition hover:bg-blue-50 active:scale-95 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                >
                  <DownloadCloud className="h-4 w-4 text-blue-600" />
                  <span>{language === 'ta' ? 'மாதிரித் தரவை ஏற்று' : 'Load Demo Sample Data'}</span>
                </button>
              )}
              <button
                id="zero-add-product-btn"
                onClick={() => onNavigate('inventory')}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>{language === 'ta' ? 'முதல் பொருள் சேர்' : 'Add First Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Query Alert Banner for Retail Store */}
      {alerts.some((a) => a.type === 'CUSTOMER_QUERY' && !a.read) && (
        <div id="customer-queries-retail-banner" className="space-y-2">
          {alerts
            .filter((a) => a.type === 'CUSTOMER_QUERY' && !a.read)
            .map((queryAlert) => (
              <div
                key={queryAlert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 via-blue-950/50 to-slate-900 p-4 text-white shadow-xl animate-fadeIn"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-black text-cyan-300 border border-cyan-400/30">
                        {language === 'ta' ? 'வாடிக்கையாளர் நேரடி வினவல்' : 'New Customer Query'}
                      </span>
                      <span className="text-xs font-bold text-white">{queryAlert.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-cyan-100 font-medium">
                      {language === 'ta' && queryAlert.messageTa ? queryAlert.messageTa : queryAlert.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigate('credit')}
                    className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition active:scale-95 shadow-md shadow-cyan-500/25"
                  >
                    {language === 'ta' ? 'கடன் கணக்கு காண்' : 'View Khata'} →
                  </button>
                  <button
                    onClick={() => onNavigate('assistant')}
                    className="rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white border border-white/20 transition active:scale-95"
                  >
                    {language === 'ta' ? 'AI பதில்' : 'AI Reply'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* WHOLESALE ECOSYSTEM PANEL: INCOMING RETAIL ORDERS & RESTOCK REQUESTS */}
      {userRole === 'wholesale' && (
        <div
          id="wholesale-incoming-orders-panel"
          className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 p-6 text-white shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {language === 'ta'
                      ? 'சில்லறை வர்த்தகர் ஆர்டர்கள் & தேவைகள் (Incoming B2B Retail Orders)'
                      : 'Incoming Retailer Orders & Restock Requests'}
                  </h3>
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-black text-cyan-300">
                    B2B Wholesale Hub
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  {language === 'ta'
                    ? 'சில்லறை கடைகளில் வைக்கப்படும் கொள்முதல் ஆர்டர்கள் இங்கே நேரலையில் பிரதிபலிக்கின்றன.'
                    : 'Restock orders submitted from retail stores reflect here in real-time.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-400/20">
                {purchases.length} {language === 'ta' ? 'மொத்த ஆர்டர்கள்' : 'Total B2B Orders'}
              </span>
            </div>
          </div>

          {dispatchSuccessMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 p-3.5 text-xs font-bold text-emerald-300 animate-fadeIn">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{dispatchSuccessMsg}</span>
            </div>
          )}

          {/* Orders List */}
          <div className="mt-4 space-y-3">
            {purchases.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-blue-500/20 bg-slate-900/40">
                <Truck className="h-8 w-8 mx-auto text-blue-400/60 mb-2" />
                <p className="text-xs font-bold text-slate-300">
                  {language === 'ta'
                    ? 'புதிய சில்லறை ஆர்டர்கள் எதுவும் நிலுவையில் இல்லை'
                    : 'No incoming retailer requests at the moment'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'ta'
                    ? 'சில்லறை டாஷ்போர்டில் சரக்கு தேவை கோரிக்கையை அனுப்பியவுடன் இங்கு உடனடியாக தோன்றும்.'
                    : 'When a retail store places a restock request, it will appear here instantly for dispatch.'}
                </p>
              </div>
            ) : (
              purchases.slice(0, 6).map((pur) => {
                const isDispatched = pur.notes?.includes('DISPATCHED');
                return (
                  <div
                    key={pur.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-400/40 transition backdrop-blur-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {pur.notes?.includes('Retail') ? 'Murugan Provisions (Retail Partner)' : 'Cauvery Retail Mart'}
                        </span>
                        <span className="text-[11px] text-slate-400">• #{pur.purchaseNo}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                            isDispatched
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/20 text-amber-300 animate-pulse'
                          }`}
                        >
                          {isDispatched
                            ? (language === 'ta' ? '🟢 சரக்கு அனுப்பப்பட்டது (Dispatched)' : '🟢 Dispatched to Retail')
                            : (language === 'ta' ? '🟡 புதிய ஆர்டர் (Pending Dispatch)' : '🟡 Pending Dispatch')}
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/90 mt-1">
                        📦 {pur.items?.map((it) => `${it.productName} (${it.quantity} ${it.unit})`).join(', ') || 'Grocery Essentials'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {pur.notes || 'Wholesale delivery order'} • {new Date(pur.date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">
                          {language === 'ta' ? 'மொத்த மதிப்பு' : 'Order Value'}
                        </span>
                        <span className="text-base font-black text-emerald-400">
                          {formatCurrency(pur.total || pur.totalAmount || 0)}
                        </span>
                      </div>

                      {!isDispatched ? (
                        <button
                          onClick={() => handleAcceptAndDispatch(pur.id)}
                          disabled={dispatchingOrderId === pur.id}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>
                            {dispatchingOrderId === pur.id
                              ? (language === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Dispatching...')
                              : (language === 'ta' ? 'ஏற்று அனுப்பு' : 'Accept & Dispatch')}
                          </span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          <span>{language === 'ta' ? 'வழியில் உள்ளது' : 'In Transit'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Critical Business Alerts Bar (if any) */}
      {alerts.some((a) => !a.read && a.priority === 'CRITICAL' && a.type !== 'CUSTOMER_QUERY') && (
        <div
          id="critical-alert-banner"
          className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
            <p className="text-xs font-semibold">
              {language === 'ta'
                ? 'முக்கிய எச்சரிக்கை: சமையல் எண்ணெய் மற்றும் நல்லெண்ணெய் இருப்பு தீர்ந்துவிட்டது. உடனே மறுஆர்டர் செய்யவும்.'
                : 'Critical Alert: Cooking oils are depleted below threshold. Reorder from Cauvery Traders.'}
            </p>
          </div>
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="shrink-0 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
          >
            {language === 'ta' ? 'சரக்கு வாங்கு' : 'Reorder Now'} →
          </button>
        </div>
      )}

      {/* Core Financial Metrics — 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Today's Revenue */}
        <div
          onClick={() => onOpenNewSale()}
          className="group cursor-pointer rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-blue-900/40 dark:bg-slate-900 dark:hover:border-blue-700 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              {t('dashboard.kpiTodayRevenue')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {formatCurrency(summary.todaySales)}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <ArrowUpRight className="h-3 w-3 text-cyan-500" />
              POS
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {sales.filter((s) => s.date === new Date().toISOString().split('T')[0]).length} {t('common.details')}
            </span>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div
          onClick={() => onNavigate('reports')}
          className="group cursor-pointer rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md dark:border-cyan-900/40 dark:bg-slate-900 dark:hover:border-cyan-700 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
              {t('dashboard.kpiNetProfit')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-md shadow-cyan-500/25">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {formatCurrency(summary.monthlyNetProfit)}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-black text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
              {summary.profitMarginPercent}% {t('dashboard.grossMargin')}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {t('dashboard.kpiNetProfit')}
            </span>
          </div>
        </div>

        {/* Customer Credit Outstanding */}
        <div
          onClick={() => onNavigate('credit')}
          className="group cursor-pointer rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/40 dark:bg-slate-900 dark:hover:border-amber-700 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {t('dashboard.kpiCreditDue')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-black tracking-tight text-amber-600 dark:text-amber-400 sm:text-2xl">
            {formatCurrency(summary.customerCreditOutstanding)}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              {overdueCustomers.length} {t('navigation.customers')}
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {t('buttons.view')} →
            </span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div
          onClick={() => onNavigate('inventory')}
          className="group cursor-pointer rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition-all hover:border-rose-300 hover:shadow-md dark:border-rose-900/40 dark:bg-slate-900 dark:hover:border-rose-700 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {t('dashboard.kpiLowStock')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-black tracking-tight text-rose-500 dark:text-rose-400 sm:text-2xl">
            {lowStockItems.length}{' '}
            <span className="text-xs font-medium text-slate-400">/ {products.length}</span>
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                lowStockItems.length > 0
                  ? 'border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                  : 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
              }`}
            >
              {lowStockItems.length > 0 ? t('dashboard.kpiLowStock') : t('common.active')}
            </span>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              {t('navigation.inventory')} →
            </span>
          </div>
        </div>
      </div>


      {/* Main Grid: Business Health Score + Monthly Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Business Health Score Gauge */}
        <div
          id="business-health-score-container"
          className="rounded-3xl border border-teal-200/70 bg-gradient-to-b from-teal-50/50 via-teal-50/10 to-white p-6 shadow-xs dark:border-teal-900/40 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100/80 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'வணிக ஆரோக்கிய மதிப்பெண்' : 'Business Health Score'}
              </h3>
            </div>
            <span className="rounded-full border border-teal-200/80 bg-teal-100/80 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 dark:border-teal-800/60 dark:bg-teal-950 dark:text-teal-300">
              {healthScore.status}
            </span>
          </div>

          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-teal-100/80 bg-white/60 shadow-inner dark:border-teal-900/50 dark:bg-slate-900/60">
              <div className="text-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {healthScore.overall}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  OUT OF 100
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs font-bold text-teal-800 dark:text-teal-300">
              {language === 'ta' ? healthScore.statusTa : healthScore.status}
            </p>
            <p className="mt-1 max-w-xs text-center text-[11px] text-slate-500 dark:text-slate-400">
              {healthScore.analysis}
            </p>
          </div>

          {/* Sub-scores breakdown with soft pastel pills */}
          <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 px-3 py-1.5 text-xs text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-200">
              <span className="font-semibold">
                {language === 'ta' ? 'லாப செயல்திறன்' : 'Profit Performance'}
              </span>
              <span className="font-bold">
                {healthScore.profitScore} / 25
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sky-50/60 px-3 py-1.5 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
              <span className="font-semibold">
                {language === 'ta' ? 'சரக்கு இருப்பு ஆரோக்கியம்' : 'Inventory Health'}
              </span>
              <span className="font-bold">
                {healthScore.inventoryScore} / 20
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-1.5 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
              <span className="font-semibold">
                {language === 'ta' ? 'கடன் மீட்பு விகிதம்' : 'Credit Recovery Ratio'}
              </span>
              <span className="font-bold">
                {healthScore.creditScore} / 20
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-violet-50/60 px-3 py-1.5 text-xs text-violet-950 dark:bg-violet-950/20 dark:text-violet-200">
              <span className="font-semibold">
                {language === 'ta' ? 'செலவு கட்டுப்பாடு' : 'Expense Control'}
              </span>
              <span className="font-bold">
                {healthScore.expenseScore} / 20
              </span>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-400">
            * {language === 'ta'
              ? 'இது கணக்கிடப்பட்ட பகுப்பாய்வு மதிப்பெண் ஆகும், உத்தரவாத நிதி அளவு அல்ல.'
              : 'Analytical score derived deterministically from verified store records.'}
          </p>
        </div>

        {/* Executive P&L (Profit & Loss / லாப நஷ்ட அறிக்கை) Statement & Margin Analytics */}
        <div
          id="executive-pl-statement-widget"
          className="rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 via-slate-50/20 to-white p-6 shadow-xl dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 lg:col-span-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === 'ta'
                      ? 'லாப நஷ்ட அறிக்கை (Executive P&L Statement)'
                      : 'Executive Profit & Loss (P&L) Statement'}
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    {summary.profitMarginPercent}% {language === 'ta' ? 'நிகர லாப விகிதம்' : 'Net Margin'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ta'
                    ? 'உண்மையான விற்பனை, கொள்முதல் அடக்கவிலை மற்றும் செலவுகளின் நேரலை அறிக்கை'
                    : 'Real-time verified revenue, COGS procurement costs, and operating expenses'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPLDetails(!showPLDetails)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>{showPLDetails ? (language === 'ta' ? 'சுருக்கு' : 'Hide Math') : (language === 'ta' ? 'கணக்கீட்டு முறை' : 'P&L Formula')}</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                <span>{language === 'ta' ? 'முழு அறிக்கை' : 'Full Reports'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Core P&L Statement Line Items */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Gross Revenue */}
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-3.5 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {language === 'ta' ? 'மொத்த வருவாய் (Sales)' : '1. Gross Revenue'}
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">100%</span>
              </div>
              <p className="mt-1.5 text-lg font-black text-slate-900 dark:text-white">
                {formatCurrency(summary.monthlySales)}
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {sales.length} {language === 'ta' ? 'ரசீதுகள்' : 'transactions'}
              </span>
            </div>

            {/* 2. COGS */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-3.5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {language === 'ta' ? 'அடக்கவிலை (COGS)' : '2. Cost of Goods'}
                </span>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                  {summary.monthlySales ? Math.round((summary.monthlyCostOfGoods / summary.monthlySales) * 100) : 0}%
                </span>
              </div>
              <p className="mt-1.5 text-lg font-black text-slate-900 dark:text-white">
                -{formatCurrency(summary.monthlyCostOfGoods)}
              </p>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                {language === 'ta' ? 'பொருட்கள் அடக்கம்' : 'Direct procurement'}
              </span>
            </div>

            {/* 3. Operating Expenses */}
            <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white p-3.5 dark:border-rose-900/40 dark:from-rose-950/30 dark:to-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  {language === 'ta' ? 'செலவுகள் (Opex)' : '3. Operating Exp'}
                </span>
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                  {summary.monthlySales ? Math.round((summary.monthlyExpenses / summary.monthlySales) * 100) : 0}%
                </span>
              </div>
              <p className="mt-1.5 text-lg font-black text-slate-900 dark:text-white">
                -{formatCurrency(summary.monthlyExpenses)}
              </p>
              <span className="text-[10px] text-rose-700 dark:text-rose-400">
                {language === 'ta' ? 'வாடகை, கூலி, மின்' : 'Rent, wages, power'}
              </span>
            </div>

            {/* 4. Net Profit */}
            <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-600 to-indigo-600 p-3.5 text-white shadow-lg shadow-blue-500/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-100">
                  {language === 'ta' ? 'நிகர லாபம் (Net Profit)' : '4. Net Profit'}
                </span>
                <span className="text-[10px] font-black text-cyan-200">
                  {summary.profitMarginPercent}%
                </span>
              </div>
              <p className="mt-1.5 text-lg font-black text-white">
                {formatCurrency(summary.monthlyNetProfit)}
              </p>
              <span className="text-[10px] text-blue-100/90 font-medium">
                {language === 'ta' ? 'கடைசி நிகர லாபம்' : 'Retained Bottom Line'}
              </span>
            </div>
          </div>

          {/* Collapsible Itemized Math Formula */}
          {showPLDetails && (
            <div className="mt-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40 text-xs">
              <h4 className="font-extrabold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                {language === 'ta' ? 'லாப நஷ்ட கணக்கீட்டு சூத்திரம் (Exact P&L Formula):' : 'Itemized Accounting Math:'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-500 text-[11px]">{language === 'ta' ? 'படி 1: மொத்த லாபம் (Gross Profit)' : 'Step 1: Gross Profit'}</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(summary.monthlySales)} - {formatCurrency(summary.monthlyCostOfGoods)} = <span className="text-emerald-600">{formatCurrency(grossProfit)}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ta' ? `விகிதம்: ${grossMarginPercent}%` : `Gross Margin: ${grossMarginPercent}%`}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-500 text-[11px]">{language === 'ta' ? 'படி 2: நிகர லாபம் (Net Profit)' : 'Step 2: Net Profit'}</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(grossProfit)} - {formatCurrency(summary.monthlyExpenses)} = <span className="text-blue-600 dark:text-cyan-400">{formatCurrency(summary.monthlyNetProfit)}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ta' ? `நிகர லாப விகிதம்: ${summary.profitMarginPercent}%` : `Net Margin: ${summary.profitMarginPercent}%`}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-500 text-[11px]">{language === 'ta' ? 'படி 3: வணிக நிலை (Status)' : 'Step 3: Financial Health'}</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {summary.monthlyNetProfit > 0 ? (language === 'ta' ? '✓ லாபகரமாக இயங்குகிறது' : '✓ Profitable Business') : (language === 'ta' ? 'எச்சரிக்கை: இழப்பு' : 'Warning: Loss')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ta' ? 'கடன் வசூல் மற்றும் இருப்பு சீராக உள்ளது' : 'Based on real POS ledger'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profit Waterfall Visualization */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">
                {language === 'ta' ? 'வருவாய் பகிர்வு வரைபடம் (P&L Waterfall Distribution)' : 'P&L Waterfall Distribution Bar'}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {language === 'ta' ? `நிகர லாபம்: ${formatCurrency(summary.monthlyNetProfit)}` : `Net Profit: ${formatCurrency(summary.monthlyNetProfit)}`}
              </span>
            </div>

            {/* Stacked bar */}
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                title="Cost of Goods"
                className="bg-amber-400 transition-all duration-500"
                style={{
                  width: `${summary.monthlySales ? Math.min(80, (summary.monthlyCostOfGoods / summary.monthlySales) * 100) : 60}%`,
                }}
              ></div>
              <div
                title="Expenses"
                className="bg-rose-400 transition-all duration-500"
                style={{
                  width: `${summary.monthlySales ? Math.min(30, (summary.monthlyExpenses / summary.monthlySales) * 100) : 20}%`,
                }}
              ></div>
              <div
                title="Net Profit"
                className="bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${summary.monthlySales ? Math.max(10, (summary.monthlyNetProfit / summary.monthlySales) * 100) : 20}%`,
                }}
              ></div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="h-3 w-3 rounded-full bg-amber-400"></span>
                {language === 'ta' ? 'சரக்கு வாங்கிய விலை (COGS)' : 'Cost of Goods'}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="h-3 w-3 rounded-full bg-rose-400"></span>
                {language === 'ta' ? 'செலவுகள் (வாடகை, கூலி)' : 'Operating Expenses'}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                {language === 'ta' ? 'நிகர லாபம் (Net Profit)' : 'Net Profit'}
              </span>
            </div>
          </div>

          {/* Quick Actions Bar with soft pastel interactive buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-900 shadow-xs transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {language === 'ta' ? 'விற்பனை பதிவு' : 'Record Sale'}
            </button>
            <button
              onClick={onOpenNewPurchase}
              className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/80 px-3.5 py-2 text-xs font-bold text-sky-900 shadow-xs transition hover:bg-sky-100 active:scale-95 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200"
            >
              <Package className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              {language === 'ta' ? 'கொள்முதல் சேர்க்க' : 'Add Purchase'}
            </button>
            <button
              onClick={onOpenNewExpense}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-900 shadow-xs transition hover:bg-rose-100 active:scale-95 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              <Receipt className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              {language === 'ta' ? 'செலவு பதிவு' : 'Add Expense'}
            </button>
            <button
              onClick={() => onNavigate('credit')}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-xs transition hover:bg-amber-100 active:scale-95 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              {language === 'ta' ? 'கடன் வசூல்' : 'Udhar Collection'}
            </button>
            <button
              onClick={() => onNavigate('memory')}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/80 px-3.5 py-2 text-xs font-bold text-violet-900 shadow-xs transition hover:bg-violet-100 active:scale-95 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200"
            >
              <Brain className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              {language === 'ta' ? 'நினைவகம் காண்க' : 'Business Memory'}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Graphs (Mobile & Desktop Responsive Recharts) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales & Profit Trajectory Area Chart */}
        <div
          id="dashboard-sales-trajectory-chart"
          className="rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/50 via-emerald-50/10 to-white p-6 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'விற்பனை & லாப வரைபடம்' : 'Sales & Profit Trajectory'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {sales.length > 0
                    ? (language === 'ta' ? 'சமீபத்திய தினசரி விற்பனைப் போக்கு' : 'Recent sales and estimated margins')
                    : (language === 'ta' ? 'விற்பனை பதிவு செய்யப்பட்டவுடன் நேரலையாகக் காட்டும்' : 'Real-time velocity once sales are recorded')}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200/60 bg-emerald-100/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950 dark:text-emerald-300">
              {sales.length} {language === 'ta' ? 'விற்பனைகள்' : 'Sales'}
            </span>
          </div>

          <div className="mt-6 h-64 w-full">
            {sales.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200/80 bg-white/60 p-6 text-center dark:border-emerald-800/50 dark:bg-slate-900/40">
                <BarChart3 className="h-8 w-8 text-emerald-400 dark:text-emerald-600" />
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'இன்னும் விற்பனை பதிவுகள் இல்லை' : 'No sales records recorded yet'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {language === 'ta' ? 'குரல் மூலம் "2 கிலோ அரிசி விற்றது" எனப் பேசுங்கள்' : 'Speak "Sold 5 kg rice for ₹300" to see live graphs'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${value}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    isAnimationActive={false}
                    dataKey="sales"
                    name={language === 'ta' ? 'விற்பனை (Sales)' : 'Sales'}
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    isAnimationActive={false}
                    dataKey="profit"
                    name={language === 'ta' ? 'லாபம் (Profit)' : 'Gross Profit'}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Inventory & Stock Distribution Bar Chart */}
        <div
          id="dashboard-stock-category-chart"
          className="rounded-3xl border border-sky-200/70 bg-gradient-to-b from-sky-50/50 via-sky-50/10 to-white p-6 shadow-xs dark:border-sky-900/40 dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100/80 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'பிரிவு வாரியாக சரக்கு இருப்பு' : 'Stock Levels by Category'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {products.length > 0
                    ? `${products.length} ${language === 'ta' ? 'பொருட்கள் கணக்கில் உள்ளன' : 'products tracked in real-time'}`
                    : (language === 'ta' ? 'பொருட்கள் சேர்க்கப்பட்டவுடன் காண்பிக்கும்' : 'Tracks inventory by category')}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-sky-600 hover:underline dark:text-sky-400"
            >
              {language === 'ta' ? 'சரக்கு பட்டியல்' : 'Inventory'} →
            </button>
          </div>

          <div className="mt-6 h-64 w-full">
            {products.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-sky-200/80 bg-white/60 p-6 text-center dark:border-sky-800/50 dark:bg-slate-900/40">
                <Boxes className="h-8 w-8 text-sky-400 dark:text-sky-600" />
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'சரக்கு விவரங்கள் எதுவும் சேர்க்கப்படவில்லை' : 'No products in inventory yet'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {language === 'ta' ? '+ புதிய பொருள் சேர்க்க அல்லது மாதிரி தரவை ஏற்றவும்' : 'Add products or load sample demo data'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(val: any) => [`${val} units`, 'Stock']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar isAnimationActive={false} dataKey="stock" name={language === 'ta' ? 'இருப்பு' : 'Units'} radius={[8, 8, 0, 0]}>
                    {categoryStockData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Three Column Section: Low Stock Table, Top Debtors, Financial Pie Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Low Stock Items Action Card */}
        <div
          id="dash-low-stock-card"
          className="rounded-3xl border border-rose-200/70 bg-gradient-to-b from-rose-50/40 via-rose-50/10 to-white p-6 shadow-xs dark:border-rose-900/40 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100/80 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                <Boxes className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'சரக்கு மறுஆர்டர் தேவை' : 'Immediate Reorder Alert'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
            >
              {language === 'ta' ? 'அனைத்தும்' : 'View All'} ({products.length}) →
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {lowStockItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                {language === 'ta' ? 'அனைத்து பொருட்களும் போதிய இருப்புடன் உள்ளன' : 'All items are well stocked.'}
              </p>
            ) : (
              lowStockItems.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'ta' ? p.nameTa : p.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ta' ? 'குறைந்தபட்ச இருப்பு:' : 'Min Threshold:'} {p.minStock} {p.unit} • {p.supplierName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.currentStock === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {p.currentStock} {p.unit} left
                    </span>
                    <button
                      onClick={onOpenNewPurchase}
                      className="mt-1 block text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
                    >
                      {language === 'ta' ? 'ஆர்டர் செய்' : 'Reorder'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer Outstanding Credit Card */}
        <div
          id="dash-credit-debtors-card"
          className="rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50/40 via-amber-50/10 to-white p-6 shadow-xs dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'கடன் பாக்கி உள்ள வாடிக்கையாளர்கள்' : 'Top Credit Due Customers'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('credit')}
              className="text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
            >
              {language === 'ta' ? 'கடன் கணக்கு' : 'Credit Ledger'} →
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {overdueCustomers.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                {language === 'ta' ? 'யாருக்கும் கடன் பாக்கி இல்லை!' : 'No pending customer credit.'}
              </p>
            ) : (
              overdueCustomers.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {c.phone || 'No phone'} • {c.purchaseCount} {language === 'ta' ? 'முறை வாங்கியுள்ளார்' : 'purchases'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      {formatCurrency(c.outstandingBalance)}
                    </p>
                    <button
                      onClick={() => onNavigate('credit')}
                      className="mt-1 text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {language === 'ta' ? 'நினைவூட்டு' : 'Remind'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

        {/* Financial Distribution Pie Chart */}
        <div
          id="dash-financial-pie-card"
          className="rounded-3xl border border-violet-200/70 bg-gradient-to-b from-violet-50/40 via-violet-50/10 to-white p-6 shadow-xs dark:border-violet-900/40 dark:from-violet-950/20 dark:via-slate-900 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100/80 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                <PieChart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'நிதி விநியோகம்' : 'Financial Distribution'}
              </h3>
            </div>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
              {language === 'ta' ? 'AI கணிப்பு' : 'AI Analysis'}
            </span>
          </div>

          <div className="mt-6 h-56 w-full">
            {financialPieData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <PieChart className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-xs text-slate-500">
                  {language === 'ta' ? 'போதிய தரவு இல்லை' : 'Insufficient financial data'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val), 'Amount']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Pie
                    data={financialPieData}
                    isAnimationActive={false}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {financialPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* RETAIL RESTOCK REQUEST MODAL */}
      {isRestockModalOpen && (
        <div id="retail-restock-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-blue-500/30 bg-white p-6 shadow-2xl dark:border-blue-900/50 dark:bg-slate-900 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'ta' ? 'மொத்த விற்பனையாளரிடம் சரக்கு கேட்க (B2B Restock Order)' : 'Place Wholesale Restock Request'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ta'
                      ? 'இந்த ஆர்டர் மொத்த விற்பனையாளர் டாஷ்போர்டில் உடனடியாகப் பிரதிபலிக்கும்.'
                      : 'This order reflects immediately in the wholesale dashboard for fulfillment.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ta' ? 'மொத்த விற்பனையாளர் / மண்டி (Wholesale Supplier)' : 'Select Wholesaler / Mandi'}
                </label>
                <select
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Cauvery Wholesale Mandi">Cauvery Wholesale Mandi (காவேரி மண்டி - மதுரை)</option>
                  <option value="Madurai Wholesale Provisions">Madurai Wholesale Provisions (மாட்டுத்தாவணி)</option>
                  <option value="Salem Rice Mills & Mandi">Salem Rice Mills (சேலம் அரிசி மண்டி)</option>
                  <option value="Aachi Direct Wholesale Hub">Aachi Direct Wholesale Hub (ஆச்சி)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ta' ? 'தேவையான பொருள் (Product)' : 'Product to Restock'}
                  </label>
                  <select
                    value={restockProductId}
                    onChange={(e) => setRestockProductId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {language === 'ta' && p.nameTa ? p.nameTa : p.name} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ta' ? 'அளவு (Quantity)' : 'Quantity Required'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ta' ? 'அவசர நிலை / குறிப்பு (Urgency / Note)' : 'Urgency Level / Instructions'}
                </label>
                <select
                  value={restockUrgency}
                  onChange={(e) => setRestockUrgency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Urgent Restock">⚡ அவசர மறுஆர்டர் (Urgent - Stock Depleted)</option>
                  <option value="Standard Weekend Restock">📦 வழக்கமான வார இறுதி கொள்முதல் (Standard)</option>
                  <option value="Bulk Advance Order">🚛 மொத்த அட்வான்ஸ் ஆர்டர் (Bulk Advance)</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-slate-800/80 p-3 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {language === 'ta' ? 'தோராய மொத்த மதிப்பு:' : 'Estimated Order Value:'}
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-cyan-400">
                  {formatCurrency((products.find((p) => p.id === restockProductId)?.costPrice || 40) * restockQuantity)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  id="submit-restock-request-btn"
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{language === 'ta' ? 'மொத்த விற்பனையாளருக்கு அனுப்பு' : 'Submit to Wholesale Hub'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 22 Indian Languages Selection Modal */}
      {onLanguageChange && (
        <LanguageSelectorModal
          isOpen={isLangModalOpen}
          currentLanguage={language}
          onSelect={onLanguageChange}
          onClose={() => setIsLangModalOpen(false)}
        />
      )}
    </div>
  );
};

export const DashboardView = React.memo(DashboardViewComponent);
