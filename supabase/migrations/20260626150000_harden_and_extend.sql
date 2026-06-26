-- Security and domain hardening for the adaptive learning demo.

alter extension vector set schema extensions;

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.instructor_section
  add constraint instructor_section_section_id_fkey
  foreign key (section_id) references public.sections(id) on delete cascade;

alter table public.questions
  add column prompt text not null default '',
  add column question_type text not null default 'opcion_multiple'
    check (question_type in ('opcion_multiple', 'texto_libre')),
  add column options jsonb,
  add column correct_answer text not null default '',
  add column sequence integer not null default 0 check (sequence >= 0),
  add column active boolean not null default true,
  add constraint questions_section_id_fkey
    foreign key (section_id) references public.sections(id) on delete cascade,
  add constraint questions_options_shape_check check (
    (question_type = 'texto_libre' and options is null)
    or
    (question_type = 'opcion_multiple' and jsonb_typeof(options) = 'array')
  );

alter table public.profiles
  alter column full_name set not null,
  alter column email set not null,
  add column onboarding_completed boolean not null default true;

create table public.student_section (
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (student_id, section_id)
);

create table public.student_link_codes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(code_hash) = 64)
);

create index student_link_codes_active_idx
  on public.student_link_codes (code_hash, expires_at)
  where used_at is null;

create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  terms_version text not null,
  signed_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index consent_events_student_idx on public.consent_events(student_id, signed_at desc);

create table public.mastery_events (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.student_responses(id) on delete cascade,
  student_id uuid not null references public.profiles(student_id) on delete cascade,
  topic text not null,
  previous_mastery numeric(5,4) not null check (previous_mastery between 0 and 1),
  new_mastery numeric(5,4) not null check (new_mastery between 0 and 1),
  is_correct boolean not null,
  updated boolean not null default true,
  created_at timestamptz not null default now()
);

create index mastery_events_student_created_idx on public.mastery_events(student_id, created_at desc);

drop index if exists public.knowledge_embeddings_embedding_idx;
alter table public.knowledge_embeddings
  alter column embedding drop not null,
  alter column embedding type extensions.vector(384) using null,
  add column embedding_text text not null default '',
  add column embedding_status text not null default 'pending'
    check (embedding_status in ('pending', 'ready', 'failed')),
  add column embedding_error text;

create index knowledge_embeddings_embedding_idx
  on public.knowledge_embeddings using hnsw (embedding extensions.vector_ip_ops)
  where embedding is not null;

alter table public.student_responses
  drop constraint student_responses_session_question_unique,
  add constraint student_responses_student_session_question_unique
    unique(student_id, session_id, question_id),
  add column processing_status text not null default 'queued'
    check (processing_status in ('queued', 'processing', 'completed', 'failed')),
  add column processing_error_code text,
  add column orchestration_attempts integer not null default 0,
  add column completed_at timestamptz;

alter table public.feedbacks
  add column version integer not null default 1 check (version > 0),
  add constraint feedbacks_response_version_unique unique(response_id, version);

alter table public.adaptive_paths
  add column response_id uuid references public.student_responses(id) on delete cascade;

create index adaptive_paths_created_idx on public.adaptive_paths(student_id, created_at desc);
create index questions_section_sequence_idx on public.questions(section_id, sequence) where active;

-- Remove policies that exposed mutable/sensitive rows too broadly.
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "student_responses_select_own" on public.student_responses;
drop policy if exists "mastery_select_as_tutor" on public.student_mastery_matrix;

alter table public.sections enable row level security;
alter table public.questions enable row level security;
alter table public.knowledge_embeddings enable row level security;
alter table public.student_section enable row level security;
alter table public.student_link_codes enable row level security;
alter table public.consent_events enable row level security;
alter table public.mastery_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.feedbacks to authenticated;
grant select on public.student_mastery_matrix to authenticated;
grant select on public.mastery_events to authenticated;
grant select on public.adaptive_paths to authenticated;

