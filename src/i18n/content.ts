/**
 * Content translation overlay for authored game text (city lore, events, ...).
 * English stays in the source as the fallback; `public/locales/<lng>/content.json` maps stable ids
 * to translations. Dependency-free so pure game modules and node checks can use `tc`.
 * Missing file / missing id => the English passed in. Components call `useContentLocale()` to re-render on load.
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, resolveSupportedLocale, type SupportedLocaleCode } from './supportedLocales';

type Dict = Readonly<Record<string, string>>;

/** Dictionaries per locale; each is merged into one lookup. Add a file here to add a content domain. */
export const CONTENT_FILES = ['content', 'events', 'minigames', 'crew'] as const;

const cache = new Map<SupportedLocaleCode, Dict>();
const pending = new Set<SupportedLocaleCode>();
const listeners = new Set<() => void>();
let active: SupportedLocaleCode = DEFAULT_LOCALE;
let version = 0;

const bump = () => {
  version += 1;
  listeners.forEach((l) => l());
};

/** Switch the content language; fetches its dictionary once (browser only). English needs no file. */
export const setContentLocale = (code: unknown): SupportedLocaleCode => {
  active = resolveSupportedLocale(code);
  if (active !== DEFAULT_LOCALE && !cache.has(active) && !pending.has(active) && typeof fetch === 'function' && typeof window !== 'undefined') {
    const lng = active;
    pending.add(lng);
    Promise.all(
      CONTENT_FILES.map((f) =>
        fetch(`/locales/${lng}/${f}.json`)
          .then((r) => (r.ok ? (r.json() as Promise<Dict>) : {}))
          .catch(() => ({}) as Dict),
      ),
    )
      .then((parts) => cache.set(lng, Object.assign({}, ...parts)))
      .finally(() => {
        pending.delete(lng);
        bump();
      });
  }
  bump();
  return active;
};

/** Test/SSR hook: register a dictionary directly. */
export const registerContent = (code: SupportedLocaleCode, dict: Dict): void => {
  cache.set(code, dict);
  bump();
};

const interpolate = (text: string, vars?: Record<string, string | number>): string =>
  vars ? text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;

/** Translate authored content: `id` is the stable key, `english` the in-source fallback. */
export const tc = (id: string, english: string, vars?: Record<string, string | number>): string =>
  interpolate(cache.get(active)?.[id] ?? english, vars);

/** Like `tc` but returns undefined when there is no translation (for dynamic text built elsewhere). */
export const tcOpt = (id: string, vars?: Record<string, string | number>): string | undefined => {
  const hit = cache.get(active)?.[id];
  return hit === undefined ? undefined : interpolate(hit, vars);
};

export const useContentLocale = (): number =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version,
  );
