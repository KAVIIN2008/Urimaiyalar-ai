import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Search,
  Tag,
  Pin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  User,
  Lightbulb,
} from 'lucide-react';
import { BusinessMemory, LanguageCode } from '../types';

interface BusinessMemoryViewProps {
  memories: BusinessMemory[];
  language: LanguageCode;
  onAddMemory: (mem: any) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
}

export const BusinessMemoryView: React.FC<BusinessMemoryViewProps> = ({
  memories,
  language,
  onAddMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [category, setCategory] = useState<
    'customer_preference' | 'supplier_deal' | 'seasonal_pattern' | 'business_decision' | 'general'
  >('customer_preference');
  const [title, setTitle] = useState('');
  const [titleTa, setTitleTa] = useState('');
  const [content, setContent] = useState('');
  const [contentTa, setContentTa] = useState('');
  const [relatedEntityName, setRelatedEntityName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onAddMemory({
      category,
      title,
      titleTa: titleTa || title,
      content,
      contentTa: contentTa || content,
      relatedEntityName: relatedEntityName.trim() || undefined,
      tags: tags.length > 0 ? tags : ['General'],
      pinned: isPinned,
      createdDate: new Date().toISOString(),
    });

    setIsModalOpen(false);
    setTitle('');
    setTitleTa('');
    setContent('');
    setContentTa('');
    setRelatedEntityName('');
    setTagsInput('');
  };

  const q = (search || '').toLowerCase();
  const filteredMemories = memories.filter((m) => {
    const title = m.title || '';
    const titleTa = m.titleTa || '';
    const content = m.content || m.description || '';
    const contentTa = m.contentTa || m.description || '';
    const entity = m.relatedEntityName || m.entityName || '';
    const tags = m.tags || [];

    const matchesSearch =
      !q ||
      title.toLowerCase().includes(q) ||
      titleTa.toLowerCase().includes(q) ||
      content.toLowerCase().includes(q) ||
      contentTa.toLowerCase().includes(q) ||
      entity.toLowerCase().includes(q) ||
      tags.some((t) => (t || '').toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="business-memory-view-container" className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                {language === 'ta' ? 'வணிக நினைவக இயந்திரம்' : 'Business Memory Engine'}
              </span>
              <Brain className="h-4 w-4 text-purple-300" />
            </div>
            <h2 className="mt-2 text-xl font-black sm:text-2xl lg:text-3xl">
              {language === 'ta' ? 'வணிக நினைவகம் (Business Memory)' : 'Your Business Memory'}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-purple-200 sm:text-sm">
              {language === 'ta'
                ? 'வாடிக்கையாளர் விருப்பங்கள், விநியோகஸ்தர் ஒப்பந்தங்கள், திருவிழா கால விற்பனை போக்குகள் மற்றும் வாக்குறுதிகளை ஒருபோதும் மறக்காதீர்கள்.'
                : 'Customer preferences, supplier promises, seasonal demand surges, and store decisions — preserved forever.'}
            </p>
          </div>

          <button
            id="add-memory-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-purple-950 shadow-md transition hover:bg-purple-50 active:scale-95"
          >
            <Plus className="h-4 w-4 text-purple-700" />
            <span>{language === 'ta' ? '+ நினைவகம் சேர்க்க' : '+ Save New Memory'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'ta'
                ? 'நினைவகம், நபர் பெயர், குறிச்சொற்கள் தேடுக...'
                : 'Search memories, customer names, tags, seasonal patterns...'
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs focus:bg-white dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">{language === 'ta' ? 'அனைத்து பிரிவுகளும்' : 'All Categories'}</option>
            <option value="customer_preference">{language === 'ta' ? 'வாடிக்கையாளர் விருப்பம்' : 'Customer Preference'}</option>
            <option value="supplier_deal">{language === 'ta' ? 'விநியோகஸ்தர் ஒப்பந்தம்' : 'Supplier Deal'}</option>
            <option value="seasonal_pattern">{language === 'ta' ? 'பருவகால விற்பனை போக்கு' : 'Seasonal Pattern'}</option>
            <option value="business_decision">{language === 'ta' ? 'வணிக முடிவுகள்' : 'Business Decision'}</option>
          </select>
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMemories.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700">
            <Brain className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold">
              {language === 'ta' ? 'நினைவகங்கள் எதுவும் கிடைக்கவில்லை' : 'No memories found.'}
            </p>
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const isTa = language === 'ta';
            return (
              <div
                key={mem.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${
                  mem.pinned
                    ? 'border-purple-300 bg-purple-50/40 dark:border-purple-900/50 dark:bg-purple-950/20'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div>
                  {/* Category & Pin */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {mem.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePin(mem.id)}
                        className={`rounded-lg p-1 transition ${
                          mem.pinned
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-slate-300 hover:text-slate-600'
                        }`}
                        title={mem.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMemory(mem.id)}
                        className="rounded-lg p-1 text-slate-300 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Related Entity */}
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    {isTa ? (mem.titleTa || mem.title) : (mem.title || mem.titleTa)}
                  </h3>

                  {(mem.relatedEntityName || mem.entityName) && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <User className="h-3 w-3" />
                      <span>{mem.relatedEntityName || mem.entityName}</span>
                    </div>
                  )}

                  {/* Content */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {isTa ? (mem.contentTa || mem.description || mem.content) : (mem.content || mem.description || mem.contentTa)}
                  </p>
                </div>

                {/* Footer: Tags & Date */}
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1">
                    {(mem.tags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(mem.createdDate || mem.timestamp || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'புதிய வணிக நினைவகம் பதிவு' : 'Save Business Memory'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="customer_preference">Customer Preference (வாடிக்கையாளர் விருப்பம்)</option>
                  <option value="supplier_deal">Wholesale Deal (விநியோகஸ்தர் ஒப்பந்தம்)</option>
                  <option value="seasonal_pattern">Seasonal / Festival Demand (திருவிழா விற்பனை)</option>
                  <option value="business_decision">Key Decision (வணிக முடிவு)</option>
                  <option value="general">General Observation (பொதுவானது)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Title (English)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ramesh Rice Brand Preference"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  தலைப்பு (தமிழ்)
                </label>
                <input
                  type="text"
                  value={titleTa}
                  onChange={(e) => setTitleTa(e.target.value)}
                  placeholder="எ.கா: ரமேஷ் அவர்களின் அரிசி பிராண்ட் விருப்பம்"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Related Person / Company (Optional)
                </label>
                <input
                  type="text"
                  value={relatedEntityName}
                  onChange={(e) => setRelatedEntityName(e.target.value)}
                  placeholder="e.g. M. Ramesh or Cauvery Traders"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Details / Observations (English)
                </label>
                <textarea
                  rows={2}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Only buys Ponni Boiled Rice, clears credit within 10 days..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  விவரம் (தமிழ்)
                </label>
                <textarea
                  rows={2}
                  value={contentTa}
                  onChange={(e) => setContentTa(e.target.value)}
                  placeholder="பொன்னி புழுங்கல் அரிசி மட்டுமே வாங்குவார், 10 நாட்களுக்குள் கடன் செலுத்திவிடுவார்..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="VIP, Rice, Credit, Pongal"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinned-check"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <label htmlFor="pinned-check" className="text-xs text-slate-700 dark:text-slate-300">
                  Pin to top of Business Memory
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-800"
                >
                  Save to Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
