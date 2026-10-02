# Asset provenance

This directory contains the first machine-checkable asset provenance slice for Recording Studio Tycoon.

`assets/provenance.json` currently covers:
- `public/assets/kenney-ui/PNG/**`
- `public/audio/ui-sfx/kenney/**`

Run:

```bash
pnpm assets:verify
```

The verifier checks that every manifest entry points to a real file, uses a recognised non-empty license value, and that every file under the tracked third-party directories has a manifest entry. It is an integrity check, not legal advice.

This is intentionally a partial audit. Other existing audio/art directories remain outside this first slice until their provenance is reviewed explicitly.

The living-studio gear shelf already uses the current `src/data/equipmentArt.ts` / shelf-layout pipeline with procedural fallbacks when sprite art is missing. PR #91 proposed an additional `studioAssets.ts` layer, but current `main` has since evolved a stronger asset path, so that obsolete duplicate layer is intentionally not carried forward.

The Kenney audio entries preserve the repository's existing attribution. The exact source-page link for those audio files should be re-verified if the provenance scope is later promoted from an internal integrity manifest to a formal release audit.
