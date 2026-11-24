-- 오답 노트 v2: 틀린 이유, 간격 복습(1·3·6주), 실전 타이머 기록 (2026-11-24)
alter table public.item_notes add column if not exists causes text[] default '{}';
alter table public.item_notes add column if not exists time_sec int;
alter table public.item_notes add column if not exists review_at date;
alter table public.item_notes add column if not exists review_step int not null default 0;
alter table public.item_notes add column if not exists tries int not null default 0;

-- p_event: mark(상태 표시) / review_ok(복습에서 맞힘) / review_fail(복습에서 또 틀림) / memo(메모·이유만) / time(타이머 기록)
create or replace function public.save_note2(p_item text, p_school text, p_status text, p_memo text, p_causes text[], p_time int, p_event text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Seoul')::date; r public.item_notes;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_event not in ('mark','review_ok','review_fail','memo','time') then raise exception 'bad event'; end if;
  if p_event = 'mark' and coalesce(p_status, '') = '' then
    delete from public.item_notes where user_id = auth.uid() and item_id = left(p_item, 40);
    return null;
  end if;
  if p_status is not null and p_status <> '' and p_status not in ('solved','wrong','retry') then raise exception 'bad status'; end if;

  insert into public.item_notes (user_id, item_id, school, status, memo, causes, time_sec, tries)
  values (auth.uid(), left(p_item, 40), left(p_school, 12), coalesce(nullif(p_status, ''), 'retry'), left(p_memo, 1000),
          coalesce(p_causes[1:6], '{}'), case when p_time between 1 and 36000 then p_time end, case when p_event = 'time' then 1 else 0 end)
  on conflict (user_id, item_id) do nothing;

  select * into r from public.item_notes where user_id = auth.uid() and item_id = left(p_item, 40);

  if p_event = 'mark' then
    update public.item_notes set status = p_status,
      review_step = case when p_status = 'solved' then review_step else 0 end,
      review_at = case when p_status = 'solved' then null else today + 7 end,
      tries = tries + 1, updated_at = now()
    where user_id = r.user_id and item_id = r.item_id;
  elsif p_event = 'review_ok' then
    update public.item_notes set review_step = review_step + 1,
      review_at = case review_step when 0 then today + 14 when 1 then today + 21 else null end,
      status = case when review_step >= 2 then 'solved' else status end,
      tries = tries + 1, updated_at = now()
    where user_id = r.user_id and item_id = r.item_id;
  elsif p_event = 'review_fail' then
    update public.item_notes set status = 'wrong', review_step = 0, review_at = today + 7, tries = tries + 1, updated_at = now()
    where user_id = r.user_id and item_id = r.item_id;
  elsif p_event = 'memo' then
    update public.item_notes set memo = left(p_memo, 1000), causes = coalesce(p_causes[1:6], causes), updated_at = now()
    where user_id = r.user_id and item_id = r.item_id;
  elsif p_event = 'time' then
    update public.item_notes set time_sec = case when p_time between 1 and 36000 then p_time else time_sec end, updated_at = now()
    where user_id = r.user_id and item_id = r.item_id;
  end if;

  select * into r from public.item_notes where user_id = auth.uid() and item_id = left(p_item, 40);
  return jsonb_build_object('status', r.status, 'review_at', r.review_at, 'review_step', r.review_step, 'time_sec', r.time_sec, 'causes', r.causes, 'memo', r.memo);
end $$;
revoke execute on function public.save_note2(text,text,text,text,text[],int,text) from public, anon;
grant execute on function public.save_note2(text,text,text,text,text[],int,text) to authenticated;

-- 관리자: 오답 노트 심화 통계
create or replace function public.admin_notes_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'causes', (select coalesce(jsonb_agg(s), '[]') from (
        select c as cause, count(*) as n from public.item_notes n join public.profiles p on p.id = n.user_id, unnest(n.causes) c
        where not p.is_admin group by c order by n desc) s),
    'review_due', (select count(*) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin and review_at <= today),
    'review_pending', (select count(*) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin and review_at is not null),
    'review_done', (select count(*) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin and review_step >= 3),
    'timed', (select count(*) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin and time_sec is not null),
    'active_7d', (select count(distinct user_id) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin and n.updated_at > now() - interval '7 days')
  );
end $$;
revoke execute on function public.admin_notes_stats() from public, anon;
grant execute on function public.admin_notes_stats() to authenticated;
