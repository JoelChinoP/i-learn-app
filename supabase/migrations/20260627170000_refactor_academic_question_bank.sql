-- Refactor the demo academic question bank.
-- Old demo/catalog questions are deactivated instead of deleted so historical
-- student responses keep their original question references.
-- The active bank below creates 5 ordered questions for every catalog topic:
-- definition/opening, comprehension, applied case, advanced criterion, synthesis.

with topic_catalog(topic_index, course_code, topic, focus) as (
  values
    (1, 'mat', 'Números enteros y operaciones', 'Signos, jerarquía, valor absoluto.'),
    (2, 'mat', 'Fracciones y decimales', 'Equivalencias, operaciones, conversiones.'),
    (3, 'mat', 'Razones y proporciones', 'Regla de tres simple y compuesta.'),
    (4, 'mat', 'Porcentajes y aumentos sucesivos', 'Descuentos, IGV, intereses.'),
    (5, 'mat', 'Potencias y radicales', 'Propiedades, racionalización.'),
    (6, 'mat', 'Notación científica', 'Magnitudes muy grandes y muy pequeñas.'),
    (7, 'mat', 'Lógica proposicional', 'Conectores, tablas de verdad.'),
    (8, 'mat', 'Expresiones algebraicas', 'Reducción, valor numérico.'),
    (9, 'mat', 'Ecuaciones lineales', 'Una y dos variables.'),
    (10, 'mat', 'Sistemas de ecuaciones 2×2', 'Reducción, sustitución, gráfico.'),
    (11, 'mat', 'Inecuaciones lineales', 'Intervalos, recta numérica.'),
    (12, 'mat', 'Factorización', 'Aspa simple, diferencia de cuadrados.'),
    (13, 'mat', 'Ecuaciones cuadráticas', 'Fórmula general, discriminante.'),
    (14, 'mat', 'Funciones lineal y cuadrática', 'Gráfica, dominio y rango.'),
    (15, 'mat', 'Progresiones aritmética y geométrica', 'Término general, suma de n términos.'),
    (16, 'mat', 'Ángulos y rectas', 'Pares de ángulos, paralelas.'),
    (17, 'mat', 'Triángulos y congruencia', 'Criterios LAL, ALA, LLL.'),
    (18, 'mat', 'Polígonos y cuadriláteros', 'Ángulos internos, áreas.'),
    (19, 'mat', 'Circunferencia y círculo', 'Arcos, sectores, π.'),
    (20, 'mat', 'Áreas y perímetros', 'Figuras compuestas.'),
    (21, 'mat', 'Sólidos: prismas y pirámides', 'Volumen y superficie.'),
    (22, 'mat', 'Razones trigonométricas', 'Sen, cos, tan en triángulo rectángulo.'),
    (23, 'mat', 'Geometría analítica', 'Punto, recta, distancia.'),
    (24, 'mat', 'Tablas y gráficos estadísticos', 'Barras, circulares, histograma.'),
    (25, 'mat', 'Medidas de tendencia central', 'Media, mediana, moda.'),
    (26, 'mat', 'Medidas de dispersión', 'Rango, varianza, desviación.'),
    (27, 'mat', 'Probabilidad clásica', 'Espacios muestrales y eventos.'),
    (28, 'mat', 'Probabilidad condicional', 'Eventos dependientes e independientes.'),
    (29, 'mat', 'Combinatoria', 'Permutaciones y combinaciones.'),
    (30, 'com', 'Idea principal y secundarias', 'Identificar el tema y el centro del párrafo.'),
    (31, 'com', 'Inferencias y predicciones', 'Leer entre líneas con evidencia.'),
    (32, 'com', 'Tipos de texto y propósito', 'Narrativo, expositivo, argumentativo.'),
    (33, 'com', 'Vocabulario por contexto', 'Sinónimos, antónimos, polisemia.'),
    (34, 'com', 'Conectores lógicos', 'Causa, contraste, secuencia.'),
    (35, 'com', 'Análisis crítico de fuentes', 'Sesgo, intención y verosimilitud.'),
    (36, 'com', 'Coherencia y cohesión', 'Que el texto fluya sin saltos.'),
    (37, 'com', 'Ortografía y tildación', 'Reglas y tildes diacríticas.'),
    (38, 'com', 'Signos de puntuación', 'Coma, punto y coma, dos puntos.'),
    (39, 'com', 'Estructura argumentativa', 'Tesis, argumentos, contraargumentos.'),
    (40, 'com', 'Ensayo y artículo de opinión', 'Voz autoral y registro formal.'),
    (41, 'com', 'Citas y referencias', 'APA básico, evitar plagio.'),
    (42, 'com', 'Géneros literarios', 'Narrativo, lírico, dramático.'),
    (43, 'com', 'Literatura peruana e hispanoamericana', 'Vallejo, García Márquez, Vargas Llosa.'),
    (44, 'com', 'Figuras literarias', 'Metáfora, hipérbole, sinécdoque.'),
    (45, 'com', 'Exposición oral', 'Estructura y manejo del tiempo.'),
    (46, 'com', 'Debate y argumentación oral', 'Tomar postura y rebatir.'),
    (47, 'cyt', 'Magnitudes y unidades', 'SI, conversiones, vectores.'),
    (48, 'cyt', 'Cinemática: MRU y MRUV', 'Posición, velocidad, aceleración.'),
    (49, 'cyt', 'Dinámica y leyes de Newton', 'Fuerza, masa, aceleración.'),
    (50, 'cyt', 'Trabajo y energía', 'Conservación de la energía mecánica.'),
    (51, 'cyt', 'Electricidad y circuitos', 'Voltaje, corriente, Ley de Ohm.'),
    (52, 'cyt', 'Ondas y sonido', 'Frecuencia, longitud de onda, eco.'),
    (53, 'cyt', 'Estados de la materia', 'Cambios físicos y químicos.'),
    (54, 'cyt', 'Tabla periódica', 'Grupos, periodos, propiedades.'),
    (55, 'cyt', 'Enlace químico', 'Iónico, covalente, metálico.'),
    (56, 'cyt', 'Reacciones y estequiometría', 'Balanceo y mol.'),
    (57, 'cyt', 'Disoluciones y pH', 'Ácidos, bases, neutralización.'),
    (58, 'cyt', 'Célula y biomoléculas', 'Procariota, eucariota, ADN.'),
    (59, 'cyt', 'Sistemas del cuerpo humano', 'Digestivo, circulatorio, nervioso.'),
    (60, 'cyt', 'Genética y herencia', 'Mendel, ADN y mutaciones.'),
    (61, 'cyt', 'Ecosistemas y biodiversidad', 'Cadenas tróficas, biomas del Perú.'),
    (62, 'cyt', 'Salud y educación sexual integral', 'Prevención, ITS, anatomía reproductiva.'),
    (63, 'cyt', 'Capas de la Tierra y placas tectónicas', 'Sismos en Perú y vulcanismo.'),
    (64, 'cyt', 'Clima y cambio climático', 'Calentamiento global y mitigación.'),
    (65, 'cyt', 'Sistema solar y universo', 'Cuerpos celestes, leyes de Kepler.'),
    (66, 'ccss', 'Culturas preincas', 'Caral, Chavín, Mochica, Wari.'),
    (67, 'ccss', 'Imperio incaico', 'Organización, expansión, caída.'),
    (68, 'ccss', 'Conquista y virreinato', 'Conquista, mita, encomienda.'),
    (69, 'ccss', 'Independencia del Perú', 'San Martín, Bolívar, Ayacucho.'),
    (70, 'ccss', 'República y siglo XIX', 'Caudillismo, guerra del Pacífico.'),
    (71, 'ccss', 'Perú siglo XX', 'Oncenio, reformas, CVR.'),
    (72, 'ccss', 'Historia universal contemporánea', 'Guerras mundiales, Guerra Fría, globalización.'),
    (73, 'ccss', 'Ocho regiones del Perú', 'Pulgar Vidal: Costa, Sierra, Selva y subregiones.'),
    (74, 'ccss', 'Departamentos y regiones', '24 departamentos, capitales.'),
    (75, 'ccss', 'Recursos naturales del Perú', 'Pesca, minería, biodiversidad.'),
    (76, 'ccss', 'Riesgos y gestión de desastres', 'Sismos, friajes, El Niño.'),
    (77, 'ccss', 'Cambio climático y sostenibilidad', 'Huella de carbono y ODS.'),
    (78, 'ccss', 'Necesidades y bienes', 'Escasez y elección.'),
    (79, 'ccss', 'Oferta, demanda y precios', 'Funcionamiento del mercado.'),
    (80, 'ccss', 'Sistema financiero y ahorro', 'Bancos, tasas, presupuesto personal.'),
    (81, 'ccss', 'Economía del Perú', 'PBI, sectores productivos, exportación.'),
    (82, 'dpcc', 'Autoestima y autoconcepto', 'Reconocer fortalezas y límites.'),
    (83, 'dpcc', 'Regulación emocional', 'Identificar y gestionar emociones.'),
    (84, 'dpcc', 'Sexualidad integral', 'Identidad, género y respeto.'),
    (85, 'dpcc', 'Proyecto de vida', 'Metas a corto y largo plazo.'),
    (86, 'dpcc', 'Toma de decisiones', 'Criterios y consecuencias.'),
    (87, 'dpcc', 'Derechos humanos', 'Declaración universal y casos.'),
    (88, 'dpcc', 'Estado peruano y poderes', 'Ejecutivo, legislativo, judicial.'),
    (89, 'dpcc', 'Constitución del Perú', 'Derechos fundamentales.'),
    (90, 'dpcc', 'Participación ciudadana', 'Voto, organización, vigilancia.'),
    (91, 'dpcc', 'Diversidad cultural', 'Interculturalidad y pueblos originarios.'),
    (92, 'dpcc', 'Ética y resolución de conflictos', 'Diálogo y mediación.'),
    (93, 'ing', 'Present simple y vocabulario básico', 'Routines, jobs, family.'),
    (94, 'ing', 'Past simple y narrativa breve', 'Last weekend, last summer.'),
    (95, 'ing', 'Future tenses', 'Will, going to, present continuous.'),
    (96, 'ing', 'Reading short articles', 'Skimming, scanning y main idea.'),
    (97, 'ing', 'Modal verbs', 'Can, should, must, have to.'),
    (98, 'ing', 'Conditional sentences', 'Zero, first, second conditional.'),
    (99, 'ing', 'Passive voice', 'Tenses passive forms.'),
    (100, 'ing', 'Personal description', 'Adjectives, family, hobbies.'),
    (101, 'ing', 'Daily routines', 'Frequency adverbs y horarios.'),
    (102, 'ing', 'Opinion writing', 'Linkers y vocabulario académico.'),
    (103, 'ing', 'Job interview basics', 'Common questions y responses.'),
    (104, 'ing', 'Email writing', 'Formal vs informal.')
), deactivated as (
  update public.questions
  set active = false
  where section_id = '00000000-0000-4000-8000-000000000001'::uuid
    and active = true
  returning id
), question_bank as (
  select
    ('60000000-' || substr(md5(c.topic || ':' || q.q_order::text), 1, 4) || '-4000-8000-' || substr(md5(c.topic || ':' || q.q_order::text), 5, 12))::uuid as id,
    '00000000-0000-4000-8000-000000000001'::uuid as section_id,
    c.topic,
    q.difficulty_level,
    q.prompt,
    q.question_type,
    q.options,
    q.correct_answer,
    q.expected_answer_or_rubric,
    array[
      'banco-academico',
      c.course_code,
      regexp_replace(lower(c.topic), '[^[:alnum:]]+', '-', 'g'),
      regexp_replace(lower(c.focus), '[^[:alnum:]]+', '-', 'g')
    ]::text[] as knowledge_tags,
    (c.topic_index * 10 + q.q_order) as sequence,
    true as active
  from topic_catalog c
  cross join lateral (
    values
      (
        1,
        'texto_libre',
        1,
        format('Para comenzar: ¿qué entiendes por "%s"? Explícalo con tus palabras, sin copiar una definición, y agrega un ejemplo relacionado con %s.', c.topic, lower(c.focus)),
        null::jsonb,
        format('Definición propia de %s con ejemplo contextual.', c.topic),
        format('Debe explicar con palabras propias qué significa %s, mencionar al menos una idea vinculada a %s y dar un ejemplo concreto. Valorar claridad, precisión y que no solo repita el título del tema.', c.topic, lower(c.focus))
      ),
      (
        2,
        'opcion_multiple',
        2,
        case c.course_code
          when 'mat' then format('En una práctica de %s aparece este foco: %s ¿Cuál acción muestra mejor comprensión matemática?', c.topic, lower(c.focus))
          when 'com' then format('Al trabajar %s, con foco en %s, ¿qué acción muestra mejor comprensión lectora o comunicativa?', c.topic, lower(c.focus))
          when 'cyt' then format('En una indagación de %s, relacionada con %s, ¿qué acción muestra pensamiento científico?', c.topic, lower(c.focus))
          when 'ccss' then format('Al estudiar %s, con atención a %s, ¿qué acción permite una explicación social o histórica seria?', c.topic, lower(c.focus))
          when 'dpcc' then format('Frente a una situación de %s, relacionada con %s, ¿qué acción muestra reflexión ciudadana responsable?', c.topic, lower(c.focus))
          else format('When studying %s, especially %s, which action shows real understanding?', c.topic, lower(c.focus))
        end,
        jsonb_build_array(
          case c.course_code
            when 'mat' then 'Identificar los datos, elegir una propiedad adecuada, resolver paso a paso y comprobar si el resultado tiene sentido.'
            when 'com' then 'Usar evidencias del texto o del propósito comunicativo para explicar la respuesta con claridad.'
            when 'cyt' then 'Relacionar observaciones, conceptos y evidencias antes de formular una conclusión.'
            when 'ccss' then 'Ubicar actores, tiempo, espacio y causas para explicar el proceso con evidencia.'
            when 'dpcc' then 'Reconocer a las personas involucradas, sus derechos y las consecuencias de cada decisión.'
            else 'Use the grammar or vocabulary in a meaningful sentence and check if the message is clear.'
          end,
          'Repetir el nombre del tema sin explicar su significado.',
          'Elegir una respuesta por intuición sin revisar datos ni evidencias.',
          'Memorizar una frase larga aunque no se relacione con la situación.'
        ),
        case c.course_code
          when 'mat' then 'Identificar los datos, elegir una propiedad adecuada, resolver paso a paso y comprobar si el resultado tiene sentido.'
          when 'com' then 'Usar evidencias del texto o del propósito comunicativo para explicar la respuesta con claridad.'
          when 'cyt' then 'Relacionar observaciones, conceptos y evidencias antes de formular una conclusión.'
          when 'ccss' then 'Ubicar actores, tiempo, espacio y causas para explicar el proceso con evidencia.'
          when 'dpcc' then 'Reconocer a las personas involucradas, sus derechos y las consecuencias de cada decisión.'
          else 'Use the grammar or vocabulary in a meaningful sentence and check if the message is clear.'
        end,
        format('Debe elegir la opción que conecta el tema %s con procedimientos, evidencias o criterios académicos vinculados a %s.', c.topic, lower(c.focus))
      ),
      (
        3,
        'texto_libre',
        3,
        case c.course_code
          when 'mat' then format('Caso aplicado: inventa o resuelve una situación breve donde se use %s. Incluye datos, procedimiento y una verificación del resultado.', lower(c.focus))
          when 'com' then format('Caso aplicado: escribe un ejemplo breve donde se use %s. Señala qué evidencia, intención o recurso comunicativo permite sostener tu respuesta.', lower(c.focus))
          when 'cyt' then format('Caso aplicado: plantea una observación o problema donde intervenga %s. Indica qué variable o evidencia mirarías y qué conclusión provisional obtendrías.', lower(c.focus))
          when 'ccss' then format('Caso aplicado: explica un hecho o situación del Perú donde aparezca %s. Menciona actores, lugar o época y una causa o consecuencia.', lower(c.focus))
          when 'dpcc' then format('Caso aplicado: describe una situación cotidiana relacionada con %s. Explica qué decisión sería responsable y por qué.', lower(c.focus))
          else format('Applied task: write a short example using %s. Include one sentence in English and explain what it means in Spanish.', lower(c.focus))
        end,
        null::jsonb,
        format('Aplicación correcta de %s en un caso breve.', c.topic),
        case c.course_code
          when 'mat' then format('Debe incluir una situación coherente con %s, datos suficientes, procedimiento ordenado y revisión del resultado.', lower(c.focus))
          when 'com' then format('Debe construir un ejemplo coherente con %s y justificarlo con evidencia textual, intención comunicativa o recurso lingüístico.', lower(c.focus))
          when 'cyt' then format('Debe relacionar %s con observaciones, variables o procesos, y distinguir dato de conclusión.', lower(c.focus))
          when 'ccss' then format('Debe ubicar %s en un contexto social, geográfico, económico o histórico, con causa/consecuencia sustentada.', lower(c.focus))
          when 'dpcc' then format('Debe analizar %s considerando derechos, emociones, consecuencias o convivencia democrática.', lower(c.focus))
          else format('Debe usar %s en un ejemplo comprensible en inglés y explicar su sentido sin traducir palabra por palabra.', lower(c.focus))
        end
      ),
      (
        4,
        'opcion_multiple',
        4,
        format('Para una respuesta avanzada sobre %s (%s), ¿qué criterio evita una explicación superficial?', c.topic, lower(c.focus)),
        jsonb_build_array(
          'Comparar casos, justificar con evidencia y cerrar con una conclusión verificable.',
          'Escribir muchas líneas aunque no respondan la pregunta central.',
          'Usar palabras difíciles sin definirlas ni aplicarlas.',
          'Responder solo con una opinión personal sin datos, ejemplos ni razones.'
        ),
        'Comparar casos, justificar con evidencia y cerrar con una conclusión verificable.',
        format('Debe reconocer que una respuesta avanzada sobre %s compara, justifica y concluye con evidencia; no se queda en definición memorizada.', c.topic)
      ),
      (
        5,
        'texto_libre',
        5,
        case c.course_code
          when 'mat' then format('Síntesis: conecta %s con otro tema de Matemática o con una situación real. ¿Qué relación encuentras y qué error común habría que evitar?', c.topic)
          when 'com' then format('Síntesis: conecta %s con lectura, escritura u oralidad. ¿Cómo mejora la comunicación y qué error de interpretación habría que evitar?', c.topic)
          when 'cyt' then format('Síntesis: conecta %s con un problema ambiental, tecnológico o de salud. ¿Qué explicación científica usarías y qué límite tendría tu conclusión?', c.topic)
          when 'ccss' then format('Síntesis: conecta %s con una situación actual del Perú o del mundo. ¿Qué continuidad, cambio o tensión observas?', c.topic)
          when 'dpcc' then format('Síntesis: conecta %s con convivencia democrática o proyecto personal. ¿Qué principio aplicarías y qué consecuencia tendría?', c.topic)
          else format('Synthesis: connect %s with a real communicative situation. Write one useful English example and explain when you would use it.', c.topic)
        end,
        null::jsonb,
        format('Síntesis argumentada de %s.', c.topic),
        format('Debe relacionar %s con otro contenido o contexto, explicar la relación con razones y mencionar una limitación, cuidado o error frecuente.', c.topic)
      )
  ) as q(q_order, question_type, difficulty_level, prompt, options, correct_answer, expected_answer_or_rubric)
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
  active
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

-- When a student chooses a topic for the first time, the definition/opening
-- question should appear first even if the UI preference is multiple-choice.
do $$
declare
  v_definition text;
  v_next_definition text;
begin
  select pg_get_functiondef('public.get_student_dashboard(text,text)'::regprocedure)
    into v_definition;

  if position('Academic definition priority' in v_definition) > 0 then
    return;
  end if;

  v_next_definition := replace(
    v_definition,
    '  with eligible as (
    select q.*',
    '  -- Academic definition priority: every chosen topic starts with its open definition question.
  if v_topic is not null then
    select q.* into v_question
    from public.questions q
    join public.student_section ss on ss.section_id = q.section_id and ss.student_id = v_profile.student_id
    where q.active
      and lower(q.topic) = lower(v_topic)
      and q.question_type = ''texto_libre''
      and q.sequence = (
        select min(q2.sequence)
        from public.questions q2
        where q2.active
          and q2.section_id = q.section_id
          and lower(q2.topic) = lower(v_topic)
      )
      and not exists (
        select 1
        from public.student_responses sr
        where sr.question_id = q.id and sr.student_id = v_profile.student_id
      )
    order by q.sequence
    limit 1;
  end if;

  if v_question.id is null then
  with eligible as (
    select q.*'
  );

  v_next_definition := replace(
    v_next_definition,
    '  select * into v_question
  from unanswered
  order by sequence
  limit 1;

  if v_question.id is null then',
    '  select * into v_question
  from unanswered
  order by sequence
  limit 1;
  end if;

  if v_question.id is null then'
  );

  if v_next_definition = v_definition then
    raise exception 'GET_STUDENT_DASHBOARD_PRIORITY_PATCH_NOT_APPLIED';
  end if;

  execute v_next_definition;
end;
$$;
