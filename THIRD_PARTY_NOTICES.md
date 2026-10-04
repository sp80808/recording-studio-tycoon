# Third-Party Notices

Recording Studio Tycoon is proprietary. The root `LICENSE` applies only to
original RST materials owned by the RST copyright holder.

Third-party materials remain under their own licences and are excluded from the
proprietary grant/restrictions to the extent required by those licences.

## Where provenance is recorded

- `assets/provenance.json` — asset-by-asset provenance for tracked external
  material and original-tree declarations.
- `public/assets/**/License.txt` (where present) — upstream asset-pack licence
  text committed alongside the relevant material.
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, and `bun.lockb` —
  JavaScript dependency manifests/lockfiles. Dependencies retain their
  respective upstream licences.
- Source-file headers and documentation may contain additional attribution or
  licence notices.

## Code provenance audit

`docs/CODE_CITATIONS_AUDIT.md` records the audit of the legacy assistant
citation logs in `docs/old/` (issue #254). Conclusion: all cited snippets are
stock shadcn/ui scaffolding (MIT upstream); the two RST files that matched
(`tailwind.config.ts` accordion keyframes, `src/components/ui/slider.tsx`) were
independently rewritten. UI scaffolding in `src/components/ui/` otherwise
derives from MIT-licensed shadcn/ui and Radix UI.

## Important distinction

An upstream CC0, MIT, Apache, or other permissively licensed component may be
reused according to its upstream licence. That does **not** make the RST game,
its original source code, original artwork, game design, narrative, branding,
or compiled product open source.

If a provenance entry conflicts with the root proprietary licence, the
provenance entry controls only for the specifically identified third-party
material. Original RST material should be marked `original` rather than CC0.
