-- =====================================================================
-- 2Gether — avaliar se as tags de acessibilidade estavam certas
-- (Task 4 do Stage 2: "Review a past event's accessibility accuracy")
-- =====================================================================
-- Só é perguntado na review de eventos que têm tags de acessibilidade.
-- Fica a null nos outros. Pode ser corrido mais do que uma vez.
-- =====================================================================

alter table public.reviews
  add column if not exists accessibility_accuracy text;

alter table public.reviews
  drop constraint if exists reviews_accessibility_accuracy_check;

alter table public.reviews
  add constraint reviews_accessibility_accuracy_check
  check (accessibility_accuracy in ('yes', 'partly', 'no'));
