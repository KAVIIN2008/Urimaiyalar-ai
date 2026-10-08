import { TranslationSchema } from './types';
import { en } from './locales/en';
import { ta } from './locales/ta';
import { hi } from './locales/hi';
import { te } from './locales/te';
import { kn } from './locales/kn';
import { ml } from './locales/ml';
import { mr } from './locales/mr';
import { bn } from './locales/bn';
import { gu } from './locales/gu';
import { pa } from './locales/pa';
import { ur } from './locales/ur';
import { or } from './locales/or';
import { as } from './locales/as';
import {
  tanglish,
  sa,
  ne,
  kok,
  mai,
  doi,
  ks,
  sd,
  brx,
  sat,
  mni,
} from './locales/otherLocales';

export const TRANSLATION_RESOURCES: Record<string, TranslationSchema> = {
  en,
  ta,
  hi,
  te,
  kn,
  ml,
  mr,
  bn,
  gu,
  pa,
  ur,
  or,
  as,
  tanglish,
  sa,
  ne,
  kok,
  mai,
  doi,
  ks,
  sd,
  brx,
  sat,
  mni,
};

// Internal missing keys registry for developer diagnostics
const missingKeysCache = new Set<string>();

/**
 * Resolves a nested translation key (e.g. 'navigation.dashboard', 'buttons.save')
 * with automatic fallback to English ('en') and parameter interpolation (e.g. {{count}}).
 */
export function translateKey(
  locale: string,
  key: string,
  params?: Record<string, string | number>
): string {
  const normLocale = (locale || 'en').toLowerCase().trim();
  const currentDict = TRANSLATION_RESOURCES[normLocale] || TRANSLATION_RESOURCES.en;
  const englishDict = TRANSLATION_RESOURCES.en;

  const [namespace, itemKey] = key.split('.');

  let result: string | undefined;

  // 1. Try to find key in current locale
  if (namespace && itemKey && (currentDict as any)[namespace]) {
    result = (currentDict as any)[namespace][itemKey];
  }

  // 2. If missing in current locale, fall back to English
  if (!result && (englishDict as any)[namespace]) {
    result = (englishDict as any)[namespace]?.[itemKey];
    if (process.env.NODE_ENV !== 'production' && normLocale !== 'en') {
      const cacheKey = `${normLocale}:${key}`;
      if (!missingKeysCache.has(cacheKey)) {
        missingKeysCache.add(cacheKey);
        // Safe debug notice
        // console.debug(`[MISSING_TRANSLATION] locale=${normLocale} key=${key} -> falling back to English`);
      }
    }
  }

  // 3. Ultimate fallback: humanize the last token of the key
  if (!result) {
    result = itemKey ? itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()) : key;
  }

  // 4. Parameter interpolation: {{key}} -> value
  if (params && typeof result === 'string') {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      result = result!.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramVal));
    });
  }

  return result || key;
}

/**
 * Generates an audit coverage report across all supported locales
 */
export function getTranslationCoverage() {
  const enKeys: string[] = [];

  // Count total keys in base English dictionary
  Object.entries(en).forEach(([ns, obj]) => {
    Object.keys(obj).forEach((k) => {
      enKeys.push(`${ns}.${k}`);
    });
  });

  const totalKeys = enKeys.length;
  const coverageMap: Record<string, { total: number; translated: number; percentage: number }> = {};

  Object.entries(TRANSLATION_RESOURCES).forEach(([loc, dict]) => {
    let translatedCount = 0;
    enKeys.forEach((fullKey) => {
      const [ns, k] = fullKey.split('.');
      const val = (dict as any)?.[ns]?.[k];
      if (val && typeof val === 'string' && val.trim().length > 0) {
        translatedCount++;
      }
    });

    coverageMap[loc] = {
      total: totalKeys,
      translated: translatedCount,
      percentage: Math.round((translatedCount / totalKeys) * 100),
    };
  });

  return { totalKeys, coverageMap };
}
