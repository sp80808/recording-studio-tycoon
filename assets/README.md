# Asset provenance — first slice (GitHub issue #58)

This directory holds `provenance.json`, a manifest of every third-party
(CC0) asset actually **committed** to this repo, plus `pnpm assets:verify`
(`scripts/verify-assets.mjs`) — a mechanical check, not a legal opinion —
that keeps it honest.

## What's tracked in this pass

`provenance.json` covers exactly two directories, which `assets:verify`
treats as its source of truth (any file added there without a manifest
entry fails the check):

- `public/assets/kenney-ui/PNG/**` — Kenney UI Pack 2.0 (11 PNGs). License
  is verified in-repo: `public/assets/kenney-ui/License.txt` is the pack's
  own CC0 1.0 Universal declaration, committed alongside the files.
- `public/audio/ui-sfx/kenney/**` — 8 Kenney click/switch WAV files
  (`click1‑5.wav`, `switch1‑3.wav`) already wired into
  `src/utils/audioSystem.ts` as tactile UI cues.

These are the only directories audited today. **This is a partial slice of
#58, not a full asset-licensing audit of the repository.** In particular,
`assets:verify` does **not** check (and this pass did not re-license):

- `public/audio/chart_clips/**`, `public/audio/music/**`, the rest of
  `public/audio/ui-sfx/**` (non-Kenney files), `public/audio/drums/**` —
  pre-existing content from before this pass, tracked separately (or not
  yet tracked) — see `docs/ART_SOURCING_LOG.md` for what's already
  documented there.
- `src/data/equipmentArt.ts` sprite **targets** under
  `public/assets/items/*.png` — these files are not committed yet (the
  loader falls back to an emoji + tint when they're absent, by design). A
  planned-but-uncommitted asset has nothing to verify; add it to
  `provenance.json` and drop the PNG in the same change once real files
  land.

Widening `TRACKED_DIRS` in `scripts/verify-assets.mjs` to cover more of the
above is the natural next slice of #58, tracked as a follow-up rather than
attempted here.

## Why no new assets were added this pass

This pass ran with **no outbound network access** to kenney.nl,
opengameart.org, or itch.io (verified against the sandboxed environment's
proxy — CONNECT attempts to both hosts were rejected). Per the standing
instruction for this kind of work: *if internet access is unavailable, do
not fabricate source assets or licenses — build the manifest/atlas
architecture and use only already-present licensed material.*

So this slice:

- formalizes the provenance manifest architecture issue #58 asks for,
- backs it with the CC0 assets that were **already sitting in the repo**
  (the Kenney UI pack and the Kenney click/switch WAVs above — both already
  informally attributed in code comments; this manifest makes that
  attribution explicit and machine-checkable),
- adds a small sprite/texture *dressing layer*
  (`src/components/studio/studioAssets.ts`) that the living studio can use
  once real art lands, with a guaranteed procedural fallback in the
  meantime (see below),
- does **not** claim any new external pack was reviewed or imported.

The `kenney-ui-audio-*` entries in `provenance.json` carry a `notes` field
flagging that their exact Kenney source page was **not re-verified this
pass** — the attribution already existed in `audioSystem.ts` before this
work started, but network access to confirm the precise pack URL against
kenney.nl/support's blanket CC0 policy was unavailable. Re-verify that link
before treating it as authoritative in a future pass with network access.

## Manifest schema

Each entry in `provenance.json`'s `assets` array:

```ts
interface AssetProvenanceEntry {
  id: string;              // unique, stable id
  localPath: string;       // path from repo root
  sourcePack: string;      // pack / collection name
  sourcePage: string;      // URL to the source page
  author: string;          // author / provider
  license: 'CC0-1.0' | 'CC0' | 'MIT' | 'Apache-2.0' | 'original';
  modifications: string;   // "none" or a description of what changed
  intendedUse: 'ui' | 'sfx' | 'scene' | 'placeholder';
  notes?: string;          // caveats, verification status, etc.
}
```

This is a superset of the `AssetProvenance` shape proposed in issue #58
(`sourceName`/`purpose` there map to `sourcePack`/`intendedUse` here) —
kept close enough that migrating either direction is a rename, not a
redesign.

## Running the check

```bash
pnpm assets:verify
```

Fails when:

- a manifest entry's `localPath` doesn't exist on disk,
- a manifest entry has an empty or unrecognised `license`,
- a file inside a tracked directory has no manifest entry at all.

It does **not** perform legal analysis — a passing run means the manifest
is internally consistent and the claims it makes are non-empty, not that
those claims have been independently verified by a lawyer.

## The sprite/texture dressing layer

`src/components/studio/studioAssets.ts` is the small, reusable asset layer
issue #58 (§B "activate the existing asset pipeline") asks for:

```
authoritative GameState
  -> StudioSceneState (presentation model, StudioRoom.tsx)
  -> procedural Pixi room (WebGLCanvas.tsx, buildScene())
  -> optional sprite/texture dressing layer (studioAssets.ts)
```

`WebGLCanvas`'s gear shelf is wired to it today: each owned-equipment id is
looked up against `src/data/equipmentArt.ts`, and if a sprite path resolves
*and* the file actually loads, that shelf slot swaps from a procedural
Graphics bar to the sprite. Since no files exist yet under
`public/assets/items/`, every lookup resolves to the fallback today — which
is the point: simulation state never depends on an asset being present, and
dropping a real PNG in later lights up that slot with no code changes.
