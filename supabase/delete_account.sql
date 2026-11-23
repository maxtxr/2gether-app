
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  hosted_ids uuid[];
  conv_ids uuid[];
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(array_agg(id), '{}') into hosted_ids
  from public.events
  where host_id = uid;

  select coalesce(array_agg(id), '{}') into conv_ids
  from public.conversations
  where host_id = uid
     or participant_id = uid
     or event_id = any(hosted_ids);

  if array_length(conv_ids, 1) is not null then
    delete from public.messages where conversation_id = any(conv_ids);
    delete from public.notifications where conversation_id = any(conv_ids);
    delete from public.conversations where id = any(conv_ids);
  end if;

  delete from public.notifications
  where user_id = uid
     or event_id = any(hosted_ids);

  delete from public.reviews
  where user_id = uid
     or event_id = any(hosted_ids);

  delete from public.event_waitlist
  where user_id = uid
     or event_id = any(hosted_ids);

  delete from public.event_participants
  where user_id = uid
     or event_id = any(hosted_ids);

  if array_length(hosted_ids, 1) is not null then
    delete from public.events where id = any(hosted_ids);
  end if;

  delete from public.profiles where id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- Precisas destas policies para a app conseguir limpar ficheiros antes do delete
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own review images" on storage.objects;
create policy "Users can delete their own review images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'review-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Hosts can delete their event images" on storage.objects;
create policy "Hosts can delete their event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
