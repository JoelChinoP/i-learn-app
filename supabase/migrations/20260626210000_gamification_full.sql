-- =============================================================================
-- GAMIFICATION SYSTEM — single consolidated migration.
-- Tables, types, RPCs, seed, RLS, grants. Idempotent.
-- Apply this file in one shot via the Supabase SQL editor, or via
--   npx supabase db push   (after replacing the three split files).
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
  source text not null,
  amount int not null check (amount > 0),
  ref_id text,
  ref_table text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Normalize columns/constraints in case the table was created earlier without them.
alter table public.xp_events
  add column if not exists ref_table text;
alter table public.xp_events
  drop constraint if exists xp_events_source_check;
alter table public.xp_events
  add constraint xp_events_source_check check (source in (
    'correct_answer', 'mission_reward', 'achievement_reward',
    'streak_bonus', 'daily_login', 'audio_answer', 'topic_touch'
  ));

create index if not exists xp_events_student_created_idx
  on public.xp_events (student_id, created_at desc);

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

-- No additional columns needed; safe as-is.

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

-- Normalize columns in case the table was created earlier without them.
alter table public.achievement_defs
  add column if not exists sort_order int not null default 0;

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
  created_at timestamptz not null default now()
);

-- Normalize columns in case the table was created earlier without them.
alter table public.missions
  add column if not exists sort_order int not null default 0;
alter table public.missions
  add column if not exists target_topic text;
alter table public.missions
  drop constraint if exists missions_target_kind_check;
alter table public.missions
  add constraint missions_target_kind_check check (target_kind in (
    'correct_count', 'topics_touched', 'audio_count',
    'minutes_practiced', 'streak_days', 'mastery_topic', 'session_count',
    'distinct_topics', 'evaluation_count'
  ));

create index if not exists missions_active_kind_idx
  on public.missions (active, kind, sort_order);

create table if not exists public.mission_progress (
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  window_start timestamptz not null,
  current int not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, mission_id, window_start)
);

-- Normalize in case the table was created earlier with stricter checks.
alter table public.mission_progress
  drop constraint if exists mission_progress_current_check;
alter table public.mission_progress
  add column if not exists updated_at timestamptz not null default now();
alter table public.mission_progress
  alter column current drop default,
  alter column current set default 0;

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
  ('daily_correct_3', 'daily', 'Tiro certero', '3 respuestas correctas hoy', 'target', 'correct_count', 3, null, 30, 10),
  ('daily_topics_2', 'daily', 'Mente abierta', 'Practica 2 temas distintos hoy', 'shuffle', 'distinct_topics', 2, null, 25, 20),
  ('daily_streak', 'daily', 'Racha del día', 'Responde al menos 1 vez hoy', 'flame', 'streak_days', 1, null, 20, 30),
  ('daily_session_1', 'daily', 'A rodar', 'Completa 1 sesión hoy', 'play', 'session_count', 1, null, 25, 40),
  ('daily_audio_1', 'daily', 'Sube el volumen', 'Envía 1 respuesta en audio', 'mic', 'audio_count', 1, null, 30, 50),
  ('daily_minutes_15', 'daily', 'Calentamiento', 'Estudia 15 minutos hoy', 'clock', 'minutes_practiced', 15, null, 30, 60),
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
-- 6. RLS + grants.
-- -----------------------------------------------------------------------------
alter table public.xp_events enable row level security;
alter table public.student_xp enable row level security;
alter table public.achievement_defs enable row level security;
alter table public.student_achievements enable row level security;
alter table public.missions enable row level security;
alter table public.mission_progress enable row level security;

drop policy if exists achievement_defs_select_all on public.achievement_defs;
create policy achievement_defs_select_all on public.achievement_defs
  for select to authenticated using (active);

drop policy if exists missions_select_all on public.missions;
create policy missions_select_all on public.missions
  for select to authenticated using (active);

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

-- =============================================================================
-- RPCs (depend on tables above; functions use `record` instead of %rowtype
-- so this file can be pasted in any order).
-- =============================================================================

create or replace function public._daily_window_start(p_at timestamptz default now())
returns timestamptz
language sql stable
as $$
  select date_trunc('day', p_at at time zone 'America/Lima') at time zone 'America/Lima';
$$;

