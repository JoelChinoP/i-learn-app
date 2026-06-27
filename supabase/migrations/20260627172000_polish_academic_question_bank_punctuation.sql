-- Remove punctuation artifacts produced when a focus hint already includes a
-- final period and the sentence continues with a comma/question/parenthesis.

update public.questions
set
  prompt = replace(
    replace(
      replace(
        replace(prompt, '., ¿', ', ¿'),
        '., which', ', which'
      ),
      '., qué', ', qué'
    ),
    '.)', ')'
  ),
  expected_answer_or_rubric = replace(
    replace(
      replace(expected_answer_or_rubric, '.,', ','),
      '.)', ')'
    ),
    '..', '.'
  )
where section_id = '00000000-0000-4000-8000-000000000001'::uuid
  and id::text like '60000000-%';
