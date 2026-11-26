-- Executar no SQL Editor do Supabase (plano gratuito)
-- Este ficheiro pode ser executado várias vezes seguidas sem dar erros.
-- (Substitui o antigo supabase.sql, que dava "policy ... already exists".)

create table if not exists public.progress(
  user_id uuid primary key references auth.users(id) on delete cascade,
  hole real default 1520, bit real default 1500,
  stats jsonb default '{}', settings jsonb default '{}',
  updated_at timestamptz default now());

alter table public.progress enable row level security;

-- Apaga as regras antigas, se existirem, para as poder criar de novo sem erro.
drop policy if exists "ler o proprio" on public.progress;
drop policy if exists "criar o proprio" on public.progress;
drop policy if exists "atualizar o proprio" on public.progress;

-- Cada pessoa só vê e altera a sua própria linha de progresso.
create policy "ler o proprio" on public.progress for select using (auth.uid()=user_id);
create policy "criar o proprio" on public.progress for insert with check (auth.uid()=user_id);
create policy "atualizar o proprio" on public.progress for update using (auth.uid()=user_id);

-- Acesso à tabela pelo site (necessário em projetos mais recentes do Supabase).
grant select, insert, update on public.progress to authenticated;
