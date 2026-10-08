import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  QrCode,
  Scan,
} from 'lucide-react';
import { Sale, Product, Customer, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { openInvoicePrintWindow, shareInvoiceViaWhatsApp, InvoiceData } from '../utils/invoiceGenerator';
import { Spatial3DCard } from './Spatial3DWidgets';

interface SalesViewProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  language: LanguageCode;
  onAddSale: (saleData: any) => Promise<void>;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  products,
  customers,
  language,
  onAddSale,
}) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [qrModalSale, setQrModalSale] = useState<Sale | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // New Sale Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'upi' | 'credit' | 'partial'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Items in current draft invoice
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [cartItems, setCartItems] = useState<
    { productId: string; productName: string; quantity: number; unit: any; unitPrice: number; total: number }[]
  >([]);

  const handleAddItemToCart = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const existingIndex = cartItems.findIndex((i) => i.productId === prod.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: prod.id,
          productName: language === 'ta' ? prod.nameTa : prod.name,
          quantity: itemQuantity,
          unit: prod.unit,
          unitPrice: prod.sellingPrice,
          total: prod.sellingPrice * itemQuantity,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const subtotal = cartItems.reduce((acc, i) => acc + i.total, 0);
  const total = Math.max(0, subtotal - discount);
  const balanceDue = paymentType === 'credit' ? total : paymentType === 'partial' ? Math.max(0, total - amountPaid) : 0;

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    await onAddSale({
      customerName: customerName.trim() || 'Walk-in Cash Customer',
      customerPhone: customerPhone.trim(),
      items: cartItems,
      subtotal,
      discount,
      tax: 0,
      total,
      paymentType,
      amountPaid: paymentType === 'cash' || paymentType === 'upi' ? total : amountPaid,
      balanceDue,
      notes,
    });

    // Reset Form
    setIsModalOpen(false);
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setAmountPaid(0);
    setNotes('');
  };

  // Filter sales
  const q = (search || '').toLowerCase();
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      !q ||
      (s.invoiceNo || '').toLowerCase().includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      (s.items || []).some((i) => (i.productName || '').toLowerCase().includes(q));

    const matchesPayment = paymentFilter === 'all' || s.paymentType === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  return (
    <div id="sales-view-container" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {language === 'ta' ? 'விற்பனை மேலாண்மை (Sales)' : 'Sales & Invoices'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'விற்பனையை பதிவு செய்யும்போது சரக்கு இருப்பு மற்றும் வாடிக்கையாளர் கடன் தானாக புதுப்பிக்கப்படும்.'
              : 'Record cash, UPI & credit sales. Inventory & customer ledgers update automatically.'}
          </p>
        </div>

        <button
          id="open-add-sale-modal-btn"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ta' ? '+ புதிய விற்பனை' : '+ New Sale Invoice'}</span>
        </button>
      </div>

      {/* Quick Sales Overview Boxes with 3D Spatial Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Spatial3DCard depth={12}>
          <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white p-4 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                {language === 'ta' ? 'மொத்த விற்பனை மதிப்பு' : 'Total Sales Recorded'}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {sales.length} bills
              </span>
            </div>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(sales.reduce((acc, s) => acc + s.total, 0))}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'அனைத்து பதிவு செய்யப்பட்ட பில்கள்' : 'Cumulative revenue across all invoices'}
            </p>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-2xl border border-cyan-200/70 bg-gradient-to-b from-cyan-50/70 via-cyan-50/20 to-white p-4 shadow-sm dark:border-cyan-900/40 dark:from-cyan-950/30 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300">
                {language === 'ta' ? 'நேரடி ரொக்கம் & UPI' : 'Cash & UPI Realized'}
              </span>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                Paid
              </span>
            </div>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-2 text-2xl font-black text-cyan-950 dark:text-cyan-100">
              {formatCurrency(sales.reduce((acc, s) => acc + s.amountPaid, 0))}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'கடை கல்லாவில் சேர்ந்த ரொக்க வரவு' : 'Instantly realized counter liquidity'}
            </p>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                {language === 'ta' ? 'வாடிக்கையாளர் கடன் பாக்கி' : 'Sales on Credit'}
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Udhar
              </span>
            </div>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
              {formatCurrency(sales.reduce((acc, s) => acc + s.balanceDue, 0))}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'வசூலிக்க வேண்டிய மீதி தொகை' : 'Receivables tracked in customer ledger'}
            </p>
          </div>
        </Spatial3DCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/60 to-white p-4 shadow-xs dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'ta'
                ? 'ரசீது எண், வாடிக்கையாளர் பெயர் தேடுக...'
                : 'Search by invoice #, customer name...'
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{language === 'ta' ? 'அனைத்து கட்டண முறைகளும்' : 'All Payments'}</option>
            <option value="cash">{language === 'ta' ? 'ரொக்கம் (Cash)' : 'Cash'}</option>
            <option value="upi">{language === 'ta' ? 'UPI / GPay' : 'UPI'}</option>
            <option value="credit">{language === 'ta' ? 'கடன் (Credit)' : 'Credit (Udhar)'}</option>
            <option value="partial">{language === 'ta' ? 'பகுதி தொகை' : 'Partial'}</option>
          </select>
        </div>
      </div>

      {/* Sales Transactions List Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">{language === 'ta' ? 'ரசீது எண்' : 'Invoice #'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'தேதி' : 'Date'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'வாடிக்கையாளர்' : 'Customer'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'பொருட்கள்' : 'Items'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'முறை' : 'Payment'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'மொத்தம்' : 'Total'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'பாக்கி' : 'Balance'}</th>
                <th className="px-5 py-3.5 text-center">{language === 'ta' ? 'ரசீது' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {language === 'ta' ? 'விற்பனை விவரங்கள் இல்லை' : 'No sales records found.'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {sale.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {sale.customerName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          sale.paymentType === 'cash'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : sale.paymentType === 'upi'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : sale.paymentType === 'credit'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {sale.paymentType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">
                      {sale.balanceDue > 0 ? formatCurrency(sale.balanceDue) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const invoiceData: InvoiceData = {
                              invoiceNo: sale.invoiceNo,
                              date: new Date(sale.date).toLocaleDateString('en-IN'),
                              businessName: 'Thirumalai Stores',
                              businessPhone: '9842100000',
                              businessAddress: 'Madurai, Tamil Nadu',
                              customerName: sale.customerName,
                              customerPhone: sale.customerPhone,
                              items: sale.items,
                              subtotal: sale.subtotal,
                              discount: sale.discount,
                              tax: sale.tax,
                              total: sale.total,
                              paymentType: sale.paymentType,
                              amountPaid: sale.amountPaid,
                              balanceDue: sale.balanceDue,
                            };
                            openInvoicePrintWindow(invoiceData);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800"
                          title="Print Invoice PDF"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const invoiceData: InvoiceData = {
                              invoiceNo: sale.invoiceNo,
                              date: new Date(sale.date).toLocaleDateString('en-IN'),
                              businessName: 'Thirumalai Stores',
                              businessPhone: '9842100000',
                              businessAddress: 'Madurai, Tamil Nadu',
                              customerName: sale.customerName,
                              customerPhone: sale.customerPhone,
                              items: sale.items,
                              subtotal: sale.subtotal,
                              discount: sale.discount,
                              tax: sale.tax,
                              total: sale.total,
                              paymentType: sale.paymentType,
                              amountPaid: sale.amountPaid,
                              balanceDue: sale.balanceDue,
                            };
                            shareInvoiceViaWhatsApp(invoiceData);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-slate-800"
                          title="Share via WhatsApp"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setQrModalSale(sale)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800"
                          title="Generate UPI QR"
                        >
                          <QrCode className="h-4 w-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'புதிய விற்பனை ரசீது (New Invoice)' : 'Create New Sale Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="mt-4 space-y-4">
              {/* Customer selection/input */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'வாடிக்கையாளர் பெயர்' : 'Customer Name'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="M. Ramesh / Walk-in"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'தொலைபேசி எண் (விருப்பத்தேர்வு)' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98421..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Add Product Line with soft color background */}
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-emerald-50/20 p-4 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    {language === 'ta' ? 'பொருட்கள் சேர்க்க' : 'Add Item to Cart'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    <Scan className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{language === 'ta' ? 'பார்கோடு ஸ்கேன்' : 'Scan Barcode'}</span>
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {language === 'ta' ? p.nameTa : p.name} (₹{p.sellingPrice}/{p.unit}) - Stock: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Qty"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddItemToCart}
                      className="w-full rounded-xl bg-emerald-600 p-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                    >
                      + {language === 'ta' ? 'சேர்க்க' : 'Add Item'}
                    </button>
                  </div>
                </div>

                {/* Cart Items List */}
                {cartItems.length > 0 && (
                  <div className="mt-3 divide-y divide-emerald-200/60 border-t border-emerald-200/60 pt-2 dark:divide-emerald-900/50 dark:border-emerald-900/50">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.productName} × {item.quantity} {item.unit}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(item.total)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Type & Calculations */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'கட்டண முறை' : 'Payment Type'}
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="cash">{language === 'ta' ? 'ரொக்கம் (Cash)' : 'Full Cash'}</option>
                    <option value="upi">{language === 'ta' ? 'UPI (GPay / PhonePe)' : 'UPI / Online'}</option>
                    <option value="credit">{language === 'ta' ? 'முழு கடன் (Udhar)' : 'Full Credit'}</option>
                    <option value="partial">{language === 'ta' ? 'பகுதி ரொக்கம் + பகுதி கடன்' : 'Partial Payment'}</option>
                  </select>
                </div>

                {paymentType === 'partial' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {language === 'ta' ? 'செலுத்திய ரொக்கம் (Paid Amount)' : 'Amount Paid Now'}
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Total Calculation summary with soft color wash */}
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white p-4 text-xs shadow-xs dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">{language === 'ta' ? 'பொருட்கள் தொகை' : 'Subtotal'}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-base font-black text-slate-900 dark:text-white">
                  <span>{language === 'ta' ? 'மொத்த தொகை (Total)' : 'Total Bill'}:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(total)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between border-t border-emerald-200/60 pt-1.5 text-xs font-bold text-amber-700 dark:border-emerald-900/40 dark:text-amber-300">
                    <span>{language === 'ta' ? 'கடன் பாக்கி (Balance Due)' : 'Credit Balance Due'}:</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {language === 'ta' ? 'விற்பனையை உறுதிசெய்' : 'Save & Print Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400">TAX INVOICE SLIP</span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                THIRUMALAI STORES
              </h3>
              <p className="text-[11px] text-slate-500">
                142, East Veli Street, Madurai - 625001 • GST: 33ABCDE1234F1Z5
              </p>
              <div className="my-3 border-b border-dashed border-slate-300 dark:border-slate-700"></div>
              <div className="flex justify-between text-left text-xs">
                <span className="text-slate-500">Invoice: {selectedInvoice.invoiceNo}</span>
                <span className="text-slate-500">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
              </div>
              <div className="mt-1 text-left text-xs font-semibold">
                Customer: {selectedInvoice.customerName}
              </div>

              {/* Items */}
              <div className="my-3 space-y-1 text-left text-xs">
                {selectedInvoice.items.map((it, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{it.productName} ({it.quantity} {it.unit})</span>
                    <span className="font-bold">{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>

              <div className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700"></div>
              <div className="flex justify-between text-sm font-black">
                <span>Total:</span>
                <span>{formatCurrency(selectedInvoice.total)}</span>
              </div>
              {selectedInvoice.balanceDue > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-600">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(selectedInvoice.balanceDue)}</span>
                </div>
              )}
              <p className="mt-4 text-[10px] text-slate-400">Thank you! Visit Again / நன்றி, மீண்டும் வருக!</p>
            </div>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 p-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              <Printer className="h-4 w-4" />
              {language === 'ta' ? 'அச்சிடுக' : 'Print Invoice'}
            </button>
          </div>
        </div>
      )}
      {/* UPI QR Modal */}
      {qrModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">INSTANT UPI PAYMENT</span>
              <button onClick={() => setQrModalSale(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Thirumalai Stores</h4>
              <p className="text-xs text-slate-500">Bill #{qrModalSale.invoiceNo} • {qrModalSale.customerName}</p>
              
              <div className="my-4 flex justify-center rounded-2xl bg-white p-4 shadow-inner border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `upi://pay?pa=thirumalai@okicici&pn=ThirumalaiStores&am=${qrModalSale.total}&cu=INR&tn=Invoice_${qrModalSale.invoiceNo}`
                  )}`}
                  alt="UPI QR Code"
                  className="h-48 w-48 object-contain"
                />
              </div>

              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(qrModalSale.total)}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Scan using GPay, PhonePe, Paytm, BHIM</p>
            </div>
            <button
              onClick={() => setQrModalSale(null)}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              {language === 'ta' ? 'முடிந்தது / மூடு' : 'Done / Close'}
            </button>
          </div>
        </div>
      )}
      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-950 p-6 text-center shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Scan className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Barcode Scanner</span>
              </div>
              <button onClick={() => setIsScannerOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-6">
              <div className="relative mx-auto flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500/50 bg-slate-900">
                {/* Laser animation */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2s_infinite]" />
                
                <div className="text-center p-4">
                  <Scan className="mx-auto h-12 w-12 text-emerald-400/40 animate-pulse" />
                  <p className="mt-2 text-xs font-medium text-slate-300">
                    {language === 'ta' ? 'பார்கோடு கேமராவில் காட்டவும்...' : 'Align product barcode inside frame...'}
                  </p>
                  <p className="text-[10px] text-slate-500">Scanning at 60 FPS • Laser Active</p>
                </div>
              </div>

              {/* Quick Scan Simulator buttons for demo */}
              <div className="mt-4 space-y-2">
                <p className="text-[11px] text-slate-400">Quick Scan Test (Simulate):</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {products.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        handleAddItemToCart();
                        setIsScannerOpen(false);
                      }}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      ⚡ {language === 'ta' ? p.nameTa : p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsScannerOpen(false)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
            >
              {language === 'ta' ? 'ரத்து செய்க' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
