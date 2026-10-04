# Asset provenance

This directory contains the first machine-checkable asset provenance slice for Recording Studio Tycoon.

`assets/provenance.json` covers:
- Third-party CC0 files, one `assets[]` entry each: `public/assets/kenney-ui/PNG/**` and `public/audio/ui-sfx/kenney/**`.
- In-house work, one `originalTrees[]` entry per directory: props, studio (Blender renders), rewards, icons, studio-kit and atlases under `public/assets/`.
- Three loose in-house files under `public/assets/` as individual entries.

Anything new under `public/assets/` fails `pnpm assets:verify` until it is declared.

Run:

```bash
pnpm assets:verify
```

The verifier checks that every manifest entry points to a real file, uses a recognised non-empty license value, and that every file under the tracked third-party directories has a manifest entry. It is an integrity check, not legal advice.

### Adding an asset (the process)

1. Third-party file: copy the pack's licence next to it, add an `assets[]` entry with the exact source page, author, licence and modifications. Only CC0, MIT, Apache-2.0 or original are accepted. Do not assume a site is free; verify the individual asset.
2. In-house file in an existing tree: nothing to add to the manifest. Add a line to the matching section of `docs/ART_SOURCING_LOG.md`.
3. In-house file in a new directory: add an `originalTrees[]` entry whose `sourceLog` points at the log section, and write that section.
4. Run `pnpm assets:verify` (it also runs in `pnpm test`).

Still outside the audit: `public/audio/**` other than the Kenney UI sounds (music, drums, chart clips, `ui sfx`), `public/icons`, `public/brand` and `public/lib`. Widening to those is the next slice.

The living-studio gear shelf already uses the current `src/data/equipmentArt.ts` / shelf-layout pipeline with procedural fallbacks when sprite art is missing. PR #91 proposed an additional `studioAssets.ts` layer, but current `main` has since evolved a stronger asset path, so that obsolete duplicate layer is intentionally not carried forward.

The Kenney audio entries preserve the repository's existing attribution. The exact source-page link for those audio files should be re-verified if the provenance scope is later promoted from an internal integrity manifest to a formal release audit.
