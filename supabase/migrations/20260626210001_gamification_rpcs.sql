-- =============================================================================
-- Gamification RPCs: award_xp, check_achievements, mission bump/claim,
-- leaderboard, and updated finalize_response that emits XP atomically.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Window helpers (Lima timezone).
-- -----------------------------------------------------------------------------
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
  -- Week starts Monday 00:00 in Lima.
  select (date_trunc('week', (p_at at time zone 'America/Lima')::timestamp)
          - interval '1 day')::timestamptz at time zone 'America/Lima';
$$;

-- -----------------------------------------------------------------------------
-- 1. award_xp: idempotent emission of XP to a student.
-- -----------------------------------------------------------------------------
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
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_ref_id is not null then
    insert into public.xp_events(student_id, source, amount, ref_id, metadata)
    values (p_student_id, p_source, p_amount, p_ref_id, p_metadata)
    on conflict (student_id, source, ref_id) do nothing
    returning id into v_event_id;
    if v_event_id is null then
      -- already awarded, look it up
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
    'event_id', v_event_id,
    'inserted', v_inserted,
    'amount', p_amount,
    'source', p_source
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. check_achievements: evaluate rules and unlock missing ones.
-- -----------------------------------------------------------------------------
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
      -- Count consecutive correct answers from the most recent.
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
      -- also count xp_events activity (audio answers may not have a response row)
      return v_total;

    when 'audio_count' then
      -- count responses where clean_answer starts with [audio:
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
      -- Best-effort: count distinct sessions of size >= 1 (telemetry not granular yet).
      -- Refine when we track mode in student_responses.
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
    -- Rules are compared as: if the type is mastery_topic, progress is a count of
    -- topics at/above threshold; >= 1 = unlocked. Otherwise progress >= count.
    if v_progress >= 1
       and not ((v_def.rule->>'type') in ('total_correct','correct_streak','streak_days','audio_count','distinct_topics','session_count','evaluation_count')
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

-- -----------------------------------------------------------------------------
-- 3. Mission progress: bump + claim.
-- -----------------------------------------------------------------------------
create or replace function public._mission_target_window(p_kind text, p_at timestamptz)
returns timestamptz
language sql stable
as $$
  select case
    when p_kind = 'weekly' then public._weekly_window_start(p_at)
    else public._daily_window_start(p_at)
  end;
$$;

-- Bump a single mission for a student. Idempotent-ish (current is monotonic per window).
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
  v_mission record;       -- record, not %rowtype, so the function compiles even if
                           -- the missions table is created in a different migration file.
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

  -- Insert row if missing, then update.
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
    -- For distinct topics, recompute from actual data, don't double-count.
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

-- Bump ALL active missions of a kind whose target_kind matches the event.
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

-- Claim a completed mission → grant XP exactly once.
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

  -- Find the latest window's progress row.
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

-- Get active missions for a student with progress in the current window.
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

-- -----------------------------------------------------------------------------
-- 4. Leaderboard.
-- -----------------------------------------------------------------------------
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
  v_profile public.profiles%rowtype;
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
      student_id,
      total_xp,
      window_xp,
      rank() over (
        order by (case when p_window = 'alltime' then total_xp else window_xp end) desc,
                 total_xp desc,
                 student_id
      ) as rk
    from agg
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank', rk,
    'student_id', student_id,
    'alias', 'Loopper ' || upper(substr(replace(student_id::text, '-', ''), 1, 4)),
    'total_xp', total_xp,
    'window_xp', window_xp
  ) order by rk), '[]'::jsonb)
  into v_rows
  from ranked
  where rk <= 50;

  select rk, alias into v_my_rank, v_my_alias
    from (
      select rk, 'Loopper ' || upper(substr(replace(student_id::text, '-', ''), 1, 4)) as alias
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

-- -----------------------------------------------------------------------------
-- 5. Set leaderboard opt-in.
-- -----------------------------------------------------------------------------
create or replace function public.set_leaderboard_opt_in(p_enabled boolean)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.profiles set leaderboard_opt_in = p_enabled where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 6. Updated finalize_response: emit XP + bump missions + check achievements.
-- -----------------------------------------------------------------------------
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
  v_response public.student_responses%rowtype;
  v_feedback public.feedbacks%rowtype;
  v_version int;
  v_xp jsonb;
  v_mission_bumps jsonb;
  v_achievements jsonb;
  v_xp_earned int := 0;
  v_bumps_unlocked int := 0;
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
  -- XP: +10 for correct, +5 for attempt (encourages trying). Idempotent via response_id ref.
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

  -- Audio bonus: +5 if the response was an audio answer.
  if v_response.clean_answer like '[audio:%' then
    v_xp := public.award_xp(
      v_response.student_id, 'audio_answer', 5,
      'audio:' || v_response.id::text
    );
    v_xp_earned := v_xp_earned + 5;
  end if;

  -- Mission bumps: correct / audio / topic / mastery.
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
  -- Daily streak: any answer today = +1 to current streak mission.
  v_mission_bumps := public.bump_missions_for_event(v_response.student_id, 'session');

  -- Achievement check (idempotent — only unlocks missing ones).
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

-- -----------------------------------------------------------------------------
-- 7. Grants.
-- -----------------------------------------------------------------------------
grant execute on function public.award_xp(uuid,text,int,text,jsonb) to service_role;
grant execute on function public.check_achievements(uuid) to service_role;
grant execute on function public.bump_mission_progress(uuid,text,int) to service_role;
grant execute on function public.bump_missions_for_event(uuid,text,text) to service_role;
grant execute on function public.get_leaderboard(text,text) to authenticated;
grant execute on function public.set_leaderboard_opt_in(boolean) to authenticated;

-- student-facing RPC: get active missions for the caller
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
grant execute on function public.get_my_active_missions() to authenticated;
