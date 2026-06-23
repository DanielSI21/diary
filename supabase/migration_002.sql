-- ============================================================
--  Migración 002
--  - Objetivos con etiqueta (tag opcional)
--  - Entradas del diario con hora final opcional
--  Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================

-- Objetivos: etiqueta opcional (no rompe objetivos si se borra el tag)
alter table public.goals
  add column if not exists tag_id uuid references public.tags(id) on delete set null;

-- Entradas: hora final opcional. NULL = termina cuando empieza la siguiente entrada.
alter table public.entries
  add column if not exists end_time time;
