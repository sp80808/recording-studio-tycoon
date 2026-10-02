/**
 * Locale-aware number/date/percent formatting, kept free of i18next so pure game modules
 * (economy, cities) and node checks can import it. `src/i18n.ts` pushes the active language in.
 * Money keeps its city symbol (see `formatMoney`); only digit grouping and dates follow the locale.
 */
import { DEFAULT_LOCALE, resolveSupportedLocale, type SupportedLocaleCode } from './supportedLocales';

let active: SupportedLocaleCode = DEFAULT_LOCALE;

export const setFormatLocale = (code: unknown): SupportedLocaleCode => {
  active = resolveSupportedLocale(code);
  return active;
};

export const getFormatLocale = (): SupportedLocaleCode => active;

/** BCP-47 tag for Intl. 'en' is pinned to en-US so grouping stays "1,240" regardless of the browser. */
const intlTag = (code: SupportedLocaleCode): string => (code === 'en' ? 'en-US' : code);

const safe = <T,>(run: (tag: string) => T, fallback: () => T): T => {
  try {
    return run(intlTag(active));
  } catch {
    return fallback();
  }
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
  safe(
    (tag) => new Intl.NumberFormat(tag, options).format(value),
    () => String(value),
  );

/** `ratio` of 0.12 → "12%" (locale decides spacing, e.g. "12 %" in French/German). */
export const formatPercent = (ratio: number, fractionDigits = 0): string =>
  formatNumber(ratio, { style: 'percent', maximumFractionDigits: fractionDigits });

export const formatDate = (value: Date | number, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string =>
  safe(
    (tag) => new Intl.DateTimeFormat(tag, options).format(value),
    () => new Date(value).toISOString().slice(0, 10),
  );
