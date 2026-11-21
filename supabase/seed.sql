-- =====================================================================
-- 2Gether — dados de teste para os 3 cenários de avaliação
-- =====================================================================
-- Como usar:
--   1. Criem as 3 contas abaixo em Supabase → Authentication → Users →
--      "Add user" (marca "Auto Confirm User"). As passwords escolham voces.
--   2. Abre Supabase → SQL Editor, cola este ficheiro todo e carrega em Run.
--
-- O ficheiro cria a função public.reset_test_data(), que apaga os dados de
-- teste anteriores (só os das 3 contas de teste) e volta a criá-los com
-- datas relativas a HOJE, e agenda-a (pg_cron) para correr todos os dias
-- às 04:00 UTC. Assim os dados estão sempre frescos, seja qual for o dia em
-- que a app é testada. Também a corre uma vez no fim.
--
-- Repor os dados à mão, a qualquer momento:
--   select public.reset_test_data();
--
-- Desligar a reposição automática:
--   select cron.unschedule('reset-2gether-test-data');
--
-- Pode ser corrido as vezes que quiserem.
--
-- Contas de teste:
--   tester  → a pessoa que faz os cenários (João)
--   maya    → organizadora do padel para iniciantes
--   paul    → organizador da corrida e de outros eventos
-- =====================================================================

create or replace function public.reset_test_data()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  -- ---- contas -------------------------------------------------------
  tester_email constant text := 'joao@2gether.test';
  maya_email   constant text := 'maya@2gether.test';
  paul_email   constant text := 'paul@2gether.test';

  v_tester uuid;
  v_maya   uuid;
  v_paul   uuid;

  -- ---- IDs fixos dos dados de teste -----------------------------------
  e_padel_beg   constant uuid := '2e000000-0000-4000-8000-000000000001';
  e_padel_int   constant uuid := '2e000000-0000-4000-8000-000000000002';
  e_padel_lx    constant uuid := '2e000000-0000-4000-8000-000000000003';
  e_run         constant uuid := '2e000000-0000-4000-8000-000000000004';
  e_yoga        constant uuid := '2e000000-0000-4000-8000-000000000005';
  e_games       constant uuid := '2e000000-0000-4000-8000-000000000006';
  e_volley_full constant uuid := '2e000000-0000-4000-8000-000000000007';
  e_stretch     constant uuid := '2e000000-0000-4000-8000-000000000008';
  e_past_run    constant uuid := '2e000000-0000-4000-8000-000000000009';
  e_past_beach  constant uuid := '2e000000-0000-4000-8000-00000000000a';
  e_past_walk   constant uuid := '2e000000-0000-4000-8000-00000000000b';
  c_stretch     constant uuid := '2c000000-0000-4000-8000-000000000001';

  seed_events uuid[];

  -- ---- datas ----------------------------------------------------------
  today date := current_date;
  next_sat date;
  fmt constant text := 'DD/MM/YYYY, HH24:MI';
