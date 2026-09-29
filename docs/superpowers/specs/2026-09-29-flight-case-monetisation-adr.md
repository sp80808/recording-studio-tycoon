# ADR: Flight Case Monetisation (Earned vs Premium-Curated)

Date: 2026-09-29. Bead epic: `recording-studio-tycoon-89o`.
Status: accepted for v1 (mock provider, feature-flagged, no real billing).

## Decision

Ship a two-path Flight Case economy reusing the central catalogue
(`src/data/flightCases.ts` — no second loot model):

- **A. Earned cases** (chore streaks, S-grades, yard sales, dealers/events,
  future awards) keep randomised gear tables. Untouched by this ADR.
- **B. Premium curated cases** are real-money products with
  disclosed/previewable contents. No paid random loot in v1.

## Constraints (product thesis)

- Monetise collection, ownership, studio identity, self-expression,
  nostalgia, fantasy, reveal presentation, customer choice, engagement
  (Hussain et al. 2024/25; Mkedder et al. 2024; Zhao et al. 2022;
  Wang et al. 2022; Böffel et al. 2022; Kordyaka & Hribersek 2019;
  Musabirov et al. 2017; Gumussoy 2016; Rietveld 2018).
- **Hard product rule — storyline is free:** never monetise or soft-gate
  story path, narrative progress, campaign acts, branch choices, finales,
  or CareerHub story unlocks. Purchases are optional cosmetics / rare or
  skinned gear / Flight Case vanity only. Experiments A–E are dealer
  presentation levers and must not paywall narrative.
- Never: frustrate free progression on purpose, degrade earned cases,
  mandatory purchases, obscured prices, energy refills, artificial
  inconvenience, pay-to-win, premium currency in v1.
- Collector-equipment variants are cosmetic only and stat-equivalent to
  their base item (Böffel: identification without performance gain).
- Prices are direct and localised, supplied by the payment provider at
  runtime; no hard-coded display currencies in gameplay components.
- Valve/Steam principle applies: sell things players want in their studio,
  never charge to remove frustration.

## Architecture

`src/monetization/` is a separate domain (beads 89o.2–89o.4):

- `types.ts` — `StoreProduct`, `EntitlementGrant`, `PurchaseReceipt`,
  `PurchaseProvider` interface. No prices here.
- `catalog.ts` — v1 SKUs (all previewable; SKUs unique; catalogue
  validates at import).
- `PurchaseProvider.ts` / `MockPurchaseProvider.ts` — provider contract +
  mock with localised mock prices, pending/success/cancel/fail,
  duplicate-callback and offline modes. No billing secrets client-side.
- `entitlements.ts` — purchased-ownership ledger, independent of
  `GameState` saves: save reset/import cannot mint or destroy purchases.
- `fulfillment.ts` — idempotent `transactionId + entitlementId` granting;
  pending/success/cancel/restore/duplicate/reload/refund/offline-cache.
- `telemetry.ts` (bead 89o.7), store UI (89o.5), reveal integration (89o.6)
  follow after this contract.

## Trust model (v1)

- The provider receipt is the authority, not `localStorage`.
- `localStorage` holds an offline/read-only ownership cache only.
- Mock receipts are structurally valid but provider-tagged `mock`; the
  Steam adapter (89o.10) replaces verification with backend MicroTxn
  finalisation without changing the domain contract.
- Refund/reversal revokes entitlements gracefully (decor unequips to
  default; no save corruption).

## Isolation

- Everything ships behind `monetisation-dealer` / `premium-cases` flags
  (default off) in the existing `featureFlagStore`.
- `CrateUnboxingModal` becomes a presentation/decision surface receiving a
  resolved model; it never generates paid rewards (bead 89o.6).
- No changes to `ActiveProject`/session panel (GH-65, bead `typ`, P0 open).
- Earned-case tests must stay green with monetisation on or off.
