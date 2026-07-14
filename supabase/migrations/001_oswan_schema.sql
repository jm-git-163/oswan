-- Oswan / 오스완 — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Or: supabase db push (CLI)

create extension if not exists "pgcrypto";

-- ── Identity ──────────────────────────────────────────────
create table if not exists public.soft_users (
  id uuid primary key,
  nickname text not null check (char_length(nickname) between 1 and 12),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  auth_user_id uuid null references auth.users (id) on delete set null,
  platform text default 'web',
  app_version text
);

create index if not exists soft_users_last_seen_idx on public.soft_users (last_seen_at desc);

-- ── Sessions ────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key,
  soft_user_id uuid not null references public.soft_users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  reps int not null check (reps >= 0),
  target_reps int not null check (target_reps > 0),
  cleared boolean not null default false,
  duration_ms int not null check (duration_ms >= 0),
  form_score numeric(5,2),
  rule_version text not null default 'hss-v3',
  challenge_id uuid,
  source text not null default 'free' check (source in ('free', 'challenge', 'practice')),
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_ended_idx
  on public.sessions (soft_user_id, ended_at desc);
create index if not exists sessions_ended_idx
  on public.sessions (ended_at desc);

-- ── Challenges ──────────────────────────────────────────
create table if not exists public.challenges (
  id uuid primary key,
  from_soft_user_id uuid not null references public.soft_users (id) on delete cascade,
  from_nickname text not null,
  to_soft_user_id uuid null references public.soft_users (id) on delete set null,
  to_nickname text,
  target_reps int not null check (target_reps > 0),
  deadline_at timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'accepted', 'completed', 'expired', 'declined')),
  rule_version text not null default 'hss-v3',
  win_mode text not null default 'clear_target',
  from_cleared boolean,
  to_cleared boolean,
  from_session_id uuid,
  to_session_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists challenges_status_idx on public.challenges (status, deadline_at);

-- ── Daily stats (그래프·랭킹용 집계) ─────────────────────
create table if not exists public.daily_stats (
  soft_user_id uuid not null references public.soft_users (id) on delete cascade,
  day date not null,
  reps_sum int not null default 0,
  sessions_count int not null default 0,
  clears_count int not null default 0,
  primary key (soft_user_id, day)
);

create index if not exists daily_stats_day_reps_idx
  on public.daily_stats (day desc, reps_sum desc);

-- 세션 저장 시 daily_stats upsert
create or replace function public.tg_sessions_daily_stats()
returns trigger
language plpgsql
as $$
begin
  insert into public.daily_stats as d (soft_user_id, day, reps_sum, sessions_count, clears_count)
  values (
    new.soft_user_id,
    (new.ended_at at time zone 'Asia/Seoul')::date,
    new.reps,
    1,
    case when new.cleared then 1 else 0 end
  )
  on conflict (soft_user_id, day) do update
  set
    reps_sum = d.reps_sum + excluded.reps_sum,
    sessions_count = d.sessions_count + 1,
    clears_count = d.clears_count + excluded.clears_count;
  return new;
end;
$$;

drop trigger if exists trg_sessions_daily_stats on public.sessions;
create trigger trg_sessions_daily_stats
after insert on public.sessions
for each row execute function public.tg_sessions_daily_stats();

-- last_seen touch
create or replace function public.tg_touch_soft_user()
returns trigger
language plpgsql
as $$
begin
  update public.soft_users set last_seen_at = now() where id = new.soft_user_id;
  return new;
end;
$$;

drop trigger if exists trg_sessions_touch_user on public.sessions;
create trigger trg_sessions_touch_user
after insert on public.sessions
for each row execute function public.tg_touch_soft_user();

-- ── Ranking views ───────────────────────────────────────
create or replace view public.leaderboard_today as
select
  d.soft_user_id,
  u.nickname,
  d.reps_sum,
  d.clears_count,
  d.sessions_count,
  rank() over (order by d.reps_sum desc, d.clears_count desc) as rank
from public.daily_stats d
join public.soft_users u on u.id = d.soft_user_id
where d.day = (now() at time zone 'Asia/Seoul')::date;

create or replace view public.leaderboard_week as
select
  d.soft_user_id,
  u.nickname,
  sum(d.reps_sum)::int as reps_sum,
  sum(d.clears_count)::int as clears_count,
  sum(d.sessions_count)::int as sessions_count,
  rank() over (order by sum(d.reps_sum) desc, sum(d.clears_count) desc) as rank
from public.daily_stats d
join public.soft_users u on u.id = d.soft_user_id
where d.day >= ((now() at time zone 'Asia/Seoul')::date - 6)
group by d.soft_user_id, u.nickname;

-- ── RLS (MVP Soft ID — anon 키로 읽기/쓰기 허용, 전국 닉네임만 노출) ──
alter table public.soft_users enable row level security;
alter table public.sessions enable row level security;
alter table public.challenges enable row level security;
alter table public.daily_stats enable row level security;

-- soft_users
drop policy if exists soft_users_select on public.soft_users;
create policy soft_users_select on public.soft_users for select using (true);

drop policy if exists soft_users_insert on public.soft_users;
create policy soft_users_insert on public.soft_users for insert with check (true);

drop policy if exists soft_users_update on public.soft_users;
create policy soft_users_update on public.soft_users for update using (true);

-- sessions
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select using (true);

drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions for insert with check (true);

-- challenges
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges for select using (true);

drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges for insert with check (true);

drop policy if exists challenges_update on public.challenges;
create policy challenges_update on public.challenges for update using (true);

-- daily_stats (trigger writes as table owner / security definer path)
drop policy if exists daily_stats_select on public.daily_stats;
create policy daily_stats_select on public.daily_stats for select using (true);

-- Views: grant select to anon/authenticated
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.soft_users to anon, authenticated;
grant select, insert on public.sessions to anon, authenticated;
grant select, insert, update on public.challenges to anon, authenticated;
grant select on public.daily_stats to anon, authenticated;
grant select on public.leaderboard_today to anon, authenticated;
grant select on public.leaderboard_week to anon, authenticated;

-- Trigger function needs to write daily_stats under RLS
alter table public.daily_stats force row level security;
drop policy if exists daily_stats_insert on public.daily_stats;
create policy daily_stats_insert on public.daily_stats for insert with check (true);
drop policy if exists daily_stats_update on public.daily_stats;
create policy daily_stats_update on public.daily_stats for update using (true);

-- Make trigger run as definer so aggregates always land
create or replace function public.tg_sessions_daily_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_stats as d (soft_user_id, day, reps_sum, sessions_count, clears_count)
  values (
    new.soft_user_id,
    (new.ended_at at time zone 'Asia/Seoul')::date,
    new.reps,
    1,
    case when new.cleared then 1 else 0 end
  )
  on conflict (soft_user_id, day) do update
  set
    reps_sum = d.reps_sum + excluded.reps_sum,
    sessions_count = d.sessions_count + 1,
    clears_count = d.clears_count + excluded.clears_count;
  return new;
end;
$$;
