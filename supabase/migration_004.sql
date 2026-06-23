-- ============================================================
--  Migración 004
--  - NOTES (notas / pensamientos): log de texto con hora de inicio.
--    * tag opcional, links clickeables (se guarda el texto tal cual).
--    * pending = true -> es un "pendiente"; puede tener due_date y done.
--  - day_activity ahora también cuenta notas.
--  Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
--  NOTES (notas / pensamientos)
--  on delete set null: limpiar un tag NO rompe notas antiguas.
-- ------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  note_time   time not null,
  text        text not null check (char_length(trim(text)) > 0),
  tag_id      uuid references public.tags(id) on delete set null,
  pending     boolean not null default false,
  due_date    date,            -- opcional: fecha del pendiente
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_day_idx
  on public.notes (user_id, day, note_time);
-- Para el banner "pendientes que vencen este día" en la vista del día.
create index if not exists notes_user_due_idx
  on public.notes (user_id, due_date)
  where pending and not done;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
--  ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.notes enable row level security;

drop policy if exists notes_select on public.notes;
drop policy if exists notes_insert on public.notes;
drop policy if exists notes_update on public.notes;
drop policy if exists notes_delete on public.notes;
create policy notes_select on public.notes for select using (auth.uid() = user_id);
create policy notes_insert on public.notes for insert with check (auth.uid() = user_id);
create policy notes_update on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notes_delete on public.notes for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
--  Vista del calendario: ahora incluye notas.
-- ------------------------------------------------------------
create or replace view public.day_activity
with (security_invoker = true) as
  select user_id, day,
         count(*) filter (where src = 'goal')  as goals_count,
         count(*) filter (where src = 'entry') as entries_count,
         count(*) filter (where src = 'note')  as notes_count
  from (
    select user_id, day, 'goal'  as src from public.goals
    union all
    select user_id, day, 'entry' as src from public.entries
    union all
    select user_id, day, 'note'  as src from public.notes
  ) t
  group by user_id, day;
