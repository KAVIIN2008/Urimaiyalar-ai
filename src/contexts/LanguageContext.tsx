import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageCode } from '../types';
import { translateKey } from '../i18n/translations';
import { isRtlLanguage, getLanguageInfo } from '../utils/languages';

// URIMAIYALAR OS - Global Centralized Language & Localization Context
// Persists language choice to localStorage, syncs with user profile,
// manages RTL/LTR directionality, and provides instant t(key, params) translation.

const STORAGE_KEY = 'urimaiyalar_language';
const DEFAULT_LANG: LanguageCode = 'en';

export interface LanguageContextType {
  language: LanguageCode;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved) return saved;
    }
    return DEFAULT_LANG;
  });

  const direction: 'ltr' | 'rtl' = isRtlLanguage(language) ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  // Apply HTML attributes to document root
  const syncHtmlAttributes = useCallback((lang: string, dir: 'ltr' | 'rtl') => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      if (dir === 'rtl') {
        document.documentElement.classList.add('rtl-layout');
      } else {
        document.documentElement.classList.remove('rtl-layout');
      }
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    const dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      syncHtmlAttributes(lang, dir);
      
      // If user is authenticated, attempt async background sync of preferred_language
      const token = localStorage.getItem('urimaiyalar_token');
      if (token) {
        fetch('/api/business/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ preferred_language: lang })
        }).catch(() => {
          // Non-blocking background sync
        });
      }
    } catch {
      // Ignore storage errors in private browsing
    }
  }, [syncHtmlAttributes]);

  useEffect(() => {
    syncHtmlAttributes(language, direction);
  }, [language, direction, syncHtmlAttributes]);

  // Translation function wrapper
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    return translateKey(language, key, params);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, direction, isRTL, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = (): LanguageContextType => {
  return useLanguage();
};
