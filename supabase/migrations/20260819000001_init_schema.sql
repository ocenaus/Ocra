-- ORCA — Phase 1 initial schema
-- Ethereum Mainnet only (chain_id 1) for V1. Tables are designed so later
-- phases (Alchemy/Moralis ingestion, risk scoring, whale detection, alerts,
-- smart money) only need to INSERT/UPDATE real computed data — no schema
-- changes required to start populating them with live blockchain data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- users — profile row mirroring auth.users, created by trigger on signup
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  is_admin boolean not null default false,
  telegram_chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Creates a public.users row whenever a new auth.users row is created.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- wallets — cache of Ethereum addresses ORCA has analyzed
-- ---------------------------------------------------------------------
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null unique check (address ~ '^0x[a-f0-9]{40}$'),
  ens_name text,
  label text,
  first_seen_at timestamptz,
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wallets_address_idx on public.wallets (address);

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- tokens — cache of ERC-20 contracts ORCA has analyzed
-- ---------------------------------------------------------------------
create table public.tokens (
  id uuid primary key default gen_random_uuid(),
  address text not null unique check (address ~ '^0x[a-f0-9]{40}$'),
  chain_id integer not null default 1,
  name text,
  symbol text,
  decimals integer,
  logo_url text,
  is_verified boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tokens_address_idx on public.tokens (address);

create trigger tokens_set_updated_at
  before update on public.tokens
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- transactions — real on-chain transactions/transfers ORCA has ingested
-- ---------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  tx_hash text not null check (tx_hash ~ '^0x[a-f0-9]{64}$'),
  log_index integer not null default 0,
  block_number bigint,
  chain_id integer not null default 1,
  from_address text not null check (from_address ~ '^0x[a-f0-9]{40}$'),
  to_address text check (to_address ~ '^0x[a-f0-9]{40}$'),
  token_id uuid references public.tokens (id) on delete set null,
  value_wei numeric,
  usd_value numeric,
  tx_type text not null default 'unknown'
    check (tx_type in ('transfer', 'swap', 'mint', 'burn', 'contract_call', 'unknown')),
  occurred_at timestamptz not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (tx_hash, log_index)
);

create index transactions_tx_hash_idx on public.transactions (tx_hash);
create index transactions_from_address_idx on public.transactions (from_address);
create index transactions_to_address_idx on public.transactions (to_address);
create index transactions_token_id_idx on public.transactions (token_id);
create index transactions_occurred_at_idx on public.transactions (occurred_at desc);

-- ---------------------------------------------------------------------
-- wallet_activity — derived activity feed entries (whale alerts, dex
-- activity, etc.) linked back to a real transaction
-- ---------------------------------------------------------------------
create table public.wallet_activity (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  activity_type text not null
    check (activity_type in ('large_transfer', 'whale_alert', 'dex_swap', 'token_transfer', 'contract_interaction')),
  amount_usd numeric,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (wallet_id, transaction_id, activity_type)
);

create index wallet_activity_wallet_id_idx on public.wallet_activity (wallet_id);
create index wallet_activity_occurred_at_idx on public.wallet_activity (occurred_at desc);

-- ---------------------------------------------------------------------
-- watchlists — user-tracked wallets/tokens
-- ---------------------------------------------------------------------
create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  item_type text not null check (item_type in ('wallet', 'token')),
  wallet_id uuid references public.wallets (id) on delete cascade,
  token_id uuid references public.tokens (id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watchlists_item_matches_type check (
    (item_type = 'wallet' and wallet_id is not null and token_id is null) or
    (item_type = 'token' and token_id is not null and wallet_id is null)
  )
);

create unique index watchlists_user_wallet_unique
  on public.watchlists (user_id, wallet_id) where item_type = 'wallet';
create unique index watchlists_user_token_unique
  on public.watchlists (user_id, token_id) where item_type = 'token';
create index watchlists_user_id_idx on public.watchlists (user_id);

create trigger watchlists_set_updated_at
  before update on public.watchlists
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- alerts — server-processed alert rules
-- ---------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  alert_type text not null check (
    alert_type in ('wallet_large_transfer', 'token_risk_change', 'wallet_token_interaction')
  ),
  wallet_id uuid references public.wallets (id) on delete cascade,
  token_id uuid references public.tokens (id) on delete cascade,
  threshold_usd numeric,
  config jsonb not null default '{}'::jsonb,
  channel text not null default 'app' check (channel in ('app', 'telegram', 'both')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index alerts_user_id_idx on public.alerts (user_id);
create index alerts_wallet_id_idx on public.alerts (wallet_id);
create index alerts_token_id_idx on public.alerts (token_id);

create trigger alerts_set_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- alert_events — real firings of an alert rule, one per triggering event
-- ---------------------------------------------------------------------
create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  delivery_channel text not null default 'app' check (delivery_channel in ('app', 'telegram')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (alert_id, transaction_id)
);

create index alert_events_alert_id_idx on public.alert_events (alert_id);
create index alert_events_created_at_idx on public.alert_events (created_at desc);

-- ---------------------------------------------------------------------
-- token_risk_scores — history of ORCA Risk Score computations
-- ---------------------------------------------------------------------
create table public.token_risk_scores (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.tokens (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'moderate', 'high', 'critical')),
  reasons jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index token_risk_scores_token_id_idx on public.token_risk_scores (token_id, computed_at desc);

-- ---------------------------------------------------------------------
-- wallet_scores — history of wallet-level analytical scores
-- (e.g. activity score, risk exposure) other than Smart Money
-- ---------------------------------------------------------------------
create table public.wallet_scores (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  score_type text not null,
  score integer not null check (score between 0 and 100),
  metrics jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index wallet_scores_wallet_id_idx on public.wallet_scores (wallet_id, computed_at desc);

-- ---------------------------------------------------------------------
-- smart_money_profiles — ORCA Smart Money Score for a wallet
-- ---------------------------------------------------------------------
create table public.smart_money_profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null unique references public.wallets (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  signals jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger smart_money_profiles_set_updated_at
  before update on public.smart_money_profiles
  for each row execute function public.set_updated_at();
