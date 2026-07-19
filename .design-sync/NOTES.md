# design-sync notes for makop

## Repo shape
- `frontend/` is a Vite **application**, not a published component library —
  no `dist/` library entry, no `main`/`module`/`exports` in `package.json`.
  The converter runs in **synth-entry mode**: `srcDir` is pinned to
  `src/components/ui` so the synthesized entry only re-exports the 9 shadcn
  primitives, never `App.tsx`/`main.tsx`/panels (those have real side effects
  — `main.tsx` calls `ReactDOM.createRoot(...).render(...)` at import time,
  which would break the whole bundle if pulled in).
- Feature-level panels (`src/components/panels/`) are intentionally **not**
  synced as library components — they're app-specific compositions, not
  reusable DS primitives. Good source material for authoring previews though.

## node_modules self-reference (recreate on every fresh clone / re-sync)
This repo isn't consumed as an npm package, so `node_modules/makop-frontend`
doesn't exist naturally. The converter's package-shape adapter resolves
`PKG_DIR` as `join(NODE_MODULES, cfg.pkg)` when no `--entry` flag is passed
(and we deliberately don't pass `--entry` — passing it would short-circuit
synth-entry mode to bundle only that one file). Fix: a self-referencing
symlink:
```sh
cd frontend && ln -sfn .. node_modules/makop-frontend
```
This lives inside `node_modules/` (gitignored) — recreate it after every
fresh clone or `npm ci`.

## cssEntry: stable filename, not the Vite hash
Tailwind v4 compiles at Vite build time; `dist/assets/index-<hash>.css`'s
hash changes whenever the compiled CSS changes. `cfg.buildCmd` runs the real
build AND copies the output to a stable `dist/_ds-styles.css`, which is what
`cfg.cssEntry` points at — keeps the config path valid across rebuilds.

## Fonts: Google Fonts, loaded via `<link>` in index.html, not local
The app's three brand fonts (Space Grotesk, Archivo, JetBrains Mono) are
loaded from Google Fonts via a `<link rel="stylesheet">` in
`frontend/index.html` — there's no local `@font-face`/`.woff2` anywhere in
the repo, and the package-shape converter has no storybook-preview-head
scraping to pick this up automatically (that path is storybook-shape only).
Fix: `.design-sync/fonts/google-fonts.css` is a saved copy of the actual
`@font-face` CSS Google serves for the exact font/weight list our
`index.html` requests (fetched 2026-07-19). It's wired via `cfg.extraFonts`
as `"../../../.design-sync/fonts/google-fonts.css"`.

**Why 3 levels of `../`:** all `cfg.*` path fields resolve via
`resolve(PKG_DIR, rel)` where `PKG_DIR` is the *unresolved* symlink path
`frontend/node_modules/makop-frontend` (see the node_modules-symlink note
above) — `path.resolve` pops textual segments, symlink-unaware, so `..`
pops `makop-frontend`, `node_modules`, `frontend` in turn before landing at
the repo root. `workspaceRoot` only widens the post-resolve *containment
bound*, it isn't the resolution base — don't reintroduce a single `../`
here, it lands inside `node_modules/` and silently no-ops
(`! extraFonts: ... not found — skipped`).
The converter's `extractFonts` leaves `https://` `url()` refs as-is (CDN —
by design, see `lib/css.mjs`), so these rules ship pointing at
`fonts.gstatic.com` — same as production, not self-hosted. If the family/
weight list in `index.html`'s Google Fonts URL ever changes, refetch:
```sh
curl -s -A "Mozilla/5.0 ... Chrome/124 ..." "<the index.html font URL>" \
  -o .design-sync/fonts/google-fonts.css
```
(User-Agent matters — Google serves woff/ttf without a modern UA.)

## No provider/theme wrapper needed
Theming is pure CSS custom properties in `:root` (`frontend/src/index.css`)
— no React context/ThemeProvider wraps the app. `cfg.provider` is
intentionally unset.

## Preview cards default to a white canvas — this DS has no light theme
The design-tool's gallery card template hardcodes `body{background:#fff}`
in each emitted `<Name>.html` (an inline `<style>` after the linked
stylesheets, so it wins the cascade for `background` specifically). Our own
`body { @apply bg-background text-foreground }` rule still wins for `color`
(inherited, nothing overrides it), so any authored preview that doesn't set
its own explicit background renders **white text with no dark surface under
it** — invisible. Hit this first on `Button`'s `ghost` variant (no bg at
rest) and then across `Input`/`Label`/`Table` (plain text with no explicit
color). Fix applied: every authored `.tsx` under `.design-sync/previews/`
wraps its composition in `bg-background text-foreground p-6` — see the
comment in `Button.tsx`. This is also documented in `conventions.md` for the
design agent's own compositions, since the same gotcha applies to anything
it builds fresh.
**Any future authored preview must include this wrapper** — components that
set their own opaque surface (`Card`, `Alert`, `DropdownMenuContent`) are the
only exception.

## Re-sync risks
- If `frontend/src/index.css` token values change, `cssEntry`'s compiled
  output changes too — `buildCmd` handles that automatically (just rebuild).
- If the Google Fonts URL in `index.html` changes (different families/
  weights), `.design-sync/fonts/google-fonts.css` goes stale silently —
  nothing fails loudly, previews would just keep using the old weight list.
- Panels were deliberately excluded from `componentSrcMap`; if a future
  panel graduates into a real reusable primitive, add it explicitly — the
  `srcDir` scoping means new files dropped anywhere outside
  `src/components/ui/` are invisible to this sync by design, not by oversight.
