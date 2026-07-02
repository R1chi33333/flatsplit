# Roadmap

Development follows small, releasable increments. Each item below is one loop.

## Milestone: v0.1.0 — Foundations

- [x] Loop 1: repository scaffold, CI pipeline, deployable blank landing page
- [x] Loop 2: database schema (flats, members, expenses, shares) with Drizzle and Neon, migration workflow
- [x] Loop 3: settlement engine — net balances and minimum-transfer algorithm, fully unit tested
- [x] Loop 4: auth with NextAuth — demo account credentials login, session handling
- [ ] Release v0.1.0

## Milestone: v0.2.0 — Core product

- [x] Loop 5: flat dashboard shell — navigation, member list, responsive layout
- [x] Loop 6: expense recording — add and delete with equal, ratio and fixed splits
- [x] Loop 7: settlement view — who owes whom with minimum transfers
- [x] Loop 8: demo flat seed data — 4 members, 3 months of expenses behind one-click demo login
- [ ] Release v0.2.0

## Milestone: v0.3.0 — CSV import and landing

- [x] Loop 9: CSV import with nz-bank-parser — upload, select shared transactions, bulk add
- [x] Loop 10: landing page with product story, screenshot and Try demo button
- [x] Loop 11: Playwright e2e — demo login flow and CSV import flow
- [ ] Release v0.3.0

## Milestone: v1.0.0 — Ship

- [ ] Loop 12: magic-link email auth, invite codes for real flats
- [ ] Loop 13: polish pass — empty states, loading states, mobile audit
- [ ] Loop 14: README with product screenshot, settlement algorithm explainer, coverage badge
- [ ] Release v1.0.0

## Later

- [ ] Recurring expenses (rent schedules)
- [ ] Receipt photo attachments
- [ ] Export settlement history as CSV
