/** First-class locales exposed in Settings and validated by locale parity tests. */
export const SUPPORTED_LOCALE_CODES = ['en', 'en-GB', 'pl'] as const;

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
];

export const DEFAULT_LOCALE: SupportedLocaleCode = 'en';

export function isSupportedLocale(code: string): code is SupportedLocaleCode {
  return (SUPPORTED_LOCALE_CODES as readonly string[]).includes(code);
}
