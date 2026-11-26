-- Executar no SQL Editor do Supabase (plano gratuito)
create table if not exists public.progress(
  user_id uuid primary key references auth.users(id) on delete cascade,
  hole real default 1520, bit real default 1500,
  stats jsonb default '{}', settings jsonb default '{}',
  updated_at timestamptz default now());
alter table public.progress enable row level security;
create policy "ler o proprio" on public.progress for select using (auth.uid()=user_id);
create policy "criar o proprio" on public.progress for insert with check (auth.uid()=user_id);
create policy "atualizar o proprio" on public.progress for update using (auth.uid()=user_id);
