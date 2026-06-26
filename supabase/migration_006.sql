-- ============================================================
--  Migración 006
--  - ANÁLISIS POR ÍTEM: columna `analysis` (Markdown largo, opcional)
--    en `entries` y `notes`. Permite adjuntar a un log o nota un
--    análisis generado externamente (ChatGPT/Claude), mostrado
--    colapsado en la app.
--    * NULL = sin análisis (estado por defecto).
--  Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================

alter table public.entries add column if not exists analysis text;
alter table public.notes   add column if not exists analysis text;
