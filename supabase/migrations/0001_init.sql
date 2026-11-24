-- 논술의 시대 사이트 기본 스키마 (Supabase SQL Editor에 그대로 붙여 실행)

-- 1. 회원 프로필: auth.users 1:1
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  grade text,                       -- 고1/고2/고3/N수/학부모/교사·강사
  target_schools text[] default '{}',
  strengths text[] default '{}',    -- 강한 과목
  wanted_books text[] default '{}', -- 관심 교재
  nonsul_type text,                 -- 논술 유형 검사 결과(예: SEDA)
  marketing_ok boolean default false,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "본인 프로필 읽기" on public.profiles for select using (auth.uid() = id);
-- 수정은 서버(/api/profile)가 허용된 칸만 골라 대신 저장한다(is_admin 위조 차단)

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. 행동 기록: 방문·다운로드·관심 투표·클릭 전부 한 테이블
create table if not exists public.events (
  id bigint generated always as identity primary key,
  type text not null,               -- page_view | download | wish | click | signup | profile_update | test_result
  visitor_id text,                  -- 비로그인 방문자 식별(1st-party 쿠키, 무작위값)
  user_id uuid references auth.users(id) on delete set null,
  path text,
  target text,                      -- 자료 slug, 교재 key 등
  referrer text,
  meta jsonb default '{}'::jsonb,   -- utm 등
  created_at timestamptz default now()
);
create index if not exists events_type_time on public.events (type, created_at desc);
create index if not exists events_target on public.events (type, target);
create index if not exists events_user on public.events (user_id);
alter table public.events enable row level security; -- 정책 없음: 0002의 log_event 함수로만 기록

-- 3. 관리자 통계용 뷰
create or replace view public.stat_downloads with (security_invoker = on) as
  select target, count(*) as total,
         count(distinct coalesce(user_id::text, visitor_id)) as unique_people,
         count(*) filter (where created_at > now() - interval '7 days') as last_7d
  from public.events where type = 'download' group by target;

create or replace view public.stat_daily with (security_invoker = on) as
  select (created_at at time zone 'Asia/Seoul')::date as day,
         count(*) filter (where type = 'page_view') as views,
         count(distinct visitor_id) filter (where type = 'page_view') as visitors,
         count(*) filter (where type = 'download') as downloads,
         count(*) filter (where type = 'signup') as signups
  from public.events group by 1 order by 1 desc;

create or replace view public.stat_wishes with (security_invoker = on) as
  select target, count(distinct coalesce(user_id::text, visitor_id)) as people
  from public.events where type = 'wish' group by target order by people desc;

create or replace view public.stat_pages with (security_invoker = on) as
  select path, count(*) as views, count(distinct visitor_id) as visitors
  from public.events where type = 'page_view' and created_at > now() - interval '30 days'
  group by path order by views desc;

create or replace view public.stat_referrers with (security_invoker = on) as
  select coalesce(meta->>'utm_source', nullif(split_part(split_part(referrer, '://', 2), '/', 1), ''), '(직접)') as source,
         count(distinct visitor_id) as visitors
  from public.events where type = 'page_view' and created_at > now() - interval '30 days'
  group by 1 order by visitors desc;

create or replace view public.stat_types with (security_invoker = on) as
  select target as code, count(*) as results,
         count(distinct coalesce(user_id::text, visitor_id)) as people
  from public.events where type = 'test_result' group by target order by people desc;

revoke all on public.stat_types, public.stat_downloads, public.stat_daily, public.stat_wishes, public.stat_pages, public.stat_referrers from anon, authenticated;

-- 관리자 지정: 대표 계정으로 한 번 로그인한 뒤 실행
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = '대표 이메일');
