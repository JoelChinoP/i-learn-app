-- Demo-wide static question bank.
-- Keeps the demo simple: one class section can serve questions for every topic
-- shown in the student catalog, while evaluation still happens server-side from
-- `questions.correct_answer` / `expected_answer_or_rubric`.

with topic_catalog(topic_index, topic) as (
  values
    (1, 'Números enteros y operaciones'),
    (2, 'Fracciones y decimales'),
    (3, 'Razones y proporciones'),
    (4, 'Porcentajes y aumentos sucesivos'),
    (5, 'Potencias y radicales'),
    (6, 'Notación científica'),
    (7, 'Lógica proposicional'),
    (8, 'Expresiones algebraicas'),
    (9, 'Ecuaciones lineales'),
    (10, 'Sistemas de ecuaciones 2×2'),
    (11, 'Inecuaciones lineales'),
    (12, 'Factorización'),
    (13, 'Ecuaciones cuadráticas'),
    (14, 'Funciones lineal y cuadrática'),
    (15, 'Progresiones aritmética y geométrica'),
    (16, 'Ángulos y rectas'),
    (17, 'Triángulos y congruencia'),
    (18, 'Polígonos y cuadriláteros'),
    (19, 'Circunferencia y círculo'),
    (20, 'Áreas y perímetros'),
    (21, 'Sólidos: prismas y pirámides'),
    (22, 'Razones trigonométricas'),
    (23, 'Geometría analítica'),
    (24, 'Tablas y gráficos estadísticos'),
    (25, 'Medidas de tendencia central'),
    (26, 'Medidas de dispersión'),
    (27, 'Probabilidad clásica'),
    (28, 'Probabilidad condicional'),
    (29, 'Combinatoria'),
    (30, 'Idea principal y secundarias'),
    (31, 'Inferencias y predicciones'),
    (32, 'Tipos de texto y propósito'),
    (33, 'Vocabulario por contexto'),
    (34, 'Conectores lógicos'),
    (35, 'Análisis crítico de fuentes'),
    (36, 'Coherencia y cohesión'),
    (37, 'Ortografía y tildación'),
    (38, 'Signos de puntuación'),
    (39, 'Estructura argumentativa'),
    (40, 'Ensayo y artículo de opinión'),
    (41, 'Citas y referencias'),
    (42, 'Géneros literarios'),
    (43, 'Literatura peruana e hispanoamericana'),
    (44, 'Figuras literarias'),
    (45, 'Exposición oral'),
    (46, 'Debate y argumentación oral'),
    (47, 'Magnitudes y unidades'),
    (48, 'Cinemática: MRU y MRUV'),
    (49, 'Dinámica y leyes de Newton'),
    (50, 'Trabajo y energía'),
    (51, 'Electricidad y circuitos'),
    (52, 'Ondas y sonido'),
    (53, 'Estados de la materia'),
    (54, 'Tabla periódica'),
    (55, 'Enlace químico'),
    (56, 'Reacciones y estequiometría'),
    (57, 'Disoluciones y pH'),
    (58, 'Célula y biomoléculas'),
    (59, 'Sistemas del cuerpo humano'),
    (60, 'Genética y herencia'),
    (61, 'Ecosistemas y biodiversidad'),
    (62, 'Salud y educación sexual integral'),
    (63, 'Capas de la Tierra y placas tectónicas'),
    (64, 'Clima y cambio climático'),
    (65, 'Sistema solar y universo'),
    (66, 'Culturas preincas'),
    (67, 'Imperio incaico'),
    (68, 'Conquista y virreinato'),
    (69, 'Independencia del Perú'),
    (70, 'República y siglo XIX'),
    (71, 'Perú siglo XX'),
    (72, 'Historia universal contemporánea'),
    (73, 'Ocho regiones del Perú'),
    (74, 'Departamentos y regiones'),
    (75, 'Recursos naturales del Perú'),
    (76, 'Riesgos y gestión de desastres'),
    (77, 'Cambio climático y sostenibilidad'),
    (78, 'Necesidades y bienes'),
    (79, 'Oferta, demanda y precios'),
    (80, 'Sistema financiero y ahorro'),
    (81, 'Economía del Perú'),
    (82, 'Autoestima y autoconcepto'),
    (83, 'Regulación emocional'),
    (84, 'Sexualidad integral'),
    (85, 'Proyecto de vida'),
    (86, 'Toma de decisiones'),
    (87, 'Derechos humanos'),
    (88, 'Estado peruano y poderes'),
    (89, 'Constitución del Perú'),
    (90, 'Participación ciudadana'),
    (91, 'Diversidad cultural'),
    (92, 'Ética y resolución de conflictos'),
    (93, 'Present simple y vocabulario básico'),
    (94, 'Past simple y narrativa breve'),
    (95, 'Future tenses'),
    (96, 'Reading short articles'),
    (97, 'Modal verbs'),
    (98, 'Conditional sentences'),
    (99, 'Passive voice'),
    (100, 'Personal description'),
    (101, 'Daily routines'),
    (102, 'Opinion writing'),
    (103, 'Job interview basics'),
    (104, 'Email writing')
), template_bank(
  template_index,
  question_type,
  difficulty_level,
  prompt_template,
  correct_answer,
  distractor_1,
  distractor_2,
  distractor_3,
  rubric_template
) as (
  values
    (
      1,
      'opcion_multiple',
      1,
      '¿Cuál es el mejor punto de partida para resolver una actividad sobre "{{topic}}"?',
      'Leer la consigna, ubicar datos importantes y relacionarlos con el tema.',
      'Responder con la primera idea que aparezca, sin revisar la consigna.',
      'Copiar una definición larga aunque no explique el caso.',
      'Elegir una opción al azar para avanzar más rápido.',
      'Debe reconocer que un buen inicio combina comprensión de consigna, datos relevantes y relación con "{{topic}}".'
    ),
    (
      2,
      'opcion_multiple',
      2,
      'En "{{topic}}", ¿qué evidencia muestra mejor que una respuesta está bien sustentada?',
      'Una explicación breve con datos, procedimiento y conclusión coherente.',
      'Una respuesta extensa que no usa datos del problema.',
      'Una frase memorizada sin conectar con la situación.',
      'Un dibujo decorativo sin explicación.',
      'Debe identificar evidencia, procedimiento y conclusión como rasgos de una respuesta sustentada.'
    ),
    (
      3,
      'opcion_multiple',
      3,
      'Si te equivocas en una pregunta de "{{topic}}", ¿cuál es la mejor estrategia para corregir?',
      'Revisar el paso donde cambió el resultado y comparar con la regla o criterio del tema.',
      'Borrar todo y repetir exactamente el mismo procedimiento.',
      'Cambiar solo la respuesta final sin revisar el proceso.',
      'Evitar ese tema y pasar a otro sin analizar el error.',
      'Debe elegir una estrategia de revisión del proceso y contraste con el criterio del tema.'
    ),
    (
      4,
      'texto_libre',
      2,
      'Explica con tus palabras una idea central de "{{topic}}" y por qué sirve para resolver problemas.',
      'Debe mencionar una idea clave del tema y explicar su utilidad en una situación concreta.',
      '',
      '',
      '',
      'Aceptar respuestas que nombren una idea relevante de "{{topic}}", la expliquen con claridad y conecten esa idea con una situación o problema.'
    ),
    (
      5,
      'texto_libre',
      3,
      'Plantea un ejemplo cotidiano donde se use "{{topic}}" y describe los pasos para resolverlo.',
      'Debe proponer un ejemplo pertinente y describir al menos dos pasos razonables de solución.',
      '',
      '',
      '',
      'Aceptar ejemplos coherentes con "{{topic}}" que incluyan contexto, datos o criterios, y pasos ordenados para llegar a una conclusión.'
    ),
    (
      6,
      'opcion_multiple',
      4,
      '¿Qué haría más fuerte una explicación avanzada sobre "{{topic}}"?',
      'Comparar dos casos, justificar diferencias y cerrar con una conclusión verificable.',
      'Usar palabras difíciles aunque no expliquen nada.',
      'Repetir el título del tema como si fuera una respuesta.',
      'Responder solo con sí o no.',
      'Debe valorar comparación, justificación y conclusión verificable como rasgos de una explicación avanzada.'
    )
), question_bank as (
  select
    ('40000000-' || substr(md5(c.topic || ':' || t.template_index::text), 1, 4) || '-4000-8000-' || substr(md5(c.topic || ':' || t.template_index::text), 5, 12))::uuid as id,
    '00000000-0000-4000-8000-000000000001'::uuid as section_id,
    c.topic,
    t.difficulty_level,
    replace(t.prompt_template, '{{topic}}', c.topic) as prompt,
    t.question_type,
    case
      when t.question_type = 'opcion_multiple' then
        case t.template_index % 4
          when 1 then jsonb_build_array(t.correct_answer, t.distractor_1, t.distractor_2, t.distractor_3)
          when 2 then jsonb_build_array(t.distractor_1, t.correct_answer, t.distractor_2, t.distractor_3)
          when 3 then jsonb_build_array(t.distractor_1, t.distractor_2, t.correct_answer, t.distractor_3)
          else jsonb_build_array(t.distractor_1, t.distractor_2, t.distractor_3, t.correct_answer)
        end
      else null::jsonb
    end as options,
    t.correct_answer,
    replace(t.rubric_template, '{{topic}}', c.topic) as expected_answer_or_rubric,
    array['demo', 'catalogo', 'curriculo']::text[] as knowledge_tags,
    1000 + c.topic_index * 10 + t.template_index as sequence
  from topic_catalog c
  cross join template_bank t
)
insert into public.questions(
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
)
select
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
  true
