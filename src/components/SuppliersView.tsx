import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  MapPin,
  Package,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MessageCircle,
  PhoneCall,
} from 'lucide-react';
import { Supplier, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { Spatial3DCard } from './Spatial3DWidgets';
import { playSoundEffect } from '../utils/audioSpeech';

interface SuppliersViewProps {
  suppliers: Supplier[];
  language: LanguageCode;
  onAddSupplier: (sup: any) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  isFinderMode?: boolean;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  language,
  onAddSupplier,
  onRefreshData,
  isFinderMode = false,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [productsSupplied, setProductsSupplied] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('0');

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setPhone('');
    setCity('');
    setProductsSupplied('');
    setOutstandingBalance('0');
    setEditingSupplier(null);
    setSubmitError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setContactPerson(sup.contactPerson || sup.name);
    setPhone(sup.phone || '');
    setCity(sup.city || sup.address || '');
    setProductsSupplied(Array.isArray(sup.productsSupplied) ? sup.productsSupplied.join(', ') : '');
    setOutstandingBalance(String(sup.outstandingBalance ?? sup.outstandingPayable ?? 0));
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSubmitError(language === 'ta' ? 'விநியோகஸ்தர் பெயர் அவசியம்' : 'Supplier name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        // PUT update
        const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            contactPerson: contactPerson.trim() || trimmedName,
            phone: phone.trim() || null,
            address: city.trim() || null,
            outstandingBalance: Number(outstandingBalance) || 0,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update supplier');
        }

        setSuccessMsg(language === 'ta' ? 'விநியோகஸ்தர் வெற்றிகரமாக புதுப்பிக்கப்பட்டார்!' : 'Supplier updated successfully!');
      } else {
        // POST create
        await onAddSupplier({
          name: trimmedName,
          contactPerson: contactPerson.trim() || trimmedName,
          phone: phone.trim() || null,
          city: city.trim() || null,
          address: city.trim() || null,
          productsSupplied: productsSupplied.split(',').map((s) => s.trim()).filter(Boolean),
          outstandingBalance: Number(outstandingBalance) || 0,
          notes: '',
        });

        setSuccessMsg(language === 'ta' ? 'புதிய விநியோகஸ்தர் சேர்க்கப்பட்டார்!' : 'New supplier added successfully!');
      }

      if (onRefreshData) await onRefreshData();
      setIsModalOpen(false);
      resetForm();
      playSoundEffect('action_success');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Supplier form error:', err);
      setSubmitError(err.message || (language === 'ta' ? 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Failed to save. Please try again.'));
      playSoundEffect('action_delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete supplier');

      if (onRefreshData) await onRefreshData();
      setDeletingSupplier(null);
      setSuccessMsg(language === 'ta' ? 'விநியோகஸ்தர் நீக்கப்பட்டார்' : 'Supplier removed');
      playSoundEffect('action_delete');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Delete supplier error:', err);
      alert(err.message || 'Could not delete supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = (search || '').toLowerCase();
  const filtered = suppliers.filter(
    (s) =>
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q) ||
      (s.city || s.address || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
  );

  return (
    <div id="suppliers-view-container" className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {isFinderMode
              ? language === 'ta'
                ? 'மொத்த விற்பனையாளரைத் தேடு (Find Wholesale Network)'
                : 'Find Wholesale Suppliers & Mandi Partners'
              : language === 'ta'
              ? 'மொத்த விநியோகஸ்தர்கள் (Suppliers)'
              : 'Wholesale Suppliers'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isFinderMode
              ? language === 'ta'
                ? 'தமிழ்நாட்டின் சிறந்த தானியம், மளிகை மற்றும் எண்ணெய் மொத்த விற்பனையாளர்களைத் தொடர்புகொள்ளுங்கள்.'
                : 'Connect directly with verified grain mills, edible oil mandis, and wholesale distributors in Tamil Nadu.'
              : language === 'ta'
              ? 'சரக்கு சப்ளை செய்யும் மொத்த வியாபாரிகள் மற்றும் அவர்களுக்கு செலுத்த வேண்டிய பாக்கி விவரங்கள்.'
              : 'Directory of grain, oil, and FMCG wholesalers with payable settlement tracking.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-3d-primary flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ta' ? '+ புதிய விநியோகஸ்தர்' : '+ Add Supplier'}</span>
        </button>
      </div>

      {/* 3D Spatial Metric Highlight Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-sky-900/40 dark:from-sky-950/25 dark:via-slate-900 dark:to-slate-900">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              {isFinderMode
                ? language === 'ta'
                  ? 'கிடைக்கும் மொத்த விற்பனையாளர்கள்'
                  : 'Verified Wholesalers'
                : language === 'ta'
                ? 'விநியோகஸ்தர்கள் எண்ணிக்கை'
                : 'Wholesale Suppliers'}
            </span>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {suppliers.length}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'அரிசி, எண்ணெய் & மளிகை சப்ளை' : 'Mills & wholesale partners'}
            </span>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-amber-900/40 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {language === 'ta' ? 'செலுத்த வேண்டிய மொத்த பாக்கி' : 'Total Supplier Payables'}
            </span>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(suppliers.reduce((acc, s) => acc + (s.outstandingBalance ?? s.outstandingPayable ?? 0), 0))}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'சரக்கு கொள்முதல் கடன்' : 'Wholesale trade credit'}
            </span>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-cyan-200/80 bg-gradient-to-b from-cyan-50/70 via-cyan-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-cyan-900/40 dark:from-cyan-950/25 dark:via-slate-900 dark:to-slate-900">
            <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              {language === 'ta' ? 'முழுமையாக செலுத்தியவர்கள்' : 'Settled Suppliers'}
            </span>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-1 text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {suppliers.filter((s) => (s.outstandingBalance ?? s.outstandingPayable ?? 0) === 0).length}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'பாக்கி இல்லை' : 'Clear account status'}
            </span>
          </div>
        </Spatial3DCard>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={language === 'ta' ? 'விநியோகஸ்தர் பெயர், போன், அல்லது ஊர் கொண்டு தேடுங்கள்...' : 'Search supplier by name, contact person, city or phone...'}
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs shadow-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const due = s.outstandingBalance ?? s.outstandingPayable ?? 0;
          const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');

          return (
            <div
              key={s.id}
              className={`group relative rounded-3xl border p-5 shadow-xs transition-all hover:shadow-md ${
                due > 0
                  ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900'
                  : 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h3>
                  <p className="text-[11px] text-slate-500">{s.contactPerson || s.name}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {due > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {formatCurrency(due)} Due
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Settled
                    </span>
                  )}

                  {/* Actions Menu */}
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                    title={language === 'ta' ? 'திருத்து' : 'Edit'}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingSupplier(s)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                    title={language === 'ta' ? 'நீக்கு' : 'Delete'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {s.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="font-mono">{s.phone}</span>
                  </p>
                )}
                {(s.city || s.address) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{s.city || s.address}</span>
                  </p>
                )}
              </div>

              {/* Quick Communication Buttons */}
              {cleanPhone && (
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <PhoneCall className="h-3 w-3 text-blue-600" />
                    <span>{language === 'ta' ? 'அழைக்க' : 'Call'}</span>
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-1.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    <MessageCircle className="h-3 w-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}

              {Array.isArray(s.productsSupplied) && s.productsSupplied.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Supplies:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.productsSupplied.map((p, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSupplier
                  ? language === 'ta'
                    ? 'விநியோகஸ்தர் விவரங்களை மாற்ற'
                    : 'Edit Supplier Details'
                  : language === 'ta'
                  ? 'புதிய விநியோகஸ்தர் சேர்க்க'
                  : 'Add Wholesale Supplier'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'நிறுவனம் / மொத்த விற்பனையாளர் பெயர் *' : 'Business / Agency Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cauvery Traders / Sri Murugan Rice Mill"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'தொடர்பாளர் பெயர்' : 'Contact Person'}
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="K. Subramanian"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'தொலைபேசி எண் (10 இலக்கம்)' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9842100000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'நகரம் / முகவரி' : 'City / Location'}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Madurai / Erode"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {!editingSupplier && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'வழங்கும் பொருட்கள் (கமாவால் பிரிக்கவும்)' : 'Products Supplied (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={productsSupplied}
                    onChange={(e) => setProductsSupplied(e.target.value)}
                    placeholder="Rice, Edible Oil, Pulses, Sugar"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'செலுத்த வேண்டிய தொடக்க பாக்கி (₹)' : 'Outstanding Payable Balance (₹)'}
                </label>
                <input
                  type="number"
                  value={outstandingBalance}
                  onChange={(e) => setOutstandingBalance(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-amber-600 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>
                    {editingSupplier
                      ? language === 'ta'
                        ? 'புதுப்பி'
                        : 'Update Supplier'
                      : language === 'ta'
                      ? 'சேமி'
                      : 'Save Supplier'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'ta' ? 'விநியோகஸ்தரை நீக்கவா?' : 'Delete Supplier?'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {language === 'ta'
                ? `"${deletingSupplier.name}" என்ற விநியோகஸ்தரை நிச்சயமாக நீக்க விரும்புகிறீர்களா?`
                : `Are you sure you want to remove "${deletingSupplier.name}"? Past purchase histories will remain intact.`}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSupplier(deletingSupplier.id)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{language === 'ta' ? 'ஆம், நீக்கு' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
