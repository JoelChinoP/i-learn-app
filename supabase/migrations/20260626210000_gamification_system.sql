-- =============================================================================
-- Gamification system: XP, achievements, missions, leaderboard.
-- Idempotent: safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Profile opt-in for leaderboard (parent can disable).
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists leaderboard_opt_in boolean not null default true;

-- -----------------------------------------------------------------------------
-- 1. XP events (append-only ledger).
-- -----------------------------------------------------------------------------
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  source text not null check (source in (
    'correct_answer', 'mission_reward', 'achievement_reward',
    'streak_bonus', 'daily_login', 'audio_answer', 'topic_touch'
  )),
  amount int not null check (amount > 0),
  ref_id text,
  ref_table text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists xp_events_student_created_idx
  on public.xp_events (student_id, created_at desc);

-- Idempotency per (student, source, ref). NULL ref_id bypasses unique.
create unique index if not exists xp_events_idempotency_uidx
  on public.xp_events (student_id, source, ref_id)
  where ref_id is not null;

create index if not exists xp_events_student_source_idx
  on public.xp_events (student_id, source, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Aggregated XP rollup (cheap reads; refreshed by trigger).
-- -----------------------------------------------------------------------------
create table if not exists public.student_xp (
  student_id uuid primary key references public.profiles(student_id) on delete cascade,
  total_xp int not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);

-- Level curve: level n requires (100 * n * (n+1) / 2) cumulative XP.
-- L1: 0, L2: 100, L3: 300, L4: 600, L5: 1000, L6: 1500, ...
create or replace function public._xp_level(p_total int)
returns int
language sql immutable
as $$
  with recursive curve(n, req) as (
    select 1, 0
    union all
    select n + 1, req + 100 * n from curve where n < 200
  )
  select coalesce((
    select max(n) from curve where req <= p_total
  ), 1);
$$;

create or replace function public._xp_for_level(p_level int)
returns int
language sql immutable
as $$
  select 100 * (p_level - 1) * p_level / 2;
$$;

create or replace function public._refresh_student_xp(p_student_id uuid)
returns void
language plpgsql
as $$
declare
  v_total int;
  v_level int;
begin
  select coalesce(sum(amount), 0) into v_total from public.xp_events
    where student_id = p_student_id;
  v_level := public._xp_level(v_total);
  insert into public.student_xp(student_id, total_xp, level, updated_at)
    values (p_student_id, v_total, v_level, now())
    on conflict (student_id) do update set
      total_xp = excluded.total_xp,
      level = excluded.level,
      updated_at = now();
end;
$$;

create or replace function public._trg_refresh_student_xp()
returns trigger
language plpgsql
as $$
begin
  perform public._refresh_student_xp(coalesce(new.student_id, old.student_id));
  return null;
end;
$$;

drop trigger if exists xp_events_refresh_student_xp on public.xp_events;
create trigger xp_events_refresh_student_xp
  after insert or delete or update on public.xp_events
  for each row execute function public._trg_refresh_student_xp();

-- -----------------------------------------------------------------------------
-- 3. Achievements (catalog + earned).
-- -----------------------------------------------------------------------------
create table if not exists public.achievement_defs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text not null,
  icon text not null default 'trophy',
  rule jsonb not null,
  xp_reward int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.student_achievements (
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  achievement_id uuid not null references public.achievement_defs(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (student_id, achievement_id)
);

create index if not exists student_achievements_student_idx
  on public.student_achievements (student_id, earned_at desc);

-- -----------------------------------------------------------------------------
-- 4. Missions (daily / weekly).
-- -----------------------------------------------------------------------------
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('daily', 'weekly')),
  title text not null,
  hint text not null,
  icon text not null default 'target',
  target_kind text not null check (target_kind in (
    'correct_count', 'topics_touched', 'audio_count',
    'minutes_practiced', 'streak_days', 'mastery_topic', 'session_count',
    'distinct_topics', 'evaluation_count'
  )),
  target_count int not null check (target_count > 0),
  target_topic text,
  xp_reward int not null default 0 check (xp_reward >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists missions_active_kind_idx
  on public.missions (active, kind, sort_order);

create table if not exists public.mission_progress (
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  window_start timestamptz not null,
  current int not null default 0 check (current >= 0),
  completed_at timestamptz,
  claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, mission_id, window_start)
);

create index if not exists mission_progress_student_window_idx
  on public.mission_progress (student_id, window_start desc);

create index if not exists mission_progress_unclaimed_idx
  on public.mission_progress (student_id)
  where completed_at is not null and claimed_at is null;

-- -----------------------------------------------------------------------------
-- 5. Seed: achievements + missions.
-- -----------------------------------------------------------------------------
insert into public.achievement_defs (code, label, description, icon, rule, xp_reward, sort_order)
values
  ('first_correct', 'Primer acierto', 'Responde tu primera pregunta correctamente', 'star', '{"type":"total_correct","count":1}'::jsonb, 25, 10),
  ('correct_streak_5', 'Racha de 5', '5 respuestas correctas seguidas', 'flame', '{"type":"correct_streak","count":5}'::jsonb, 50, 20),
  ('correct_streak_10', 'En llamas', '10 respuestas correctas seguidas', 'flame', '{"type":"correct_streak","count":10}'::jsonb, 120, 21),
  ('correct_count_25', 'Apretado de balas', '25 respuestas correctas en total', 'target', '{"type":"total_correct","count":25}'::jsonb, 75, 30),
  ('correct_count_100', 'Cien hits', '100 respuestas correctas en total', 'trophy', '{"type":"total_correct","count":100}'::jsonb, 250, 31),
  ('mastery_topic_70', 'Tema dominado', 'Llega al 70% de dominio en un tema', 'star', '{"type":"mastery_topic","threshold":0.70}'::jsonb, 75, 40),
  ('mastery_topic_85', 'Maestría total', 'Llega al 85% de dominio en un tema', 'trophy', '{"type":"mastery_topic","threshold":0.85}'::jsonb, 200, 41),
  ('streak_3', 'Tres al hilo', '3 días seguidos con actividad', 'flame', '{"type":"streak_days","count":3}'::jsonb, 40, 50),
  ('streak_7', 'Una semana entera', '7 días seguidos con actividad', 'medal', '{"type":"streak_days","count":7}'::jsonb, 150, 51),
  ('streak_30', 'Hábito formado', '30 días seguidos con actividad', 'trophy', '{"type":"streak_days","count":30}'::jsonb, 600, 52),
  ('audio_first', 'Voz al ring', 'Envía tu primera respuesta en audio', 'mic', '{"type":"audio_count","count":1}'::jsonb, 30, 60),
  ('audio_count_10', 'Locutor', '10 respuestas en audio', 'mic', '{"type":"audio_count","count":10}'::jsonb, 100, 61),
  ('topic_explorer_5', 'Explorador', 'Practica 5 temas distintos', 'target', '{"type":"distinct_topics","count":5}'::jsonb, 75, 70),
  ('topic_explorer_10', 'Políglota del currículo', 'Practica 10 temas distintos', 'medal', '{"type":"distinct_topics","count":10}'::jsonb, 200, 71),
  ('session_count_10', 'Constante', 'Completa 10 sesiones', 'star', '{"type":"session_count","count":10}'::jsonb, 80, 80),
  ('evaluation_count_5', 'Sin red', 'Completa 5 sesiones en modo evaluación', 'trophy', '{"type":"evaluation_count","count":5}'::jsonb, 150, 90)
on conflict (code) do update set
  label = excluded.label,
  description = excluded.description,
  icon = excluded.icon,
  rule = excluded.rule,
  xp_reward = excluded.xp_reward;

insert into public.missions (code, kind, title, hint, icon, target_kind, target_count, target_topic, xp_reward, sort_order)
values
  -- Daily pool (mostrar 3 rotando por día de la semana ISO)
  ('daily_correct_3', 'daily', 'Tiro certero', '3 respuestas correctas hoy', 'target', 'correct_count', 3, null, 30, 10),
  ('daily_topics_2', 'daily', 'Mente abierta', 'Practica 2 temas distintos hoy', 'shuffle', 'distinct_topics', 2, null, 25, 20),
  ('daily_streak', 'daily', 'Racha del día', 'Responde al menos 1 vez hoy', 'flame', 'streak_days', 1, null, 20, 30),
  ('daily_session_1', 'daily', 'A rodar', 'Completa 1 sesión hoy', 'play', 'session_count', 1, null, 25, 40),
  ('daily_audio_1', 'daily', 'Sube el volumen', 'Envía 1 respuesta en audio', 'mic', 'audio_count', 1, null, 30, 50),
  ('daily_minutes_15', 'daily', 'Calentamiento', 'Estudia 15 minutos hoy', 'clock', 'minutes_practiced', 15, null, 30, 60),
  -- Weekly pool
  ('weekly_correct_20', 'weekly', 'Francotirador semanal', '20 correctas esta semana', 'target', 'correct_count', 20, null, 150, 10),
  ('weekly_streak_5', 'weekly', 'Cinco al hilo', '5 días seguidos con actividad', 'flame', 'streak_days', 5, null, 200, 20),
  ('weekly_topic_70', 'weekly', 'Tema conquistado', 'Llega al 70% en cualquier tema', 'star', 'mastery_topic', 1, null, 300, 30),
  ('weekly_session_10', 'weekly', 'Maratón', '10 sesiones esta semana', 'play', 'session_count', 10, null, 150, 40),
  ('weekly_topics_3', 'weekly', 'Currículo amplio', 'Practica 3 temas distintos esta semana', 'shuffle', 'distinct_topics', 3, null, 100, 50),
  ('weekly_evaluation_5', 'weekly', 'Modo arena', '5 sesiones en evaluación esta semana', 'medal', 'evaluation_count', 5, null, 200, 60)
on conflict (code) do update set
  title = excluded.title,
  hint = excluded.hint,
  icon = excluded.icon,
  target_kind = excluded.target_kind,
  target_count = excluded.target_count,
  target_topic = excluded.target_topic,
  xp_reward = excluded.xp_reward,
  sort_order = excluded.sort_order,
  active = true;

-- -----------------------------------------------------------------------------
-- 6. RLS.
-- -----------------------------------------------------------------------------
alter table public.xp_events enable row level security;
alter table public.student_xp enable row level security;
alter table public.achievement_defs enable row level security;
alter table public.student_achievements enable row level security;
alter table public.missions enable row level security;
alter table public.mission_progress enable row level security;

-- Defs/missions are readable by everyone authenticated (they're the catalog).
drop policy if exists achievement_defs_select_all on public.achievement_defs;
create policy achievement_defs_select_all on public.achievement_defs
  for select to authenticated using (active);

drop policy if exists missions_select_all on public.missions;
create policy missions_select_all on public.missions
  for select to authenticated using (active);

-- Students see their own progress; tutors see their kids'.
drop policy if exists xp_events_select_own on public.xp_events;
create policy xp_events_select_own on public.xp_events
  for select to authenticated using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists student_xp_select_own on public.student_xp;
create policy student_xp_select_own on public.student_xp
  for select to authenticated using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists student_achievements_select_own on public.student_achievements;
create policy student_achievements_select_own on public.student_achievements
  for select to authenticated using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists mission_progress_select_own on public.mission_progress;
create policy mission_progress_select_own on public.mission_progress
  for select to authenticated using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

-- Leaderboard opt-in toggleable by the student themselves.
drop policy if exists profiles_update_own_leaderboard on public.profiles;
create policy profiles_update_own_leaderboard on public.profiles
  for update to authenticated using (id = auth.uid())
  with check (id = auth.uid());

grant select on public.achievement_defs to authenticated;
grant select on public.missions to authenticated;
grant select on public.xp_events to authenticated;
grant select on public.student_xp to authenticated;
grant select on public.student_achievements to authenticated;
grant select on public.mission_progress to authenticated;
