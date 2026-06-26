create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  student_id uuid not null default gen_random_uuid() unique,
  role text not null check (role in ('alumno', 'padre', 'instructor')),
  full_name text,
  email text,
  tutor_consent_signed boolean not null default false,
  tutor_consent_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tutor_student (
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (student_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tutor_id, student_id)
);

create table if not exists public.instructor_section (
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  section_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (instructor_id, section_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid,
  topic text not null,
  difficulty_level int not null check (difficulty_level between 1 and 5),
  expected_answer_or_rubric text not null,
  knowledge_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions (id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_embeddings_embedding_idx
  on public.knowledge_embeddings using hnsw (embedding vector_cosine_ops);

create table if not exists public.student_responses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (student_id) on delete cascade,
  question_id uuid not null references public.questions (id),
  session_id uuid not null,
  clean_answer text not null check (char_length(clean_answer) > 0 and char_length(clean_answer) <= 4000),
  created_at timestamptz not null default now(),
  topic text not null,
  difficulty_level int not null,
  expected_answer_or_rubric text not null,
  knowledge_tags text[] not null default '{}',
  is_correct boolean,
  constraint student_responses_session_question_unique unique (session_id, question_id)
);

create index if not exists student_responses_student_id_idx on public.student_responses (student_id);
create index if not exists student_responses_question_id_idx on public.student_responses (question_id);

create table if not exists public.student_mastery_matrix (
  student_id uuid not null references public.profiles (student_id) on delete cascade,
  topic text not null,
  mastery numeric(5,4) not null default 0 check (mastery between 0 and 1),
  updated_at timestamptz not null default now(),
  primary key (student_id, topic)
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.student_responses (id) on delete cascade,
  student_id uuid not null references public.profiles (student_id) on delete cascade,
  explanation text not null,
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists feedbacks_student_id_idx on public.feedbacks (student_id);

create table if not exists public.adaptive_paths (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (student_id) on delete cascade,
  topic text not null,
  recommended_question_id uuid references public.questions (id),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists adaptive_paths_student_id_idx on public.adaptive_paths (student_id);

alter table public.profiles enable row level security;
alter table public.student_responses enable row level security;
alter table public.feedbacks enable row level security;
alter table public.adaptive_paths enable row level security;
alter table public.student_mastery_matrix enable row level security;
alter table public.tutor_student enable row level security;
alter table public.instructor_section enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
create policy "student_responses_select_own" on public.student_responses for select using (
  student_id = (select student_id from public.profiles where id = auth.uid())
);
create policy "feedbacks_select_own" on public.feedbacks for select using (
  student_id = (select student_id from public.profiles where id = auth.uid())
);
create policy "adaptive_paths_select_own" on public.adaptive_paths for select using (
  student_id = (select student_id from public.profiles where id = auth.uid())
);
create policy "mastery_select_own_student" on public.student_mastery_matrix for select using (
  student_id = (select student_id from public.profiles where id = auth.uid())
);
create policy "mastery_select_as_tutor" on public.student_mastery_matrix for select using (
  student_id in (select ts.student_id from public.tutor_student ts where ts.tutor_id = auth.uid())
);
create policy "tutor_student_select_own" on public.tutor_student for select using (tutor_id = auth.uid());
create policy "instructor_section_select_own" on public.instructor_section for select using (instructor_id = auth.uid());
