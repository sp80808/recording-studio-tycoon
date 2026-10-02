# Localisation

**Locales (12):** en, en-GB, pl, es, fr, de, it, pt-BR, ru, ja, ko, zh-CN. Files: `public/locales/<code>/common.json`.
Missing keys fall back to English (`fallbackLng`). The `i18n-locales` check enforces key parity and matching `{{placeholders}}`.

## API
- `src/i18n/language.ts`: `getLanguage()`, `setLanguage(code)`, `listLanguages()`. Unknown codes resolve to `en`.
- `src/i18n/formatLocale.ts`: `formatNumber`, `formatPercent`, `formatDate`, `getFormatLocale`. Kept free of i18next so pure game modules can use it; `src/i18n.ts` keeps it in sync on `languageChanged`.
- `formatMoney` (home-city currency) keeps its city symbol and dollar conversion; only digit grouping follows the locale (de: `$1.240`).

## Translation provenance
All non-English strings are **machine-written (Claude) and unreviewed by native speakers**. en-GB differs from en by spelling only.
Native-speaker review wanted, especially for ja, ko, zh-CN, ru, pl. Keys added in the 2026-10-02 slice (`active_*`) are in the same state.

## Coverage
Translated: splash, header, drawer, settings, staff/studio/recruitment modals, project card, and the active-session dock (empty state, intervention, stage chips).
Still hard-coded English (follow-ups): event director text, minigames, city lore/describeCity, season/ledger explanations, gear names, many `$` literals that bypass `money()`.
