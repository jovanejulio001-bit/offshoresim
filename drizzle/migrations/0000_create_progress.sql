create table public.progress(
  user_id uuid primary key,
  hole real not null default 1520,
  bit real not null default 1500,
  stats jsonb not null default '{}',
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now());
grant select, insert, update on public.progress to authenticated;
grant all on public.progress to service_role;
alter table public.progress enable row level security;
create policy "own select" on public.progress for select to authenticated using ((select auth.uid())=user_id);
create policy "own insert" on public.progress for insert to authenticated with check ((select auth.uid())=user_id);
create policy "own update" on public.progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);