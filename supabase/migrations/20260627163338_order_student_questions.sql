-- Keep the first student-facing questions predictable and academic.
-- The original demo questions use the lowest sequences, while the broad
-- catalog repertoire starts at 1011. Topic-filtered sessions keep their own
-- sequence order because every selected row includes `questions.sequence`.
do $$
declare
  v_definition text;
  v_ordered_definition text;
begin
  select pg_get_functiondef('public.get_student_dashboard(text,text)'::regprocedure)
    into v_definition;

  v_ordered_definition := replace(
    v_definition,
    'order by random()',
    'order by sequence'
  );

  if v_ordered_definition = v_definition then
    raise exception 'GET_STUDENT_DASHBOARD_RANDOM_ORDER_NOT_FOUND';
  end if;

  execute v_ordered_definition;
end;
$$;
