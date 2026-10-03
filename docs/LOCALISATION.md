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
`src/i18n/content.ts`: `tc(id, english, vars)` returns the translation from `public/locales/<lng>/content.json`, else the in-source English. Dependency-free, so pure game modules use it; React views call `useContentLocale()` to re-render when a dictionary loads. `events.json` holds the Studio Event Director text (57 events: kicker, title, context with `{{label}}`, option label/flavour/outcome), applied in `DirectorEventModal`. Regenerate `en/events.json` from `DIRECTOR_EVENTS` when events change; the check fails if an event or option is missing from it. `minigames.json` (all 34 mini-games plus their logic-module feedback, ids `mg.<File>.<slug>`) and `crew.json` (crew board and recruitment channels) are wired inline with `tc('id', 'English', vars)`, so English stays in the source as the fallback; `i18n-locales.check.ts` verifies every literal id exists in the en JSON with the same English text. Currently `content.json` covers city taglines, scenes, lore, landmarks, era text and the city picker lines (`cityText`, `describeCity`). New authored text should add ids here instead of new `common.json` keys.

## Coverage
Translated: splash, header, drawer, settings, staff/studio/recruitment modals, project card, and the active-session dock (empty state, intervention, stage chips, focus channels, Arm Take button, duties).
Also translated: the phone home screen (enquiry rail with plurals, primary action, dock nav, drawer titles) and the shared story decision chips/buttons; the phone session console (focus mixer, auto-align, overdrive) and city lore. Checked at 390px in de, ru, fr, ja, pt-BR: no horizontal overflow.
Plural keys use i18next suffixes (`_one`/`_few`/`_many`/`_other`); the parity check compares plural families, so ja/ko/zh-CN carry only `_other` and ru/pl add `_few`/`_many`.
Still hard-coded English (follow-ups): generated candidate CVs and headlines, floor chore chips (Tune Acoustics...), other story modals (storyline branches, narrative choices), Skills/Recipes tabs, stage focus channel labels, toasts, season/ledger explanations, gear names, many `$` literals that bypass `money()`.
