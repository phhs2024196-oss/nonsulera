-- 서버 비밀키 없이 동작하도록: 기록·프로필 수정·관리자 통계를 검증된 함수로만 허용
create or replace function public.log_event(
  p_type text, p_visitor text, p_path text, p_target text, p_referrer text, p_meta jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('page_view','download','wish','click','signup','profile_update','test_result') then
    raise exception 'bad event type';
  end if;
  insert into public.events (type, visitor_id, user_id, path, target, referrer, meta)
  values (p_type, left(p_visitor, 64), auth.uid(), left(p_path, 200), left(p_target, 80), left(p_referrer, 300),
          case when p_meta is null or pg_column_size(p_meta) > 4000 then '{}'::jsonb else p_meta end);
end $$;

create or replace function public.update_my_profile(
  p_nickname text, p_grade text, p_target_schools text[], p_strengths text[], p_wanted_books text[], p_marketing_ok boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.profiles set
    nickname = left(p_nickname, 20), grade = left(p_grade, 10),
    target_schools = p_target_schools[1:6], strengths = p_strengths[1:10], wanted_books = p_wanted_books[1:20],
    marketing_ok = coalesce(p_marketing_ok, false), updated_at = now()
  where id = auth.uid();
end $$;

create or replace function public.set_my_type(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_code !~ '^[VS][BE][QD][AH]$' then return; end if;
  update public.profiles set nonsul_type = p_code, updated_at = now() where id = auth.uid();
end $$;

create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'downloads', (select coalesce(jsonb_agg(s), '[]') from public.stat_downloads s),
    'daily', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_daily limit 14) s),
    'wishes', (select coalesce(jsonb_agg(s), '[]') from public.stat_wishes s),
    'pages', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_pages limit 15) s),
    'referrers', (select coalesce(jsonb_agg(s), '[]') from (select * from public.stat_referrers limit 10) s),
    'types', (select coalesce(jsonb_agg(s), '[]') from public.stat_types s),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('grade', grade, 'target_schools', target_schools,
        'strengths', strengths, 'wanted_books', wanted_books, 'marketing_ok', marketing_ok, 'nonsul_type', nonsul_type)), '[]')
      from public.profiles)
  );
end $$;

revoke execute on function public.log_event(text,text,text,text,text,jsonb), public.update_my_profile(text,text,text[],text[],text[],boolean),
  public.set_my_type(text), public.admin_stats() from public;
grant execute on function public.log_event(text,text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.update_my_profile(text,text,text[],text[],text[],boolean), public.set_my_type(text), public.admin_stats() to authenticated;

-- Supabase 기본 권한이 anon에 직접 실행권을 주므로 회원 전용 함수는 따로 회수
revoke execute on function public.update_my_profile(text,text,text[],text[],text[],boolean), public.set_my_type(text), public.admin_stats() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
