-- =====================================================================
-- 2Gether — subcategoria e ícone dos eventos
-- =====================================================================
-- A app grava estes dois campos ao criar/editar um evento:
--   events.subcategory  → ex.: "Padel", "Yoga" (src/data/options.js)
--   events.icon         → nome do ícone MaterialCommunityIcons
--
-- Pode ser corrido outra vez sem problema.
-- =====================================================================

alter table public.events
  add column if not exists subcategory text;

alter table public.events
  add column if not exists icon text;
