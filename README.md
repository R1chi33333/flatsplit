[![CI](https://github.com/R1chi33333/flatsplit/actions/workflows/ci.yml/badge.svg)](https://github.com/R1chi33333/flatsplit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/R1chi33333/flatsplit/branch/main/graph/badge.svg)](https://codecov.io/gh/R1chi33333/flatsplit)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

# FlatSplit — fair expenses for New Zealand flats

[Live Demo](https://flatsplit-nz.vercel.app) · [Documentation](#getting-started) · [Report Bug](https://github.com/R1chi33333/flatsplit/issues/new?template=bug_report.md)

![FlatSplit settlement view](./public/shots/settle.png)

## Why this exists

Flatting is how most young New Zealanders live, and every flat runs the same spreadsheet: rent by room size, power split evenly, groceries owed to whoever paid. Spreadsheets rot and nobody settles up. FlatSplit tracks shared expenses, imports transactions straight from your bank's CSV export, and tells everyone the fewest transfers needed to be square.

## Features

- Create a flat, invite flatmates with a code
- Record expenses with equal, ratio or fixed-amount splits
- Settlement view: who owes whom, with the minimum number of transfers
- Import bank CSV exports via [nz-bank-parser](https://github.com/R1chi33333/nz-bank-parser) and turn shared transactions into expenses in bulk
- One-click demo flat with realistic data, no signup needed
- All amounts in integer cents, so totals always add up

## How settlement works

Every expense is stored in integer cents with exact shares, so each member has a precise net position: what they paid minus what they owe. To settle, FlatSplit repeatedly matches the largest debtor with the largest creditor until everyone reaches zero. This greedy plan always needs at most n-1 transfers for n members and is exact to the cent. Finding the true minimum number of transfers is NP-hard (it embeds subset sum), and for flat-sized groups the greedy plan is optimal or within one transfer of it.

```mermaid
flowchart LR
    B[Ben owes 2,437.42] -->|transfer 1| D[Demo Flatmate is owed 6,512.80]
    A[Aroha owes 2,281.11] -->|transfer 2| D
    M[Mia owes 1,794.27] -->|transfer 3| D
```

Three debtors, one creditor: three transfers and the flat is square. The engine lives in [`src/lib/settlement.ts`](./src/lib/settlement.ts) with invariant tests that apply every plan back to the balances and assert everyone lands on zero.

## Architecture

```mermaid
flowchart LR
    A[Next.js App Router] --> B[Server Actions]
    B --> C[Drizzle ORM]
    C --> D[(Neon Postgres)]
    A --> E[nz-bank-parser<br/>client-side CSV parsing]
    B --> F[Settlement engine<br/>min-transfer algorithm]
```

## Tech Stack

Next.js 15 (App Router), TypeScript (strict), Neon Postgres, Drizzle ORM, NextAuth, Tailwind CSS, nz-bank-parser, Vitest, Playwright. Deployed on Vercel.

## Getting Started

```bash
git clone https://github.com/R1chi33333/flatsplit.git
cd flatsplit
npm ci
cp .env.example .env.local   # fill in database URL and auth secret
npm run dev
```

## Testing

```bash
npm test               # unit tests (settlement engine, split maths, invite codes)
npm run test:coverage  # with coverage report
npm run e2e            # Playwright: demo login flow and CSV import flow
node scripts/mobile-audit.mjs  # horizontal-overflow audit at phone width
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## License

[MIT](./LICENSE)
