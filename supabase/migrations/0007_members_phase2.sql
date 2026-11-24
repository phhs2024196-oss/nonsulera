-- 회원 기능 2차: 목표 대학 소식(2), 기출 오답 노트(5), 질문 접수형 Q&A(6) (2026-11-24)

-- 5. 기출 오답 노트: 문항별 내 상태와 메모
create table if not exists public.item_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  school text not null,
  status text not null check (status in ('solved','wrong','retry')),
  memo text,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.item_notes enable row level security;
create policy "own notes read" on public.item_notes for select using (auth.uid() = user_id);

create or replace function public.save_note(p_item text, p_school text, p_status text, p_memo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_status is null or p_status = '' then
    delete from public.item_notes where user_id = auth.uid() and item_id = left(p_item, 40);
    return;
  end if;
  if p_status not in ('solved','wrong','retry') then raise exception 'bad status'; end if;
  insert into public.item_notes (user_id, item_id, school, status, memo, updated_at)
  values (auth.uid(), left(p_item, 40), left(p_school, 12), p_status, left(p_memo, 1000), now())
  on conflict (user_id, item_id) do update set status = excluded.status, memo = excluded.memo, school = excluded.school, updated_at = now();
end $$;

-- 6. 질문 접수형 Q&A
create table if not exists public.questions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  nickname text,
  topic text,
  body text not null,
  answer text,
  is_public boolean not null default false,
  status text not null default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
alter table public.questions enable row level security;
create policy "own questions read" on public.questions for select using (auth.uid() = user_id);
create policy "public answers read" on public.questions for select using (status = 'answered' and is_public);

create or replace function public.ask_question(p_topic text, p_body text, p_public boolean) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_recent int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if length(coalesce(trim(p_body), '')) < 10 then raise exception 'too short'; end if;
  select count(*) into v_recent from public.questions where user_id = auth.uid() and created_at > now() - interval '1 day';
  if v_recent >= 5 then raise exception 'too many'; end if;
  insert into public.questions (user_id, nickname, topic, body, is_public)
  values (auth.uid(), (select nickname from public.profiles where id = auth.uid()), left(p_topic, 40), left(p_body, 3000), coalesce(p_public, false))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_answer(p_id bigint, p_answer text, p_public boolean, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'forbidden'; end if;
  update public.questions set
    answer = nullif(trim(p_answer), ''),
    is_public = coalesce(p_public, is_public),
    status = coalesce(p_status, case when nullif(trim(p_answer), '') is null then 'open' else 'answered' end),
    answered_at = case when nullif(trim(p_answer), '') is null then null else coalesce(answered_at, now()) end
  where id = p_id;
end $$;

-- 2. 목표 대학 소식: 관리자가 학교별 소식을 올리면 그 학교를 찜한 회원의 내 기록에 뜬다
create table if not exists public.school_notices (
  id bigint generated always as identity primary key,
  school text not null,
  title text not null,
  body text,
  url text,
  created_at timestamptz not null default now()
);
alter table public.school_notices enable row level security;
create policy "notices read" on public.school_notices for select using (true);

create or replace function public.admin_notice(p_school text, p_title text, p_body text, p_url text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'forbidden'; end if;
  insert into public.school_notices (school, title, body, url)
  values (left(p_school, 12), left(p_title, 120), left(p_body, 2000), nullif(left(p_url, 400), ''));
end $$;

-- 관리자: 2차 기능 통계·목록
create or replace function public.admin_members_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'notes_users', (select count(distinct user_id) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin),
    'notes_total', (select count(*) from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin),
    'notes_by_status', (select coalesce(jsonb_object_agg(status, c), '{}') from (
        select status, count(*) c from public.item_notes n join public.profiles p on p.id = n.user_id where not p.is_admin group by status) s),
    'wrong_top', (select coalesce(jsonb_agg(s), '[]') from (
        select item_id, school, count(*) as n from public.item_notes n join public.profiles p on p.id = n.user_id
        where not p.is_admin and status in ('wrong','retry') group by item_id, school order by n desc limit 15) s),
    'notes_schools', (select coalesce(jsonb_agg(s), '[]') from (
        select school, count(distinct user_id) as users, count(*) as n from public.item_notes n join public.profiles p on p.id = n.user_id
        where not p.is_admin group by school order by users desc limit 15) s),
    'questions', (select coalesce(jsonb_agg(q), '[]') from (
        select id, nickname, topic, body, answer, is_public, status, created_at, answered_at from public.questions
        order by (status = 'open') desc, created_at desc limit 100) q),
    'notices', (select coalesce(jsonb_agg(n), '[]') from (
        select id, school, title, url, created_at from public.school_notices order by created_at desc limit 50) n)
  );
end $$;

revoke execute on function public.save_note(text,text,text,text), public.ask_question(text,text,boolean),
  public.admin_answer(bigint,text,boolean,text), public.admin_notice(text,text,text,text),
  public.admin_members_stats() from public, anon;
grant execute on function public.save_note(text,text,text,text), public.ask_question(text,text,boolean),
  public.admin_answer(bigint,text,boolean,text), public.admin_notice(text,text,text,text),
  public.admin_members_stats() to authenticated;
