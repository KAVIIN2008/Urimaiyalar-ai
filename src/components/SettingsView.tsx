import React, { useState } from 'react';
import {
  Settings,
  Store,
  Globe,
  Moon,
  Sun,
  Shield,
  RefreshCw,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile, LanguageCode } from '../types';

interface SettingsViewProps {
  profile: BusinessProfile;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isDark: boolean;
  onThemeToggle: () => void;
  onResetData: () => void;
  onUpdateProfile: (profile: BusinessProfile) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  language,
  onLanguageChange,
  isDark,
  onThemeToggle,
  onResetData,
  onUpdateProfile,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div id="settings-view-container" className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          {language === 'ta' ? 'அமைப்புகள் & வணிக விவரங்கள்' : 'Settings & Business Profile'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'ta'
            ? 'உங்கள் கடையின் பெயர், ஜிஎஸ்டி எண், மொழி மற்றும் தோற்ற விருப்பங்கள்.'
            : 'Configure store profile, GST registration, language, and display theme.'}
        </p>
      </div>

      {/* Store Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <Store className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'ta' ? 'வணிக சுயவிவரம்' : 'Store Identity'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Business Name (English)
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                வணிக பெயர் (தமிழ்)
              </label>
              <input
                type="text"
                value={formData.businessNameTa}
                onChange={(e) => setFormData({ ...formData, businessNameTa: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Owner / Proprietor Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'ta' ? 'அமைப்புகள் சேமிக்கப்பட்டது!' : 'Saved successfully!'}
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                {language === 'ta' ? 'சேமிக்க' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {language === 'ta' ? 'பயனர் விருப்பங்கள்' : 'User Preferences'}
        </h3>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {language === 'ta' ? 'முதன்மை மொழி' : 'Default Language'}
              </p>
              <p className="text-[11px] text-slate-500">Tamil / English / Tanglish</p>
            </div>
            <div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              <button
                onClick={() => onLanguageChange('ta')}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${
                  language === 'ta' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${
                  language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('tanglish')}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${
                  language === 'tanglish' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tanglish
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {language === 'ta' ? 'இரவு / பகல் பயன்முறை' : 'Dark / Light Theme'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isDark ? 'Dark theme active' : 'Light theme active'}
              </p>
            </div>
            <button
              onClick={onThemeToggle}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold dark:border-slate-700"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {language === 'ta' ? 'டெமோ தரவை மீட்டமை' : 'Reset Demo Data'}
              </p>
              <p className="text-[11px] text-slate-500">
                Restore the Madurai grocery store demo dataset
              </p>
            </div>
            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
