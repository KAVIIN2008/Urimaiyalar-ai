import React, { useState } from 'react';
import {
  PackagePlus,
  Plus,
  Search,
  Truck,
  Calendar,
  DollarSign,
  CheckCircle2,
  X,
  ScanLine,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Purchase, Product, Supplier, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { playSoundEffect } from '../utils/audioSpeech';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  language: LanguageCode;
  onAddPurchase: (purchaseData: any) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  products,
  suppliers,
  language,
  onAddPurchase,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'credit' | 'partial'>('paid');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Line items
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(100);
  const [purchaseItems, setPurchaseItems] = useState<
    { productId: string; productName: string; quantity: number; unit: any; unitCost: number; total: number }[]
  >([]);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setPurchaseItems([
      ...purchaseItems,
      {
        productId: prod.id,
        productName: language === 'ta' ? prod.nameTa : prod.name,
        quantity,
        unit: prod.unit,
        unitCost,
        total: quantity * unitCost,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const subtotal = purchaseItems.reduce((acc, i) => acc + i.total, 0);
  const balanceDue = paymentStatus === 'credit' ? subtotal : paymentStatus === 'partial' ? Math.max(0, subtotal - amountPaid) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (purchaseItems.length === 0) {
      setSubmitError(language === 'ta' ? 'குறைந்தது ஒரு பொருளையாவது சேர்க்கவும்' : 'Please add at least one item to purchase');
      return;
    }

    setIsSubmitting(true);
    try {
      const sup = suppliers.find((s) => s.id === supplierId);

      await onAddPurchase({
        supplierId,
        supplierName: sup ? sup.name : 'Wholesale Supplier',
        invoiceNumber: invoiceNumber.trim() || `PUR-${Date.now().toString().slice(-4)}`,
        items: purchaseItems,
        totalAmount: subtotal,
        paymentStatus,
        amountPaid: paymentStatus === 'paid' ? subtotal : amountPaid,
        balanceDue,
      });

      if (onRefreshData) await onRefreshData();
      setIsModalOpen(false);
      setPurchaseItems([]);
      setInvoiceNumber('');
      setSuccessMsg(language === 'ta' ? 'கொள்முதல் வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Purchase recorded successfully!');
      playSoundEffect('action_success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Purchase error:', err);
      setSubmitError(err.message || (language === 'ta' ? 'கொள்முதலை பதிவு செய்ய முடியவில்லை' : 'Failed to record purchase'));
      playSoundEffect('action_delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setSupplierId(suppliers[0]?.id || '');
      setInvoiceNumber(`INV-OCR-${Date.now().toString().slice(-4)}`);
      if (products.length >= 2) {
        setPurchaseItems([
          {
            productId: products[0].id,
            productName: language === 'ta' ? products[0].nameTa : products[0].name,
            quantity: 50,
            unit: products[0].unit,
            unitCost: products[0].costPrice || products[0].purchasePrice || 20,
            total: 50 * (products[0].costPrice || products[0].purchasePrice || 20),
          },
          {
            productId: products[1].id,
            productName: language === 'ta' ? products[1].nameTa : products[1].name,
            quantity: 100,
            unit: products[1].unit,
            unitCost: products[1].costPrice || products[1].purchasePrice || 15,
            total: 100 * (products[1].costPrice || products[1].purchasePrice || 15),
          },
        ]);
      }
      setIsModalOpen(true);
      playSoundEffect('action_success');
    }, 2000);
  };

  const q = (search || '').toLowerCase();
  const filtered = purchases.filter(
    (p) =>
      !q ||
      (p.supplierName || '').toLowerCase().includes(q) ||
      (p.invoiceNumber || p.purchaseNo || '').toLowerCase().includes(q) ||
      (p.items || []).some((it) => (it.productName || '').toLowerCase().includes(q))
  );

  return (
    <div id="purchases-view-container" className="space-y-6">
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
            {language === 'ta' ? 'கொள்முதல் மேலாண்மை (Procurement)' : 'Purchases & Stock Inward'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'மொத்த விற்பனையாளரிடமிருந்து கொள்முதல் பதிவுகள் மற்றும் பில் ஸ்கேனர் வசதி.'
              : 'Record B2B procurement bills from millers & distributors. Updates stock automatically.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            ) : (
              <ScanLine className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>
              {isScanning
                ? language === 'ta' ? 'OCR ஸ்கேன் ஆகிறது...' : 'Processing OCR...'
                : language === 'ta' ? 'பில் ஸ்கேன் (AI OCR)' : 'Scan Bill (AI OCR)'}
            </span>
          </button>

          <button
            onClick={() => {
              setSubmitError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{language === 'ta' ? '+ புதிய கொள்முதல்' : '+ New Purchase'}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={language === 'ta' ? 'கொள்முதல் பில் அல்லது சப்ளையர் பெயர் கொண்டு தேடுங்கள்...' : 'Search purchase invoices by supplier or bill no...'}
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Purchases Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">{language === 'ta' ? 'விலைப்பட்டியல் எண்' : 'Bill / Invoice #'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'சப்ளையர் பெயர்' : 'Supplier'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'பொருட்கள்' : 'Items'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'கட்டண நிலை' : 'Status'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'பாக்கி தொகை' : 'Balance Due'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    {language === 'ta' ? 'கொள்முதல் பதிவுகள் எதுவும் இல்லை' : 'No purchase records found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {p.invoiceNumber || p.purchaseNo || 'INV-TEMP'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {p.supplierName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {(p.items || []).map((i) => `${i.productName} (${i.quantity})`).join(', ') || 'General Items'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          p.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(p.totalAmount ?? p.total ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                      {p.balanceDue > 0 ? formatCurrency(p.balanceDue) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'புதிய கொள்முதல் சேர்க்க' : 'Add Wholesale Purchase'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'விநியோகஸ்தர் *' : 'Supplier *'}
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {suppliers.length === 0 && (
                      <option value="" disabled>No Suppliers Available. Add in Suppliers tab.</option>
                    )}
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'பில் எண்' : 'Bill / Invoice #'}
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-9923"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ta' ? 'பொருட்கள் சேர்க்க' : 'Add Purchased Items'}
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {products.length === 0 && (
                        <option value="" disabled>No Products Found.</option>
                      )}
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {language === 'ta' ? p.nameTa : p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full rounded-xl bg-emerald-600 p-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      + {language === 'ta' ? 'சேர்க்க' : 'Add'}
                    </button>
                  </div>
                </div>

                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="mt-2 flex items-center justify-between border-t border-slate-200 pt-1 text-xs dark:border-slate-700">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.productName} × {item.quantity}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'கட்டண முறை' : 'Payment Status'}
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="paid">{language === 'ta' ? 'முழு ரொக்கம் (Full Paid)' : 'Full Paid'}</option>
                    <option value="credit">{language === 'ta' ? 'முழு கடன் (Full Credit)' : 'Full Credit (Pay Later)'}</option>
                    <option value="partial">{language === 'ta' ? 'பகுதி கட்டணம் (Partial Paid)' : 'Partial Paid'}</option>
                  </select>
                </div>
                {paymentStatus === 'partial' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'செலுத்திய ரொக்கம் (Paid Amount)' : 'Amount Paid Now'}
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>{language === 'ta' ? 'மொத்த தொகை:' : 'Total Amount:'}</span>
                  <span className="text-emerald-600">{formatCurrency(subtotal)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="mt-1 flex justify-between font-bold text-rose-600">
                    <span>{language === 'ta' ? 'பாக்கி தொகை:' : 'Balance Due:'}</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  disabled={isSubmitting || purchaseItems.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{language === 'ta' ? 'சேமி' : 'Save Purchase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