create or replace function public._weekly_window_start(p_at timestamptz default now())
returns timestamptz
language sql stable
as $$
  select (date_trunc('week', (p_at at time zone 'America/Lima')::timestamp)
          - interval '1 day')::timestamptz at time zone 'America/Lima';
$$;

create or replace function public.award_xp(
  p_student_id uuid,
  p_source text,
  p_amount int,
  p_ref_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
  v_inserted boolean := false;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_ref_id is not null then
    insert into public.xp_events(student_id, source, amount, ref_id, metadata)
    values (p_student_id, p_source, p_amount, p_ref_id, p_metadata)
    on conflict (student_id, source, ref_id) do nothing
    returning id into v_event_id;
    if v_event_id is null then
      select id into v_event_id from public.xp_events
        where student_id = p_student_id and source = p_source and ref_id = p_ref_id;
    else
      v_inserted := true;
    end if;
  else
    insert into public.xp_events(student_id, source, amount, metadata)
    values (p_student_id, p_source, p_amount, p_metadata)
    returning id into v_event_id;
    v_inserted := true;
  end if;
  return jsonb_build_object(
    'event_id', v_event_id, 'inserted', v_inserted, 'amount', p_amount, 'source', p_source
  );
end;
$$;

create or replace function public._achievement_progress(
  p_student_id uuid,
  p_rule jsonb
)
returns int
language plpgsql stable
as $$
declare
  v_type text := p_rule->>'type';
  v_count int := coalesce((p_rule->>'count')::int, 1);
  v_threshold numeric := coalesce((p_rule->>'threshold')::numeric, 0);
  v_streak int := 0;
  v_total int := 0;
  v_audio int := 0;
  v_distinct_topics int := 0;
  v_sessions int := 0;
  v_evals int := 0;
  v_topics_at_threshold int := 0;
begin
  case v_type
    when 'total_correct' then
      select count(*) into v_total from public.student_responses
        where student_id = p_student_id and is_correct = true;
      return v_total;
    when 'correct_streak' then
      with s as (
        select is_correct,
          sum(case when is_correct then 0 else 1 end)
            over (order by created_at desc rows between unbounded preceding and current row) as grp
        from public.student_responses
        where student_id = p_student_id
          and processing_status = 'completed'
          and is_correct is not null
        order by created_at desc
        limit 200
      )
      select count(*) into v_streak from s where grp = 0 and is_correct = true;
      return v_streak;
    when 'mastery_topic' then
      select count(*) into v_topics_at_threshold from public.student_mastery_matrix
        where student_id = p_student_id and mastery >= v_threshold;
      return v_topics_at_threshold;
    when 'streak_days' then
      select count(distinct created_at::date) into v_total from public.student_responses
        where student_id = p_student_id
          and created_at >= current_date - (v_count + 10);
      return v_total;
    when 'audio_count' then
      select count(*) into v_audio from public.student_responses
        where student_id = p_student_id and clean_answer like '[audio:%';
      return v_audio;
    when 'distinct_topics' then
      select count(distinct topic) into v_distinct_topics
        from public.student_responses
        where student_id = p_student_id;
      return v_distinct_topics;
    when 'session_count' then
      select count(distinct session_id) into v_sessions from public.student_responses
        where student_id = p_student_id;
      return v_sessions;
    when 'evaluation_count' then
      select count(distinct session_id) into v_evals from public.student_responses
        where student_id = p_student_id;
      return v_evals;
    else
      return 0;
  end case;
end;
$$;

create or replace function public.check_achievements(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_def record;
  v_progress int;
  v_unlocked int := 0;
  v_xp_awarded int := 0;
  v_results jsonb := '[]'::jsonb;
begin
  for v_def in
    select id, code, label, rule, xp_reward
    from public.achievement_defs
    where active
      and not exists (
        select 1 from public.student_achievements sa
        where sa.achievement_id = v_def.id and sa.student_id = p_student_id
      )
  loop
    v_progress := public._achievement_progress(p_student_id, v_def.rule);
    if v_progress >= 1
       and not ((v_def.rule->>'type') in (
                  'total_correct','correct_streak','streak_days',
                  'audio_count','distinct_topics','session_count','evaluation_count')
                and v_progress < coalesce((v_def.rule->>'count')::int, 1)) then
      insert into public.student_achievements(student_id, achievement_id)
        values (p_student_id, v_def.id);
      v_unlocked := v_unlocked + 1;
      if v_def.xp_reward > 0 then
        perform public.award_xp(
          p_student_id, 'achievement_reward', v_def.xp_reward,
          'ach:' || v_def.id::text,
          jsonb_build_object('code', v_def.code, 'label', v_def.label)
        );
        v_xp_awarded := v_xp_awarded + v_def.xp_reward;
      end if;
      v_results := v_results || jsonb_build_object(
        'code', v_def.code, 'label', v_def.label, 'xp', v_def.xp_reward
      );
    end if;
  end loop;
  return jsonb_build_object(
    'unlocked', v_unlocked, 'xp_awarded', v_xp_awarded, 'items', v_results
  );
end;
$$;

create or replace function public._mission_target_window(p_kind text, p_at timestamptz)
returns timestamptz
language sql stable
as $$
  select case
    when p_kind = 'weekly' then public._weekly_window_start(p_at)
    else public._daily_window_start(p_at)
  end;
$$;

create or replace function public.bump_mission_progress(
  p_student_id uuid,
  p_mission_code text,
  p_delta int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mission record;       -- record (not %rowtype) so compile does not need the table
  v_window timestamptz;
  v_current int;
  v_completed_at timestamptz;
  v_target int;
  v_new int;
  v_event_id text;
begin
  select * into v_mission from public.missions
    where code = p_mission_code and active;
  if v_mission.id is null then
    return jsonb_build_object('skipped', 'mission_not_found');
  end if;

  v_window := public._mission_target_window(v_mission.kind, now());
  v_target := v_mission.target_count;

  insert into public.mission_progress(student_id, mission_id, window_start, current)
    values (p_student_id, v_mission.id, v_window, 0)
    on conflict (student_id, mission_id, window_start) do nothing;

  select current, completed_at into v_current, v_completed_at
    from public.mission_progress
    where student_id = p_student_id and mission_id = v_mission.id and window_start = v_window
    for update;
  if v_completed_at is not null then
    return jsonb_build_object('mission_id', v_mission.id, 'current', v_current, 'completed', true);
  end if;

  v_new := v_current + p_delta;
  if v_mission.target_kind = 'distinct_topics' then
    select count(distinct topic) into v_new
      from public.student_responses
      where student_id = p_student_id
        and created_at >= v_window;
  end if;

  if v_new >= v_target then
    v_new := v_target;
    update public.mission_progress
      set current = v_new, completed_at = now(), updated_at = now()
      where student_id = p_student_id and mission_id = v_mission.id and window_start = v_window;
  else
    update public.mission_progress
      set current = v_new, updated_at = now()
      where student_id = p_student_id and mission_id = v_mission.id and window_start = v_window;
  end if;

  return jsonb_build_object(
    'mission_id', v_mission.id,
    'code', v_mission.code,
    'current', v_new,
    'target', v_target,
    'completed', v_new >= v_target
  );
end;
$$;

create or replace function public.bump_missions_for_event(
  p_student_id uuid,
  p_event_kind text,
  p_topic text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mission record;
  v_results jsonb := '[]'::jsonb;
begin
  for v_mission in
    select id, code, kind, target_kind, target_count
    from public.missions
    where active
      and ((p_event_kind = 'correct' and target_kind in ('correct_count'))
        or (p_event_kind = 'audio' and target_kind = 'audio_count')
        or (p_event_kind = 'topic' and target_kind in ('distinct_topics','topics_touched'))
        or (p_event_kind = 'session' and target_kind = 'session_count')
        or (p_event_kind = 'evaluation' and target_kind = 'evaluation_count')
        or (p_event_kind = 'mastery' and target_kind = 'mastery_topic'))
  loop
    if v_mission.target_kind = 'distinct_topics' then
      v_results := v_results || public.bump_mission_progress(p_student_id, v_mission.code, 0);
    else
      v_results := v_results || public.bump_mission_progress(p_student_id, v_mission.code, 1);
    end if;
  end loop;
  return v_results;
end;
$$;

create or replace function public.claim_mission(
  p_student_id uuid,
  p_mission_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_progress record;
  v_mission record;
  v_xp jsonb;
begin
  select * into v_mission from public.missions where id = p_mission_id and active;
  if v_mission.id is null then raise exception 'MISSION_NOT_FOUND'; end if;

  select * into v_progress
    from public.mission_progress
    where student_id = p_student_id
      and mission_id = p_mission_id
      and completed_at is not null
    order by window_start desc
    limit 1
    for update;
  if v_progress.mission_id is null then raise exception 'MISSION_NOT_COMPLETED'; end if;
  if v_progress.claimed_at is not null then
    return jsonb_build_object('already_claimed', true, 'xp_awarded', 0);
  end if;

  update public.mission_progress set claimed_at = now()
    where student_id = p_student_id and mission_id = p_mission_id and window_start = v_progress.window_start;

  v_xp := public.award_xp(
    p_student_id, 'mission_reward', v_mission.xp_reward,
    'mission:' || p_mission_id::text || ':' || v_progress.window_start::text,
    jsonb_build_object('code', v_mission.code, 'title', v_mission.title, 'window_start', v_progress.window_start)
  );
  return jsonb_build_object(
    'already_claimed', false,
    'xp_awarded', v_mission.xp_reward,
    'mission_code', v_mission.code,
    'event', v_xp
  );
end;
$$;

create or replace function public.get_active_missions(p_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  with windows as (
    select 'daily'::text as kind, public._daily_window_start() as window_start
    union all
    select 'weekly'::text, public._weekly_window_start()
  )
  select jsonb_build_object(
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'code', m.code, 'title', m.title, 'hint', m.hint, 'icon', m.icon,
        'target_kind', m.target_kind, 'target_count', m.target_count,
        'xp_reward', m.xp_reward,
        'current', coalesce(p.current, 0),
        'progress_pct', least(100, round((coalesce(p.current, 0)::numeric / m.target_count) * 100, 0)),
        'completed', p.completed_at is not null,
        'claimed', p.claimed_at is not null,
        'window_start', w.window_start
      ) order by m.sort_order, m.title)
      from public.missions m
      cross join windows w
      left join public.mission_progress p
        on p.mission_id = m.id and p.student_id = p_student_id and p.window_start = w.window_start
      where m.active and m.kind = 'daily'
    ), '[]'::jsonb),
    'weekly', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'code', m.code, 'title', m.title, 'hint', m.hint, 'icon', m.icon,
        'target_kind', m.target_kind, 'target_count', m.target_count,
        'xp_reward', m.xp_reward,
        'current', coalesce(p.current, 0),
        'progress_pct', least(100, round((coalesce(p.current, 0)::numeric / m.target_count) * 100, 0)),
        'completed', p.completed_at is not null,
        'claimed', p.claimed_at is not null,
        'window_start', w.window_start
      ) order by m.sort_order, m.title)
      from public.missions m
      cross join windows w
      left join public.mission_progress p
        on p.mission_id = m.id and p.student_id = p_student_id and p.window_start = w.window_start
      where m.active and m.kind = 'weekly'
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.get_leaderboard(
  p_scope text default 'section',
  p_window text default 'weekly'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;  -- profiles is from baseline; safe to reference
  v_section_id uuid;
  v_window_start timestamptz;
  v_rows jsonb;
  v_my_rank int;
  v_my_alias text;
begin
  select * into v_profile from public.profiles where id = auth.uid() and role = 'alumno';
  if v_profile.id is null then raise exception 'ROLE_FORBIDDEN'; end if;

  if p_scope = 'section' then
    select section_id into v_section_id from public.student_section
      where student_id = v_profile.student_id limit 1;
  end if;

  v_window_start := case
    when p_window = 'monthly' then date_trunc('month', now() at time zone 'America/Lima') at time zone 'America/Lima'
    when p_window = 'alltime' then '1970-01-01 00:00:00+00'::timestamptz
    else public._weekly_window_start()
  end;

  with peers as (
    select p.student_id
    from public.profiles p
    where p.role = 'alumno'
      and p.leaderboard_opt_in
      and (p_scope <> 'section'
           or exists (select 1 from public.student_section ss
                      where ss.student_id = p.student_id and ss.section_id = v_section_id))
  ),
  agg as (
    select
      s.student_id,
      coalesce(sx.total_xp, 0) as total_xp,
      coalesce((
        select sum(xe.amount) from public.xp_events xe
        where xe.student_id = s.student_id and xe.created_at >= v_window_start
      ), 0) as window_xp
    from peers s
    left join public.student_xp sx on sx.student_id = s.student_id
  ),
  ranked as (
    select
      student_id, total_xp, window_xp,
      rank() over (order by (case when p_window = 'alltime' then total_xp else window_xp end) desc,
                            total_xp desc, student_id) as rk
    from agg
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank', rk, 'student_id', student_id,
    'alias', 'Loopper ' || upper(substr(replace(student_id::text, '-', ''), 1, 4)),
    'total_xp', total_xp, 'window_xp', window_xp
  ) order by rk), '[]'::jsonb)
  into v_rows
  from ranked
  where rk <= 50;

  select rk, alias into v_my_rank, v_my_alias
    from (
      select rk, 'Loopper ' || upper(substr(replace(student_id::text, '-', ''), 1, 4)) as alias,
             student_id
      from (
        select student_id,
          rank() over (order by (case when p_window = 'alltime' then total_xp else window_xp end) desc, total_xp desc, student_id) as rk
        from (
          select s.student_id,
            coalesce(sx.total_xp, 0) as total_xp,
            coalesce((select sum(xe.amount) from public.xp_events xe
                      where xe.student_id = s.student_id and xe.created_at >= v_window_start), 0) as window_xp
          from public.profiles s
          left join public.student_xp sx on sx.student_id = s.student_id
          where s.role = 'alumno'
            and s.leaderboard_opt_in
            and (p_scope <> 'section'
                 or exists (select 1 from public.student_section ss
                            where ss.student_id = s.student_id and ss.section_id = v_section_id))
        ) z
      ) y
    ) x
    where student_id = v_profile.student_id
    limit 1;

  return jsonb_build_object(
    'scope', p_scope,
    'window', p_window,
    'window_start', v_window_start,
    'my_rank', v_my_rank,
    'me_in', exists (select 1 from jsonb_array_elements(v_rows) e where (e->>'student_id') = v_profile.student_id::text),
    'rows', v_rows
  );
