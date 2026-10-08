import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  X,
  PieChart,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Expense, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { playSoundEffect } from '../utils/audioSpeech';

interface ExpensesViewProps {
  expenses: Expense[];
  language: LanguageCode;
  onAddExpense: (exp: any) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  language,
  onAddExpense,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Form State
  const [category, setCategory] = useState<any>('electricity');
  const [amount, setAmount] = useState<number>(500);
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = [
    { id: 'rent', en: 'Shop Rent', ta: 'கடை வாடகை' },
    { id: 'electricity', en: 'Electricity Bill', ta: 'மின்சார கட்டணம்' },
    { id: 'salary', en: 'Staff Salary / Wages', ta: 'பணியாளர் கூலி / சம்பளம்' },
    { id: 'transport', en: 'Transport & Freight', ta: 'சரக்கு போக்குவரத்து' },
    { id: 'packaging', en: 'Bags & Packaging', ta: 'பை மற்றும் பேக்கிங்' },
    { id: 'tea_refreshment', en: 'Tea & Refreshments', ta: 'டீ மற்றும் சிற்றுண்டி' },
    { id: 'repair_maintenance', en: 'Repairs & Maintenance', ta: 'பராமரிப்பு செலவுகள்' },
    { id: 'miscellaneous', en: 'Miscellaneous', ta: 'இதர செலவுகள்' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (Number(amount) <= 0) {
      setSubmitError(language === 'ta' ? 'செலவு தொகை 0-க்கு மேல் இருக்க வேண்டும்' : 'Expense amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddExpense({
        category,
        amount: Number(amount),
        description: description.trim() || 'Store operation expense',
        date: new Date().toISOString().split('T')[0],
        paymentMode,
      });

      if (onRefreshData) await onRefreshData();
      setIsModalOpen(false);
      setDescription('');
      setAmount(500);
      setSuccessMsg(language === 'ta' ? 'செலவு வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Expense recorded successfully!');
      playSoundEffect('action_success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Add expense error:', err);
      setSubmitError(err.message || (language === 'ta' ? 'செலவை பதிவு செய்ய முடியவில்லை' : 'Failed to record expense'));
      playSoundEffect('action_delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');

      if (onRefreshData) await onRefreshData();
      setDeletingExpense(null);
      setSuccessMsg(language === 'ta' ? 'செலவு பதிவு நீக்கப்பட்டது' : 'Expense deleted');
      playSoundEffect('action_delete');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Delete expense error:', err);
      alert(err.message || 'Could not delete expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  const q = (search || '').toLowerCase();
  const filtered = expenses.filter((e) => {
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const desc = e.description || e.title || '';
    const matchesSearch = !q || desc.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="expenses-view-container" className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {language === 'ta' ? 'செலவுகள் மேலாண்மை (Operating Expenses)' : 'Operating Expenses'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'வாடகை, மின்சாரம், பணியாளர் கூலி மற்றும் அன்றாட கடை செலவுகளை எளிதாக பதிவு செய்யுங்கள்.'
              : 'Track daily operating expenses. Affects net profit computations deterministically.'}
          </p>
        </div>

        <button
          onClick={() => {
            setSubmitError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ta' ? '+ செலவு பதிவு' : '+ Record Expense'}</span>
        </button>
      </div>

      {/* Expense Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-b from-rose-50/70 via-rose-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-rose-900/40 dark:from-rose-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
            {language === 'ta' ? 'மொத்த செயல்பாட்டு செலவு' : 'Total Expenses'}
          </span>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpense)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {expenses.length} {language === 'ta' ? 'செலவு பதிவுகள்' : 'transactions'}
          </span>
        </div>

        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-amber-900/40 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {language === 'ta' ? 'கடை வாடகை & மின்சாரம்' : 'Rent & Utilities'}
          </span>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {formatCurrency(
              expenses
                .filter((e) => e.category === 'rent' || e.category === 'electricity')
                .reduce((acc, e) => acc + e.amount, 0)
            )}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ta' ? 'நிலையான மாதாந்திர செலவு' : 'Fixed facility costs'}
          </span>
        </div>

        <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-sky-900/40 dark:from-sky-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
            {language === 'ta' ? 'கூலி & போக்குவரத்து' : 'Staff Wages & Logistics'}
          </span>
          <p className="mt-1 text-2xl font-black text-sky-700 dark:text-sky-300">
            {formatCurrency(
              expenses
                .filter((e) => e.category === 'salary' || e.category === 'transport')
                .reduce((acc, e) => acc + e.amount, 0)
            )}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ta' ? 'பணியாளர் & லோடிங்' : 'Wages & freight'}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white p-5 shadow-xs transition hover:shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {language === 'ta' ? 'டீ, பேக்கிங் & இதர செலவு' : 'Tea & Sundry'}
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {formatCurrency(
              expenses
                .filter((e) => !['rent', 'electricity', 'salary', 'transport'].includes(e.category))
                .reduce((acc, e) => acc + e.amount, 0)
            )}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ta' ? 'தினசரி சிறு செலவுகள்' : 'Daily small petty cash'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ta' ? 'செலவு விவரம் கொண்டு தேடுங்கள்...' : 'Search expenses by description...'}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="all">{language === 'ta' ? 'அனைத்து பிரிவுகளும்' : 'All Categories'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {language === 'ta' ? c.ta : c.en}
            </option>
          ))}
        </select>
      </div>

      {/* Expense List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {language === 'ta' ? 'செலவு பதிவுகள் எதுவும் இல்லை' : 'No expense records found.'}
            </div>
          ) : (
            filtered.map((e) => {
              const catObj = categories.find((c) => c.id === e.category);
              const catName = catObj ? (language === 'ta' ? catObj.ta : catObj.en) : e.category;

              return (
                <div key={e.id} className="group flex items-center justify-between p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {e.description || e.title || catName}
                      </h4>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium dark:bg-slate-800">
                          {catName}
                        </span>
                        <span>•</span>
                        <span>{new Date(e.date).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(e.amount)}
                    </span>
                    <button
                      onClick={() => setDeletingExpense(e)}
                      className="rounded-lg p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                      title={language === 'ta' ? 'நீக்கு' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'புதிய செலவு பதிவு செய்ய' : 'Record Operating Expense'}
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
                  {language === 'ta' ? 'செலவு பிரிவு' : 'Expense Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'ta' ? c.ta : c.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'தொகை (₹)' : 'Amount (₹) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="500"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-rose-600 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'விவரம் / குறிப்பு' : 'Description / Notes'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="EB bill for shop #1 / Loading charges"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'பணம் செலுத்திய முறை' : 'Payment Mode'}
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="cash">{language === 'ta' ? 'ரொக்கம் (Cash)' : 'Cash'}</option>
                  <option value="upi">{language === 'ta' ? 'UPI (GPay/PhonePe)' : 'UPI'}</option>
                  <option value="bank_transfer">{language === 'ta' ? 'வங்கி பரிமாற்றம்' : 'Bank Transfer'}</option>
                </select>
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
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{language === 'ta' ? 'பதிவு செய்' : 'Record Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'ta' ? 'செலவு பதிவை நீக்கவா?' : 'Delete Expense Record?'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {language === 'ta'
                ? `₹${deletingExpense.amount} (${deletingExpense.description || deletingExpense.title}) பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?`
                : `Are you sure you want to delete ₹${deletingExpense.amount} (${deletingExpense.description || deletingExpense.title})?`}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingExpense.id)}
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
