-- =============================================================================
-- Fix CONFLICT on finalize_response:
--   1. ON CONFLICT DO NOTHING on the feedbacks INSERT (belt).
--   2. pg_advisory_xact_lock at function start (suspenders) — serializes
--      concurrent finalizations of the same response.
--   3. Gamification hooks isolated in BEGIN/EXCEPTION (previous fix kept).
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
  v_response public.student_responses%rowtype;
  v_feedback record;
  v_version int;
  v_xp jsonb;
  v_mission_bumps jsonb;
  v_achievements jsonb;
  v_xp_earned int := 0;
  v_achievements_unlocked int := 0;
  v_gamification_error text;
begin
  -- Suspenders: serialize concurrent finalizations of the same response.
  perform pg_advisory_xact_lock(hashtext('finalize_response:' || p_response_id::text));

  -- ===== Original feedback logic =====
  select * into v_response from public.student_responses where id = p_response_id for update;
  if v_response.id is null then raise exception 'RESPONSE_NOT_FOUND'; end if;
  select coalesce(max(version), 0) + 1 into v_version
    from public.feedbacks where response_id = p_response_id;

  -- Belt: ON CONFLICT DO NOTHING so a concurrent caller that already inserted
  -- this version doesn't blow up the function. We then look it up.
  insert into public.feedbacks(response_id, student_id, explanation, used_fallback, version)
  values (v_response.id, v_response.student_id, p_explanation, p_used_fallback, v_version)
  on conflict (response_id, version) do nothing
  returning * into v_feedback;

  if v_feedback.id is null then
    select * into v_feedback from public.feedbacks
      where response_id = p_response_id and version = v_version;
  end if;

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

  -- ===== Gamification hooks (aislados) =====
  begin
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
  exception when others then
    v_gamification_error := '[' || SQLSTATE || '] ' || SQLERRM;
    raise warning 'finalize_response: gamification hook failed for response %: %',
      v_response.id, v_gamification_error;
  end;

  -- ===== Marcar la respuesta como completada (SIEMPRE, incluso si gamification falló) =====
  update public.student_responses set
    is_correct = p_is_correct,
    processing_status = 'completed',
    processing_error_code = case
      when v_gamification_error is not null then 'GAMIFICATION_HOOK_FAILED'
      else null
    end,
    completed_at = now()
  where id = v_response.id;

  return jsonb_build_object(
    'feedback_id', v_feedback.id,
    'version', v_version,
    'xp_earned', v_xp_earned,
    'achievements_unlocked', v_achievements_unlocked,
    'achievements', v_achievements->'items',
    'gamification_error', v_gamification_error
  );
end;
$$;

grant execute on function public.finalize_response(uuid,boolean,text,boolean,numeric,numeric,boolean,uuid,text) to service_role;
revoke execute on function public.finalize_response(uuid,boolean,text,boolean,numeric,numeric,boolean,uuid,text) from public, anon, authenticated;
