import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import { DEFAULT_LOCALE, SUPPORTED_LOCALE_CODES } from './i18n/supportedLocales';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [...SUPPORTED_LOCALE_CODES],
    fallbackLng: DEFAULT_LOCALE,
    // Prefer exact regional codes (en-GB) over truncating to en when both exist
    nonExplicitSupportedLngs: false,
    load: 'currentOnly',
    debug: process.env.NODE_ENV === 'development',
    detection: {
      order: ['localStorage', 'cookie', 'querystring', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
