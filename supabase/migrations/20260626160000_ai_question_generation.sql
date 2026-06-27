-- ============================================================================
-- "Generación de preguntas con IA" — capa de contenido subido por el docente
-- y borradores de preguntas pendientes de aprobación humana.
--
-- Reglas duras del diseño:
--   1. NUNCA se publican preguntas generadas automáticamente. El docente debe
--      aprobarlas (o editarlas antes de aprobar) antes de que lleguen al alumno.
--   2. `course_content` y `ai_draft_questions` solo son visibles / editables
--      por el instructor dueño de la sección (RLS estricto).
--   3. `approve_draft_question` / `reject_draft_question` son SECURITY DEFINER
--      y validan el rol. Los inserts a `questions` siempre nacen con
--      `active = false`; el docente activa cada pregunta a mano después.
-- ============================================================================

create table public.course_content (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  topic text not null,
  source_type text not null check (source_type in ('text', 'url', 'pdf')),
  source_label text not null check (char_length(source_label) between 1 and 200),
  raw_text text,
  extracted_status text not null default 'pending'
    check (extracted_status in ('pending', 'processing', 'ready', 'failed')),
  extracted_error text,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index course_content_section_topic_idx
  on public.course_content (section_id, topic);
create index course_content_status_idx
  on public.course_content (extracted_status);

alter table public.course_content enable row level security;

-- ----------------------------------------------------------------------------
-- Borradores generados por IA. Estado inicial SIEMPRE 'draft'.
-- ----------------------------------------------------------------------------
create table public.ai_draft_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  topic text not null,
  difficulty_level int not null check (difficulty_level between 1 and 5),
  prompt text not null check (char_length(prompt) between 10 and 1000),
  question_type text not null check (question_type in ('opcion_multiple', 'texto_libre')),
  options jsonb,
  correct_answer text not null check (char_length(correct_answer) between 1 and 500),
  expected_answer_or_rubric text not null check (char_length(expected_answer_or_rubric) between 5 and 2000),
  knowledge_tags text[] not null default '{}',
  source_content_ids uuid[] not null default '{}',
  generation_provider text not null check (generation_provider in ('gemini', 'deepseek')),
  generation_model text not null,
  generation_params jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_question_id uuid references public.questions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ai_draft_section_topic_status_idx
  on public.ai_draft_questions (section_id, topic, status, created_at desc);

alter table public.ai_draft_questions enable row level security;

-- ----------------------------------------------------------------------------
-- RLS para instructores dueños de la sección.
-- ----------------------------------------------------------------------------
create policy "course_content_instructor_all" on public.course_content
  for all using (
    exists (
      select 1 from public.instructor_section ins
      where ins.instructor_id = auth.uid() and ins.section_id = course_content.section_id
    )
  ) with check (
    exists (
      select 1 from public.instructor_section ins
      where ins.instructor_id = auth.uid() and ins.section_id = course_content.section_id
    )
  );

-- ai_draft_questions: SELECT y UPDATE solo por instructor dueño.
-- INSERT no se permite directo — siempre pasa por la función RPC security definer.
create policy "ai_draft_instructor_select" on public.ai_draft_questions
  for select using (
    exists (
      select 1 from public.instructor_section ins
      where ins.instructor_id = auth.uid() and ins.section_id = ai_draft_questions.section_id
    )
  );
create policy "ai_draft_instructor_update" on public.ai_draft_questions
  for update using (
    exists (
      select 1 from public.instructor_section ins
      where ins.instructor_id = auth.uid() and ins.section_id = ai_draft_questions.section_id
    )
  );

-- ============================================================================
-- RPC: aprobar un borrador (con o sin ediciones) → migra a `questions`.
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
    sequence, active
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
    false  -- el docente activa después
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

-- ============================================================================
-- RPC: rechazar un borrador.
-- ============================================================================
create or replace function public.reject_draft_question(
  p_draft_id uuid,
  p_reviewer_id uuid,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_draft public.ai_draft_questions%rowtype;
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

  if not exists (
    select 1 from public.instructor_section ins
    where ins.instructor_id = p_reviewer_id and ins.section_id = v_draft.section_id
  ) then
    raise exception 'NOT_SECTION_OWNER';
  end if;

  update public.ai_draft_questions
     set status = 'rejected',
         reviewer_id = p_reviewer_id,
         reviewed_at = now(),
         review_notes = p_review_notes
   where id = p_draft_id;
end;
$$;

grant execute on function public.reject_draft_question(uuid, uuid, text) to authenticated;

-- ============================================================================
-- RPC: listar borradores pendientes de una sección (útil para la UI).
-- Solo devuelve borradores del instructor dueño.
-- ============================================================================
create or replace function public.list_instructor_drafts(p_section_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'instructor'
  ) then
    raise exception 'ROLE_FORBIDDEN';
  end if;

  if not exists (
    select 1 from public.instructor_section ins
    where ins.instructor_id = auth.uid() and ins.section_id = p_section_id
  ) then
    raise exception 'NOT_SECTION_OWNER';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'topic', d.topic,
    'difficulty_level', d.difficulty_level,
    'prompt', d.prompt,
    'question_type', d.question_type,
    'options', d.options,
    'correct_answer', d.correct_answer,
    'expected_answer_or_rubric', d.expected_answer_or_rubric,
    'knowledge_tags', d.knowledge_tags,
    'source_content_ids', d.source_content_ids,
    'generation_provider', d.generation_provider,
    'generation_model', d.generation_model,
    'status', d.status,
    'reviewer_id', d.reviewer_id,
    'reviewed_at', d.reviewed_at,
    'review_notes', d.review_notes,
    'created_question_id', d.created_question_id,
    'created_at', d.created_at
  ) order by d.created_at desc), '[]'::jsonb)
  into v_result
  from public.ai_draft_questions d
  where d.section_id = p_section_id;

  return v_result;
end;
$$;

grant execute on function public.list_instructor_drafts(uuid) to authenticated;

-- ============================================================================
-- RPC: listar contenido subido por el docente de una sección.
-- ============================================================================
create or replace function public.list_instructor_content(p_section_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'instructor'
  ) then
    raise exception 'ROLE_FORBIDDEN';
  end if;

  if not exists (
    select 1 from public.instructor_section ins
    where ins.instructor_id = auth.uid() and ins.section_id = p_section_id
  ) then
    raise exception 'NOT_SECTION_OWNER';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'topic', c.topic,
    'source_type', c.source_type,
    'source_label', c.source_label,
    'raw_text', c.raw_text,
    'extracted_status', c.extracted_status,
    'extracted_error', c.extracted_error,
    'created_at', c.created_at,
    'processed_at', c.processed_at
  ) order by c.created_at desc), '[]'::jsonb)
  into v_result
  from public.course_content c
  where c.section_id = p_section_id;

  return v_result;
end;
$$;

grant execute on function public.list_instructor_content(uuid) to authenticated;