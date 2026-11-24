-- 사람만 집계: 브라우저 정보(ua) 기록, 로봇·링크 미리보기 표시, 관리자(대표) 기기 제외 (2026-11-24)
alter table public.events add column if not exists ua text;
alter table public.events add column if not exists is_bot boolean default false;

create or replace function public.log_event(
  p_type text, p_visitor text, p_path text, p_target text, p_referrer text, p_meta jsonb, p_ua text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('page_view','download','wish','click','signup','profile_update','test_result','diagnosis','save_school') then
    raise exception 'bad event type';
  end if;
  insert into public.events (type, visitor_id, user_id, path, target, referrer, meta, ua, is_bot)
  values (p_type, left(p_visitor, 64), auth.uid(), left(p_path, 200), left(p_target, 80), left(p_referrer, 300),
          case when p_meta is null or pg_column_size(p_meta) > 4000 then '{}'::jsonb else p_meta end,
          left(p_ua, 300),
          coalesce(p_ua, '') = '' or p_ua ~* '(bot|crawl|spider|slurp|preview|scrap|facebookexternalhit|facebot|whatsapp|telegram|discord|slack|yeti|daum|headless|python|curl|wget|go-http|node-fetch|axios|okhttp|java/|libwww|httpclient|vercel|lighthouse|pingdom|uptime|monitor)');
end $$;
revoke execute on function public.log_event(text,text,text,text,text,jsonb,text) from public;
grant execute on function public.log_event(text,text,text,text,text,jsonb,text) to anon, authenticated;

-- 관리자 계정이 쓴 브라우저(로그인 전 기록 포함)
create or replace view public.admin_visitors with (security_invoker = on) as
  select distinct e.visitor_id from public.events e join public.profiles p on p.id = e.user_id
  where p.is_admin and e.visitor_id is not null;

-- 통계에 쓰는 '사람' 기록: 로봇 아님 + 관리자 계정·기기 아님
create or replace view public.events_human with (security_invoker = on) as
  select e.* from public.events e
  where not coalesce(e.is_bot, false)
    and (e.user_id is null or e.user_id not in (select id from public.profiles where is_admin))
    and (e.visitor_id is null or e.visitor_id not in (select visitor_id from public.admin_visitors));

create or replace view public.stat_downloads with (security_invoker = on) as
  select target, count(*) as total,
         count(distinct coalesce(user_id::text, visitor_id)) as unique_people,
         count(*) filter (where created_at > now() - interval '7 days') as last_7d
  from public.events_human where type = 'download' group by target;

create or replace view public.stat_daily with (security_invoker = on) as
  select (created_at at time zone 'Asia/Seoul')::date as day,
         count(*) filter (where type = 'page_view') as views,
         count(distinct visitor_id) filter (where type = 'page_view') as visitors,
         count(*) filter (where type = 'download') as downloads,
         count(*) filter (where type = 'signup') as signups
  from public.events_human group by 1 order by 1 desc;

create or replace view public.stat_wishes with (security_invoker = on) as
  select target, count(distinct coalesce(user_id::text, visitor_id)) as people
  from public.events_human where type = 'wish' group by target order by people desc;

create or replace view public.stat_pages with (security_invoker = on) as
  select path, count(*) as views, count(distinct visitor_id) as visitors
  from public.events_human where type = 'page_view' and created_at > now() - interval '30 days'
  group by path order by views desc;

create or replace view public.stat_referrers with (security_invoker = on) as
  select coalesce(meta->>'utm_source', nullif(split_part(split_part(referrer, '://', 2), '/', 1), ''), '(직접)') as source,
         count(distinct visitor_id) as visitors
  from public.events_human
  where type = 'page_view' and created_at > now() - interval '30 days'
    and coalesce(split_part(split_part(referrer, '://', 2), '/', 1), '') !~ '^(nonsulera[a-z0-9-]*\.vercel\.app|localhost(:\d+)?)$'
  group by 1 order by visitors desc;

create or replace view public.stat_types with (security_invoker = on) as
  select target as code, count(*) as results,
         count(distinct coalesce(user_id::text, visitor_id)) as people
  from public.events_human where type = 'test_result' group by target order by people desc;

revoke all on public.events_human, public.admin_visitors, public.stat_types, public.stat_downloads, public.stat_daily,
  public.stat_wishes, public.stat_pages, public.stat_referrers from anon, authenticated;

-- 관리자 통계: KPI도 사람 기록 기준 + 제외된 건수 표시
create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare kst_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'kpi', jsonb_build_object(
      'visitors_today', (select count(distinct visitor_id) from public.events_human where type='page_view' and (created_at at time zone 'Asia/Seoul')::date = kst_today),
      'visitors_7d', (select count(distinct visitor_id) from public.events_human where type='page_view' and created_at > now() - interval '7 days'),
      'visitors_30d', (select count(distinct visitor_id) from public.events_human where type='page_view' and created_at > now() - interval '30 days'),
      'visitors_all', (select count(distinct visitor_id) from public.events_human where type='page_view'),
      'views_all', (select count(*) from public.events_human where type='page_view'),
      'downloads_all', (select count(*) from public.events_human where type='download'),
      'downloads_7d', (select count(*) from public.events_human where type='download' and created_at > now() - interval '7 days'),
      'members', (select count(*) from public.profiles where not is_admin),
      'members_7d', (select count(*) from public.profiles where not is_admin and created_at > now() - interval '7 days'),
      'tests_all', (select count(*) from public.events_human where type='test_result'),
      'diagnoses_all', (select count(*) from public.events_human where type='diagnosis'),
      'first_event', (select min(created_at) from public.events),
      'excluded_bot', (select count(*) from public.events where is_bot),
      'excluded_admin', (select count(*) from public.events) - (select count(*) from public.events where is_bot) - (select count(*) from public.events_human)
    ),
    'downloads', (select coalesce(jsonb_agg(s), '[]') from public.stat_downloads s),
    'daily', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_daily limit 30) s),
    'wishes', (select coalesce(jsonb_agg(s), '[]') from public.stat_wishes s),
    'pages', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_pages limit 15) s),
    'referrers', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_referrers limit 10) s),
    'utm', (select coalesce(jsonb_agg(s), '[]') from (
        select coalesce(meta->>'utm_source', '(없음)') as source, count(*) as n from public.events_human
        where type='download' group by 1 order by n desc) s),
    'bots', (select coalesce(jsonb_agg(s), '[]') from (
        select type, left(ua, 60) as ua, count(*) as n from public.events where is_bot group by 1, 2 order by n desc limit 10) s),
    'types', (select coalesce(jsonb_agg(s), '[]') from public.stat_types s),
    'saved_schools', (select coalesce(jsonb_agg(s), '[]') from (
        select code, count(*) as n from public.profiles, unnest(saved_schools) as code where not is_admin group by code order by n desc limit 20) s),
    'members_list', (select coalesce(jsonb_agg(m), '[]') from (
        select p.nickname, p.grade, p.nonsul_type, p.created_at, u.raw_app_meta_data->>'provider' as provider,
               coalesce(array_length(p.saved_schools, 1), 0) as saved, p.marketing_ok, p.is_admin
        from public.profiles p join auth.users u on u.id = p.id order by p.created_at desc limit 50) m),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('grade', grade, 'target_schools', target_schools,
        'strengths', strengths, 'wanted_books', wanted_books, 'marketing_ok', marketing_ok, 'nonsul_type', nonsul_type)), '[]')
      from public.profiles where not is_admin)
  );
end $$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
