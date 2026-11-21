-- =====================================================================
-- 2Gether — notificar o organizador quando alguém se inscreve num evento
-- =====================================================================
-- A app não pode criar notificações para outros utilizadores (a política
-- RLS da tabela notifications só deixa cada um criar as suas). Por isso é a
-- base de dados que cria esta notificação, tal como já acontece com as
-- mensagens (trigger on_new_message) e com a lista de espera
-- (trigger_notify_waitlist).
--
-- Pode ser corrido outra vez sem problema.
-- =====================================================================

create or replace function public.notify_host_on_join()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_host_id uuid;
  v_title text;
  v_name text;
begin
  select host_id, title into v_host_id, v_title
  from public.events
  where id = new.event_id;

  -- Sem organizador, ou o organizador inscreveu-se no próprio evento
  if v_host_id is null or v_host_id = new.user_id then
    return new;
  end if;

  select name into v_name from public.profiles where id = new.user_id;

  insert into public.notifications (user_id, title, message, type, read, event_id, created_at)
  values (
    v_host_id,
    'Someone joined your event',
    coalesce(v_name, 'Someone') || ' joined "' || coalesce(v_title, 'your event') || '".',
    'event',
    false,
    new.event_id,
    now()
  );

  return new;
end;
$function$;

drop trigger if exists trigger_notify_host_on_join on public.event_participants;

create trigger trigger_notify_host_on_join
after insert on public.event_participants
for each row execute function public.notify_host_on_join();
