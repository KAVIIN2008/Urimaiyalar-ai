import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import { Mic } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';

// Code-split heavy views to reduce initial bundle and accelerate page switches
const SalesView = lazy(() => import('./components/SalesView').then((m) => ({ default: m.SalesView })));
const PurchasesView = lazy(() => import('./components/PurchasesView').then((m) => ({ default: m.PurchasesView })));
const InventoryView = lazy(() => import('./components/InventoryView').then((m) => ({ default: m.InventoryView })));
const CustomersView = lazy(() => import('./components/CustomersView').then((m) => ({ default: m.CustomersView })));
const SuppliersView = lazy(() => import('./components/SuppliersView').then((m) => ({ default: m.SuppliersView })));
const CreditView = lazy(() => import('./components/CreditView').then((m) => ({ default: m.CreditView })));
const ExpensesView = lazy(() => import('./components/ExpensesView').then((m) => ({ default: m.ExpensesView })));
const BusinessMemoryView = lazy(() => import('./components/BusinessMemoryView').then((m) => ({ default: m.BusinessMemoryView })));
const SchemesView = lazy(() => import('./components/SchemesView').then((m) => ({ default: m.SchemesView })));
const MarketView = lazy(() => import('./components/MarketView').then((m) => ({ default: m.MarketView })));
const ReportsView = lazy(() => import('./components/ReportsView').then((m) => ({ default: m.ReportsView })));
const AssistantView = lazy(() => import('./components/AssistantView').then((m) => ({ default: m.AssistantView })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const CustomerPortal = lazy(() => import('./components/CustomerPortal').then((m) => ({ default: m.CustomerPortal })));
const AuthView = lazy(() => import('./components/AuthView').then((m) => ({ default: m.AuthView })));
const LandingPage = lazy(() => import('./components/LandingPage').then((m) => ({ default: m.LandingPage })));

import { VoiceModal } from './components/VoiceModal';
import { playSoundEffect } from './utils/audioSpeech';
import { InstallPrompt } from './components/InstallPrompt';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './contexts/AuthContext';
import {
  BusinessProfile,
  FinancialSummary,
  BusinessHealthScore,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Expense,
  BusinessMemory,
  BusinessAlert,
  LanguageCode,
  IntentEntityExtraction,
} from './types';
import {
  defaultEmptyBusinessProfile,
  initialProfile,
  initialDemoState,
  getFreshDemoData,
} from './data/demoData';
import { calculateFinancialSummary, computeBusinessHealthScore } from './utils/financeEngine';
import { api } from './lib/api';

const isDemoModeActive = () => {
  try {
    return localStorage.getItem('urimaiyalar_demo_loaded') === 'true';
  } catch {
    return false;
  }
};

const defaultEmptySummary: FinancialSummary = {
  todaySales: 0,
  todayCostOfGoods: 0,
  todayGrossProfit: 0,
  todayExpenses: 0,
  todayNetProfit: 0,
  monthlySales: 0,
  monthlyCostOfGoods: 0,
  monthlyGrossProfit: 0,
  monthlyExpenses: 0,
  monthlyNetProfit: 0,
  profitMarginPercent: 0,
  customerCreditOutstanding: 0,
  supplierPayablesOutstanding: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
};

const defaultEmptyHealth: BusinessHealthScore = {
  overall: 100,
  profitScore: 20,
  inventoryScore: 20,
  creditScore: 20,
  expenseScore: 20,
  customerScore: 20,
  status: 'Ready / Clean Store',
  statusTa: 'புதிய தொடக்கம் / தயார் நிலை',
  analysis: 'Store initialized with zero data. You can start entering daily sales, products, and customer credit.',
};

// Pure lazy initializer to ensure heavy computations execute strictly ONCE at startup
const getInitialAppData = () => {
  const fresh = isDemoModeActive() ? getFreshDemoData() : null;
  const initialSummary = fresh
    ? calculateFinancialSummary(
        fresh.products,
        fresh.sales,
        fresh.purchases,
        fresh.expenses,
        fresh.customers,
        fresh.suppliers
      )
    : defaultEmptySummary;
  const initialHealth = fresh
    ? computeBusinessHealthScore(initialSummary, fresh.products, fresh.customers)
    : defaultEmptyHealth;

  return {
    profile: fresh?.profile || defaultEmptyBusinessProfile,
    summary: initialSummary,
    healthScore: initialHealth,
    products: fresh?.products || [],
    customers: fresh?.customers || [],
    suppliers: fresh?.suppliers || [],
    sales: fresh?.sales || [],
    purchases: fresh?.purchases || [],
    expenses: fresh?.expenses || [],
    memories: fresh?.memories || [],
    alerts: fresh?.alerts || [],
  };
};

// Modern SaaS loading skeleton for instant visual response
const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-2 sm:p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-4 w-72 rounded-lg bg-slate-100 dark:bg-slate-800/60"></div>
      </div>
      <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 p-4"></div>
      ))}
    </div>
    <div className="h-80 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/40"></div>
  </div>
);

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('urimaiyalar_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  // Navigation state
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Auth State
  const { isAuthenticated, userRole, login, logout, setRole: setUserRole } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [showLanding, setShowLanding] = useState<boolean>(true);

  // Sidebar mobile and desktop toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Voice modal state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Pre-seed demo data once at mount
  const [initialData] = useState(getInitialAppData);

  // Application Data States
  const [profile, setProfile] = useState<BusinessProfile>(initialData.profile);
  const [summary, setSummary] = useState<FinancialSummary>(initialData.summary);
  const [healthScore, setHealthScore] = useState<BusinessHealthScore>(initialData.healthScore);

  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialData.suppliers);
  const [sales, setSales] = useState<Sale[]>(initialData.sales);
  const [purchases, setPurchases] = useState<Purchase[]>(initialData.purchases);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [memories, setMemories] = useState<BusinessMemory[]>(initialData.memories);
  const [alerts, setAlerts] = useState<BusinessAlert[]>(initialData.alerts);
  const [isLoading, setIsLoading] = useState(false);

  // Sync dark class with document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('urimaiyalar_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('urimaiyalar_theme', 'light');
    }
  }, [isDark]);

  // Direct URL support for /ai/trace and /ai/architecture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/ai/trace') || hash.includes('ai-trace') || hash.includes('trace')) {
        setCurrentView('ai-trace');
        setShowLanding(false);
      } else if (path.includes('/ai/architecture') || hash.includes('ai-architecture') || hash.includes('architecture')) {
        setCurrentView('ai-architecture');
        setShowLanding(false);
      }
    }
  }, []);

  // Fetch all live data from backend APIs
  const refreshAllData = useCallback(async () => {
    try {
      const [
        profileRes,
        summaryRes,
        prodsRes,
        custsRes,
        suppsRes,
        salesRes,
        pursRes,
        expsRes,
        memsRes,
        alertsRes,
      ] = await Promise.all([
        api('/api/business/profile').then((r) => r.json()).catch(() => null),
        api('/api/financial/summary').then((r) => r.json()).catch(() => null),
        api('/api/products').then((r) => r.json()).catch(() => null),
        api('/api/customers').then((r) => r.json()).catch(() => null),
        api('/api/suppliers').then((r) => r.json()).catch(() => null),
        api('/api/sales').then((r) => r.json()).catch(() => null),
        api('/api/purchases').then((r) => r.json()).catch(() => null),
        api('/api/expenses').then((r) => r.json()).catch(() => null),
        api('/api/memory').then((r) => r.json()).catch(() => null),
        api('/api/alerts').then((r) => r.json()).catch(() => null),
      ]);

      // FIXED: Always update state from backend, regardless of whether data is empty.
      // Previously this only ran when hasBackendData was true, causing first-time inserts
      // to be invisible (e.g. first customer added would never appear).
      let backendResponded = false;

      if (profileRes && !profileRes.error) { setProfile(profileRes); backendResponded = true; }
      if (summaryRes?.summary) setSummary(summaryRes.summary);
      if (summaryRes?.health) setHealthScore(summaryRes.health);
      if (Array.isArray(prodsRes)) { setProducts(prodsRes); backendResponded = true; }
      if (Array.isArray(custsRes)) { setCustomers(custsRes); backendResponded = true; }
      if (Array.isArray(suppsRes)) { setSuppliers(suppsRes); backendResponded = true; }
      if (Array.isArray(salesRes)) { setSales(salesRes); backendResponded = true; }
      if (Array.isArray(pursRes)) { setPurchases(pursRes); backendResponded = true; }
      if (Array.isArray(expsRes)) { setExpenses(expsRes); backendResponded = true; }
      if (Array.isArray(memsRes)) { setMemories(memsRes); backendResponded = true; }
      if (Array.isArray(alertsRes)) { setAlerts(alertsRes); backendResponded = true; }

      // Only fall back to demo data if backend is completely unreachable
      if (!backendResponded && isDemoModeActive()) {
        const fresh = getFreshDemoData();
        setProfile(fresh.profile);
        setProducts(fresh.products);
        setCustomers(fresh.customers);
        setSuppliers(fresh.suppliers);
        setSales(fresh.sales);
        setPurchases(fresh.purchases);
        setExpenses(fresh.expenses);
        setMemories(fresh.memories);
        setAlerts(fresh.alerts);
        const calcSummary = calculateFinancialSummary(
          fresh.products,
          fresh.sales,
          fresh.purchases,
          fresh.expenses,
          fresh.customers,
          fresh.suppliers
        );
        setSummary(calcSummary);
        setHealthScore(computeBusinessHealthScore(calcSummary, fresh.products, fresh.customers));
      }
    } catch (err) {
      console.warn('Backend API connection notice, keeping current state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Execute Voice or AI Action
  const handleExecuteAction = async (extraction: IntentEntityExtraction) => {
    const { intent, entities } = extraction;

    if (intent === 'NAVIGATE') {
      if (entities.targetView) {
        if (entities.targetView === 'customer_portal') {
          setUserRole('customer');
          setCurrentView('customer_portal');
        } else {
          setUserRole('retail');
          setCurrentView(entities.targetView);
        }
        playSoundEffect('click');
      }
      return;
    }

    if (intent === 'SWITCH_ROLE') {
      const targetRole = entities.role || (userRole === 'retail' ? 'customer' : 'retail');
      setUserRole(targetRole);
      if (targetRole === 'customer') {
        setCurrentView('customer_portal');
      } else {
        setCurrentView('dashboard');
      }
      playSoundEffect('action_success');
      return;
    }

    if (intent === 'CHANGE_LANGUAGE') {
      const newLang = entities.targetLang || (language === 'ta' ? 'en' : 'ta');
      setLanguage(newLang);
      playSoundEffect('action_success');
      return;
    }

    if (intent === 'TOGGLE_THEME') {
      if (entities.themeTarget === 'dark') {
        setIsDark(true);
      } else if (entities.themeTarget === 'light') {
        setIsDark(false);
      } else {
        setIsDark((prev) => !prev);
      }
      playSoundEffect('action_success');
      return;
    }

    if (intent === 'SPEAK_CUSTOMER') {
      setUserRole('retail');
      setCurrentView('credit');
      playSoundEffect('click');
      return;
    }

    if (intent === 'CLEAR_DATA' || intent === 'CLEAR_TEST_DATA') {
      await handleClearTestData();
      return;
    }

    if (intent === 'LOAD_SAMPLE_DATA') {
      await handleLoadSampleData();
      return;
    }

    if (intent === 'ADD_SUPPLIER') {
      await api('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entities.supplierName || 'Wholesale Supplier',
          phone: entities.phone || '9840011223',
          contactPerson: entities.supplierName || 'Wholesale Supplier',
          address: 'Wholesale Market, Tamil Nadu',
          productsSupplied: ['Groceries'],
        }),
      });
      playSoundEffect('action_success');
    } else if (intent === 'RECORD_SUPPLIER_PAYMENT') {
      const matchSup = suppliers.find((s) =>
        (s.name || '').toLowerCase().includes((entities.supplier || '').toLowerCase())
      ) || suppliers[0];
      if (matchSup) {
        await api(`/api/suppliers/${matchSup.id}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: entities.amount || 1000,
            notes: 'Voice AI recorded supplier settlement',
          }),
        });
        playSoundEffect('action_success');
      }
    } else if (intent === 'ADD_PRODUCT') {
      await api('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entities.productName || 'New Product',
          nameTa: entities.productNameTa || entities.productName || 'புதிய பொருள்',
          category: entities.category || 'grains',
          currentStock: entities.currentStock || entities.quantity || 25,
          unit: entities.unit || 'kg',
          sellingPrice: entities.sellingPrice || entities.amount || 60,
          purchasePrice: entities.purchasePrice || Math.round((entities.sellingPrice || 60) * 0.85),
          minStock: entities.minStock || 5,
        }),
      });
      playSoundEffect('action_success');
    } else if (intent === 'ADD_CUSTOMER') {
      await api('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entities.customerName || 'New Customer',
          phone: entities.phone || '9842100000',
          creditLimit: entities.creditLimit || 5000,
          outstandingBalance: 0,
          address: 'Local Counter Customer',
        }),
      });
      playSoundEffect('action_success');
    } else if (intent === 'RECORD_PAYMENT') {
      const matchCust = customers.find((c) =>
        (c.name || '').toLowerCase().includes((entities.customer || '').toLowerCase())
      ) || customers[0];
      if (matchCust) {
        await api(`/api/customers/${matchCust.id}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: entities.amount || 500,
            notes: 'Voice AI recorded debt recovery',
          }),
        });
        playSoundEffect('action_success');
      }
    } else if (intent === 'ADD_PURCHASE') {
      await api('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: entities.supplier || 'Sri Meenakshi Rice Mill',
          items: [
            {
              productName: entities.product || 'General Stock',
              quantity: entities.quantity || 10,
              unit: entities.unit || 'bag',
              unitPrice: entities.amount ? entities.amount / (entities.quantity || 10) : 1500,
              total: entities.amount || 15000,
            },
          ],
          totalAmount: entities.amount || 15000,
          amountPaid: entities.amount || 15000,
          paymentType: 'cash',
        }),
      });
      playSoundEffect('action_success');
    } else if (intent === 'ADD_SALE') {
      await api('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: entities.customerName || entities.customer || 'Walk-in Customer',
          items: [
            {
              productName: entities.productName || entities.product || 'General Goods',
              quantity: entities.quantity || 1,
              unit: entities.unit || 'kg',
              unitPrice: entities.amount || 100,
              total: entities.amount || 100,
            },
          ],
          subtotal: entities.amount || 100,
          discount: 0,
          tax: 0,
          total: entities.amount || 100,
          paymentType: entities.paymentMode === 'credit' ? 'credit' : 'cash',
          amountPaid: entities.paymentMode === 'credit' ? 0 : entities.amount || 100,
          balanceDue: entities.paymentMode === 'credit' ? entities.amount || 100 : 0,
        }),
      });
      playSoundEffect('action_success');
    } else if (intent === 'ADD_EXPENSE') {
      await api('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: entities.expenseCategory || entities.category || 'miscellaneous',
          amount: entities.amount || 100,
          description: entities.productName || 'Operational expense',
          date: new Date().toISOString().split('T')[0],
          paymentMode: 'cash',
        }),
      });
      playSoundEffect('action_success');
    } else if (intent === 'SAVE_MEMORY') {
      await api('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'general',
          title: entities.productName || 'Store observation',
          titleTa: entities.productName || 'கடை கவனிப்பு',
          content: entities.memoryContent || 'Saved from AI voice instruction',
          contentTa: entities.memoryContent || 'குரல் வழி பதிவு',
          relatedEntityName: entities.customerName,
          tags: ['VoiceAI'],
          pinned: false,
        }),
      });
      playSoundEffect('action_success');
    }

    await refreshAllData();
  };

  // API Call Handlers
  const handleAddSale = async (saleData: any) => {
    try {
      const res = await api('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      const created = await res.json();
      if (created?.id) {
        setSales((prev) => [created, ...prev]);
      }
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err: any) {
      console.error('Failed to add sale:', err);
      throw err; // propagate so SalesView can show error
    }
  };

  const handleAddPurchase = async (purchaseData: any) => {
    await api('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });
    await refreshAllData();
  };

  const handleAddExpense = async (expData: any) => {
    try {
      const res = await api('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expData),
      });
      const created = await res.json();
      if (created?.id) {
        setExpenses((prev) => [created, ...prev]);
      }
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const handleAddProduct = async (prod: any) => {
    try {
      const res = await api('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
      const created = await res.json();
      if (created?.id) {
        setProducts((prev) => [created, ...prev]);
      }
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to add product:', err);
    }
  };

  const handleUpdateProduct = async (id: string, updates: any) => {
    try {
      const res = await api(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleAddCustomer = async (cust: any) => {
    try {
      const res = await api('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cust),
      });
      const created = await res.json();
      if (created?.id) {
        setCustomers((prev) => [created, ...prev]);
      }
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err: any) {
      console.error('Failed to add customer:', err);
      throw err; // propagate so UI can show error instead of fake success
    }
  };

  const handleUpdateCustomer = async (id: string, updates: any) => {
    try {
      const res = await api(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      throw err;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await api(`/api/customers/${id}`, { method: 'DELETE' });
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      throw err;
    }
  };

  const handleRecordCustomerPayment = async (customerId: string, amount: number, notes: string) => {
    try {
      await api(`/api/customers/${customerId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, notes }),
      });
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const handleAddSupplier = async (sup: any) => {
    try {
      const res = await api('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sup),
      });
      const created = await res.json();
      if (created?.id) {
        setSuppliers((prev) => [created, ...prev]);
      }
      await refreshAllData();
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to add supplier:', err);
    }
  };

  const handleRecordSupplierPayment = async (supplierId: string, amount: number, notes: string) => {
    await api(`/api/suppliers/${supplierId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, notes }),
    });
    await refreshAllData();
  };

  const handleAddMemory = async (mem: any) => {
    await api('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mem),
    });
    await refreshAllData();
  };

  const handleDeleteMemory = async (id: string) => {
    await api(`/api/memory/${id}`, { method: 'DELETE' });
    await refreshAllData();
  };

  const handleTogglePinMemory = async (id: string) => {
    const mem = memories.find((m) => m.id === id);
    if (!mem) return;
    await api(`/api/memory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !mem.pinned }),
    });
    await refreshAllData();
  };

  const handleLoadSampleData = async () => {
    try {
      setIsLoading(true);
      const fresh = getFreshDemoData();

      // 1. Instantly update all pages with mock up data across the entire application
      setProfile(fresh.profile);
      setProducts(fresh.products);
      setCustomers(fresh.customers);
      setSuppliers(fresh.suppliers);
      setSales(fresh.sales);
      setPurchases(fresh.purchases);
      setExpenses(fresh.expenses);
      setMemories(fresh.memories);
      setAlerts(fresh.alerts);

      const calcSummary = calculateFinancialSummary(
        fresh.products,
        fresh.sales,
        fresh.purchases,
        fresh.expenses,
        fresh.customers,
        fresh.suppliers
      );
      setSummary(calcSummary);
      setHealthScore(computeBusinessHealthScore(calcSummary, fresh.products, fresh.customers));

      // 2. Persist in localStorage so all pages retain mock data
      localStorage.setItem('urimaiyalar_demo_loaded', 'true');
      playSoundEffect('action_success');

      // 3. Sync to backend database
      try {
        await api('/api/business/load-sample', { method: 'POST' });
        const [summaryRes, prodsRes, custsRes, salesRes] = await Promise.all([
          api('/api/financial/summary').then((r) => r.json()).catch(() => null),
          api('/api/products').then((r) => r.json()).catch(() => null),
          api('/api/customers').then((r) => r.json()).catch(() => null),
          api('/api/sales').then((r) => r.json()).catch(() => null),
        ]);
        if (summaryRes?.summary) setSummary(summaryRes.summary);
        if (summaryRes?.health) setHealthScore(summaryRes.health);
        if (Array.isArray(prodsRes) && prodsRes.length > 0) setProducts(prodsRes);
        if (Array.isArray(custsRes) && custsRes.length > 0) setCustomers(custsRes);
        if (Array.isArray(salesRes) && salesRes.length > 0) setSales(salesRes);
      } catch (backendErr) {
        console.warn('Backend sync note (UI is already loaded with demo data):', backendErr);
      }
    } catch (err) {
      console.error('Failed to load sample data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    await handleLoadSampleData();
  };

  const handleClearTestData = async () => {
    try {
      setIsLoading(true);
      localStorage.removeItem('urimaiyalar_demo_loaded');
      setProfile(defaultEmptyBusinessProfile);
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setSales([]);
      setPurchases([]);
      setExpenses([]);
      setMemories([]);
      setAlerts([]);
      setSummary(defaultEmptySummary);
      setHealthScore(defaultEmptyHealth);
      await api('/api/business/clear', { method: 'POST' }).catch(() => {});
      playSoundEffect('action_success');
    } catch (err) {
      console.error('Failed to clear test data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updated: BusinessProfile) => {
    await api('/api/business/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    await refreshAllData();
  };

  const handleMarkAlertRead = async (id: string) => {
    await api(`/api/alerts/${id}/read`, { method: 'PUT' });
    await refreshAllData();
  };

  const handleDismissAlert = async (id: string) => {
    await api(`/api/alerts/${id}`, { method: 'DELETE' });
    await refreshAllData();
  };

  if (!isAuthenticated && showLanding) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <InstallPrompt language={language} variant="banner" />
        <LandingPage
          language={language}
          onLanguageChange={setLanguage}
          onGetStarted={() => setShowLanding(false)}
        />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <InstallPrompt language={language} variant="banner" />
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
          <AuthView
            language={language}
            onLanguageChange={setLanguage}
            onLogin={(role, token) => {
              login(role, token);
              setCurrentView(role === 'customer' ? 'customer_portal' : 'dashboard');
            }}
          />
        </GoogleOAuthProvider>
      </Suspense>
    );
  }

  return (
    <div
      id="app-root-container"
      className={`relative h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#070b14] dark:text-slate-100 ${
        isDark ? 'dark' : ''
      }`}
    >
      {/* Ambient Visual Mesh Background Orbs — GPU-promoted, isolated paint layer */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" style={{ contain: 'strict' }}>
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-600/15 animate-float-slow" style={{ willChange: 'transform' }} />
        <div className="absolute top-1/3 -right-40 h-[550px] w-[550px] rounded-full bg-cyan-400/8 blur-[110px] dark:bg-cyan-500/10" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/8 blur-[120px] dark:bg-indigo-600/12" />
      </div>

      {/* Top Navbar */}
      <Navbar
        profile={profile}
        alerts={alerts}
        language={language}
        onLanguageChange={setLanguage}
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onResetData={handleResetData}
        onClearData={handleClearTestData}
        onLoadSampleData={handleLoadSampleData}
        userRole={userRole}
        onToggleRole={() => {
          setUserRole((r) => (r === 'retail' ? 'customer' : 'retail'));
          playSoundEffect('click');
        }}
        onLogout={() => {
          logout();
          playSoundEffect('click');
        }}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onNavigate={(view) => {
          if (view === 'customer_portal') {
            setUserRole('customer');
          } else {
            setUserRole('retail');
            setCurrentView(view);
          }
          setIsSidebarOpen(false);
        }}
        onMarkAlertRead={handleMarkAlertRead}
        onDismissAlert={handleDismissAlert}
      />

      {/* Main Layout Area — app-shell: sidebar fixed, content scrolls */}
      <div className="flex h-full overflow-hidden" style={{ paddingTop: '4rem' }}>
        {/* Navigation Sidebar */}
        <Sidebar
          userRole={userRole}
          currentView={userRole === 'customer' ? 'customer_portal' : currentView}
          onNavigate={(view) => {
            if (userRole !== 'customer') {
              setCurrentView(view);
            }



            setIsSidebarOpen(false);
          }}
          language={language}
          healthScore={healthScore.overall}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onClearTestData={handleClearTestData}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* View Content Body — ONLY this area scrolls */}
        <main
          id="main-scroll-container"
          className={
            currentView === 'assistant'
              ? `flex-1 min-h-0 overflow-hidden flex flex-col px-3 pt-2 pb-2 sm:px-6 lg:px-8 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`
              : `flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-3 pb-24 sm:px-6 sm:pt-4 lg:px-8 lg:pt-4 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`
          }
          style={{ overscrollBehavior: 'contain' }}
        >
          <Suspense fallback={<PageSkeleton />}>
            {userRole === 'customer' || currentView === 'customer_portal' ? (
            <CustomerPortal
              products={products}
              businessProfile={{
                businessName: profile.businessName || 'Thirumalai Stores',
                businessNameTa: profile.businessNameTa || 'திருமலை ஸ்டோர்ஸ்',
                phone: profile.phone || '9842100000',
                address: profile.address || 'Madurai, Tamil Nadu',
              }}
              language={language}
              onRefreshData={refreshAllData}
              onSwitchToOwner={() => {
                logout();


              }}
            />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  summary={summary}
                  healthScore={healthScore}
                  products={products}
                  customers={customers}
                  sales={sales}
                  purchases={purchases}
                  alerts={alerts}
                  language={language}
                  onLanguageChange={setLanguage}
                  userRole={userRole}
                  onNavigate={setCurrentView}
                  onOpenVoice={() => setIsVoiceModalOpen(true)}
                  onOpenNewSale={() => setCurrentView('sales')}
                  onOpenNewPurchase={() => setCurrentView('purchases')}
                  onOpenNewExpense={() => setCurrentView('expenses')}
                  onAddPurchase={handleAddPurchase}
                  onRefreshData={refreshAllData}
                  onLoadSampleData={handleLoadSampleData}
                />
              )}

          {currentView === 'assistant' && (
            <AssistantView
              language={language}
              onLanguageChange={setLanguage}
              userRole={userRole}
              onOpenVoice={() => setIsVoiceModalOpen(true)}
              onExecuteAction={handleExecuteAction}
              onRefreshData={refreshAllData}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'sales' && (
            <SalesView
              sales={sales}
              products={products}
              customers={customers}
              language={language}
              onAddSale={handleAddSale}
            />
          )}

          {currentView === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              products={products}
              suppliers={suppliers}
              language={language}
              onAddPurchase={handleAddPurchase}
              onRefreshData={refreshAllData}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryView
              products={products}
              suppliers={suppliers}
              language={language}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onOpenPurchase={() => setCurrentView('purchases')}
              onRefreshData={refreshAllData}
            />
          )}

          {(currentView === 'customers' || currentView === 'retailer_network') && (
            <CustomersView
              customers={customers}
              language={language}
              onAddCustomer={handleAddCustomer}
              onRefreshData={refreshAllData}
            />
          )}

          {(currentView === 'suppliers' || currentView === 'find_wholesale') && (
            <SuppliersView
              suppliers={suppliers}
              language={language}
              onAddSupplier={handleAddSupplier}
              onRefreshData={refreshAllData}
              isFinderMode={currentView === 'find_wholesale'}
            />
          )}

          {currentView === 'credit' && (
            <CreditView
              customers={customers}
              suppliers={suppliers}
              language={language}
              onRecordCustomerPayment={handleRecordCustomerPayment}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              language={language}
              onAddExpense={handleAddExpense}
              onRefreshData={refreshAllData}
            />
          )}

          {currentView === 'memory' && (
            <BusinessMemoryView
              memories={memories}
              language={language}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onTogglePin={handleTogglePinMemory}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              summary={summary}
              sales={sales}
              expenses={expenses}
              language={language}
            />
          )}

          {currentView === 'schemes' && (
            <SchemesView language={language} />
          )}

          {currentView === 'market' && (
            <MarketView language={language} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              profile={profile}
              language={language}
              onLanguageChange={setLanguage}
              isDark={isDark}
              onThemeToggle={() => setIsDark(!isDark)}
              onResetData={handleResetData}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
            </>
          )}
          </Suspense>
        </main>
      </div>

      {/* Floating Voice AI Launcher Button (Hidden on AI Assistant view to avoid overlapping input and Send button) */}
      {currentView !== 'assistant' && (
        <button
          id="floating-voice-ai-trigger"
          onClick={() => {
            setIsVoiceModalOpen(true);
            playSoundEffect('click');
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-blue-400/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-4 py-3 text-white shadow-xl shadow-blue-900/35 transition-all hover:scale-105 active:scale-95"
          title={language === 'ta' ? 'குரல் AI உதவியாளர்' : 'Voice AI Assistant'}
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
          </span>
          <Mic className="h-5 w-5 animate-pulse text-cyan-200" />
          <span className="hidden text-xs font-black tracking-wide sm:inline">
            {language === 'ta' ? 'குரல் AI' : 'Voice AI'}
          </span>
        </button>
      )}

      {/* Real-Time Voice Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onExecuteAction={handleExecuteAction}
        onRefreshData={refreshAllData}
      />
    </div>
  );
}