create policy "mastery_events_select_own"
  on public.mastery_events for select to authenticated
  using (student_id = (select student_id from public.profiles where id = auth.uid()));

-- Realtime uses the authenticated SELECT policy on feedbacks.
do $$
begin
  alter publication supabase_realtime add table public.feedbacks;
exception when duplicate_object then null;
end $$;

-- Private transactional registration entrypoint. Only service_role can execute it.
create or replace function public.register_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  p_section_code text default null,
  p_generated_link_hash text default null,
  p_generated_link_expires_at timestamptz default null,
  p_student_link_hash text default null,
  p_accept_consent boolean default false,
  p_terms_version text default null,
  p_instructor_authorized boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_section_id uuid;
  v_link public.student_link_codes%rowtype;
begin
  if p_role not in ('alumno', 'padre', 'instructor') then
    raise exception 'INVALID_ROLE';
  end if;
  if nullif(trim(p_full_name), '') is null then
    raise exception 'INVALID_NAME';
  end if;

  if p_role in ('alumno', 'instructor') then
    select id into v_section_id from public.sections
    where class_code = upper(trim(p_section_code)) and active;
    if v_section_id is null then raise exception 'INVALID_SECTION_CODE'; end if;
  end if;
  if p_role = 'instructor' and not p_instructor_authorized then
    raise exception 'INVALID_INSTRUCTOR_CODE';
  end if;
  if p_role = 'padre' and (not p_accept_consent or coalesce(p_terms_version, '') = '') then
    raise exception 'CONSENT_REQUIRED';
  end if;

  insert into public.profiles(id, email, full_name, role, onboarding_completed)
  values (p_user_id, lower(trim(p_email)), trim(p_full_name), p_role, true)
  returning * into v_profile;

  if p_role = 'alumno' then
    if p_generated_link_hash is null or p_generated_link_expires_at is null then
      raise exception 'LINK_CODE_REQUIRED';
    end if;
    insert into public.student_section(student_id, section_id)
    values (v_profile.student_id, v_section_id);
    insert into public.student_link_codes(student_id, code_hash, expires_at)
    values (v_profile.student_id, p_generated_link_hash, p_generated_link_expires_at);
    insert into public.student_mastery_matrix(student_id, topic, mastery)
    select v_profile.student_id, q.topic, 0.2000
    from public.questions q
    where q.section_id = v_section_id and q.active
    group by q.topic;
  elsif p_role = 'padre' then
    select * into v_link from public.student_link_codes
    where code_hash = p_student_link_hash and used_at is null and expires_at > now()
    for update;
    if v_link.id is null then raise exception 'INVALID_STUDENT_LINK'; end if;
    insert into public.tutor_student(tutor_id, student_id)
    values (p_user_id, v_link.student_id);
    insert into public.consent_events(tutor_id, student_id, terms_version)
    values (p_user_id, v_link.student_id, p_terms_version);
    update public.profiles
      set tutor_consent_signed = true, tutor_consent_date = now()
      where student_id = v_link.student_id and role = 'alumno';
    update public.student_link_codes set used_at = now() where id = v_link.id;
  else
    insert into public.instructor_section(instructor_id, section_id)
    values (p_user_id, v_section_id);
  end if;

  return jsonb_build_object(
    'id', v_profile.id,
    'student_id', v_profile.student_id,
    'role', v_profile.role,
    'full_name', v_profile.full_name,
    'email', v_profile.email
  );
end;
$$;

