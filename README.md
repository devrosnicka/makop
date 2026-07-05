# makop

## What is makop?

**makop** (short for *malá kopaná* — Czech for "small-sided football") is a web app
for organizing and managing a Sunday-league small-sided football team.

It helps the team manager:
- Keep a **roster** of players.
- Run a **calendar** of league matches and one-off events — friendlies, training
  sessions, and summer tournaments.
- Collect **availability** for each event — players mark *going / not going /
  undecided* through a simple shared link, with no account or login.
- Track **money** — the twice-a-year season fees (one season = half a year) and
  ad-hoc collections for extra events — as a ledger of who owes and who has paid.

The goal is to replace scattered WhatsApp threads and spreadsheets with one place
to see who's coming and who's paid.

## Project planning

This project is planned and documented in-repo so both humans and AI agents
work from the same source of truth:

- [`CLAUDE.md`](CLAUDE.md) — agent operating manual (stack, commands, conventions)
- [`ROADMAP.md`](ROADMAP.md) — milestone-level direction
- [`docs/specs/`](docs/specs/) — one spec per feature
- [`docs/decisions/`](docs/decisions/) — lightweight ADRs (architecture decision records)
