-- =============================================================================
-- Extend get_student_dashboard with XP, active missions, recent achievements
-- and the student's leaderboard opt-in flag.
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

  -- XP rollup
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

  -- Active missions
  v_missions := public.get_active_missions(v_profile.student_id);

  -- Earned achievements (catalog + earned_at, last 24, including locked for vitrine)
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
      'total', v_total_xp,
      'level', v_level,
      'currentLevelXp', v_current_level_xp,
      'nextLevelXp', v_next_level_xp,
      'progressPct', v_progress_pct
    ),
    'missions', v_missions,
    'achievements', v_achievements,
    'leaderboardOptIn', v_profile.leaderboard_opt_in
  ) into v_result;
  return v_result;
end;
$$;

grant execute on function public.get_student_dashboard() to authenticated;
revoke execute on function public.get_student_dashboard() from public, anon;
