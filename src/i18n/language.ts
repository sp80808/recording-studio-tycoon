/** Simple get/set language API for Settings and any other caller. Persists via i18next's detector cache. */
import i18n from '../i18n';
import { SUPPORTED_LOCALES, resolveSupportedLocale, type SupportedLocaleCode } from './supportedLocales';

export const getLanguage = (): SupportedLocaleCode => resolveSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

/** Accepts any raw code (e.g. "pt", "es-MX"); unknown codes fall back to English. Returns the locale applied. */
export const setLanguage = async (code: string): Promise<SupportedLocaleCode> => {
  const next = resolveSupportedLocale(code);
  await i18n.changeLanguage(next);
  return next;
};

export const listLanguages = () => SUPPORTED_LOCALES;
