import React, { useState } from 'react';
import {
  Mic,
  Sun,
  Moon,
  Bell,
  RefreshCw,
  Sparkles,
  Store,
  CheckCircle2,
  AlertTriangle,
  X,
  Menu,
  Trash2,
  UserCheck,
  DownloadCloud,
  LogOut,
  Globe,
} from 'lucide-react';
import { BusinessProfile, BusinessAlert, LanguageCode } from '../types';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { getLanguageInfo } from '../utils/languages';
import { useTranslation } from '../contexts/LanguageContext';

interface NavbarProps {
  profile: BusinessProfile;
  alerts: BusinessAlert[];
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isDark: boolean;
  onThemeToggle: () => void;
  onOpenVoice: () => void;
  onResetData: () => void;
  onClearData?: () => void;
  onLoadSampleData?: () => void;
  userRole?: 'wholesale' | 'retail' | 'customer';
  onToggleRole?: () => void;
  onToggleSidebar?: () => void;
  onNavigate: (view: string) => void;
  onMarkAlertRead: (id: string) => void;
  onDismissAlert: (id: string) => void;
  onLogout?: () => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  profile,
  alerts,
  language,
  onLanguageChange,
  isDark,
  onThemeToggle,
  onOpenVoice,
  onResetData,
  onClearData,
  onLoadSampleData,
  userRole = 'retail',
  onToggleRole,
  onToggleSidebar,
  onNavigate,
  onMarkAlertRead,
  onDismissAlert,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const unreadAlerts = alerts.filter((a) => !a.read);

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all dark:border-slate-800/80 dark:bg-[#070b14]/80 shadow-sm dark:shadow-2xl dark:shadow-blue-950/20"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Store Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              id="navbar-mobile-menu-btn"
              onClick={onToggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div
            id="brand-logo-card"
            onClick={() => onNavigate('dashboard')}
            className="group flex cursor-pointer items-center gap-2.5 rounded-xl p-1 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  URIMAIYALAR OS
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {language === 'ta' && profile.businessNameTa ? profile.businessNameTa : profile.businessName} {profile.district ? `• ${profile.district.split(' ')[0]}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">

          {/* Prominent Multilingual Voice AI button */}
          <button
            id="voice-mic-trigger-btn"
            onClick={onOpenVoice}
            className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            title={t('buttons.speakVoice')}
          >
            <Mic className="h-4 w-4 animate-pulse text-white group-hover:scale-110" />
            <span className="hidden sm:inline">
              {t('buttons.speakVoice')}
            </span>
            <span className="flex h-2 w-2 rounded-full bg-cyan-300 animate-ping"></span>
          </button>

          {/* Language Selector (Quick + 22 Indian Languages Modal) */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/60 p-0.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
            <button
              id="lang-ta-btn"
              onClick={() => onLanguageChange('ta')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                language === 'ta'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              தமிழ்
            </button>
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              EN
            </button>
            <button
              id="lang-all-btn"
              onClick={() => setIsLangModalOpen(true)}
              title="22 Constitutional Indian Languages"
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                language !== 'ta' && language !== 'en'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-cyan-500" />
              <span>
                {language !== 'ta' && language !== 'en'
                  ? getLanguageInfo(language).nativeName
                  : '22 Languages'}
              </span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onThemeToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              id="notifications-bell-btn"
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {showAlertsDropdown && (
              <div
                id="alerts-dropdown-menu"
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96"
              >
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('dashboard.alertsTitle')}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {unreadAlerts.length}
                  </span>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500">
                      {t('dashboard.noAlerts')}
                    </p>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={`group relative rounded-xl border p-2.5 transition ${
                          alert.read
                            ? 'border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/50'
                            : 'border-amber-200 bg-amber-50/70 dark:border-amber-900/30 dark:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {language === 'ta' && alert.titleTa ? alert.titleTa : alert.title}
                          </p>
                          <button
                            onClick={() => onDismissAlert(alert.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          {language === 'ta' && alert.messageTa ? alert.messageTa : alert.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          {alert.actionRoute && (
                            <button
                              onClick={() => {
                                onNavigate(alert.actionRoute!.replace('/', ''));
                                setShowAlertsDropdown(false);
                              }}
                              className="text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              {alert.actionLabel || t('buttons.view')} →
                            </button>
                          )}
                          {!alert.read && (
                            <button
                              onClick={() => onMarkAlertRead(alert.id)}
                              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-600"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {t('common.confirm')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Load Demo Sample Data Button */}
          {onLoadSampleData && (
            <button
              id="load-demo-sample-data-btn"
              onClick={onLoadSampleData}
              title="Load Demo Sample Data"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <DownloadCloud className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Demo Data</span>
            </button>
          )}

          {/* Clear All Test Data Button */}
          {onClearData && (
            <button
              id="clear-all-test-data-btn"
              onClick={onClearData}
              title={t('settings.clearDemoDataBtn')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 active:scale-95 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {/* Reset Demo Data Button */}
          <button
            id="reset-demo-data-btn"
            onClick={onResetData}
            title={t('buttons.refresh')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 active:rotate-180 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              id="logout-btn"
              onClick={onLogout}
              title={t('buttons.logout')}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-95 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t('buttons.logout')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 22 Indian Languages Selection Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        currentLanguage={language}
        onSelect={onLanguageChange}
        onClose={() => setIsLangModalOpen(false)}
      />
    </header>
  );
};

export const Navbar = React.memo(NavbarComponent);
