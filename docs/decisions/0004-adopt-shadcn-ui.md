# ADR 0004: Adopt shadcn/ui for the component library

**Status:** Accepted

## Context
The frontend had zero styling: bare HTML elements with one inline `style`
object on the root `<main>`, no CSS files, no design tokens. A first attempt
to fix this adopted [Mantine](https://mantine.dev) with a "light futuristic"
theme (commit `a9a1ed8`), but it was reverted (`dca4071`): Mantine 9 requires
React 19 while the app was pinned to React 18, and pulling in a large
batteries-included component runtime turned out to be the wrong fit for a
small, fast-moving solo project.

Separately, the developer had already designed Makop's look in a Claude
Design project ("Makop Hazard App" — dark, brand-yellow accent, bold
Archivo/Space Grotesk/JetBrains Mono type). The goal was to turn that design
into a real, reusable component set so every feature (current roster/login,
future calendar/RSVP/money screens) is built from the same themed primitives
instead of hand-rolled markup each time.

## Decision
- **Migrate to React 19 first** (standalone commit, `7ef1160`) so the chosen
  library's peer dependencies don't fight the React version again.
- **Adopt [shadcn/ui](https://ui.shadcn.com)** on **Tailwind CSS v4** via
  `@tailwindcss/vite`, using the Radix UI base. Unlike Mantine, shadcn
  components are copied into the repo (`src/components/ui/`) rather than
  installed as a runtime dependency — no library version to peg the app to,
  full control over the generated code.
- **Theme tokens extracted from the existing Claude Design project**, not
  invented: near-black surfaces (`#0a0a0a`/`#141414`), brand yellow accent
  (`#FFE000`), Archivo/Space Grotesk/JetBrains Mono type — encoded as CSS
  variables in `src/index.css`. Scope was deliberately limited to
  **palette + tokens**, applied to shadcn's default component shapes;
  reproducing the design's exact per-component layouts is a later pass.
- Added `@/*` path alias (`tsconfig.json` + `vite.config.ts`) and
  `components.json` per shadcn convention.
- First components pulled in: `button`, `input`, `label`, `card`, `table`,
  `alert`, `separator`, `tabs`, `dropdown-menu`. The existing `App.tsx` panels
  (login, roster list/add-form, backend health) were refactored onto them and
  split into `src/components/panels/` as the first example of the pattern.

## Consequences
- New UI should be built from `src/components/ui/` primitives, not hand-rolled
  markup or inline styles — this is now the project convention (see
  `CLAUDE.md`).
- Styling is Tailwind-first going forward; there's no other CSS methodology
  (no CSS modules, no styled-components) to keep straight.
- Because component source lives in the repo, upgrading a component later
  means re-running `npx shadcn add <component>` and re-diffing, not a
  `package.json` bump — more manual, but no surprise breaking changes from
  upstream.
- The app is dark-first by design (matching the Claude Design source); a
  light theme isn't defined yet and isn't currently planned.
- Faithfully matching the Claude Design mockups' exact component visuals
  (not just their palette) remains open — deliberately deferred, not
  forgotten.
