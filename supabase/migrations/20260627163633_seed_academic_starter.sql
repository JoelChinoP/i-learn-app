-- A concrete academic starter for the default catalog topic. It uses a new ID
-- so existing responses to the broad demo repertoire remain historically valid.
insert into public.questions (
  id,
  section_id,
  topic,
  difficulty_level,
  prompt,
  question_type,
  options,
  correct_answer,
  expected_answer_or_rubric,
  knowledge_tags,
  sequence,
  active
) values (
  '50000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Números enteros y operaciones',
  1,
  '¿Cuál es el resultado de -8 + 13?',
  'opcion_multiple',
  '["-21", "-5", "5", "21"]'::jsonb,
  '5',
  'Al avanzar 13 unidades desde -8 en la recta numérica se llega a 5.',
  array['numeros-enteros', 'suma', 'recta-numerica', 'inicio'],
  0,
  true
)
on conflict (id) do update set
  topic = excluded.topic,
  difficulty_level = excluded.difficulty_level,
  prompt = excluded.prompt,
  question_type = excluded.question_type,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  expected_answer_or_rubric = excluded.expected_answer_or_rubric,
  knowledge_tags = excluded.knowledge_tags,
  sequence = excluded.sequence,
  active = true;
