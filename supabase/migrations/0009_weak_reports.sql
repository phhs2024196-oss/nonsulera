-- 약점 리포트: 다시 볼 문항이 10개, 20개, 30개…에 이를 때마다 한 번씩 만든다 (2026-11-24)
create table if not exists public.weak_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  level int not null,
  report jsonb not null,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, level)
);
alter table public.weak_reports enable row level security;
create policy "own reports read" on public.weak_reports for select using (auth.uid() = user_id);

create or replace function public.save_weak_report(p_level int, p_report jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_bad int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select count(*) into v_bad from public.item_notes where user_id = auth.uid() and status in ('wrong','retry');
  if p_level < 10 or p_level % 10 <> 0 or v_bad < p_level then raise exception 'not yet'; end if;
  if pg_column_size(p_report) > 60000 then raise exception 'too big'; end if;
  insert into public.weak_reports (user_id, level, report) values (auth.uid(), p_level, p_report)
  on conflict (user_id, level) do nothing returning id into v_id;
  return v_id;
end $$;

create or replace function public.mark_report_seen(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.weak_reports set seen = true where id = p_id and user_id = auth.uid();
end $$;

create or replace function public.admin_reports_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'reports', (select count(*) from public.weak_reports r join public.profiles p on p.id = r.user_id where not p.is_admin),
    'users', (select count(distinct user_id) from public.weak_reports r join public.profiles p on p.id = r.user_id where not p.is_admin),
    'seen', (select count(*) from public.weak_reports r join public.profiles p on p.id = r.user_id where not p.is_admin and seen),
    'top_units', (select coalesce(jsonb_agg(s), '[]') from (
        select x->>'k' as unit, count(*) as n from public.weak_reports r join public.profiles p on p.id = r.user_id,
          jsonb_array_elements(r.report->'unit') with ordinality as t(x, i)
        where not p.is_admin and i = 1 group by 1 order by n desc limit 10) s)
  );
end $$;

revoke execute on function public.save_weak_report(int, jsonb), public.mark_report_seen(bigint), public.admin_reports_stats() from public, anon;
grant execute on function public.save_weak_report(int, jsonb), public.mark_report_seen(bigint), public.admin_reports_stats() to authenticated;
