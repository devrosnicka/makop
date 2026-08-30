# Roadmap

A living list of features makop might have one day. Product scope only — add
or remove items freely as ideas come and go. No technical decisions here; those
live in [`docs/decisions/`](docs/decisions/).

Once a feature actually gets built, it's fine to write a spec for it in
[`docs/specs/`](docs/specs/) and link it below with `→ spec`. This is optional
and lazy — most items here will never need one.

## 🔨 In progress
- Player roster — list of team members with basic contact details. →
  [spec](docs/specs/player-roster.md)
- Events & calendar — 7-day calendar view and event creation (matches,
  training, one-offs). → [spec](docs/specs/events-calendar.md)
- Season fee calculation — create a season, pick the players, enter the costs,
  and freeze the resulting per-player contribution. →
  [spec](docs/specs/season-fee-calculation.md)
- Receivables — one generic "player owes the team X" record (season fees,
  jerseys, fines, friendly matches) with partial payments and a debtor list. →
  [spec](docs/specs/receivables.md)

## 💡 Ideas

**Team & players**

**Availability (RSVP)**
- Availability collection — players respond *going / not going / undecided* via a
  shared link, no login required.
- Event headcount — at-a-glance view of who's coming to each event.

**Money**
- Season fee tracking — two seasons per year (half-year each); track who owes and
  who has paid. *(Both halves are in progress above: the calculation, and the
  receivables module that tracks payments against it.)*
- Ad-hoc collections — collect and track money for extra events. *(Covered by
  the receivables module above, minus a per-event grouping.)*
- Balance overview — per-player view of what each person owes / has paid.
  *(The debtor list is the first half; a full per-player history is still an
  idea.)*
- Payment reminders — nudge players who haven't paid yet.
- Online payments *(later)* — pay fees through the app via a payment provider,
  instead of only tracking bank-transfer/cash payments.

## ✅ Done
_Nothing yet — move items here once shipped._
