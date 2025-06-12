import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Load translations using http (e.g., from public/locales)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next
  .init({
    supportedLngs: ['en', 'pl'], // Supported languages
    fallbackLng: 'en', // Fallback language if detected language is not supported
    debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['cookie', 'localStorage'], // Where to cache detected language
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to translation files
    },
    ns: ['common'], // Explicitly define namespaces to load
    defaultNS: 'common', // Set default namespace to 'common'
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    react: {
      useSuspense: true, // Recommended for better UX with async loading of translations
    }
  });

export default i18n;
