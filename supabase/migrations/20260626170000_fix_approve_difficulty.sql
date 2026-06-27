-- ============================================================================
-- Fix: approve_draft_question no estaba insertando `difficulty_level` en
-- `public.questions`, lo que disparaba el NOT NULL constraint.
-- ============================================================================

create or replace function public.approve_draft_question(
  p_draft_id uuid,
  p_reviewer_id uuid,
  p_edits jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_draft public.ai_draft_questions%rowtype;
  v_new_question_id uuid;
  v_prompt text;
  v_question_type text;
  v_options jsonb;
  v_correct_answer text;
  v_rubric text;
  v_tags text[];
  v_difficulty int;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_reviewer_id and role = 'instructor'
  ) then
    raise exception 'ROLE_FORBIDDEN';
  end if;

  select * into v_draft
  from public.ai_draft_questions
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'DRAFT_NOT_FOUND';
  end if;

  if v_draft.status <> 'draft' then
    raise exception 'DRAFT_NOT_PENDING';
  end if;

  -- Validar que el revisor es dueño de la sección.
  if not exists (
    select 1 from public.instructor_section ins
    where ins.instructor_id = p_reviewer_id and ins.section_id = v_draft.section_id
  ) then
    raise exception 'NOT_SECTION_OWNER';
  end if;

  v_prompt := coalesce(p_edits->>'prompt', v_draft.prompt);
  v_question_type := coalesce(p_edits->>'question_type', v_draft.question_type);
  v_correct_answer := coalesce(p_edits->>'correct_answer', v_draft.correct_answer);
  v_rubric := coalesce(p_edits->>'expected_answer_or_rubric', v_draft.expected_answer_or_rubric);
  v_difficulty := coalesce((p_edits->>'difficulty_level')::int, v_draft.difficulty_level);

  if p_edits ? 'options' then
    v_options := p_edits->'options';
  else
    v_options := v_draft.options;
  end if;

  if p_edits ? 'knowledge_tags' then
    v_tags := array(
      select jsonb_array_elements_text(p_edits->'knowledge_tags')
    );
  else
    v_tags := v_draft.knowledge_tags;
  end if;

  -- Para opción múltiple las options son obligatorias y deben ser un array JSON.
  if v_question_type = 'opcion_multiple' then
    if v_options is null or jsonb_typeof(v_options) <> 'array' or jsonb_array_length(v_options) < 2 then
      raise exception 'INVALID_OPTIONS_SHAPE';
    end if;
  else
    v_options := null;
  end if;

  insert into public.questions (
    section_id, topic, prompt, question_type, options,
    correct_answer, expected_answer_or_rubric, knowledge_tags,
    sequence, active, difficulty_level
  ) values (
    v_draft.section_id,
    v_draft.topic,
    v_prompt,
    v_question_type,
    v_options,
    v_correct_answer,
    v_rubric,
    coalesce(v_tags, '{}'),
    (
      select coalesce(max(sequence), 0) + 1
      from public.questions
      where section_id = v_draft.section_id
    ),
    false,        -- el docente activa después
    v_difficulty  -- FIX: faltaba este campo en el INSERT original
  )
  returning id into v_new_question_id;

  update public.ai_draft_questions
     set status = 'approved',
         reviewer_id = p_reviewer_id,
         reviewed_at = now(),
         review_notes = p_edits->>'review_notes',
         created_question_id = v_new_question_id
   where id = p_draft_id;

  return v_new_question_id;
end;
$$;

grant execute on function public.approve_draft_question(uuid, uuid, jsonb) to authenticated;