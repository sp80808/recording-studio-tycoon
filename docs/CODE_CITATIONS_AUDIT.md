# Legacy Code Citations Audit (issue #254)

Engineering provenance audit only; this is not legal advice. Anything uncertain
is flagged under "Open questions".

## Scope

Two auto-generated assistant citation logs under `docs/old/`:

- `docs/old/Code Citations.md` (219 entries)
- `docs/old/# Code Citations.md` (174 entries)

Most entries are repeated, progressively longer prefixes of the same few
snippets. Distinct upstream sources:

| Licence tag | Upstream file | Snippet | Entries |
|---|---|---|---|
| MIT | chibisafe/chibisafe `packages/frontend/tailwind.config.cjs` | Tailwind `accordion-down/up` keyframes + animation | 64 |
| unknown | thrilliams/aethre `tailwind.config.ts` | same accordion keyframes | 67 |
| unknown | mckennach/supabase-boilerplate `tailwind.config.ts` | same accordion keyframes | 53 |
| MIT | avitorio/outstatic `examples/advanced-blog/tailwind.config.js` | same accordion keyframes | 35 |
| unknown | galenjiang/blog `components/ui/slider.tsx` | shadcn-style Radix slider Track/Range/Thumb classes | 68 |
| unknown | Tyler-Lundin/ZenLog `components/ui/slider.tsx` | same slider markup | 53 |
| MIT | nilsbenz/ethz-order-app `packages/ui/src/components/slider.tsx` | same slider markup | 53 |

## Findings

Every cited snippet is a copy of the stock **shadcn/ui** scaffolding
(`tailwind.config` accordion keyframes and `ui/slider.tsx`), reproduced in many
unrelated repositories. The "unknown" tag reflects that those particular
forks carry no detectable licence file; the original shadcn/ui code is MIT.
The logs do not show RST copying anything specific from the "unknown" repos
rather than from the common template.

| Snippet | Current location | Status |
|---|---|---|
| Accordion keyframes/animation | `tailwind.config.ts` | Was present verbatim. Rewritten independently in this PR (shared `collapseFrames` helper and named constants; identical resulting CSS values, 200ms ease-out). |
| Slider | `src/components/ui/slider.tsx` | Already heavily customised (different track/thumb styling, py-2, transitions). Rewritten independently in this PR with style constants; identical class output. |
| Tailwind config accordion consumer | `src/components/ui/accordion.tsx` | Uses the `animate-accordion-*` names only; names are mandated by Radix/Tailwind integration, not expressive code. |

No other snippet in either log maps to current source.

## Remaining notices

- `shadcn-ui` scaffolding in `src/components/ui/*` is derived from the
  MIT-licensed shadcn/ui project. The MIT notice should be kept; see
  `THIRD_PARTY_NOTICES.md`.
- Radix UI primitives are MIT dependencies via `package.json`.

## Open questions

- Other files in `src/components/ui/` were not cited in these logs but are
  likely stock shadcn/ui output; they are covered by the MIT notice above, not
  individually audited here.
- Whether short, functional, near-universal boilerplate (Radix-mandated CSS
  variable names, class lists) is copyrightable at all is a legal question
  outside this audit; the rewrite is a conservative measure.
- The legacy logs themselves are kept for history. They should not be published
  externally with source snapshots without removing or caveating them.
