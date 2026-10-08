import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  MessageCircle,
  CreditCard,
  X,
  UserPlus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Customer, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { api } from '../lib/api';

interface CustomersViewProps {
  customers: Customer[];
  language: LanguageCode;
  onAddCustomer: (customer: any) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  language,
  onAddCustomer,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(5000);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setCreditLimit(5000);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setCreditLimit(c.creditLimit || c.totalCredit || 5000);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError('Customer name is required');
      return;
    }
    if (phone.trim() && !/^[0-9]{10}$/.test(phone.trim())) {
      setSubmitError('Phone number must be 10 digits');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (editingCustomer) {
        // Edit existing customer
        const res = await api(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim() || '9842100000',
            address: address.trim() || '',
            creditLimit: Number(creditLimit) || 5000,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to update customer');
        }
        setSuccessMsg(language === 'ta' ? '✓ வாடிக்கையாளர் புதுப்பிக்கப்பட்டது!' : '✓ Customer updated successfully!');
      } else {
        // Add new customer
        await onAddCustomer({
          name: name.trim(),
          phone: phone.trim() || '9842100000',
          address: address.trim() || '',
          creditLimit: Number(creditLimit) || 5000,
          totalCredit: Number(creditLimit) || 5000,
          outstandingBalance: 0,
          totalPurchases: 0,
          totalUdhar: 0,
        });
        setSuccessMsg(language === 'ta' ? '✓ வாடிக்கையாளர் சேர்க்கப்பட்டது!' : '✓ Customer added successfully!');
      }
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setAddress('');
      setCreditLimit(5000);
      if (onRefreshData) await onRefreshData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    const confirmMsg = language === 'ta'
      ? `"${c.name}" வாடிக்கையாளரை நீக்கவா?`
      : `Delete customer "${c.name}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api(`/api/customers/${c.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete customer');
        return;
      }
      setSuccessMsg(language === 'ta' ? '✓ வாடிக்கையாளர் நீக்கப்பட்டது!' : '✓ Customer deleted');
      if (onRefreshData) await onRefreshData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Failed to delete customer. Please try again.');
    }
  };

  const q = (search || '').toLowerCase();
  const filtered = customers.filter(
    (c) =>
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.nameTa || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(search)
  );

  return (
    <div id="customers-view-container" className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {language === 'ta' ? 'வாடிக்கையாளர் பட்டியல் (Customers)' : 'Customer Directory'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'வாடிக்கையாளர் கடன் வரம்பு, கொள்முதல் வரலாறு மற்றும் வாட்ஸ்அப் தொடர்பு.'
              : 'Maintain trusted customer ledgers, credit caps, and buying patterns.'}
          </p>
        </div>

        <button
          id="add-customer-btn"
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ta' ? '+ புதிய வாடிக்கையாளர்' : '+ Add Customer'}</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-sky-900/40 dark:from-sky-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
            {language === 'ta' ? 'பதிவுசெய்த வாடிக்கையாளர்கள்' : 'Total Registered Customers'}
          </span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {customers.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ta' ? 'கடை வரவு-செலவு தொடர்பு' : 'Active store patrons'}
          </span>
        </div>

        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-amber-900/40 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {language === 'ta' ? 'கடன் உள்ள வாடிக்கையாளர்கள்' : 'With Active Credit (Udhar)'}
          </span>
          <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {customers.filter((c) => (c.outstandingBalance || c.totalUdhar || 0) > 0).length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatCurrency(customers.reduce((acc, c) => acc + (c.outstandingBalance || c.totalUdhar || 0), 0))}{' '}
            {language === 'ta' ? 'மொத்த பாக்கி' : 'total pending'}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {language === 'ta' ? 'பாக்கி இல்லாதவர்கள்' : 'Clear & Loyal Accounts'}
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {customers.filter((c) => !(c.outstandingBalance || c.totalUdhar || 0)).length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ta' ? 'முழுமையாக செலுத்தியவர்கள்' : 'Zero debt status'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={language === 'ta' ? 'வாடிக்கையாளர் பெயர், எண் தேடுக...' : 'Search customers by name or mobile...'}
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs shadow-sm focus:outline-none dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <UserPlus className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
            {language === 'ta' ? 'வாடிக்கையாளர் பதிவுகள் எதுவும் இல்லை' : 'No customer records found'}
          </h4>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {search
              ? (language === 'ta' ? `"${search}" பெயரில் வாடிக்கையாளர் இல்லை` : `No customer matching "${search}"`)
              : (language === 'ta'
                ? 'புதிய வாடிக்கையாளரை சேர்க்க மேலேயுள்ள பொத்தானை அழுத்தவும்.'
                : 'Click "+ Add Customer" to add your first customer.')}
          </p>
          {!search && (
            <button
              onClick={openAddModal}
              className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ta' ? '+ முதல் வாடிக்கையாளரை சேர்' : '+ Add Customer'}</span>
            </button>
          )}
        </div>
      )}

      {/* Customer Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const balance = c.outstandingBalance || c.totalUdhar || 0;
          const hasDebt = balance > 0;
          return (
            <div
              key={c.id}
              className={`rounded-3xl border p-5 shadow-xs transition hover:shadow-sm ${
                hasDebt
                  ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900'
                  : 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <Phone className="h-3 w-3" />
                    {c.phone || 'No phone recorded'}
                  </p>
                </div>

                {hasDebt ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {formatCurrency(balance)} Due
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Clean Balance
                  </span>
                )}
              </div>

              {c.address && (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{c.address}</span>
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400">Total Spent</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(c.totalPurchases || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Credit Limit</span>
                  <p className="font-extrabold text-slate-700 dark:text-slate-300">
                    {formatCurrency(c.creditLimit || c.totalCredit || 5000)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {c.phone && (
                  <a
                    href={`https://wa.me/91${(c.phone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  onClick={() => openEditModal(c)}
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  title="Edit Customer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="flex items-center justify-center rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
                  title="Delete Customer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCustomer
                  ? (language === 'ta' ? 'வாடிக்கையாளர் திருத்தம்' : 'Edit Customer')
                  : (language === 'ta' ? 'புதிய வாடிக்கையாளர் சேர்க்க' : 'Add New Customer')}
              </h3>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {/* Error */}
              {submitError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. M. Ramesh"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number (10 digits)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9842100000"
                  maxLength={10}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Address / Area
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="East Veli St, Madurai"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Credit Limit (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isSubmitting
                    ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...')
                    : editingCustomer
                      ? (language === 'ta' ? 'புதுப்பிக்க' : 'Update Customer')
                      : (language === 'ta' ? 'சேமிக்க' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
