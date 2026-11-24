-- 접속 주체 분류(사람/검색로봇/AI/링크 미리보기/자동화 도구) + 대표·Claude 활동은 기록하지 않음 (2026-11-24)
alter table public.events add column if not exists agent_kind text default 'human';

create or replace function public.agent_kind(p_ua text) returns text
language sql immutable as $$
  select case
    when coalesce(p_ua, '') = '' then 'tool'
    when p_ua ~* '(gptbot|chatgpt|oai-searchbot|claudebot|claude-web|claude-user|anthropic|perplexity|google-extended|googleother|ccbot|bytespider|amazonbot|applebot-extended|meta-externalagent|cohere|diffbot|youbot|mistral|ai2bot|timpibot|petalbot)' then 'ai'
    when p_ua ~* '(facebookexternalhit|facebot|meta-externalfetcher|kakaotalk-scrap|twitterbot|slackbot|discordbot|telegrambot|whatsapp|linkedinbot|skypeuripreview|embedly|preview|scrap|line/|pinterest)' then 'preview'
    when p_ua ~* '(googlebot|bingbot|yeti|naver|daum|daumoa|duckduckbot|baiduspider|yandex|seznam|sogou|applebot|crawl|spider|slurp|bot\b|bot/)' then 'search'
    when p_ua ~* '(headless|python|curl|wget|go-http|node-fetch|axios|okhttp|java/|libwww|httpclient|vercel|lighthouse|pingdom|uptime|monitor|playwright|puppeteer|selenium|phantom)' then 'tool'
    else 'human' end
$$;

create or replace function public.log_event(
  p_type text, p_visitor text, p_path text, p_target text, p_referrer text, p_meta jsonb, p_ua text
) returns void
language plpgsql security definer set search_path = public as $$
declare k text := public.agent_kind(p_ua);
begin
  if p_type not in ('page_view','download','wish','click','signup','profile_update','test_result','diagnosis','save_school') then
    raise exception 'bad event type';
  end if;
  -- 관리자(대표) 계정 활동은 기록하지 않는다
  if exists (select 1 from public.profiles where id = auth.uid() and is_admin) then return; end if;
  insert into public.events (type, visitor_id, user_id, path, target, referrer, meta, ua, is_bot, agent_kind)
  values (p_type, left(p_visitor, 64), auth.uid(), left(p_path, 200), left(p_target, 80), left(p_referrer, 300),
          case when p_meta is null or pg_column_size(p_meta) > 4000 then '{}'::jsonb else p_meta end,
          left(p_ua, 300), k <> 'human', k);
end $$;
revoke execute on function public.log_event(text,text,text,text,text,jsonb,text) from public;
grant execute on function public.log_event(text,text,text,text,text,jsonb,text) to anon, authenticated;
-- 예전 6인자 함수는 더 이상 쓰지 않으므로 실행 권한 회수
revoke execute on function public.log_event(text,text,text,text,text,jsonb) from public, anon, authenticated;

-- 기존 기록 재분류
update public.events set agent_kind = public.agent_kind(ua), is_bot = public.agent_kind(ua) <> 'human' where ua is not null;
update public.events set agent_kind = 'tool', is_bot = true
  where referrer ~ '^https?://nonsulera-[a-z0-9]+-uuu-b847\.vercel\.app';

create or replace view public.stat_agents with (security_invoker = on) as
  select agent_kind, type, count(*) as n, count(distinct visitor_id) as visitors,
         count(*) filter (where created_at > now() - interval '7 days') as last_7d
  from public.events where agent_kind <> 'human' group by 1, 2 order by n desc;
revoke all on public.stat_agents from anon, authenticated;

-- 관리자 통계: 비인간 기록을 분류별로
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
      'excluded_admin', 0
    ),
    'downloads', (select coalesce(jsonb_agg(s), '[]') from public.stat_downloads s),
    'daily', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_daily limit 30) s),
    'wishes', (select coalesce(jsonb_agg(s), '[]') from public.stat_wishes s),
    'pages', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_pages limit 15) s),
    'referrers', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_referrers limit 10) s),
    'utm', (select coalesce(jsonb_agg(s), '[]') from (
        select coalesce(meta->>'utm_source', '(없음)') as source, count(*) as n from public.events_human
        where type='download' group by 1 order by n desc) s),
    'agents', (select coalesce(jsonb_agg(s), '[]') from public.stat_agents s),
    'agent_ua', (select coalesce(jsonb_agg(s), '[]') from (
        select agent_kind, left(ua, 70) as ua, count(*) as n from public.events where agent_kind <> 'human' group by 1, 2 order by n desc limit 15) s),
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
