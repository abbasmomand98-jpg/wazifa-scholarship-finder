# Wazifa — Scholarship Finder (UX Concept)

A working demo of a scholarship finder for Pakistani students: one list of awards,
an eligibility checker that scores your match, a deadline tracker with countdowns,
a document checklist saved on your device, and a scam-spotter for fee-charging agents.

**Live demo (intended):** https://abbasmomand98-jpg.github.io/wazifa-scholarship-finder/
**Code repo (intended):** https://github.com/abbasmomand98-jpg/wazifa-scholarship-finder

> **Sample-data honesty note:** every scholarship, amount and deadline in this demo is
> illustrative sample data, invented to show how the concept works. Nothing here is an
> official announcement. Always verify deadlines, eligibility rules and document lists
> on the official HEC / provincial / university portal before applying — and never pay
> anyone a "processing fee" for a scholarship application.

## How it works

1. **Finder tab** — Search 12 sample scholarships by name or provider, and filter by
   level and province. "All Pakistan" awards always pass a province filter, because they
   are open nationwide. Click any award to see its detail: amount, type, deadline
   countdown, and a match-% against your checker profile.
2. **Checker tab** — Enter your marks (%), family income per month, domicile and level.
   Each scholarship is scored on four plain checks (marks threshold, income cap,
   domicile, level) and ranked by match-%. A scholarship with no income cap always
   passes that check.
3. **Tracker tab** — All awards sorted soonest-deadline-first, each with a countdown
   bar (gold when 21 days or fewer remain). Below it, pick a scholarship and tick off
   its document checklist — your ticks are saved in `localStorage` under
   `wazifa-docs-v1`, so they survive a reload on the same device.
4. **Scam Spotter tab** — Paste an agent's message. The checker flags fee demands,
   fake "guaranteed selection" promises, up-front payments and pressure language, and
   rates the message low / medium / high risk.

## What you can learn from this project

- **Filtering without a framework:** `filterScholarships` in `logic.js` is a pure
  function — same input, same output, easy to test. The UI only renders what it returns.
- **Keeping logic testable:** all rules (match scoring, deadline math, scam flags)
  live in `logic.js` with no DOM access, so `node test.js` can verify them. `app.js`
  only wires buttons and lists to those functions.
- **Dates as data:** deadlines are plain `YYYY-MM-DD` strings, and `daysUntil`
  compares calendar days (not timestamps), so "21 days left" is stable and testable.
- **localStorage as a tiny database:** the checklist is a JSON object keyed by
  scholarship id, saved on every tick — no server needed.
- **Honest sample data:** when a demo invents real-world facts, label them clearly
  (the gold SAMPLE pill, the honesty note) instead of letting users mistake them
  for official information.

## Fork it and adapt it

Fork this repo and make it yours: swap the 12 sample listings in `data.js` for real
awards in your own province or country, add a level (e.g. Postgraduate), or add a new
scam pattern in `scamCheck`. The pattern — search + filter, score, countdown,
checklist, warning — works for any deadline-driven opportunity: internships, grants,
admissions, or exam registrations.

## Run the tests

```bash
node --check data.js && node --check logic.js && node --check app.js
node test.js
```