from question_bank
on conflict (id) do update set
  section_id = excluded.section_id,
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

insert into public.student_mastery_matrix(student_id, topic, mastery)
select p.student_id, q.topic, 0.2000
from public.profiles p
join public.student_section ss on ss.student_id = p.student_id
join public.questions q on q.section_id = ss.section_id and q.active
where p.role = 'alumno'
group by p.student_id, q.topic
on conflict (student_id, topic) do nothing;

drop function if exists public.get_student_dashboard();
drop function if exists public.get_student_dashboard(text, text);

create or replace function public.get_student_dashboard(
  p_topic text default null,
  p_question_pref text default 'mix'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_question public.questions%rowtype;
  v_topic text := nullif(trim(coalesce(p_topic, '')), '');
  v_question_pref text := coalesce(nullif(trim(p_question_pref), ''), 'mix');
  v_total_xp int;
  v_level int;
  v_next_level_xp int;
  v_current_level_xp int;
  v_progress_pct int;
  v_missions jsonb;
  v_achievements jsonb;
  v_result jsonb;
begin
  if v_question_pref not in ('multiple', 'open', 'mix') then
    v_question_pref := 'mix';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() and role = 'alumno';
  if v_profile.id is null then raise exception 'ROLE_FORBIDDEN'; end if;

  with eligible as (
    select q.*
    from public.questions q
    join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
    where q.active
      and (v_topic is null or lower(q.topic) = lower(v_topic))
      and (
        v_question_pref = 'mix'
        or (v_question_pref = 'multiple' and q.question_type = 'opcion_multiple')
        or (v_question_pref = 'open' and q.question_type = 'texto_libre')
      )
  ), unanswered as (
    select e.*
    from eligible e
    where not exists (
      select 1
      from public.student_responses sr
      where sr.question_id = e.id and sr.student_id = v_profile.student_id
    )
  )
  select * into v_question
  from unanswered
  order by random()
  limit 1;

  if v_question.id is null then
    with eligible as (
      select q.*
      from public.questions q
      join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
      where q.active
        and (v_topic is null or lower(q.topic) = lower(v_topic))
        and (
          v_question_pref = 'mix'
          or (v_question_pref = 'multiple' and q.question_type = 'opcion_multiple')
          or (v_question_pref = 'open' and q.question_type = 'texto_libre')
        )
    )
    select * into v_question
    from eligible
    order by random()
    limit 1;
  end if;

  if v_question.id is null and v_topic is not null then
    with eligible as (
      select q.*
      from public.questions q
      join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
      where q.active
        and (
          v_question_pref = 'mix'
          or (v_question_pref = 'multiple' and q.question_type = 'opcion_multiple')
          or (v_question_pref = 'open' and q.question_type = 'texto_libre')
        )
    ), unanswered as (
      select e.*
      from eligible e
      where not exists (
        select 1
        from public.student_responses sr
        where sr.question_id = e.id and sr.student_id = v_profile.student_id
      )
    )
    select * into v_question
    from unanswered
    order by random()
    limit 1;
  end if;

  if v_question.id is null then
    select q.* into v_question
    from public.questions q
    join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
    where q.active
    order by random()
    limit 1;
  end if;

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

  v_missions := public.get_active_missions(v_profile.student_id);

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

grant execute on function public.get_student_dashboard(text, text) to authenticated;
revoke execute on function public.get_student_dashboard(text, text) from public, anon;
