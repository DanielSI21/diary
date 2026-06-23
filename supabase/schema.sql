-- ============================================================
--  Diario de Productividad — Esquema Supabase / PostgreSQL
--  Ejecutar completo en: Supabase Dashboard -> SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
--  Trigger genérico para updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
--  TAGS (etiquetas)
-- ------------------------------------------------------------
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(trim(name)) > 0),
  color       text not null default '#3b82f6',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Nombre único por usuario (sin distinguir mayúsculas) -> evita duplicados
create unique index if not exists tags_user_name_unique
  on public.tags (user_id, lower(name));
create index if not exists tags_user_idx on public.tags (user_id);

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
--  GOALS (objetivos diarios)
-- ------------------------------------------------------------
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  text        text not null check (char_length(trim(text)) > 0),
  completed   boolean not null default false,
  completion_percent int not null default 100 check (completion_percent between 0 and 100),
  tag_id      uuid references public.tags(id) on delete set null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists goals_user_day_idx on public.goals (user_id, day);

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
--  ENTRIES (entradas del diario)
--  on delete set null: borrar/limpiar un tag NO rompe logs antiguos
-- ------------------------------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  entry_time  time not null,
  end_time    time, -- opcional: NULL = termina al empezar la siguiente entrada
  text        text not null check (char_length(trim(text)) > 0),
  tag_id      uuid references public.tags(id) on delete set null,
  goal_id     uuid references public.goals(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists entries_user_day_idx
  on public.entries (user_id, day, entry_time);
create index if not exists entries_goal_idx on public.entries (goal_id);

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
--  ROW LEVEL SECURITY
--  Cada usuario sólo accede a sus propias filas.
-- ------------------------------------------------------------
alter table public.tags    enable row level security;
alter table public.goals   enable row level security;
alter table public.entries enable row level security;

-- TAGS
drop policy if exists tags_select on public.tags;
drop policy if exists tags_insert on public.tags;
drop policy if exists tags_update on public.tags;
drop policy if exists tags_delete on public.tags;
create policy tags_select on public.tags for select using (auth.uid() = user_id);
create policy tags_insert on public.tags for insert with check (auth.uid() = user_id);
create policy tags_update on public.tags for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tags_delete on public.tags for delete using (auth.uid() = user_id);

-- GOALS
drop policy if exists goals_select on public.goals;
drop policy if exists goals_insert on public.goals;
drop policy if exists goals_update on public.goals;
drop policy if exists goals_delete on public.goals;
create policy goals_select on public.goals for select using (auth.uid() = user_id);
create policy goals_insert on public.goals for insert with check (auth.uid() = user_id);
create policy goals_update on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy goals_delete on public.goals for delete using (auth.uid() = user_id);

-- ENTRIES
drop policy if exists entries_select on public.entries;
drop policy if exists entries_insert on public.entries;
drop policy if exists entries_update on public.entries;
drop policy if exists entries_delete on public.entries;
create policy entries_select on public.entries for select using (auth.uid() = user_id);
create policy entries_insert on public.entries for insert with check (auth.uid() = user_id);
create policy entries_update on public.entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy entries_delete on public.entries for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
--  (Opcional) Vista para el calendario: días con datos por usuario.
--  Devuelve qué días tienen objetivos y/o entradas.
-- ------------------------------------------------------------
create or replace view public.day_activity
with (security_invoker = true) as
  select user_id, day,
         count(*) filter (where src = 'goal')  as goals_count,
         count(*) filter (where src = 'entry') as entries_count
  from (
    select user_id, day, 'goal'  as src from public.goals
    union all
    select user_id, day, 'entry' as src from public.entries
  ) t
  group by user_id, day;