end;
$$;

create or replace function public.set_leaderboard_opt_in(p_enabled boolean)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.profiles set leaderboard_opt_in = p_enabled where id = auth.uid();
$$;

create or replace function public.get_my_active_missions()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_student_id uuid;
begin
  select student_id into v_student_id from public.profiles where id = auth.uid() and role = 'alumno';
  if v_student_id is null then raise exception 'ROLE_FORBIDDEN'; end if;
  return public.get_active_missions(v_student_id);
end;
$$;

-- =============================================================================
-- finalize_response rewrite: emits XP, bumps missions, checks achievements.
-- =============================================================================
create or replace function public.finalize_response(
  p_response_id uuid,
  p_is_correct boolean,
  p_explanation text,
  p_used_fallback boolean,
  p_previous_mastery numeric,
  p_new_mastery numeric,
  p_mastery_updated boolean,
  p_recommended_question_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_response public.student_responses%rowtype;  -- baseline table, safe
  v_feedback record;
  v_version int;
  v_xp jsonb;
  v_mission_bumps jsonb;
  v_achievements jsonb;
  v_xp_earned int := 0;
  v_achievements_unlocked int := 0;
begin
  select * into v_response from public.student_responses where id = p_response_id for update;
  if v_response.id is null then raise exception 'RESPONSE_NOT_FOUND'; end if;
  select coalesce(max(version), 0) + 1 into v_version from public.feedbacks where response_id = p_response_id;
  insert into public.feedbacks(response_id, student_id, explanation, used_fallback, version)
  values (v_response.id, v_response.student_id, p_explanation, p_used_fallback, v_version)
  returning * into v_feedback;

  if p_mastery_updated then
    insert into public.student_mastery_matrix(student_id, topic, mastery, updated_at)
    values (v_response.student_id, v_response.topic, p_new_mastery, now())
    on conflict (student_id, topic) do update set mastery = excluded.mastery, updated_at = now();
  end if;
  insert into public.mastery_events(
    response_id, student_id, topic, previous_mastery, new_mastery, is_correct, updated
  ) values (
    v_response.id, v_response.student_id, v_response.topic,
    p_previous_mastery, p_new_mastery, p_is_correct, p_mastery_updated
  );
  insert into public.adaptive_paths(response_id, student_id, topic, recommended_question_id, reason)
  values (v_response.id, v_response.student_id, v_response.topic, p_recommended_question_id, p_reason);
  update public.student_responses set
    is_correct = p_is_correct,
    processing_status = 'completed',
    processing_error_code = null,
    completed_at = now()
  where id = v_response.id;

  -- ===== Gamification hooks =====
  if p_is_correct then
    v_xp := public.award_xp(
      v_response.student_id, 'correct_answer', 10,
      'resp:' || v_response.id::text,
      jsonb_build_object('topic', v_response.topic, 'difficulty', v_response.difficulty_level)
    );
    v_xp_earned := v_xp_earned + 10;
  else
    v_xp := public.award_xp(
      v_response.student_id, 'correct_answer', 3,
      'resp:' || v_response.id::text,
      jsonb_build_object('topic', v_response.topic, 'attempt', true, 'correct', false)
    );
    v_xp_earned := v_xp_earned + 3;
  end if;

  if v_response.clean_answer like '[audio:%' then
    v_xp := public.award_xp(
      v_response.student_id, 'audio_answer', 5,
      'audio:' || v_response.id::text
    );
    v_xp_earned := v_xp_earned + 5;
  end if;

  if p_is_correct then
    v_mission_bumps := public.bump_missions_for_event(v_response.student_id, 'correct');
  end if;
  if v_response.clean_answer like '[audio:%' then
    v_mission_bumps := public.bump_missions_for_event(v_response.student_id, 'audio');
  end if;
  v_mission_bumps := public.bump_missions_for_event(v_response.student_id, 'topic');
  if p_mastery_updated and p_new_mastery >= 0.70 then
    v_mission_bumps := public.bump_missions_for_event(v_response.student_id, 'mastery');
  end if;
  v_mission_bumps := public.bump_missions_for_event(v_response.student_id, 'session');

  v_achievements := public.check_achievements(v_response.student_id);
  v_achievements_unlocked := (v_achievements->>'unlocked')::int;
  v_xp_earned := v_xp_earned + (v_achievements->>'xp_awarded')::int;

  return jsonb_build_object(
    'feedback_id', v_feedback.id,
    'version', v_version,
    'xp_earned', v_xp_earned,
    'achievements_unlocked', v_achievements_unlocked,
    'achievements', v_achievements->'items'
  );
end;
$$;

-- =============================================================================
-- get_student_dashboard extension.
-- =============================================================================
create or replace function public.get_student_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_question public.questions%rowtype;
  v_total_xp int;
  v_level int;
  v_next_level_xp int;
  v_current_level_xp int;
  v_progress_pct int;
  v_missions jsonb;
  v_achievements jsonb;
  v_result jsonb;
begin
  select * into v_profile from public.profiles where id = auth.uid() and role = 'alumno';
  if v_profile.id is null then raise exception 'ROLE_FORBIDDEN'; end if;

  select q.* into v_question
  from public.questions q
  join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
  left join public.student_responses sr on sr.question_id = q.id and sr.student_id = v_profile.student_id
  where q.active and sr.id is null
  order by q.sequence
  limit 1;
  if v_question.id is null then
    select q.* into v_question
    from public.questions q
    join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
    where q.active order by q.sequence limit 1;
  end if;

  select coalesce(total_xp, 0), coalesce(level, 1)
    into v_total_xp, v_level
    from public.student_xp where student_id = v_profile.student_id;
  v_total_xp := coalesce(v_total_xp, 0);
  v_level := coalesce(v_level, 1);
  v_current_level_xp := public._xp_for_level(v_level);
  v_next_level_xp := public._xp_for_level(v_level + 1);
  v_progress_pct := case
    when v_next_level_xp = v_current_level_xp then 100
    else least(100, greatest(0, round(((v_total_xp - v_current_level_xp)::numeric
        / (v_next_level_xp - v_current_level_xp)) * 100, 0)))
  end;

  v_missions := public.get_active_missions(v_profile.student_id);

  select jsonb_build_object(
    'earned', coalesce((select jsonb_agg(jsonb_build_object(
      'id', def.id, 'code', def.code, 'label', def.label, 'description', def.description,
      'icon', def.icon, 'xp_reward', def.xp_reward, 'earned_at', sa.earned_at
    ) order by sa.earned_at desc)
    from public.student_achievements sa
    join public.achievement_defs def on def.id = sa.achievement_id
    where sa.student_id = v_profile.student_id), '[]'::jsonb),
    'locked', coalesce((select jsonb_agg(jsonb_build_object(
      'id', def.id, 'code', def.code, 'label', def.label, 'description', def.description,
      'icon', def.icon, 'xp_reward', def.xp_reward
    ) order by def.label)
    from public.achievement_defs def
    where def.active
      and not exists (select 1 from public.student_achievements sa
                      where sa.achievement_id = def.id and sa.student_id = v_profile.student_id)
    limit 24), '[]'::jsonb),
    'recent_xp', coalesce((select jsonb_agg(jsonb_build_object(
      'source', xe.source, 'amount', xe.amount, 'created_at', xe.created_at, 'metadata', xe.metadata
    ) order by xe.created_at desc)
    from public.xp_events xe
    where xe.student_id = v_profile.student_id
    limit 10), '[]'::jsonb)
  ) into v_achievements;

  select jsonb_build_object(
    'studentId', v_profile.student_id,
    'studentName', v_profile.full_name,
    'consentSigned', v_profile.tutor_consent_signed,
    'currentQuestion', case when v_question.id is null then null else jsonb_build_object(
      'id', v_question.id, 'text', v_question.prompt, 'type', v_question.question_type,
      'options', v_question.options, 'topic', v_question.topic,
      'difficultyLevel', v_question.difficulty_level
    ) end,
    'masteryByTopic', coalesce((select jsonb_agg(jsonb_build_object(
      'topic', sm.topic, 'mastery', round((sm.mastery * 100)::numeric, 0)
    ) order by sm.topic) from public.student_mastery_matrix sm where sm.student_id = v_profile.student_id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object(
      'date', me.created_at, 'topic', me.topic, 'mastery', round((me.new_mastery * 100)::numeric, 0)
    ) order by me.created_at) from public.mastery_events me where me.student_id = v_profile.student_id), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(jsonb_build_object('date', d.activity_date, 'count', coalesce(a.activity_count, 0)) order by d.activity_date)
      from (select generate_series(current_date - 29, current_date, interval '1 day')::date as activity_date) d
      left join (select created_at::date as activity_date, count(*) as activity_count from public.student_responses
        where student_id = v_profile.student_id and created_at >= current_date - 29 group by 1) a using(activity_date)), '[]'::jsonb),
    'answeredCount', (select count(*) from public.student_responses where student_id = v_profile.student_id),
    'correctCount', (select count(*) from public.student_responses where student_id = v_profile.student_id and is_correct),
    'streakDays', (select count(distinct created_at::date) from public.student_responses
      where student_id = v_profile.student_id and created_at >= current_date - 6),
    'xp', jsonb_build_object(
      'total', v_total_xp, 'level', v_level,
      'currentLevelXp', v_current_level_xp, 'nextLevelXp', v_next_level_xp,
      'progressPct', v_progress_pct
    ),
    'missions', v_missions,
    'achievements', v_achievements,
    'leaderboardOptIn', v_profile.leaderboard_opt_in
  ) into v_result;
  return v_result;
end;
$$;

-- =============================================================================
-- Grants.
-- =============================================================================
grant execute on function public.award_xp(uuid,text,int,text,jsonb) to service_role;
grant execute on function public.check_achievements(uuid) to service_role;
grant execute on function public.bump_mission_progress(uuid,text,int) to service_role;
grant execute on function public.bump_missions_for_event(uuid,text,text) to service_role;
grant execute on function public.get_leaderboard(text,text) to authenticated;
grant execute on function public.set_leaderboard_opt_in(boolean) to authenticated;
grant execute on function public.get_my_active_missions() to authenticated;
grant execute on function public.get_student_dashboard() to authenticated;
grant execute on function public.finalize_response(uuid,boolean,text,boolean,numeric,numeric,boolean,uuid,text) to service_role;
revoke execute on function public.get_student_dashboard() from public, anon;
revoke execute on function public.get_leaderboard(text,text) from public, anon;
revoke execute on function public.set_leaderboard_opt_in(boolean) from public, anon;
revoke execute on function public.get_my_active_missions() from public, anon;
