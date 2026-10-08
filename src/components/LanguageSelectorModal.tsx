import React, { useState } from 'react';
import { Globe, Search, Check, X, Sparkles } from 'lucide-react';
import { INDIAN_LANGUAGES_22, getLanguageInfo } from '../utils/languages';
import { LanguageCode } from '../types';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  currentLanguage: LanguageCode;
  onSelect: (lang: LanguageCode) => void;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  currentLanguage,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = INDIAN_LANGUAGES_22.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q)
    );
  });

  const popular = filtered.filter((l) => l.popular);
  const others = filtered.filter((l) => !l.popular);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  இந்திய மொழிகள் தேர்வு / Choose Language
                </h3>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  22 Languages
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                8th Schedule of Constitution of India • 22 Official Indian Languages + Tanglish
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 22 languages (e.g. தமிழ், Hindi, Telugu, বাংলা, ಕನ್ನಡ)..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-inner focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Popular Section */}
          {popular.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Frequently Used / முதன்மை மொழிகள்
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {popular.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelect(lang.code as LanguageCode);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {lang.nativeName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            ({lang.name})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {lang.region}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other 22 Languages Section */}
          {others.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                All 22 Constitutional Scheduled Languages
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {others.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelect(lang.code as LanguageCode);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {lang.nativeName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({lang.name})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {lang.region}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Active: <strong className="text-slate-900 dark:text-white">{getLanguageInfo(currentLanguage).nativeName} ({getLanguageInfo(currentLanguage).name})</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