begin
  select id into v_tester from auth.users where email = tester_email;
  select id into v_maya   from auth.users where email = maya_email;
  select id into v_paul   from auth.users where email = paul_email;

  if v_tester is null or v_maya is null or v_paul is null then
    raise exception 'Cria primeiro as contas % , % e % (Authentication → Users).',
      tester_email, maya_email, paul_email;
  end if;

  -- Próximo sábado (se hoje for sábado, o da semana seguinte)
  next_sat := today + (((6 - extract(isodow from today)::int) + 7) % 7);
  if next_sat = today then next_sat := today + 7; end if;

  seed_events := array[e_padel_beg, e_padel_int, e_padel_lx, e_run, e_yoga,
                       e_games, e_volley_full, e_stretch, e_past_run,
                       e_past_beach, e_past_walk];

  -- ---- limpar dados de teste anteriores --------------------------------
  -- Eventos criados durante os testes pelas contas de teste também saem
  seed_events := seed_events || array(
    select id from public.events
    where host_id in (v_tester, v_maya, v_paul) and not (id = any(seed_events)));

  delete from public.messages
    where conversation_id in (select id from public.conversations where event_id = any(seed_events));
  delete from public.conversations   where event_id = any(seed_events);
  delete from public.reviews         where event_id = any(seed_events);
  delete from public.event_waitlist  where event_id = any(seed_events);
  delete from public.event_participants where event_id = any(seed_events);
  delete from public.notifications   where event_id = any(seed_events)
                                        or user_id in (v_tester, v_maya, v_paul);
  delete from public.events          where id = any(seed_events);

  -- ---- perfis ------------------------------------------------------------
  insert into public.profiles (id, name, email, bio, interests)
  select p.id, p.name, p.email, p.bio, p.interests
  from jsonb_populate_recordset(null::public.profiles, jsonb_build_array(
    jsonb_build_object('id', v_tester, 'name', 'João Silva', 'email', tester_email,
      'bio', 'Student, just bought my first padel racket.',
      'interests', jsonb_build_array('Padel', 'Running')),
    jsonb_build_object('id', v_maya, 'name', 'Maya Costa', 'email', maya_email,
      'bio', 'Padel coach. Beginners welcome!',
      'interests', jsonb_build_array('Padel', 'Yoga')),
    jsonb_build_object('id', v_paul, 'name', 'Paul Santos', 'email', paul_email,
      'bio', 'Runner and weekend organiser.',
      'interests', jsonb_build_array('Running', 'Volleyball'))
  )) p
  on conflict (id) do update
    set name = excluded.name, email = excluded.email,
        bio = excluded.bio, interests = excluded.interests;

  -- ---- eventos -----------------------------------------------------------
  -- jsonb_populate_recordset converte cada valor para o tipo real da coluna,
  -- por isso funciona quer accessibility/people sejam text[] quer jsonb.
  insert into public.events (id, title, category, sport, level, short, "when",
    place, address, area, lat, lng, host, host_id, capacity, base, people,
    accessibility, description, created_at)
  select e.id, e.title, e.category, e.sport, e.level, e.short, e."when",
    e.place, e.address, e.area, e.lat, e.lng, e.host, e.host_id, e.capacity,
    e.base, e.people, e.accessibility, e.description, e.created_at
  from jsonb_populate_recordset(null::public.events, jsonb_build_array(

    -- Cenário 1: o evento certo (padel, iniciantes, Barreiro, sábado de manhã)
    jsonb_build_object('id', e_padel_beg, 'title', 'Padel for Absolute Beginners',
      'category', 'Sports', 'sport', 'Padel', 'level', 'Beginner',
      'when', to_char(next_sat + time '10:00', fmt), 'short', to_char(next_sat + time '10:00', fmt),
      'place', 'Barreiro Padel Club', 'address', 'Court 2 · Rua Miguel Bombarda', 'area', 'Barreiro',
      'lat', 38.6631, 'lng', -9.0724, 'host', 'Maya Costa', 'host_id', v_maya,
      'capacity', 8, 'base', 0, 'people', '[]'::jsonb,
      'accessibility', jsonb_build_array('Low intensity'),
      'description', 'First time holding a racket? Perfect. Slow-paced games, basic rules explained, no pressure.',
      'created_at', now() - interval '1 minute'),

    -- Cenário 1: distrações (outro nível / outra zona)
    jsonb_build_object('id', e_padel_int, 'title', 'Padel Doubles Night',
      'category', 'Sports', 'sport', 'Padel', 'level', 'Intermediate',
      'when', to_char(next_sat + time '18:30', fmt), 'short', to_char(next_sat + time '18:30', fmt),
      'place', 'Barreiro Padel Club', 'address', 'Court 1', 'area', 'Barreiro',
      'lat', 38.6625, 'lng', -9.0710, 'host', 'Paul Santos', 'host_id', v_paul,
      'capacity', 4, 'base', 0, 'people', '[]'::jsonb, 'accessibility', '[]'::jsonb,
      'description', 'Competitive doubles for players who already know the game.',
      'created_at', now() - interval '2 minutes'),

    jsonb_build_object('id', e_padel_lx, 'title', 'Sunday Padel Mix',
      'category', 'Sports', 'sport', 'Padel', 'level', 'All levels',
      'when', to_char(next_sat + 1 + time '11:00', fmt), 'short', to_char(next_sat + 1 + time '11:00', fmt),
      'place', 'Lisboa Racket Centre', 'address', 'Av. de Berna', 'area', 'Lisboa',
      'lat', 38.7378, 'lng', -9.1476, 'host', 'Maya Costa', 'host_id', v_maya,
      'capacity', 8, 'base', 0, 'people', '[]'::jsonb, 'accessibility', '[]'::jsonb,
      'description', 'Mixed-level games, partners rotate every set.',
      'created_at', now() - interval '3 minutes'),

    -- Cenário 3: corrida futura em que o João está inscrito (para cancelar)
    jsonb_build_object('id', e_run, 'title', 'Riverside 5K Run',
      'category', 'Sports', 'sport', 'Running', 'level', 'Intermediate',
      'when', to_char(today + 3 + time '08:00', fmt), 'short', to_char(today + 3 + time '08:00', fmt),
      'place', 'Parque Tejo', 'address', 'Meeting at the Vasco da Gama tower', 'area', 'Lisboa',
      'lat', 38.7745, 'lng', -9.0918, 'host', 'Paul Santos', 'host_id', v_paul,
      'capacity', 20, 'base', 0, 'people', '[]'::jsonb, 'accessibility', jsonb_build_array('Flat terrain'),
      'description', 'Social 5K at about 6:00/km along the river. Coffee afterwards.',
      'created_at', now() - interval '4 minutes'),

    -- Outros eventos para a app não parecer vazia
    jsonb_build_object('id', e_yoga, 'title', 'Beginner Yoga in the Park',
      'category', 'Sports', 'sport', 'Yoga', 'level', 'Beginner',
      'when', to_char(today + 5 + time '08:30', fmt), 'short', to_char(today + 5 + time '08:30', fmt),
      'place', 'Jardim da Estrela', 'address', 'Near the bandstand', 'area', 'Lisboa',
      'lat', 38.7139, 'lng', -9.1600, 'host', 'Maya Costa', 'host_id', v_maya,
      'capacity', 15, 'base', 0, 'people', '[]'::jsonb,
      'accessibility', jsonb_build_array('Low intensity', 'All ages'),
      'description', 'Gentle 45-minute session. Bring a mat or a towel.',
      'created_at', now() - interval '5 minutes'),

    jsonb_build_object('id', e_games, 'title', 'Board Games Night',
      'category', 'Social', 'sport', 'Board games', 'level', 'All levels',
      'when', to_char(today + 4 + time '19:30', fmt), 'short', to_char(today + 4 + time '19:30', fmt),
      'place', 'Café Tabuleiro', 'address', 'Back room', 'area', 'Almada',
      'lat', 38.6780, 'lng', -9.1560, 'host', 'Paul Santos', 'host_id', v_paul,
      'capacity', 12, 'base', 0, 'people', '[]'::jsonb,
      'accessibility', jsonb_build_array('Wheelchair friendly', 'Low intensity'),
      'description', 'Bring a game or just yourself. We teach the rules.',
      'created_at', now() - interval '6 minutes'),

    -- Evento cheio (mostra a lista de espera)
    jsonb_build_object('id', e_volley_full, 'title', 'Sunset Beach Volleyball',
      'category', 'Sports', 'sport', 'Volleyball', 'level', 'Advanced',
      'when', to_char(today + 6 + time '18:00', fmt), 'short', to_char(today + 6 + time '18:00', fmt),
      'place', 'Costa da Caparica', 'address', 'Praia do CDS', 'area', 'Almada',
      'lat', 38.6400, 'lng', -9.2380, 'host', 'Paul Santos', 'host_id', v_paul,
      'capacity', 1, 'base', 0, 'people', '[]'::jsonb, 'accessibility', '[]'::jsonb,
      'description', 'Fast 2v2 games on the sand.',
      'created_at', now() - interval '7 minutes'),

    -- Evento organizado pelo João (gera as notificações do cenário 2)
    jsonb_build_object('id', e_stretch, 'title', 'Morning Stretch & Walk',
      'category', 'Outdoors', 'sport', 'Walking', 'level', 'All levels',
      'when', to_char(today + 5 + time '09:00', fmt), 'short', to_char(today + 5 + time '09:00', fmt),
      'place', 'Parque da Paz', 'address', 'Main entrance', 'area', 'Almada',
      'lat', 38.6620, 'lng', -9.1650, 'host', 'João Silva', 'host_id', v_tester,
      'capacity', 30, 'base', 0, 'people', '[]'::jsonb,
      'accessibility', jsonb_build_array('Flat terrain', 'Low intensity', 'All ages'),
      'description', 'Easy stretching followed by a 30-minute walk on flat paths.',
      'created_at', now() - interval '8 minutes'),

    -- Cenário 3: eventos passados
    jsonb_build_object('id', e_past_run, 'title', 'Evening River Run',
      'category', 'Sports', 'sport', 'Running', 'level', 'Beginner',
      'when', to_char(today - 3 + time '18:00', fmt), 'short', to_char(today - 3 + time '18:00', fmt),
      'place', 'Parque das Nações', 'address', 'Oceanário entrance', 'area', 'Lisboa',
      'lat', 38.7633, 'lng', -9.0937, 'host', 'Maya Costa', 'host_id', v_maya,
      'capacity', 15, 'base', 0, 'people', '[]'::jsonb, 'accessibility', jsonb_build_array('Flat terrain'),
      'description', 'Easy 4K along the river at a conversational pace.',
      'created_at', now() - interval '20 days'),

    jsonb_build_object('id', e_past_beach, 'title', 'Beach Volleyball Sunday',
      'category', 'Sports', 'sport', 'Volleyball', 'level', 'All levels',
      'when', to_char(today - 14 + time '11:00', fmt), 'short', to_char(today - 14 + time '11:00', fmt),
      'place', 'Costa da Caparica', 'address', 'Praia do Tarquínio', 'area', 'Almada',
      'lat', 38.5750, 'lng', -9.2320, 'host', 'Paul Santos', 'host_id', v_paul,
      'capacity', 12, 'base', 0, 'people', '[]'::jsonb, 'accessibility', '[]'::jsonb,
      'description', 'Casual games, teams mixed every round.',
      'created_at', now() - interval '30 days'),

    jsonb_build_object('id', e_past_walk, 'title', 'Riverside Walk',
      'category', 'Outdoors', 'sport', 'Walking', 'level', 'All levels',
      'when', to_char(today - 10 + time '09:30', fmt), 'short', to_char(today - 10 + time '09:30', fmt),
      'place', 'Seixal Bay', 'address', 'Ferry terminal', 'area', 'Seixal',
      'lat', 38.6420, 'lng', -9.1010, 'host', 'João Silva', 'host_id', v_tester,
      'capacity', 20, 'base', 0, 'people', '[]'::jsonb,
      'accessibility', jsonb_build_array('Flat terrain', 'Wheelchair friendly'),
      'description', 'Flat, paved riverside path with benches.',
      'created_at', now() - interval '25 days')
  )) e;

  -- ---- participações -----------------------------------------------------
  insert into public.event_participants (event_id, user_id) values
    (e_padel_beg,   v_paul),        -- já tem alguém inscrito
    (e_run,         v_tester),      -- cenário 3: o João vai cancelar esta
    (e_run,         v_maya),
    (e_yoga,        v_paul),
    (e_volley_full, v_maya),        -- capacidade 1 → evento cheio
    (e_stretch,     v_maya),
    (e_stretch,     v_paul),
    (e_past_run,    v_tester),      -- cenário 3: evento a avaliar (o mais recente)
    (e_past_run,    v_paul),
    (e_past_beach,  v_tester),      -- já avaliado
    (e_past_walk,   v_maya),
    (e_past_walk,   v_paul);

  -- ---- reviews (feed, perfil, "★ 4" em My events) -------------------------
  insert into public.reviews (event_id, user_id, content, rating, image_path, created_at) values
    (e_past_beach, v_tester, 'Great vibe and very well organised. Teams were balanced!', 4, null, now() - interval '13 days'),
    (e_past_walk,  v_maya,   'Lovely flat route, perfect for my knees. Thanks João!', 5, null, now() - interval '9 days'),
    (e_past_walk,  v_paul,   'Relaxed pace and on time. Would join again.', 4, null, now() - interval '9 days');

  -- ---- conversa (o João, como organizador, tem uma mensagem por ler) -------
  insert into public.conversations (id, event_id, host_id, participant_id)
    values (c_stretch, e_stretch, v_tester, v_maya);
  insert into public.messages (conversation_id, sender_id, content, created_at) values
    (c_stretch, v_maya, 'Hi! Is there parking near the main entrance?', now() - interval '2 hours');

  -- ---- notificações do João (cenário 2: ver e apagar todas) ---------------
  -- As notificações "Someone joined your event" e "New messages" são criadas
  -- pelos triggers (notifications.sql e on_new_message) ao inserir acima.
  insert into public.notifications (user_id, title, message, type, read, event_id, conversation_id, created_at) values
    (v_tester, 'Event reminder', '"Riverside 5K Run" is coming up soon.', 'event', true, e_run, null, now() - interval '1 day'),
    (v_tester, 'How was it?', 'Leave a review for "Evening River Run".', 'event', true, e_past_run, null, now() - interval '2 days');

  raise notice '2Gether: dados de teste criados (próximo sábado = %).', next_sat;
end $$;

-- Só o próprio Supabase (agendador / SQL Editor) pode correr isto;
-- a app e os utilizadores não.
revoke execute on function public.reset_test_data() from public, anon, authenticated;

-- Reposição automática todos os dias às 04:00 UTC
select cron.unschedule(jobid)
from cron.job
where jobname = 'reset-2gether-test-data';

select cron.schedule(
  'reset-2gether-test-data',
  '0 4 * * *',
  'select public.reset_test_data();'
);

-- E corre já uma vez
select public.reset_test_data();
