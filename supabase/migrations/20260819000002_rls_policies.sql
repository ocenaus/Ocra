-- ORCA — Row Level Security
--
-- Per-user tables (users, watchlists, alerts, alert_events) are scoped to
-- auth.uid(). ORCA's own analytical cache tables (wallets, tokens,
-- transactions, wallet_activity, token_risk_scores, wallet_scores,
-- smart_money_profiles) hold data ORCA computed from public on-chain
-- activity, not user-owned data — they're readable by any authenticated
-- user and written only by server code using the service role key, which
-- bypasses RLS entirely.

alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.tokens enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_activity enable row level security;
alter table public.watchlists enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_events enable row level security;
alter table public.token_risk_scores enable row level security;
alter table public.wallet_scores enable row level security;
alter table public.smart_money_profiles enable row level security;

-- users: can only see/update their own profile row.
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ORCA analytical cache: readable by any authenticated user, no client writes.
create policy "wallets_select_authenticated" on public.wallets
  for select using (auth.role() = 'authenticated');
create policy "tokens_select_authenticated" on public.tokens
  for select using (auth.role() = 'authenticated');
create policy "transactions_select_authenticated" on public.transactions
  for select using (auth.role() = 'authenticated');
create policy "wallet_activity_select_authenticated" on public.wallet_activity
  for select using (auth.role() = 'authenticated');
create policy "token_risk_scores_select_authenticated" on public.token_risk_scores
  for select using (auth.role() = 'authenticated');
create policy "wallet_scores_select_authenticated" on public.wallet_scores
  for select using (auth.role() = 'authenticated');
create policy "smart_money_profiles_select_authenticated" on public.smart_money_profiles
  for select using (auth.role() = 'authenticated');

-- watchlists: fully owned by the user.
create policy "watchlists_select_own" on public.watchlists
  for select using (auth.uid() = user_id);
create policy "watchlists_insert_own" on public.watchlists
  for insert with check (auth.uid() = user_id);
create policy "watchlists_update_own" on public.watchlists
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watchlists_delete_own" on public.watchlists
  for delete using (auth.uid() = user_id);

-- alerts: fully owned by the user (rule definitions; processing happens
-- server-side via the service role, independent of RLS).
create policy "alerts_select_own" on public.alerts
  for select using (auth.uid() = user_id);
create policy "alerts_insert_own" on public.alerts
  for insert with check (auth.uid() = user_id);
create policy "alerts_update_own" on public.alerts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "alerts_delete_own" on public.alerts
  for delete using (auth.uid() = user_id);

-- alert_events: read-only for the owning user, via the parent alert.
create policy "alert_events_select_own" on public.alert_events
  for select using (
    exists (
      select 1 from public.alerts
      where alerts.id = alert_events.alert_id
        and alerts.user_id = auth.uid()
    )
  );
