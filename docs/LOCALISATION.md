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

## Content overlay (authored game text)
`src/i18n/content.ts`: `tc(id, english, vars)` returns the translation from `public/locales/<lng>/content.json`, else the in-source English. Dependency-free, so pure game modules use it; React views call `useContentLocale()` to re-render when a dictionary loads. Currently covers city taglines, scenes, lore, landmarks, era text and the city picker lines (`cityText`, `describeCity`). New authored text should add ids here instead of new `common.json` keys.

## Coverage
Translated: splash, header, drawer, settings, staff/studio/recruitment modals, project card, and the active-session dock (empty state, intervention, stage chips, focus channels, Arm Take button, duties).
Also translated: the phone session console (focus mixer, auto-align, overdrive) and city lore. Checked at 390px in de, ru, fr, ja, pt-BR: no horizontal overflow.
Still hard-coded English (follow-ups): event director text, minigames, stage focus channel labels, toasts, season/ledger explanations, gear names, many `$` literals that bypass `money()`.
