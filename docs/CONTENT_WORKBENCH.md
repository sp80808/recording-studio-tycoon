# Content Workbench (#64)

A development-only surface for inspecting, validating and previewing authored content, plus a validator that gates the build.

## Use it

```bash
pnpm content:validate          # schemas, ids, cross references, caps. Exit 1 on any error. --strict fails on warnings, --json prints machine output.
pnpm dev   # then open /?contentWorkbench
```

`pnpm content:validate` runs inside `pnpm test` and as part of `pnpm build` (`prebuild`), so invalid content cannot reach a production build. The repository has no GitHub Actions workflow; Vercel runs `pnpm build`, which now includes validation.

The workbench is lazy-loaded behind `import.meta.env.DEV` (same as the Balance Lab), so production bundles contain none of it.

## What it covers (first slice)

| Family | Source of truth | Validated | Previewed |
|---|---|---|---|
| Studio synergies (#45) | `src/data/synergies.ts` | schema, duplicate ids, duplicate conditions, bonus above game cap, bonus using over 60% of cap headroom, penalties, empty conditions, impossible staff combinations, category/condition mismatch | each condition as pass/fail against four fixtures |
| Events (#56) | `src/narrative/*Events.ts` | schema, duplicate ids and narrative keys, option ids, delegable needs a default, default is an option, modal event with no cooldown and no limit, reward beyond `EFFECT_LIMITS`, memory required and blocked, memory never written, missing English strings | eligible or blocked with the first blocking reason, against three fixtures |
| Brief templates (#48) | `src/rpg/projectBrief.ts` | schema, every service has a room and role, approach ids, focus sums to 100, unreachable directions, directions with no approach | directions per genre, service to room path, five sample derived briefs |

The previews are checked against the engine in `tests/content-workbench.check.ts` (192 event/fixture pairs and 80 synergy/fixture pairs agree with `resolveEligibleEvents` and `evaluateProjectSynergies`).

## Authoring flow

The workbench edits an in-memory copy. Edits validate live against the whole registry (so a duplicate id or a bad reference shows up at once). Export with Copy JSON, Download JSON or Download diff (a one-line-per-field structured diff). It never writes source files; a developer applies the change in a normal commit. A local-only save bridge stays a later option, as the issue says.

## Honest limits

- Events carry code (`eligible`, `pickSubject`, `context`). The registry records those as flags and the workbench cannot edit them. Adding a brand-new event still needs a definition in `src/narrative/`; the issue's "add an event without editing a React component" holds (no component is touched), but the event is not yet loaded from JSON.
- Synergy and event data still live in TypeScript, not under `src/content/*.json`. Moving them to JSON files with domain loaders is the next step and is a mechanical change now that the schemas exist.
- Brief "templates" are the generator tables (services, directions, priorities, approaches), because briefs are derived per project rather than authored one by one.
- Gear, services and seasons are not covered yet.

## Decision: Zod and plain React, not RJSF

The issue asks to compare. Option A (Zod schemas plus bespoke editor) was chosen:

- The three schemas already exist as Zod and double as the validator, so the editor reuses them with no second schema format.
- The editor is a JSON text area with live validation and a field diff. That is about 170 lines. RJSF would add a large dev dependency, a JSON Schema duplicate of each Zod schema (or a converter), and its own widget theming, to produce forms we do not need yet.
- Revisit RJSF when a family has deeply nested arrays that authors edit often (events with many options are the likely first case). The Zod schemas would feed a converter, so the validation rules would not move.
