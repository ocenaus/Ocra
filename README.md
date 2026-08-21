# ORCA Bubble Map — Powered by Oceanus

_Track the Ocean._

A single-page tool: enter an Ethereum token contract address, see who really
holds it. Top holders render as an interactive bubble map — bubble size = %
of total supply — alongside real contract details (price, market cap,
verification status, owner/mint/burn/pause capabilities). No authentication
required. This project never uses fake/mock blockchain data in production;
when a data provider can't confirm something, the UI says "data unavailable"
instead of guessing.

## Tech stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui-style components, d3-force for the bubble layout
- **Backend**: Next.js API routes, TypeScript
- **Blockchain data**: Alchemy (metadata/price/on-chain owner read), Moralis (metadata/price/**top holders**), Etherscan (contract source verification + capability heuristics) — Ethereum Mainnet only
- **Database/Auth**: PostgreSQL via Supabase — present in the codebase but **not required to run the app**; the bubble map itself has no auth or database dependency (see below)

## Getting started

```bash
npm install
cp .env.example .env.local   # add real Alchemy/Moralis/Etherscan keys — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a token contract
address, and it takes you to `/token/[address]`.

### Environment variables

See [`.env.example`](./.env.example). To see real data you need:

- `ALCHEMY_API_KEY`
- `MORALIS_API_KEY` — the only provider we use with a general "get token
  holders" endpoint, so this is required for the bubble map itself
- `ETHERSCAN_API_KEY` — needed for contract verification/capability details

Without these, the app still runs — every panel shows an explicit "not
configured" state rather than fake numbers. Supabase variables are entirely
optional; nothing in the active app depends on them.

## What's dormant vs. active

This codebase was originally scaffolded for a much larger multi-phase ORCA
platform (radar, wallet scanner, watchlists, alerts, pricing tiers, Supabase
Auth). The project has since been scoped down to just the bubble map. Rather
than delete the auth/database plumbing, it's left in place but unused:

- **Active**: `/` (landing/input), `/token/[address]` (bubble map + token
  details), `/api/token/[address]`, `/api/token/[address]/holders`
- **Dormant, reachable by direct URL only**: `/login`, `/signup`,
  `/auth/callback`, `/admin/diagnostics` — Supabase Auth code, unlinked from
  the main UI
- **Schema kept, mostly unused for now**: `supabase/migrations` — `tokens`
  and `token_risk_scores` could back a future caching layer; the bubble map
  currently fetches live rather than persisting to Postgres

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Run the test suite (Vitest) |

## Project structure

```
src/app/                     Routes (App Router)
src/app/api/token/            Token metadata + holders API routes
src/components/ui/            Base shadcn-style components
src/components/orca/          Bubble map, token detail panel, search bar
src/lib/services/             Provider clients (alchemy, moralis, etherscan) + orchestrator + pure math
src/lib/                      Env config, Supabase clients (dormant), validation, format helpers
supabase/migrations/          SQL schema + RLS policies (kept, mostly unused for now)
tests/                        Vitest test suites
```
