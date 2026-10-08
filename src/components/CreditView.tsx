import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  MessageCircle,
  Phone,
  PhoneCall,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Users,
  Truck,
  ArrowDownLeft,
  Volume2,
  Copy,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { Customer, Supplier, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { playSoundEffect, speakTextGuaranteed, stopSpeaking } from '../utils/audioSpeech';
import { Spatial3DCard } from './Spatial3DWidgets';

interface CreditViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  language: LanguageCode;
  onRecordCustomerPayment: (customerId: string, amount: number, notes: string) => Promise<void>;
  onRecordSupplierPayment: (supplierId: string, amount: number, notes: string) => Promise<void>;
}

export const CreditView: React.FC<CreditViewProps> = ({
  customers,
  suppliers,
  language,
  onRecordCustomerPayment,
  onRecordSupplierPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = useState('');
  const [paymentModalData, setPaymentModalData] = useState<{
    id: string;
    name: string;
    type: 'customer' | 'supplier';
    currentBalance: number;
  } | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [speakModalCustomer, setSpeakModalCustomer] = useState<Customer | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSpeakDialogue = (text: string) => {
    playSoundEffect('click');
    speakTextGuaranteed(text, { lang: language === 'ta' ? 'ta' : 'en' });
  };

  const copyToClipboard = (text: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      playSoundEffect('action_success');
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // WhatsApp reminder generator
  const sendWhatsAppReminder = (c: Customer) => {
    const textEn = `Namaskaram ${c.name}, Greetings from Thirumalai Stores. Your pending credit balance is ${formatCurrency(c.outstandingBalance)}. Kindly clear the pending dues when convenient. Thank you!`;
    const textTa = `வணக்கம் ${c.name}, திருமலை ஸ்டோர்ஸ் சார்பாக வாழ்த்துகள். தங்களின் கடன் பாக்கி தொகை ${formatCurrency(c.outstandingBalance)}. வசதியான நேரத்தில் செலுத்த வேண்டுகிறோம். நன்றி!`;
    const msg = language === 'ta' ? textTa : textEn;
    const phone = c.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(msg)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const handleOpenPayment = (id: string, name: string, type: 'customer' | 'supplier', balance: number) => {
    setPaymentModalData({ id, name, type, currentBalance: balance });
    setPaymentAmount(balance);
    setPaymentNotes('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalData || paymentAmount <= 0) return;

    if (paymentModalData.type === 'customer') {
      await onRecordCustomerPayment(paymentModalData.id, paymentAmount, paymentNotes);
    } else {
      await onRecordSupplierPayment(paymentModalData.id, paymentAmount, paymentNotes);
    }
    setPaymentModalData(null);
  };

  const totalCustomerCredit = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const totalSupplierPayable = suppliers.reduce((acc, s) => acc + (s.outstandingBalance || s.outstandingPayable || 0), 0);

  const q = (search || '').toLowerCase();
  const filteredCustomers = customers.filter(
    (c) =>
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.nameTa || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
  );

  return (
    <div id="credit-ledger-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {language === 'ta' ? 'கடன் மேலாண்மை (Udhar & Credit Ledger)' : 'Credit & Debt Ledger'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'வாடிக்கையாளர் பாக்கி மற்றும் விநியோகஸ்தர் கடன் கணக்குகள், வாட்ஸ்அப் நினைவூட்டல் வசதியுடன்.'
              : 'Track receivables from customers and payables to wholesale suppliers with WhatsApp reminders.'}
          </p>
        </div>
      </div>

      {/* Summary Cards with 3D Spatial Effects */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                {language === 'ta' ? 'வாடிக்கையாளர் வரவேண்டிய கடன்' : 'Total Receivables (From Customers)'}
              </span>
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
              {formatCurrency(totalCustomerCredit)}
            </p>
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              {customers.filter((c) => c.outstandingBalance > 0).length}{' '}
              {language === 'ta' ? 'வாடிக்கையாளர்கள் பாக்கி வைத்துள்ளனர்' : 'active credit accounts'}
            </p>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                {language === 'ta' ? 'விநியோகஸ்தருக்கு செலுத்த வேண்டிய கடன்' : 'Total Payables (To Suppliers)'}
              </span>
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-300">
              {formatCurrency(totalSupplierPayable)}
            </p>
            <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
              {suppliers.filter((s) => s.outstandingPayable > 0).length}{' '}
              {language === 'ta' ? 'விநியோகஸ்தர்களுக்கு வழங்க வேண்டும்' : 'suppliers pending settlement'}
            </p>
          </div>
        </Spatial3DCard>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('customers')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'customers'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {language === 'ta' ? 'வாடிக்கையாளர் பாக்கி (Receivables)' : 'Customers (Receivables)'}
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'suppliers'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {language === 'ta' ? 'விநியோகஸ்தர் கடன் (Payables)' : 'Suppliers (Payables)'}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ta' ? 'பெயர், எண் தேடுக...' : 'Search name or phone...'}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs focus:bg-white dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {activeTab === 'customers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Customer Name'}</th>
                  <th className="px-5 py-3.5">{language === 'ta' ? 'தொலைபேசி' : 'Contact'}</th>
                  <th className="px-5 py-3.5">{language === 'ta' ? 'கடன் வரம்பு' : 'Credit Limit'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'பாக்கி தொகை' : 'Pending Due'}</th>
                  <th className="px-5 py-3.5 text-center">{language === 'ta' ? 'உரையாடல்' : 'Speak Guide'}</th>
                  <th className="px-5 py-3.5 text-center">{language === 'ta' ? 'நினைவூட்டல்' : 'WhatsApp'}</th>
                  <th className="px-5 py-3.5 text-center">{language === 'ta' ? 'செலுத்தல் பதிவு' : 'Payment'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.address || 'Local Resident'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {c.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`text-sm font-black ${
                          c.outstandingBalance > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(c.outstandingBalance)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {c.outstandingBalance > 0 ? (
                        <button
                          onClick={() => setSpeakModalCustomer(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-100 active:scale-95 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300"
                          title="Realistic Customer Conversation Guide"
                        >
                          <Headphones className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                          <span>{language === 'ta' ? 'பேச வழிகாட்டி' : 'Speak Guide'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {c.outstandingBalance > 0 ? (
                        <button
                          onClick={() => sendWhatsAppReminder(c)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Cleared ✓</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {c.outstandingBalance > 0 ? (
                        <button
                          onClick={() => handleOpenPayment(c.id, c.name, 'customer', c.outstandingBalance)}
                          className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                        >
                          {language === 'ta' ? 'பணம் பெறப்பட்டது' : 'Receive Payment'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600">No Balance</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">{language === 'ta' ? 'விநியோகஸ்தர்' : 'Supplier Name'}</th>
                  <th className="px-5 py-3.5">{language === 'ta' ? 'தொடர்பு நபர்' : 'Contact Person'}</th>
                  <th className="px-5 py-3.5">{language === 'ta' ? 'தொலைபேசி' : 'Phone'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'செலுத்த வேண்டிய கடன்' : 'Outstanding Payable'}</th>
                  <th className="px-5 py-3.5 text-center">{language === 'ta' ? 'கடன் செலுத்து' : 'Settle'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {s.contactPerson || s.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {s.phone}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(s.outstandingBalance ?? s.outstandingPayable ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {(s.outstandingBalance ?? s.outstandingPayable ?? 0) > 0 ? (
                        <button
                          onClick={() => handleOpenPayment(s.id, s.name, 'supplier', s.outstandingBalance ?? s.outstandingPayable ?? 0)}
                          className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                        >
                          {language === 'ta' ? 'கடன் செலுத்து' : 'Pay Supplier'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600">Settled ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {paymentModalData.type === 'customer'
                  ? language === 'ta' ? 'வாடிக்கையாளர் கடன் வசூல்' : 'Record Customer Payment'
                  : language === 'ta' ? 'விநியோகஸ்தருக்கு கடன் செலுத்து' : 'Pay Wholesale Supplier'}
              </h3>
              <button
                onClick={() => setPaymentModalData(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                <span className="text-slate-500">
                  {paymentModalData.type === 'customer' ? 'Customer:' : 'Supplier:'}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {paymentModalData.name}
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Current Balance: {formatCurrency(paymentModalData.currentBalance)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentModalData.currentBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-base font-black text-emerald-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Mode (Cash / GPay)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="GPay Txn ID / Cash counter"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalData(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Realistic Speak with Customer Guidance Modal */}
      {speakModalCustomer && (
        <div
          id="speak-customer-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div
            id="speak-customer-modal-card"
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === 'ta'
                        ? `${speakModalCustomer.name} - கடன் வசூல் உரையாடல் வழிகாட்டி`
                        : `Customer Discussion Guide: ${speakModalCustomer.name}`}
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      பாக்கி: {formatCurrency(speakModalCustomer.outstandingBalance)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ta'
                      ? 'கண்ணியமான, உறவு கெடாத உண்மையான தமிழ் சில்லறை வணிக உரையாடல் முறை'
                      : 'Respectful, realistic retail dialogue ensuring goodwill & timely recovery'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  stopSpeaking();
                  setSpeakModalCustomer(null);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content / Dialogue Scripts */}
            <div className="my-4 flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
              {/* Customer Reality Ledger Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'ta' ? 'வாடிக்கையாளர் தகவல்' : 'LEDGER PROFILE'}
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {speakModalCustomer.name} • {speakModalCustomer.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">
                    {language === 'ta' ? 'கடன் வரம்பு: ' : 'Credit Limit: '}
                    {formatCurrency(speakModalCustomer.creditLimit)}
                  </span>
                  <p className="font-black text-amber-600 dark:text-amber-400">
                    {language === 'ta' ? 'வசூலிக்க வேண்டியது: ' : 'Amount Due: '}
                    {formatCurrency(speakModalCustomer.outstandingBalance)}
                  </p>
                </div>
              </div>

              {/* Scenario 1: Phone Call Dialogue */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 shadow-sm dark:border-violet-900/30 dark:bg-violet-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <h4 className="font-bold text-violet-950 dark:text-violet-200">
                      {language === 'ta'
                        ? '1. தொலைபேசி அழைப்பு முறை (Phone Call Script)'
                        : '1. Realistic Phone Call Scenario'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleSpeakDialogue(
                          language === 'ta'
                            ? `வணக்கம் ${speakModalCustomer.name} அண்ணே, திருமலை ஸ்டோர்ஸ்ல இருந்து பேசுறேன். நல்லா இருக்கீங்களா? கடை கணக்கு நோட்டை இன்னைக்கு சரிபார்த்தேன். உங்க கணக்குல பழைய பாக்கி ${speakModalCustomer.outstandingBalance} ரூபாய் இருக்குங்க. இந்த வாரம் ஹோல்சேல் மில்லுக்கு சரக்கு எடுக்க பணம் தேவைப்படுது. உங்களால இன்னைக்கு குறைந்தது பாதி தொகையோ அல்லது முழுக் கணக்கையோ GPay அல்லது கடைக்கு வந்து குடுக்க முடியுமா அண்ணே? ரொம்ப உதவியா இருக்கும்.`
                            : `Hello ${speakModalCustomer.name} sir, greetings from Thirumalai Stores. Hope you are doing well! While reviewing our shop ledger, there is a pending balance of ${speakModalCustomer.outstandingBalance} rupees. We need to settle wholesale stock orders this week. Could you please send at least partial payment or clear it via GPay or cash today? That would really help us. Thank you!`
                        )
                      }
                      className="flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-800 transition hover:bg-violet-200 dark:bg-violet-900/60 dark:text-violet-300"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>{language === 'ta' ? 'குரல் கேட்க' : 'Listen Voice'}</span>
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `வணக்கம் ${speakModalCustomer.name} அண்ணே, திருமலை ஸ்டோர்ஸ்ல இருந்து பேசுறேன். நல்லா இருக்கீங்களா? கடை கணக்கு நோட்டை இன்னைக்கு சரிபார்த்தேன். உங்க கணக்குல பழைய பாக்கி ₹${speakModalCustomer.outstandingBalance} இருக்குங்க. இந்த வாரம் ஹோல்சேல் மில்லுக்கு சரக்கு எடுக்க பணம் தேவைப்படுது. உங்களால இன்னைக்கு குறைந்தது பாதி தொகையோ அல்லது முழுக் கணக்கையோ GPay அல்லது கடைக்கு வந்து குடுக்க முடியுமா அண்ணே? ரொம்ப உதவியா இருக்கும்.`,
                          1
                        )
                      }
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedIndex === 1 ? 'Copied ✓' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-white p-3 font-normal leading-relaxed text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                  <p>
                    {language === 'ta'
                      ? `🗣️ "வணக்கம் ${speakModalCustomer.name} அண்ணே, திருமலை ஸ்டோர்ஸ்ல இருந்து பேசுறேன். நல்லா இருக்கீங்களா? கடை கணக்கு நோட்டை இன்னைக்கு சரிபார்த்தேன். உங்க கணக்குல பழைய பாக்கி ₹${speakModalCustomer.outstandingBalance} இருக்குங்க. இந்த வாரம் ஹோல்சேல் மில்லுக்கு சரக்கு எடுக்க பணம் செலுத்த வேண்டியிருக்கு. உங்களால இன்னைக்கு குறைந்தது பாதி தொகை ₹${Math.round(
                          speakModalCustomer.outstandingBalance / 2
                        )} அல்லது முழுக் கணக்கையோ GPay அல்லது கடைக்கு வந்து குடுக்க முடியுமா அண்ணே? ரொம்ப உதவியா இருக்கும்."`
                      : `🗣️ "Hello ${speakModalCustomer.name} sir/madam, greetings from Thirumalai Stores. Hope you are well! Our store ledger shows a pending balance of ${formatCurrency(
                          speakModalCustomer.outstandingBalance
                        )}. We have wholesale restocking coming up this week. Could you kindly transfer at least partial amount ${formatCurrency(
                          Math.round(speakModalCustomer.outstandingBalance / 2)
                        )} or settle via GPay/cash today? That would really help us."`}
                  </p>
                </div>
              </div>

              {/* Scenario 2: In-Person Counter Conversation */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-200">
                      {language === 'ta'
                        ? '2. நேரில் கடைக்கு வரும்போது (In-Person Store Encounter)'
                        : '2. In-Person Store Encounter'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleSpeakDialogue(
                          language === 'ta'
                            ? `வாங்க ${speakModalCustomer.name} அண்ணே! இன்னைக்கு புது சாமான்கள் பில் ₹450 ஆகுதுங்க. பழைய கணக்குல ${speakModalCustomer.outstandingBalance} ரூபாய் பாக்கி இருக்கு. இன்னைக்கு புது சாமானோடு பழைய பாக்கியில ஒரு ₹500 சேர்த்து தர்றீங்களா அண்ணே? கணக்கு சுலபமா முடிஞ்சுடும்.`
                            : `Welcome ${speakModalCustomer.name}! Today's fresh purchases come to ₹450. In our ledger book, there is also the earlier balance of ${speakModalCustomer.outstandingBalance} rupees. Could you please add around ₹500 toward the earlier balance today along with the fresh bill? It will keep the balance light.`
                        )
                      }
                      className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>{language === 'ta' ? 'குரல் கேட்க' : 'Listen Voice'}</span>
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `வாங்க ${speakModalCustomer.name} அண்ணே! இன்னைக்கு புது சாமான்கள் பில் ₹450 ஆகுதுங்க. பழைய கணக்குல ₹${speakModalCustomer.outstandingBalance} பாக்கி இருக்கு. இன்னைக்கு புது சாமானோடு பழைய பாக்கியில ஒரு ₹500 சேர்த்து தர்றீங்களா அண்ணே? கணக்கு சுலபமா முடிஞ்சுடும்.`,
                          2
                        )
                      }
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedIndex === 2 ? 'Copied ✓' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-white p-3 font-normal leading-relaxed text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                  <p>
                    {language === 'ta'
                      ? `🗣️ "வாங்க ${speakModalCustomer.name} அண்ணே! இன்னைக்கு புது சாமான்கள் பில் ₹450 ஆகுதுங்க. பழைய கணக்குல ₹${speakModalCustomer.outstandingBalance} பாக்கி இருக்கு. இன்னைக்கு புது சாமானோடு பழைய பாக்கியில ஒரு ₹500 சேர்த்து தர்றீங்களா அண்ணே? கணக்கு சுலபமா முடிஞ்சுடும்."`
                      : `🗣️ "Welcome ${speakModalCustomer.name}! Today's groceries total ₹450. In our running ledger, there is also the earlier balance of ${formatCurrency(
                          speakModalCustomer.outstandingBalance
                        )}. Could you please add around ₹500 toward the old balance with today's bill? It will keep the balance light and easy to manage."`}
                  </p>
                </div>
              </div>

              {/* Quick Action Dock */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${speakModalCustomer.phone}`}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{language === 'ta' ? 'நேரடியாக அழைக்க' : 'Call Directly'}</span>
                  </a>
                  <button
                    onClick={() => sendWhatsAppReminder(speakModalCustomer)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{language === 'ta' ? 'WhatsApp அனுப்ப' : 'Send WhatsApp'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleOpenPayment(
                      speakModalCustomer.id,
                      speakModalCustomer.name,
                      'customer',
                      speakModalCustomer.outstandingBalance
                    );
                    setSpeakModalCustomer(null);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{language === 'ta' ? 'பணம் வசூலிக்க' : 'Collect Payment Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
