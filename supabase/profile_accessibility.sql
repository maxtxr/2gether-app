-- =====================================================================
-- 2Gether — preferências de acessibilidade do perfil
-- =====================================================================
-- A app grava aqui as opções escolhidas em "Accessibility & Preferences"
-- (Edit Profile): por exemplo ["Wheelchair friendly", "Low intensity"].
--
-- Sem esta coluna, o ecrã de edição continua a funcionar mas as escolhas
-- não ficam guardadas. Pode ser corrido mais do que uma vez.
-- =====================================================================

alter table public.profiles
  add column if not exists accessibility jsonb not null default '[]'::jsonb;
