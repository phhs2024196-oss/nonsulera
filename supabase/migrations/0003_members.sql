-- 회원 기능 1차: 내 대학 진단 저장, 내 기록, 회원 전용 자료, 관리자 통계 확장 (2026-11-24)

alter table public.profiles add column if not exists diag jsonb;           -- 진단 입력(수능 예상 등급 등)
alter table public.profiles add column if not exists saved_schools text[] default '{}'; -- 진단에서 찜한 대학 코드

-- 기록 가능한 이벤트 종류에 diagnosis(진단 실행), save_school(대학 찜) 추가
create or replace function public.log_event(
  p_type text, p_visitor text, p_path text, p_target text, p_referrer text, p_meta jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('page_view','download','wish','click','signup','profile_update','test_result','diagnosis','save_school') then
    raise exception 'bad event type';
  end if;
  insert into public.events (type, visitor_id, user_id, path, target, referrer, meta)
  values (p_type, left(p_visitor, 64), auth.uid(), left(p_path, 200), left(p_target, 80), left(p_referrer, 300),
          case when p_meta is null or pg_column_size(p_meta) > 4000 then '{}'::jsonb else p_meta end);
end $$;

create or replace function public.save_my_diag(p_diag jsonb, p_saved text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.profiles set
    diag = case when p_diag is null or pg_column_size(p_diag) > 2000 then diag else p_diag end,
    saved_schools = coalesce(p_saved[1:20], saved_schools),
    updated_at = now()
  where id = auth.uid();
end $$;

-- 내 기록: 내가 받은 자료, 최근 유형 검사, 진단 횟수
create or replace function public.my_activity() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  return jsonb_build_object(
    'downloads', (select coalesce(jsonb_agg(d), '[]') from (
        select target, count(*) as n, max(created_at) as last from public.events
        where user_id = auth.uid() and type = 'download' group by target order by last desc) d),
    'tests', (select coalesce(jsonb_agg(t), '[]') from (
        select target as code, meta, created_at from public.events
        where user_id = auth.uid() and type = 'test_result' order by created_at desc limit 5) t),
    'diagnoses', (select count(*) from public.events where user_id = auth.uid() and type = 'diagnosis'),
    'joined', (select created_at from public.profiles where id = auth.uid())
  );
end $$;

-- 관리자 통계: 한 화면용 요약 추가
create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare kst_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'kpi', jsonb_build_object(
      'visitors_today', (select count(distinct visitor_id) from public.events where type='page_view' and (created_at at time zone 'Asia/Seoul')::date = kst_today),
      'visitors_7d', (select count(distinct visitor_id) from public.events where type='page_view' and created_at > now() - interval '7 days'),
      'visitors_30d', (select count(distinct visitor_id) from public.events where type='page_view' and created_at > now() - interval '30 days'),
      'visitors_all', (select count(distinct visitor_id) from public.events where type='page_view'),
      'views_all', (select count(*) from public.events where type='page_view'),
      'downloads_all', (select count(*) from public.events where type='download'),
      'downloads_7d', (select count(*) from public.events where type='download' and created_at > now() - interval '7 days'),
      'members', (select count(*) from public.profiles),
      'members_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'tests_all', (select count(*) from public.events where type='test_result'),
      'diagnoses_all', (select count(*) from public.events where type='diagnosis'),
      'first_event', (select min(created_at) from public.events)
    ),
    'downloads', (select coalesce(jsonb_agg(s), '[]') from public.stat_downloads s),
    'daily', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_daily limit 30) s),
    'wishes', (select coalesce(jsonb_agg(s), '[]') from public.stat_wishes s),
    'pages', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_pages limit 15) s),
    'referrers', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_referrers limit 10) s),
    'utm', (select coalesce(jsonb_agg(s), '[]') from (
        select coalesce(meta->>'utm_source', '(없음)') as source, count(*) as n from public.events
        where type='download' group by 1 order by n desc) s),
    'types', (select coalesce(jsonb_agg(s), '[]') from public.stat_types s),
    'saved_schools', (select coalesce(jsonb_agg(s), '[]') from (
        select code, count(*) as n from public.profiles, unnest(saved_schools) as code group by code order by n desc limit 20) s),
    'members_list', (select coalesce(jsonb_agg(m), '[]') from (
        select p.nickname, p.grade, p.nonsul_type, p.created_at, u.raw_app_meta_data->>'provider' as provider,
               coalesce(array_length(p.saved_schools, 1), 0) as saved, p.marketing_ok
        from public.profiles p join auth.users u on u.id = p.id order by p.created_at desc limit 50) m),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('grade', grade, 'target_schools', target_schools,
        'strengths', strengths, 'wanted_books', wanted_books, 'marketing_ok', marketing_ok, 'nonsul_type', nonsul_type)), '[]')
      from public.profiles)
  );
end $$;

revoke execute on function public.save_my_diag(jsonb, text[]), public.my_activity(), public.admin_stats() from public, anon;
grant execute on function public.save_my_diag(jsonb, text[]), public.my_activity(), public.admin_stats() to authenticated;
grant execute on function public.log_event(text,text,text,text,text,jsonb) to anon, authenticated;
