/** First-class locales exposed in Settings and validated by locale parity tests. */
export const SUPPORTED_LOCALE_CODES = [
  'en',
  'en-GB',
  'pl',
  'es',
  'fr',
  'de',
  'it',
  'pt-BR',
  'ru',
  'ja',
  'ko',
  'zh-CN',
] as const;

export type SupportedLocaleCode = (typeof SUPPORTED_LOCALE_CODES)[number];

export const SUPPORTED_LOCALES: ReadonlyArray<{
  code: SupportedLocaleCode;
  /** i18n key for the language name in the active locale */
  labelKey: string;
  /** Native / region label shown in the picker (always in that language) */
  nativeLabel: string;
}> = [
  { code: 'en', labelKey: 'language_english_us', nativeLabel: 'English (US)' },
  { code: 'en-GB', labelKey: 'language_english_gb', nativeLabel: 'English (UK)' },
  { code: 'pl', labelKey: 'language_polish', nativeLabel: 'Polski' },
  { code: 'es', labelKey: 'language_spanish', nativeLabel: 'Español' },
  { code: 'fr', labelKey: 'language_french', nativeLabel: 'Français' },
  { code: 'de', labelKey: 'language_german', nativeLabel: 'Deutsch' },
  { code: 'it', labelKey: 'language_italian', nativeLabel: 'Italiano' },
  { code: 'pt-BR', labelKey: 'language_portuguese_br', nativeLabel: 'Português (Brasil)' },
  { code: 'ru', labelKey: 'language_russian', nativeLabel: 'Русский' },
  { code: 'ja', labelKey: 'language_japanese', nativeLabel: '日本語' },
  { code: 'ko', labelKey: 'language_korean', nativeLabel: '한국어' },
  { code: 'zh-CN', labelKey: 'language_chinese_simplified', nativeLabel: '简体中文' },
];

export const DEFAULT_LOCALE: SupportedLocaleCode = 'en';

/** Regional / legacy codes that should resolve to a supported locale. */
const LOCALE_ALIASES: Readonly<Record<string, SupportedLocaleCode>> = {
  'en-us': 'en',
  'en-au': 'en-GB',
  'en-ie': 'en-GB',
  'en-nz': 'en-GB',
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-BR',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
};

export function isSupportedLocale(code: string): code is SupportedLocaleCode {
  return (SUPPORTED_LOCALE_CODES as readonly string[]).includes(code);
}

/** Map any raw language string to a supported locale, falling back to DEFAULT_LOCALE. */
export function resolveSupportedLocale(raw: unknown): SupportedLocaleCode {
  if (typeof raw !== 'string') return DEFAULT_LOCALE;
  if (isSupportedLocale(raw)) return raw;
  const lower = raw.toLowerCase();
  const alias = LOCALE_ALIASES[lower];
  if (alias) return alias;
  const base = lower.split(/[-_]/)[0];
  const baseMatch = SUPPORTED_LOCALE_CODES.find((code) => code.toLowerCase() === base);
  return baseMatch ?? LOCALE_ALIASES[base] ?? DEFAULT_LOCALE;
}
