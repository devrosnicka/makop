# makop

## Project
`makop` is a web app. (One-liner to expand as the product direction firms up.)

## Stack
**TBD** — not chosen yet. See [`docs/decisions/0001-choose-stack.md`](docs/decisions/0001-choose-stack.md).
Once decided, fill in here: language, framework, database, hosting/deploy target.

## Commands
Fill in once the stack is chosen:
- Dev server: `TBD`
- Build: `TBD`
- Test: `TBD`
- Lint: `TBD`

## Planning workflow
This repo is the source of truth for planning — docs live here so Claude Code
reads them every session, not in a separate tool.

- **`ROADMAP.md`** — milestone-level direction ("where we're headed"). Start here.
- **`docs/specs/`** — one file per feature, copied from `docs/specs/_TEMPLATE.md`.
  Write the spec *before* implementing a feature.
- **`docs/decisions/`** — lightweight ADRs (one per significant decision), copied
  from `docs/decisions/_TEMPLATE.md`. Captures *why*, so context survives across
  sessions.
- Work via **plan → approve → execute**: use plan mode for anything non-trivial,
  get explicit approval, then implement.

## Conventions
- Commit small and often; commit messages explain *why*, not just *what*.
- Work off `main` directly is fine for now (solo project); revisit branching
  if collaborators join.
- Before marking a feature done, verify it end-to-end (run it, don't just read
  the diff) and check its spec's acceptance criteria.

## Guardrails
- Keep this file current — update it whenever stack, commands, or conventions change.
- Keep specs small and testable; prefer several focused specs over one sprawling one.
- Don't invent new roadmap items without adding them to `ROADMAP.md` first.
