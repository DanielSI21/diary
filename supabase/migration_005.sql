-- ============================================================
--  Migración 005
--  - ANALYSES (análisis del día): texto largo (Markdown) generado
--    externamente (ChatGPT/Claude/Codex) y guardado por día.
--    * Un análisis por día por usuario (único en (user_id, day)).
--  Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
--  ANALYSES (análisis del día)
-- ------------------------------------------------------------
create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  text        text not null check (char_length(trim(text)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Un único análisis por día y usuario.
create unique index if not exists analyses_user_day_uniq
  on public.analyses (user_id, day);

drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at
  before update on public.analyses
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
--  ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.analyses enable row level security;

drop policy if exists analyses_select on public.analyses;
drop policy if exists analyses_insert on public.analyses;
drop policy if exists analyses_update on public.analyses;
drop policy if exists analyses_delete on public.analyses;
create policy analyses_select on public.analyses for select using (auth.uid() = user_id);
create policy analyses_insert on public.analyses for insert with check (auth.uid() = user_id);
create policy analyses_update on public.analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy analyses_delete on public.analyses for delete using (auth.uid() = user_id);
