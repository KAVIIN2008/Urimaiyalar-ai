import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  FileText,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Send,
  Plus,
  Minus,
  Sparkles,
  Search,
  Receipt,
  ArrowRight,
  Store,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { Product, Customer, Sale, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { playSoundEffect } from '../utils/audioSpeech';
import { api } from '../lib/api';

interface CustomerPortalProps {
  products: Product[];
  businessProfile: {
    businessName: string;
    businessNameTa: string;
    phone: string;
    address: string;
  };
  language: LanguageCode;
  onRefreshData: () => Promise<void>;
  onSwitchToOwner: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  products,
  businessProfile,
  language,
  onRefreshData,
  onSwitchToOwner,
}) => {
  // Auth state
  const [isRegistered, setIsRegistered] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Customer profile state (after login)
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Sale[]>([]);
  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regLandmark, setRegLandmark] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Customer Navigation Tabs
  const [activeTab, setActiveTab] = useState<'katha' | 'profile' | 'catalog' | 'query'>('katha');

  // Grocery Cart State for Quick Store Ordering
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderSentNotice, setOrderSentNotice] = useState(false);

  // Customer Query / Message to Store Owner State
  const [queryText, setQueryText] = useState('');
  const [queryCategory, setQueryCategory] = useState('Product Inquiry');
  const [isSendingQuery, setIsSendingQuery] = useState(false);
  const [querySuccessMsg, setQuerySuccessMsg] = useState('');

  // Send Query to Retail Store Handler
  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setIsSendingQuery(true);
    setQuerySuccessMsg('');
    try {
      const res = await api('/api/customer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer?.id || 'guest',
          customerName: customer?.name || regName || 'Valued Customer',
          customerPhone: customer?.phone || regPhone || loginPhone || '9842100000',
          queryText: queryText.trim(),
          queryCategory,
        }),
      });
      if (res.ok) {
        setQuerySuccessMsg(
          language === 'ta'
            ? '✓ உங்கள் கேள்வி கடை உரிமையாளரின் டாஷ்போர்டுக்கு உடனடியாக அனுப்பப்பட்டது! அவர்கள் விரைவில் தொடர்புகொள்வார்கள்.'
            : '✓ Your inquiry has reached the store owner dashboard! They will get back to you shortly.'
        );
        setQueryText('');
        playSoundEffect('action_success');
        await onRefreshData();
      }
    } catch (err: any) {
      console.error('Customer query error:', err);
    } finally {
      setIsSendingQuery(false);
    }
  };

  // Login handler
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginPhone.trim()) {
      setErrorMsg(language === 'ta' ? 'தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter your phone number');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (language === 'ta' ? 'கணக்கு கிடைக்கவில்லை. புதிய வாடிக்கையாளராக பதிவு செய்யவும்.' : 'Account not found. Please register as a new customer.'));
        setLoading(false);
        return;
      }
      setCustomer(data.customer);
      setBills(data.bills || []);
      setIsRegistered(true);
      playSoundEffect('action_success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for testing
  const handleQuickDemoLogin = async (phone: string) => {
    setLoginPhone(phone);
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        setBills(data.bills || []);
        setIsRegistered(true);
        playSoundEffect('action_success');
      } else {
        // Auto register if demo not yet in database
        setRegName('M. Ramesh (ரமேஷ்)');
        setRegPhone(phone);
        setRegAddress('12, South Gate, Madurai');
        setRegLandmark('Near Pillaiyar Temple');
        setAuthTab('register');
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      setErrorMsg(language === 'ta' ? 'பெயர் மற்றும் தொலைபேசி எண் தேவை' : 'Name and phone number are required');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          address: regAddress,
          landmark: regLandmark,
          notes: regNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      setCustomer(data.customer);
      setBills([]);
      setIsRegistered(true);
      await onRefreshData();
      playSoundEffect('action_success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile Details Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setLoading(true);
    setSaveSuccessMsg('');
    try {
      const res = await api(`/api/customer/profile/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        setSaveSuccessMsg(
          language === 'ta' ? '✅ விபரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!' : '✅ Details updated successfully!'
        );
        playSoundEffect('action_success');
        await onRefreshData();
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update details');
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const updateCart = (productId: string, delta: number) => {
    setCart((prev) => {
      const curr = prev[productId] || 0;
      const next = Math.max(0, curr + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
    playSoundEffect('click');
  };

  const cartTotal = Object.entries(cart).reduce((sum: number, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return sum + (prod ? prod.sellingPrice * Number(qty) : 0);
  }, 0);

  const cartItemCount = (Object.values(cart) as number[]).reduce((sum: number, q: number) => sum + q, 0);

  // Submit Order Request
  const handleSendOrder = async () => {
    if (!customer || cartItemCount === 0) return;
    setLoading(true);
    try {
      const orderItems = Object.entries(cart).map(([pId, qty]) => {
        const prod = products.find((p) => p.id === pId);
        return {
          productId: pId,
          productName: prod ? (language === 'ta' ? prod.nameTa : prod.name) : 'Item',
          quantity: Number(qty),
          unit: prod?.unit || 'kg',
          unitPrice: prod?.sellingPrice || 0,
          total: (prod?.sellingPrice || 0) * Number(qty),
        };
      });

      const res = await api('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          items: orderItems,
          deliveryAddress: customer.address,
          notes: 'Customer Portal App Order',
        }),
      });

      if (res.ok) {
        setCart({});
        setOrderSentNotice(true);
        playSoundEffect('action_success');
        await onRefreshData();
        // Refresh customer bills
        const billRes = await api('/api/customer/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: customer.phone }),
        });
        const billData = await billRes.json();
        if (billData.bills) setBills(billData.bills);
        if (billData.customer) setCustomer(billData.customer);

        setTimeout(() => setOrderSentNotice(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Order Link Generator
  const generateWhatsAppOrderLink = () => {
    if (!customer) return '#';
    const storePhone = (businessProfile.phone || '9842155678').replace(/\D/g, '');
    const itemsText = Object.entries(cart)
      .map(([pId, qty]) => {
        const prod = products.find((p) => p.id === pId);
        return `• ${prod ? prod.name : 'Item'}: ${qty} ${prod?.unit || 'kg'} (₹${(prod?.sellingPrice || 0) * Number(qty)})`;
      })
      .join('%0A');

    const msg = `வணக்கம் ${businessProfile.businessName}! நான் ${customer.name} (${customer.phone}).%0Aஎனக்கு பின்வரும் பொருட்கள் தேவை:%0A${itemsText}%0A%0Aமொத்த தொகை: ₹${cartTotal}%0Aமுகவரி: ${encodeURIComponent(customer.address || '')}`;
    return `https://wa.me/91${storePhone}?text=${msg}`;
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.nameTa.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div id="customer-portal-root" className="min-h-[85vh] space-y-6 pb-12">
      {/* Top Header Bar with Store Branding & Switch Back */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-950 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                {language === 'ta' ? businessProfile.businessNameTa : businessProfile.businessName}
              </h2>
              <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                {language === 'ta' ? 'வாடிக்கையாளர் பக்கம்' : 'Customer Portal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {businessProfile.address} • {businessProfile.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToOwner}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'ta' ? 'கடை உரிமையாளர் ERP' : 'Store Owner Login'}</span>
          </button>
        </div>
      </div>

      {/* NOT REGISTERED / NOT LOGGED IN: Authentication View */}
      {!isRegistered || !customer ? (
        <div className="mx-auto max-w-lg">
          <div className="overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/40 via-white to-white shadow-xl dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3.5 text-xs font-bold transition ${
                  authTab === 'login'
                    ? 'border-b-2 border-emerald-600 bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'ta' ? 'வாடிக்கையாளர் உள்நுழைவு' : 'Customer Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3.5 text-xs font-bold transition ${
                  authTab === 'register'
                    ? 'border-b-2 border-emerald-600 bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'ta' ? 'புதிய வாடிக்கையாளர் பதிவு' : 'New Customer Register'}
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* LOGIN TAB */}
              {authTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'உங்கள் தொலைபேசி எண் (Mobile Number)' : 'Mobile Phone Number'}
                    </label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="98421 55678"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    <span>{loading ? 'சரிபார்க்கிறது...' : language === 'ta' ? 'கணக்கில் உள்நுழைக' : 'Sign In to My Account'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white px-2.5 font-bold tracking-wider text-slate-400 dark:bg-slate-900">
                        {language === 'ta' ? 'டெமோ வாடிக்கையாளர் மாதிரி' : 'Quick Demo Test'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">













                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('9842100001')}
                      className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-3 text-xs text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-100/70 active:scale-95 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200/70 text-[10px] font-black text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          R
                        </span>
                        <span className="font-bold">M. Ramesh (ரமேஷ்)</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Login as Ramesh →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('9842154321')}
                      className="flex items-center justify-between rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/80 to-cyan-50/50 p-3 text-xs text-sky-950 transition hover:border-sky-300 hover:bg-sky-100/70 active:scale-95 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-200/70 text-[10px] font-black text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                          P
                        </span>
                        <span className="font-bold">Priya Selvaraj (பிரியா)</span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">Login as Priya →</span>
                    </button>
                  </div>
                </form>
              )}

              {/* REGISTER TAB */}
              {authTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'முழு பெயர் (Full Name) *' : 'Full Name *'}
                    </label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="எ.கா. குமார் (Kumar)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'தொலைபேசி எண் (Mobile Phone) *' : 'Mobile Phone *'}
                    </label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="98421 00000"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'வீட்டு முகவரி / தெரு (Delivery Address)' : 'Delivery Address'}
                    </label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        rows={2}
                        placeholder="கதவு எண், தெரு பெயர், பகுதி, மதுரை"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'அடையாளம் (Landmark)' : 'Landmark'}
                    </label>
                    <input
                      type="text"
                      value={regLandmark}
                      onChange={(e) => setRegLandmark(e.target.value)}
                      placeholder="எ.கா. பெருமாள் கோவில் அருகில்"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'மளிகை டெலிவரி குறிப்புகள் (Notes)' : 'Special Delivery Notes'}
                    </label>
                    <input
                      type="text"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="எ.கா. மாலையில் டெலிவரி செய்யவும்"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'பதிவு செய்யப்படுகிறது...' : language === 'ta' ? 'பதிவு செய்து உள்நுழைக' : 'Register & Save My Details'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED IN CUSTOMER DASHBOARD */
        <div className="space-y-6">
          {/* Customer Welcome & Quick Balance Header */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
                    {language === 'ta' ? 'வாடிக்கையாளர் கணக்கு' : 'Customer Account'}
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                </div>
                <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                  {language === 'ta' ? `வணக்கம், ${customer.name}!` : `Welcome, ${customer.name}!`}
                </h1>
                <p className="text-xs text-emerald-100">
                  {customer.phone} • {customer.address || 'Local Customer'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsRegistered(false);
                    setCustomer(null);
                    setBills([]);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{language === 'ta' ? 'வெளியேறு' : 'Log Out'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Cards in Welcome Banner with soft colors */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/15 p-4 backdrop-blur-md">
                <span className="text-xs font-semibold text-amber-200">
                  {language === 'ta' ? 'கடன் பாக்கி தொகை' : 'Pending Credit Balance'}
                </span>
                <p className={`mt-1 text-2xl font-black ${customer.outstandingBalance > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {formatCurrency(customer.outstandingBalance || 0)}
                </p>
                <span className="text-[10px] text-amber-100/90">
                  {customer.outstandingBalance > 0
                    ? language === 'ta' ? 'செலுத்த வேண்டிய தொகை' : 'Payment due to store'
                    : language === 'ta' ? 'கடன் பாக்கி இல்லை' : 'All clear, no dues'}
                </span>
              </div>

              <div className="rounded-2xl border border-sky-300/30 bg-sky-500/15 p-4 backdrop-blur-md">
                <span className="text-xs font-semibold text-sky-200">
                  {language === 'ta' ? 'மொத்த கொள்முதல்' : 'Total Purchases'}
                </span>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatCurrency(customer.totalPurchases || 0)}
                </p>
                <span className="text-[10px] text-sky-100/90">
                  {bills.length} {language === 'ta' ? 'ஆர்டர்கள் / பில்கள்' : 'total orders'}
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/15 p-4 backdrop-blur-md">
                <span className="text-xs font-semibold text-emerald-200">
                  {language === 'ta' ? 'அனுமதிக்கப்பட்ட கடன் வரம்பு' : 'Credit Limit'}
                </span>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatCurrency(customer.creditLimit || 3000)}
                </p>
                <span className="text-[10px] text-emerald-100/90">
                  {language === 'ta' ? 'கடை உரிமையாளர் வழங்கியது' : 'Store approved limit'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('katha')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === 'katha'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>{language === 'ta' ? 'என் பில்கள் & கணக்கு' : 'My Bills & Katha Ledger'}</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === 'profile'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span>{language === 'ta' ? 'என் விபரங்கள் & முகவரி' : 'My Profile & Details'}</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === 'catalog'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{language === 'ta' ? 'கடை பொருட்கள் & ஆர்டர்' : 'Store Catalog & Order'}</span>
              {cartItemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              id="customer-query-tab-btn"
              onClick={() => setActiveTab('query')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === 'query'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <span>{language === 'ta' ? 'கடைக்கு கேள்வி / வினவல்' : 'Ask Store Owner'}</span>
            </button>
          </div>

          {/* TAB 1: KATHA & BILLS */}
          {activeTab === 'katha' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'கடந்த பில்கள் & கொள்முதல் வரலாறு' : 'Past Invoices & Bill History'}
                </h3>
                {customer.outstandingBalance > 0 && (
                  <a
                    href={`https://wa.me/91${businessProfile.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `வணக்கம் ${businessProfile.businessName}! நான் ${customer.name}. எனது கணக்கில் உள்ள பாக்கி ₹${customer.outstandingBalance} குறித்து பேச விரும்புகிறேன்.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{language === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'Contact Store'}</span>
                  </a>
                )}
              </div>

              {bills.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
                  <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'இன்னும் பில்கள் எதுவும் இல்லை' : 'No bills recorded yet'}
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] text-slate-400">
                    {language === 'ta'
                      ? 'கடை பொருட்கள் பக்கத்திற்கு சென்று பொருட்களை ஆர்டர் செய்யலாம்.'
                      : 'You can browse products and send order requests directly to the store.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    {language === 'ta' ? 'பொருட்களை பார்க்க →' : 'Browse Catalog →'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {bills.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBill(b)}
                      className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition hover:shadow-sm ${
                        b.paymentType === 'credit'
                          ? 'border-amber-200/70 bg-gradient-to-r from-amber-50/40 via-white to-white hover:border-amber-400 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900'
                          : 'border-emerald-200/70 bg-gradient-to-r from-emerald-50/40 via-white to-white hover:border-emerald-400 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {b.invoiceNo || 'INV-Bill'}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                b.paymentType === 'credit'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {b.paymentType === 'credit'
                                ? language === 'ta' ? 'கடன் பில் (Credit)' : 'Credit Bill'
                                : language === 'ta' ? 'ரொக்கம் (Paid)' : 'Paid'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{b.date}</span>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(b.total)}
                          </p>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            {language === 'ta' ? 'விபரம் பார்க்க →' : 'View breakdown →'}
                          </span>
                        </div>
                      </div>

                      {b.items && b.items.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {b.items.map((it) => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT PROFILE & STORE OWN DETAILS */}
          {activeTab === 'profile' && (
            <div className="max-w-xl rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/30 via-white to-white p-6 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'என் விபரங்கள் மற்றும் டெலிவரி முகவரி' : 'My Profile & Delivery Details'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === 'ta'
                  ? 'உங்கள் பெயர், முகவரி மற்றும் டெலிவரி தகவல்களை இங்கே மாற்றி சேமிக்கலாம்.'
                  : 'Update your address and delivery instructions saved with this shop.'}
              </p>

              {saveSuccessMsg && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'பெயர் (Name)' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'தொலைபேசி எண் (Mobile Phone)' : 'Mobile Phone'}
                  </label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'டெலிவரி முகவரி (Delivery Address)' : 'Delivery Address'}
                  </label>
                  <textarea
                    rows={3}
                    value={customer.address || ''}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="கதவு எண், தெரு பெயர், பகுதி, மதுரை"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'சிறப்பு குறிப்புகள் / விருப்பங்கள் (Notes)' : 'Special Delivery Preferences'}
                  </label>
                  <input
                    type="text"
                    value={customer.notes || ''}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    placeholder="எ.கா. மாலையில் கதவு அருகில் வைக்கவும்"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'சேமிக்கப்படுகிறது...' : language === 'ta' ? 'விபரங்களை சேமி' : 'Save Details'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: STORE CATALOG & GROCERY ORDER */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'ta' ? 'கடை சரக்கு பட்டியல் & ஆன்லைன் ஆர்டர்' : 'Store Catalog & Quick Order'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ta'
                      ? 'கடையிலுள்ள பொருட்களை தேர்வு செய்து நேரடியாக ஆர்டர் அனுப்பலாம்.'
                      : 'Select items and send an instant grocery request to the store.'}
                  </p>
                </div>

                {/* Search */}
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={language === 'ta' ? 'பொருட்கள் தேடுக...' : 'Search items...'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {orderSentNotice && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>
                    {language === 'ta'
                      ? '✅ உங்கள் மளிகை ஆர்டர் கடைக்கு வெற்றிகரமாக அனுப்பப்பட்டது! கடைக்காரர் சரிபார்ப்பார்.'
                      : '✅ Your order request has been sent to the store successfully!'}
                  </span>
                </div>
              )}

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                  {language === 'ta' ? 'பொருட்கள் எதுவும் கிடைக்கவில்லை' : 'No products found'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((p) => {
                    const count = cart[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/50 via-white to-white p-4 shadow-xs transition hover:border-emerald-400 hover:shadow-sm dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {language === 'ta' ? p.nameTa : p.name}
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                {p.name !== p.nameTa ? p.name : p.category}
                              </span>
                            </div>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {p.currentStock > 0 ? `${p.currentStock} ${p.unit} இருப்பு` : 'முடிந்தது'}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(p.sellingPrice)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">/ {p.unit}</span>
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'ta' ? 'அளவு சேர்க்க:' : 'Select Qty:'}
                          </span>
                          <div className="flex items-center gap-2">
                            {count > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateCart(p.id, -1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-slate-900 dark:text-white">
                                  {count}
                                </span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => updateCart(p.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating Order Cart Bar if items selected */}
              {cartItemCount > 0 && (
                <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">
                        {cartItemCount} {language === 'ta' ? 'பொருட்கள் சேர்க்கப்பட்டுள்ளது' : 'items in cart'}
                      </p>
                      <p className="text-sm font-black text-emerald-400">
                        {language === 'ta' ? 'மொத்தம்: ' : 'Total: '} {formatCurrency(cartTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={generateWhatsAppOrderLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{language === 'ta' ? 'வாட்ஸ்அப் வழி ஆர்டர்' : 'Order via WhatsApp'}</span>
                    </a>
                    <button
                      onClick={handleSendOrder}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{loading ? 'அனுப்பப்படுகிறது...' : language === 'ta' ? 'கடைக்கு ஆர்டர் அனுப்பு' : 'Submit In-App Order'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIRECT INQUIRY & QUERY TO RETAIL STORE */}
          {activeTab === 'query' && (
            <div id="customer-query-section" className="rounded-3xl border border-blue-500/20 bg-white/80 dark:bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === 'ta' ? 'கடை உரிமையாளருக்கு நேரடி கேள்வி / வினவல்' : 'Send Direct Query to Store Owner'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ta'
                      ? 'சரக்கு இருப்பு, ஹோம் டெலிவரி, கடன் கணக்கு அல்லது சிறப்பு கோரிக்கைகளை நேரடியாக அனுப்பலாம். உரிமையாளர் டாஷ்போர்டில் உடனடியாகப் பதிவு செய்யப்படும்.'
                      : 'Ask about product availability, express home delivery, credit balance or custom grocery requests. Directly alerts the retail dashboard.'}
                  </p>
                </div>
              </div>

              {querySuccessMsg && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{querySuccessMsg}</span>
                </div>
              )}

              {/* Template quick chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ta' ? 'விரைவு வினவல் வார்ப்புருக்கள் (Quick Templates):' : 'Frequently Asked Inquiries:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    language === 'ta' ? '25kg பொன்னி அரிசி மற்றும் சமையல் எண்ணெய் இருப்பு உள்ளதா?' : 'Do you have Ponni Rice 25kg & Cooking Oil in stock?',
                    language === 'ta' ? 'இன்று மாலைக்குள் வீட்டுக்கு டெலிவரி கிடைக்குமா?' : 'Is home delivery available this evening?',
                    language === 'ta' ? 'உதார் கணக்கு பாக்கியை Google Pay / UPI மூலம் செலுத்தலாமா?' : 'Can I pay my credit balance via UPI / GPay?',
                    language === 'ta' ? 'விசேஷ தேவைக்கான மொத்த மளிகைக்கு தள்ளுபடி உண்டா?' : 'Is there bulk discount for festival groceries?',
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQueryText(tpl)}
                      className="rounded-full border border-blue-500/20 bg-blue-50/60 dark:bg-slate-800 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 transition text-left"
                    >
                      💬 {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendQuery} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ta' ? 'வினவல் வகை (Category)' : 'Inquiry Category'}
                  </label>
                  <select
                    value={queryCategory}
                    onChange={(e) => setQueryCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Product Inquiry">{language === 'ta' ? 'பொருள் இருப்பு & விலை (Product & Price)' : 'Product & Price'}</option>
                    <option value="Delivery Request">{language === 'ta' ? 'ஹோம் டெலிவரி கோரிக்கை (Delivery Request)' : 'Delivery Request'}</option>
                    <option value="Khata Inquiry">{language === 'ta' ? 'கடன் / உதார் கணக்கு விபரம் (Credit / Khata)' : 'Credit / Khata'}</option>
                    <option value="Custom Order">{language === 'ta' ? 'சிறப்பு ஆர்டர் (Custom Order)' : 'Custom Order'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ta' ? 'உங்கள் செய்தி / கேள்வி (Your Message)' : 'Your Question or Request'}
                  </label>
                  <textarea
                    rows={4}
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder={
                      language === 'ta'
                        ? 'உங்கள் தேவையை அல்லது கேள்வியை இங்கே உள்ளிடவும் (எ.கா. பொன்னி அரிசி மற்றும் நல்லெண்ணெய் மாலைக்குள் வேண்டும்)...'
                        : 'Type your question or specific items needed (e.g. Please deliver 1 bag of rice and cooking oil by 6 PM)...'
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                <button
                  id="submit-customer-query-btn"
                  type="submit"
                  disabled={isSendingQuery || !queryText.trim()}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSendingQuery
                      ? (language === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Sending to Store...')
                      : (language === 'ta' ? 'கடைக்கு வினவல் அனுப்பு (Send to Retail Dashboard)' : 'Send Query to Retail Dashboard')}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedBill.invoiceNo}
                </h4>
                <p className="text-[11px] text-slate-400">{selectedBill.date}</p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'ta' ? 'வாங்கிய பொருட்கள்:' : 'Purchased Items:'}
              </span>
              <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 p-3 text-xs dark:divide-slate-800 dark:bg-slate-800/40">
                {selectedBill.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1.5">
                    <span>{it.productName} ({it.quantity} {it.unit})</span>
                    <span className="font-bold">{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'மொத்த தொகை:' : 'Total Amount:'}
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedBill.total)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBill(null)}
              className="mt-6 w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
