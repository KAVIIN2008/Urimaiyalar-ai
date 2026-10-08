import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  X,
  Package,
  TrendingDown,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Product, Supplier, LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { Spatial3DCard } from './Spatial3DWidgets';
import { playSoundEffect } from '../utils/audioSpeech';

interface InventoryViewProps {
  products: Product[];
  suppliers: Supplier[];
  language: LanguageCode;
  onAddProduct: (prod: any) => Promise<void>;
  onUpdateProduct: (id: string, updates: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onOpenPurchase: () => void;
  onRefreshData?: () => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  suppliers,
  language,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenPurchase,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [category, setCategory] = useState('Rice & Grains');
  const [unit, setUnit] = useState<'kg' | 'packet' | 'bag' | 'litre' | 'piece'>('kg');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [purchasePrice, setPurchasePrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(120);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setNameTa('');
    setCategory(categories[0] || 'Rice & Grains');
    setUnit('kg');
    setCurrentStock(10);
    setMinStock(5);
    setPurchasePrice(100);
    setSellingPrice(120);
    setSupplierId(suppliers[0]?.id || '');
    setSubmitError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setNameTa(p.nameTa || p.name);
    setCategory(p.category);
    setUnit((p.unit as any) || 'kg');
    setCurrentStock(p.currentStock);
    setMinStock(p.minStock);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setSupplierId(p.supplierId || suppliers[0]?.id || '');
    setSubmitError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSubmitError(language === 'ta' ? 'பொருளின் பெயர் அவசியம்' : 'Product name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const sup = suppliers.find((s) => s.id === supplierId);
      const payload = {
        name: trimmedName,
        nameTa: nameTa.trim() || trimmedName,
        category,
        unit,
        currentStock: Number(currentStock),
        minStock: Number(minStock),
        purchasePrice: Number(purchasePrice),
        costPrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        supplierId,
        supplierName: sup ? sup.name : 'Wholesale Supplier',
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
        setSuccessMsg(language === 'ta' ? 'பொருள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Product updated successfully!');
      } else {
        await onAddProduct(payload);
        setSuccessMsg(language === 'ta' ? 'புதிய பொருள் சேர்க்கப்பட்டது!' : 'New product added successfully!');
      }

      if (onRefreshData) await onRefreshData();
      setIsAddModalOpen(false);
      playSoundEffect('action_success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Product save error:', err);
      setSubmitError(err.message || (language === 'ta' ? 'சேமிக்க முடியவில்லை' : 'Failed to save product'));
      playSoundEffect('action_delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteProduct(id);
      if (onRefreshData) await onRefreshData();
      setDeletingProduct(null);
      setSuccessMsg(language === 'ta' ? 'பொருள் நீக்கப்பட்டது' : 'Product deleted successfully');
      playSoundEffect('action_delete');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Delete product error:', err);
      alert(err.message || 'Could not delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = (search || '').toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.nameTa || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'low' && p.currentStock <= p.minStock && p.currentStock > 0) ||
      (statusFilter === 'out' && p.currentStock <= 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStock <= 0).length;

  return (
    <div id="inventory-view-container" className="space-y-6">
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
            {language === 'ta' ? 'சரக்கு இருப்பு மேலாண்மை (Inventory)' : 'Inventory Management'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ta'
              ? 'சரக்கு இருப்பு, குறைந்தபட்ச இருப்பு எச்சரிக்கை மற்றும் கொள்முதல் விலை மேலாண்மை.'
              : 'Real-time stock monitoring, reorder alerts, and margin calculations.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ta' ? '+ புதிய பொருள்' : '+ Add Product'}</span>
        </button>
      </div>

      {/* 3D Spatial Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white p-5 shadow-xs dark:border-sky-900/40 dark:from-sky-950/25 dark:via-slate-900 dark:to-slate-900">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              {language === 'ta' ? 'மொத்த சரக்கு பொருட்கள்' : 'Total SKU Items'}
            </span>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {products.length}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {categories.length} {language === 'ta' ? 'பிரிவுகள்' : 'categories'}
            </span>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-5 shadow-xs dark:border-amber-900/40 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {language === 'ta' ? 'குறைந்த இருப்பு எச்சரிக்கை' : 'Low Stock Alert'}
            </span>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'உடனடி கொள்முதல் தேவை' : 'Reorder needed soon'}
            </span>
          </div>
        </Spatial3DCard>

        <Spatial3DCard depth={12}>
          <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-b from-rose-50/70 via-rose-50/20 to-white p-5 shadow-xs dark:border-rose-900/40 dark:from-rose-950/25 dark:via-slate-900 dark:to-slate-900">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {language === 'ta' ? 'இருப்பு தீர்ந்தவை' : 'Out of Stock'}
            </span>
            <p style={{ transform: 'translateZ(18px)' }} className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
              {outOfStockCount}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'ta' ? 'விற்பனை இழப்பு அபாயம்' : 'Critical zero stock'}
            </span>
          </div>
        </Spatial3DCard>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ta' ? 'பொருள் பெயர் கொண்டு தேடுங்கள்...' : 'Search products by name or category...'}
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
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும்' : 'All'}
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              statusFilter === 'low'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {language === 'ta' ? 'குறைந்தவை' : 'Low'}
          </button>
          <button
            onClick={() => setStatusFilter('out')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              statusFilter === 'out'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {language === 'ta' ? 'தீர்ந்தவை' : 'Out'}
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">{language === 'ta' ? 'பொருள் பெயர்' : 'Product Item'}</th>
                <th className="px-5 py-3.5">{language === 'ta' ? 'பிரிவு' : 'Category'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'தற்போதைய இருப்பு' : 'Current Stock'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'கொள்முதல் விலை' : 'Cost'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'விற்பனை விலை' : 'Selling Price'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'ta' ? 'லாப வரம்பு' : 'Margin %'}</th>
                <th className="px-5 py-3.5 text-center">{language === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                    {language === 'ta' ? 'பொருட்கள் எதுவும் கிடைக்கவில்லை' : 'No products found matching filters.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.sellingPrice - p.purchasePrice;
                  const marginPercent = p.purchasePrice > 0 ? Math.round((margin / p.purchasePrice) * 100) : 0;
                  const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        <div>{language === 'ta' ? p.nameTa || p.name : p.name}</div>
                        <div className="text-[11px] font-normal text-slate-400">
                          {language === 'ta' ? p.name : p.nameTa}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-bold">
                          <span
                            className={
                              isOut
                                ? 'text-rose-600 dark:text-rose-400'
                                : isLow
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }
                          >
                            {p.currentStock} {p.unit}
                          </span>
                          {isOut && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                          {isLow && <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {marginPercent}%
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                            title={language === 'ta' ? 'திருத்து' : 'Edit'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                            title={language === 'ta' ? 'நீக்கு' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct
                  ? language === 'ta' ? 'பொருளை திருத்து' : 'Edit Product'
                  : language === 'ta' ? 'புதிய பொருள் சேர்க்க' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'பொருள் பெயர் (English) *' : 'Product Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ponni Boiled Rice"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'பொருள் பெயர் (தமிழ்) *' : 'Product Name (Tamil) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameTa}
                    onChange={(e) => setNameTa(e.target.value)}
                    placeholder="பொன்னி புழுங்கல் அரிசி"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'பிரிவு' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Rice & Grains"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'அலகு (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="kg">kg (கிலோ)</option>
                    <option value="packet">packet (பாக்கெட்)</option>
                    <option value="bag">bag (மூட்டை/பை)</option>
                    <option value="litre">litre (லிட்டர்)</option>
                    <option value="piece">piece (எண்ணிக்கை)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'தற்போதைய இருப்பு' : 'Current Stock'}
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-emerald-600 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'குறைந்தபட்ச இருப்பு வரம்பு' : 'Min Safety Threshold'}
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'கொள்முதல் விலை (₹)' : 'Cost Price (₹)'}
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'விற்பனை விலை (₹)' : 'Selling Price (₹)'}
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-emerald-600 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  <span>
                    {editingProduct
                      ? language === 'ta' ? 'புதுப்பி' : 'Update Product'
                      : language === 'ta' ? 'சேமி' : 'Save Product'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'ta' ? 'பொருளை நீக்கவா?' : 'Delete Product?'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {language === 'ta'
                ? `"${deletingProduct.nameTa || deletingProduct.name}" பொருளை நிச்சயமாக பட்டியலில் இருந்து நீக்க விரும்புகிறீர்களா?`
                : `Are you sure you want to delete "${deletingProduct.name}" from your catalog?`}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingProduct.id)}
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