create or replace function public.link_student_to_tutor(
  p_tutor_id uuid,
  p_link_hash text,
  p_terms_version text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_link public.student_link_codes%rowtype;
begin
  if not exists (select 1 from public.profiles where id = p_tutor_id and role = 'padre') then
    raise exception 'ROLE_FORBIDDEN';
  end if;
  select * into v_link from public.student_link_codes
  where code_hash = p_link_hash and used_at is null and expires_at > now()
  for update;
  if v_link.id is null then raise exception 'INVALID_STUDENT_LINK'; end if;
  insert into public.tutor_student(tutor_id, student_id)
  values (p_tutor_id, v_link.student_id)
  on conflict do nothing;
  insert into public.consent_events(tutor_id, student_id, terms_version)
  values (p_tutor_id, v_link.student_id, p_terms_version);
  update public.profiles set tutor_consent_signed = true, tutor_consent_date = now()
  where student_id = v_link.student_id and role = 'alumno';
  update public.student_link_codes set used_at = now() where id = v_link.id;
  return v_link.student_id;
end;
$$;

create or replace function public.rotate_student_link_code(
  p_user_id uuid,
  p_link_hash text,
  p_expires_at timestamptz
)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_student_id uuid;
begin
  select student_id into v_student_id from public.profiles where id = p_user_id and role = 'alumno';
  if v_student_id is null then raise exception 'ROLE_FORBIDDEN'; end if;
  update public.student_link_codes set used_at = now()
  where student_id = v_student_id and used_at is null;
  insert into public.student_link_codes(student_id, code_hash, expires_at)
  values (v_student_id, p_link_hash, p_expires_at);
  return p_expires_at;
end;
$$;

create or replace function public.match_knowledge_embeddings(
  p_embedding extensions.vector(384),
  p_match_threshold float default 0.35,
  p_match_count int default 3
)
returns table(id uuid, question_id uuid, content text, similarity float)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select ke.id, ke.question_id, ke.content,
    (1 - (ke.embedding <=> p_embedding))::float as similarity
  from public.knowledge_embeddings ke
  where ke.embedding is not null
    and 1 - (ke.embedding <=> p_embedding) >= p_match_threshold
  order by ke.embedding <=> p_embedding
  limit greatest(1, least(p_match_count, 5));
$$;

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
  return jsonb_build_object('feedback_id', v_feedback.id, 'version', v_version);
end;
$$;

create or replace function public.add_feedback_version(
  p_response_id uuid,
  p_explanation text,
  p_used_fallback boolean
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
begin
  select * into v_response from public.student_responses where id = p_response_id for update;
  if v_response.id is null then raise exception 'RESPONSE_NOT_FOUND'; end if;
  select coalesce(max(version), 0) + 1 into v_version from public.feedbacks where response_id = p_response_id;
  insert into public.feedbacks(response_id, student_id, explanation, used_fallback, version)
  values (v_response.id, v_response.student_id, p_explanation, p_used_fallback, v_version)
  returning * into v_feedback;
  return jsonb_build_object('feedback_id', v_feedback.id, 'version', v_version);
end;
$$;

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
      where student_id = v_profile.student_id and created_at >= current_date - 6)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.get_parent_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'padre') then
    raise exception 'ROLE_FORBIDDEN';
  end if;
  select jsonb_build_object(
    'children', coalesce(jsonb_agg(jsonb_build_object(
      'id', child.student_id,
      'name', child.full_name,
      'lastActivityDate', (select max(sr.created_at) from public.student_responses sr where sr.student_id = child.student_id),
      'mastery', coalesce((select jsonb_agg(jsonb_build_object(
        'topic', sm.topic, 'mastery', round((sm.mastery * 100)::numeric, 0), 'alert', sm.mastery < 0.5
      ) order by sm.topic) from public.student_mastery_matrix sm where sm.student_id = child.student_id), '[]'::jsonb),
      'history', coalesce((select jsonb_agg(jsonb_build_object(
        'date', me.created_at, 'topic', me.topic, 'mastery', round((me.new_mastery * 100)::numeric, 0)
      ) order by me.created_at) from public.mastery_events me where me.student_id = child.student_id), '[]'::jsonb),
      'activity', coalesce((select jsonb_agg(jsonb_build_object('date', d.activity_date, 'count', coalesce(a.activity_count, 0)) order by d.activity_date)
        from (select generate_series(current_date - 29, current_date, interval '1 day')::date as activity_date) d
        left join (select created_at::date as activity_date, count(*) as activity_count from public.student_responses
          where student_id = child.student_id and created_at >= current_date - 29 group by 1) a using(activity_date)), '[]'::jsonb)
    ) order by child.full_name), '[]'::jsonb)
  ) into v_result
  from public.tutor_student ts
  join public.profiles child on child.student_id = ts.student_id and child.role = 'alumno'
  where ts.tutor_id = auth.uid();
  return coalesce(v_result, jsonb_build_object('children', '[]'::jsonb));
