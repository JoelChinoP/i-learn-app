-- Polish generated academic bank text where catalog focus hints already ended
-- with punctuation and the prompt template added another period.

update public.questions
set
  prompt = replace(prompt, '..', '.'),
  correct_answer = replace(correct_answer, '..', '.'),
  expected_answer_or_rubric = replace(expected_answer_or_rubric, '..', '.')
where section_id = '00000000-0000-4000-8000-000000000001'::uuid
  and id::text like '60000000-%';
