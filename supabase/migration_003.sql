-- ============================================================
--  Migración 003
--  - Objetivos con porcentaje de cumplimiento (0-100, default 100)
--  - Vínculo log -> objetivo (entries.goal_id)
--  Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================

alter table public.goals
  add column if not exists completion_percent int not null default 100
    check (completion_percent between 0 and 100);

-- Un log puede quedar vinculado al objetivo que ayudó a cumplir.
-- on delete set null: borrar el objetivo no borra el log.
alter table public.entries
  add column if not exists goal_id uuid references public.goals(id) on delete set null;

create index if not exists entries_goal_idx on public.entries (goal_id);
