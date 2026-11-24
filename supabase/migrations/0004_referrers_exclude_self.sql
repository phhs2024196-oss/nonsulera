-- 유입 경로에서 우리 사이트 자신(내부 이동)과 localhost 제외
create or replace view public.stat_referrers with (security_invoker = on) as
  select coalesce(meta->>'utm_source', nullif(split_part(split_part(referrer, '://', 2), '/', 1), ''), '(직접)') as source,
         count(distinct visitor_id) as visitors
  from public.events
  where type = 'page_view' and created_at > now() - interval '30 days'
    and coalesce(split_part(split_part(referrer, '://', 2), '/', 1), '') !~ '^(nonsulera[a-z0-9-]*\.vercel\.app|localhost(:\d+)?)$'
  group by 1 order by visitors desc;
revoke all on public.stat_referrers from anon, authenticated;
