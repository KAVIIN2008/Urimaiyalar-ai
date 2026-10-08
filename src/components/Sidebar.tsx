import React from 'react';
import {
  LayoutDashboard,
  Bot,
  ShoppingCart,
  PackagePlus,
  Boxes,
  Users,
  Truck,
  CreditCard,
  Receipt,
  FileBarChart,
  Landmark,
  TrendingUp,
  Brain,
  Settings,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  language: LanguageCode;
  healthScore: number;
  isOpen?: boolean;
  onClose?: () => void;
  onClearTestData?: () => void;
  onToggleSidebar?: () => void;
  userRole?: 'wholesale' | 'retail' | 'customer';
}

const SidebarComponent: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  language,
  healthScore,
  isOpen = false,
  onClose,
  onClearTestData,
  onToggleSidebar,
  userRole = 'retail',
}) => {
  const { t, isRTL } = useTranslation();

  const getNavLabel = (id: string, fallbackEn: string, fallbackTa?: string) => {
    switch (id) {
      case 'dashboard':
        return t('navigation.dashboard');
      case 'assistant':
        return t('navigation.assistant');
      case 'sales':
        return t('navigation.sales');
      case 'purchases':
        return t('navigation.purchases');
      case 'inventory':
        return t('navigation.inventory');
      case 'customers':
        return t('navigation.customers');
      case 'suppliers':
        return t('navigation.suppliers');
      case 'credit':
        return t('navigation.credit');
      case 'expenses':
        return t('navigation.expenses');
      case 'memory':
        return t('navigation.memory');
      case 'reports':
        return t('navigation.reports');
      case 'schemes':
        return t('navigation.schemes');
      case 'market':
        return t('navigation.market');
      case 'settings':
        return t('navigation.settings');
      case 'retailer_network':
        return t('navigation.customers');
      case 'find_wholesale':
        return t('navigation.findWholesale');
      default:
        return fallbackEn;
    }
  };

  let navItems = [
    {
      id: 'dashboard',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'assistant',
      labelEn: 'AI Assistant',
      icon: Bot,
      badge: 'LLM',
    },
    {
      id: 'sales',
      labelEn: 'Sales',
      icon: ShoppingCart,
    },
    {
      id: 'purchases',
      labelEn: 'Purchases',
      icon: PackagePlus,
    },
    {
      id: 'inventory',
      labelEn: 'Inventory',
      icon: Boxes,
    },
    {
      id: 'customers',
      labelEn: 'Customers',
      icon: Users,
    },
    {
      id: 'suppliers',
      labelEn: 'Suppliers',
      icon: Truck,
    },
    {
      id: 'credit',
      labelEn: 'Credit Ledger',
      icon: CreditCard,
    },
    {
      id: 'expenses',
      labelEn: 'Expenses',
      icon: Receipt,
    },
    {
      id: 'memory',
      labelEn: 'Business Memory',
      icon: Brain,
      badge: 'Core',
    },
    {
      id: 'reports',
      labelEn: 'Reports & P&L',
      icon: FileBarChart,
    },
    {
      id: 'schemes',
      labelEn: 'Govt Schemes',
      icon: Landmark,
    },
    {
      id: 'market',
      labelEn: 'Market Intel',
      icon: TrendingUp,
    },
    {
      id: 'settings',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  // Personalize Dashboard items based on Ecosystem Role
  if (userRole === 'wholesale') {
    navItems = navItems.filter((item) => !['schemes'].includes(item.id));
    // Add wholesale specific
    navItems.splice(5, 0, {
      id: 'retailer_network',
      labelEn: 'Retailer Network',
      icon: Users,
      badge: 'B2B',
    });
  } else if (userRole === 'retail') {
    // Add retail specific
    navItems.splice(8, 0, {
      id: 'find_wholesale',
      labelEn: 'Find Wholesale',
      icon: Truck,
      badge: 'New',
    });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="desktop-main-sidebar"
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`hidden fixed top-16 left-0 h-[calc(100vh-4rem)] shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur-md transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/70 lg:block overflow-y-auto z-20 ${
          isOpen ? 'w-64 pt-2.5 px-3 pb-4' : 'w-16 pt-2 px-2 pb-3 flex flex-col items-center'
        }`}
      >
        <div className="flex min-h-full flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`mb-1.5 px-2.5 py-0.5 shrink-0 ${!isOpen && 'flex justify-center px-0'}`}>
              {isOpen ? (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t('navigation.mainNav')}
                </span>
              ) : (
                <div className="h-1 w-6 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
            </div>

            <nav
              className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2 ${
                isOpen ? 'space-y-1' : 'flex flex-col justify-between space-y-2'
              }`}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;
                const label = getNavLabel(item.id, item.labelEn);
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`group relative flex items-center transition-all duration-200 ${
                      isOpen
                        ? 'w-full justify-between rounded-xl px-3 py-2 text-xs font-semibold'
                        : 'w-10 h-10 justify-center rounded-2xl mx-auto'
                    } ${
                      active
                        ? isOpen
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                    }`}
                    title={!isOpen ? label : undefined}
                  >
                    {!isOpen && active && (
                      <div className="absolute left-0 top-1/2 h-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500" />
                    )}
                    <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'justify-center'}`}>
                      <Icon
                        className={`transition-colors ${isOpen ? 'h-4 w-4' : 'h-5 w-5'} ${
                          active
                            ? isOpen
                              ? 'text-white'
                              : 'text-blue-700 dark:text-blue-300'
                            : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      />
                      {isOpen && <span className="font-semibold text-xs tracking-tight">{label}</span>}
                    </div>

                    {isOpen && item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wide ${
                          active
                            ? 'bg-white/25 text-white'
                            : 'border border-blue-500/20 bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 shrink-0 border-t border-slate-100/80 pt-4 dark:border-slate-800/80 space-y-4">
            {/* Business Health Card at Bottom */}
            <div
              id="sidebar-health-status-card"
              onClick={() => onNavigate('dashboard')}
              className={`cursor-pointer transition-all ${
                isOpen
                  ? 'rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/80 p-3 shadow-sm hover:border-blue-300 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/80 dark:hover:border-blue-700/50'
                  : 'flex h-10 w-10 mx-auto items-center justify-center rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/60'
              }`}
              title={!isOpen ? `${t('dashboard.kpiHealthScore')}: ${healthScore}/100` : undefined}
            >
              {isOpen ? (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                      {t('dashboard.kpiHealthScore')}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{healthScore}/100</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${healthScore}%` }}
                    ></div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {healthScore >= 75
                      ? t('dashboard.healthStatus')
                      : t('dashboard.storeInitialized')}
                  </p>
                </>
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>

            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className={`mt-4 mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 ${
                  isOpen ? (isRTL ? '' : 'rotate-180') : isRTL ? 'rotate-180' : ''
                }`}
                title={t('navigation.mainNav')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer for Tablets & Phones */}
      {isOpen && (
        <div
          id="mobile-sidebar-drawer-backdrop"
          dir={isRTL ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm lg:hidden"
        >
          <div
            id="mobile-sidebar-drawer-card"
            className="flex h-full w-72 max-w-[85vw] flex-col justify-between border-r border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('navigation.mainNav')}
                </span>
                <button
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  const label = getNavLabel(item.id, item.labelEn);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose?.();
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                          }`}
                        />
                        <span>{label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions in Drawer */}
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800 space-y-2">
              {onClearTestData && (
                <button
                  onClick={() => {
                    onClearTestData();
                    onClose?.();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>{t('buttons.delete')}</span>
                </button>
              )}

              <div
                onClick={() => {
                  onNavigate('dashboard');
                  onClose?.();
                }}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>{t('dashboard.kpiHealthScore')}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{healthScore}/100</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={onClose}></div>
        </div>
      )}

      <nav
        id="mobile-bottom-nav-bar"
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
      >
        {[
          { id: 'dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
          { id: userRole === 'wholesale' ? 'retailer_network' : 'customers', label: t('navigation.customers'), icon: Users },
          { id: 'sales', label: t('navigation.sales'), icon: ShoppingCart },
          { id: 'assistant', label: t('navigation.assistant'), icon: Bot, isVoice: true },
          { id: 'inventory', label: t('navigation.inventory'), icon: Boxes },
          { id: 'credit', label: t('navigation.credit'), icon: CreditCard },
          { id: 'menu_drawer', label: t('common.details'), icon: Menu, isMenu: true },
        ].map((btn) => {
          const Icon = btn.icon;
          const active = currentView === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.isMenu) {
                  if (isOpen) onClose?.();
                  else onNavigate('open_sidebar_drawer');
                } else {
                  onNavigate(btn.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[10px] font-semibold transition ${
                btn.isVoice
                  ? 'scale-110 text-emerald-600 dark:text-emerald-400'
                  : active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <div
                className={`${
                  btn.isVoice
                    ? 'flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="truncate max-w-[55px] text-center">{btn.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);