end;
$$;

create or replace function public.get_instructor_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'instructor') then
    raise exception 'ROLE_FORBIDDEN';
  end if;
  select jsonb_build_object(
    'sections', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name))
      from public.instructor_section ins join public.sections s on s.id = ins.section_id
      where ins.instructor_id = auth.uid()), '[]'::jsonb),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
      'studentId', p.student_id,
      'studentAlias', 'Alumno ' || upper(substr(replace(p.student_id::text, '-', ''), 1, 6)),
      'topic', sm.topic,
      'mastery', round((sm.mastery * 100)::numeric, 0),
      'lastActivity', coalesce((select max(sr.created_at) from public.student_responses sr where sr.student_id = p.student_id), p.created_at)
    ) order by p.student_id, sm.topic)
      from public.instructor_section ins
      join public.student_section ss on ss.section_id = ins.section_id
      join public.profiles p on p.student_id = ss.student_id and p.role = 'alumno'
      join public.student_mastery_matrix sm on sm.student_id = p.student_id
      where ins.instructor_id = auth.uid()), '[]'::jsonb),
    'trend', coalesce((select jsonb_agg(jsonb_build_object('week', x.week, 'average', x.average) order by x.week)
      from (select date_trunc('week', me.created_at)::date week,
          round(avg(me.new_mastery * 100)::numeric, 0) average
        from public.instructor_section ins
        join public.student_section ss on ss.section_id = ins.section_id
        join public.mastery_events me on me.student_id = ss.student_id
        where ins.instructor_id = auth.uid()
        group by 1) x), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

grant execute on function public.get_student_dashboard() to authenticated;
grant execute on function public.get_parent_dashboard() to authenticated;
grant execute on function public.get_instructor_analytics() to authenticated;
revoke execute on function public.get_student_dashboard() from public, anon;
revoke execute on function public.get_parent_dashboard() from public, anon;
revoke execute on function public.get_instructor_analytics() from public, anon;

revoke all on function public.register_profile(uuid,text,text,text,text,text,timestamptz,text,boolean,text,boolean) from public, anon, authenticated;
revoke all on function public.link_student_to_tutor(uuid,text,text) from public, anon, authenticated;
revoke all on function public.rotate_student_link_code(uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.match_knowledge_embeddings(extensions.vector,float,int) from public, anon, authenticated;
revoke all on function public.finalize_response(uuid,boolean,text,boolean,numeric,numeric,boolean,uuid,text) from public, anon, authenticated;
revoke all on function public.add_feedback_version(uuid,text,boolean) from public, anon, authenticated;

grant execute on function public.register_profile(uuid,text,text,text,text,text,timestamptz,text,boolean,text,boolean) to service_role;
grant execute on function public.link_student_to_tutor(uuid,text,text) to service_role;
grant execute on function public.rotate_student_link_code(uuid,text,timestamptz) to service_role;
grant execute on function public.match_knowledge_embeddings(extensions.vector,float,int) to service_role;
grant execute on function public.finalize_response(uuid,boolean,text,boolean,numeric,numeric,boolean,uuid,text) to service_role;
grant execute on function public.add_feedback_version(uuid,text,boolean) to service_role;
