# ORCA Database

PostgreSQL via Supabase. Schema source of truth lives in
[`supabase/migrations`](../supabase/migrations) (SQL migration files, applied
in filename order).

## Tables (Phase 1)

| Table | Purpose |
| --- | --- |
| `users` | Profile row mirrored from `auth.users` on signup (tier, admin flag, Telegram chat id). |
| `wallets` | Cache of Ethereum addresses ORCA has analyzed. |
| `tokens` | Cache of ERC-20 contracts ORCA has analyzed. |
| `transactions` | Real ingested on-chain transactions/transfers. |
| `wallet_activity` | Derived activity feed entries (whale alerts, DEX activity), linked to a real transaction. |
| `watchlists` | User-tracked wallets/tokens. |
| `alerts` | User-defined alert rules, processed server-side. |
| `alert_events` | Real firings of an alert rule. |
| `token_risk_scores` | History of ORCA Risk Score computations per token. |
| `wallet_scores` | History of wallet-level analytical scores (non-Smart-Money). |
| `smart_money_profiles` | ORCA Smart Money Score per wallet. |

All tables use `created_at`/`updated_at` (auto-maintained via trigger where
mutable). Duplicate transactions are prevented with a unique constraint on
`(tx_hash, log_index)`; duplicate alert firings with a unique constraint on
`(alert_id, transaction_id)`; duplicate wallet activity entries with a unique
constraint on `(wallet_id, transaction_id, activity_type)`.

Row Level Security is enabled on every table (see
`20260819000002_rls_policies.sql`). Per-user tables (`users`, `watchlists`,
`alerts`, `alert_events`) are scoped to `auth.uid()`. ORCA's own analytical
cache tables are read-only for authenticated users — they're only ever
written by server code using the Supabase service role key (which bypasses
RLS), never directly by the client.

## Applying migrations

Requires a Supabase project. Set `DATABASE_URL` in `.env.local` to the
project's connection string (Supabase dashboard → Settings → Database →
Connection string → URI), then either:

```bash
# Using the Supabase CLI (recommended)
supabase link --project-ref <your-project-ref>
supabase db push

# Or directly with psql
psql "$DATABASE_URL" -f supabase/migrations/20260819000001_init_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20260819000002_rls_policies.sql
```

After applying, regenerate TypeScript types to replace the hand-written
placeholder at `src/lib/database.types.ts`:

```bash
supabase gen types typescript --project-id <your-project-ref> > src/lib/database.types.ts
```
