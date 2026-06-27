-- ============================================================================
-- "Fortalezas y caminos" — vista del padre que conecta temas donde el
-- alumno destaca con carreras universitarias afines.
--
-- Idea clave (mensaje del producto): un alumno con bajo dominio en un tema
-- (p. ej. matemática) no está "cerrado" a ninguna carrera. Si tiene al menos
-- una fortaleza clara, las puertas se abren. La capa de SQL sólo devuelve
-- agregados: nada de rúbricas, respuestas libres ni datos personales.
-- ============================================================================

create table public.careers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cluster text not null check (
    cluster in (
      'ingenieria',
      'tecnologia',
      'arquitectura',
      'salud',
      'economia',
      'ciencias',
      'arte-diseno',
      'educacion'
    )
  ),
  description text not null check (char_length(description) between 10 and 280),
  created_at timestamptz not null default now()
);

create unique index careers_name_lower_uidx on public.careers (lower(name));

create table public.topic_career_affinity (
  topic text not null,
  career_id uuid not null references public.careers (id) on delete cascade,
  affinity numeric(4, 3) not null check (affinity between 0 and 1),
  primary key (topic, career_id)
);

create index topic_career_affinity_career_idx
  on public.topic_career_affinity (career_id);

-- ----------------------------------------------------------------------------
-- Catálogo de carreras de demostración.
-- ----------------------------------------------------------------------------
insert into public.careers (id, name, cluster, description) values
  ('30000000-0000-4000-8000-000000000001', 'Ingeniería Civil', 'ingenieria',
   'Diseña y supervisa la construcción de infraestructura como puentes, edificios y caminos.'),
  ('30000000-0000-4000-8000-000000000002', 'Ingeniería de Software', 'tecnologia',
   'Crea programas, aplicaciones y sistemas que usan las personas cada día.'),
  ('30000000-0000-4000-8000-000000000003', 'Arquitectura', 'arquitectura',
   'Diseña espacios y edificios funcionales, seguros y bellos.'),
  ('30000000-0000-4000-8000-000000000004', 'Medicina', 'salud',
   'Diagnostica, trata y acompaña la salud de las personas a lo largo de su vida.'),
  ('30000000-0000-4000-8000-000000000005', 'Enfermería', 'salud',
   'Cuida y acompaña a pacientes en su recuperación dentro de equipos de salud.'),
  ('30000000-0000-4000-8000-000000000006', 'Economía', 'economia',
   'Analiza cómo las personas, empresas y países usan sus recursos para tomar decisiones.'),
  ('30000000-0000-4000-8000-000000000007', 'Administración de Empresas', 'economia',
   'Dirige organizaciones, lidera equipos y conecta las metas con las personas.'),
  ('30000000-0000-4000-8000-000000000008', 'Contabilidad', 'economia',
   'Registra y analiza la información financiera de personas, empresas y gobiernos.'),
  ('30000000-0000-4000-8000-000000000009', 'Ciencia de Datos y Estadística', 'tecnologia',
   'Encuentra patrones en los datos para tomar mejores decisiones en cualquier campo.'),
  ('30000000-0000-4000-8000-000000000010', 'Física y Ciencias Naturales', 'ciencias',
   'Estudia las leyes del universo y la naturaleza para entender cómo funciona el mundo.'),
  ('30000000-0000-4000-8000-000000000011', 'Diseño Gráfico y UX', 'arte-diseno',
   'Crea imágenes, interfaces y experiencias visuales que comunican y resuelven problemas.'),
  ('30000000-0000-4000-8000-000000000012', 'Docencia en Matemática', 'educacion',
   'Enseña y motiva a nuevas generaciones a descubrir los números y el razonamiento lógico.')
on conflict (id) do update set
  name = excluded.name,
  cluster = excluded.cluster,
  description = excluded.description;

-- ----------------------------------------------------------------------------
-- Afinidades tema × carrera (0 = nada afin, 1 = afin muy alta).
-- Calibradas a los 5 temas del seed demo: Fracciones, Números enteros,
-- Geometría, Decimales, Porcentajes. Cuando se agreguen más temas,
-- basta con añadir filas a esta tabla; no se requiere migración de esquema.
-- ----------------------------------------------------------------------------
insert into public.topic_career_affinity (topic, career_id, affinity) values
  -- Ingeniería Civil: alto en geometría + moderado en el resto cuantitativo.
  ('Geometría',         '30000000-0000-4000-8000-000000000001', 0.900),
  ('Fracciones',        '30000000-0000-4000-8000-000000000001', 0.700),
  ('Números enteros',   '30000000-0000-4000-8000-000000000001', 0.600),
  ('Decimales',         '30000000-0000-4000-8000-000000000001', 0.600),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000001', 0.600),

  -- Ingeniería de Software: lógica + enteros + fracciones dominan.
  ('Números enteros',   '30000000-0000-4000-8000-000000000002', 0.900),
  ('Fracciones',        '30000000-0000-4000-8000-000000000002', 0.800),
  ('Decimales',         '30000000-0000-4000-8000-000000000002', 0.600),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000002', 0.500),
  ('Geometría',         '30000000-0000-4000-8000-000000000002', 0.400),

  -- Arquitectura: geometría manda, porcentajes/decimales como complemento.
  ('Geometría',         '30000000-0000-4000-8000-000000000003', 0.950),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000003', 0.700),
  ('Fracciones',        '30000000-0000-4000-8000-000000000003', 0.600),
  ('Decimales',         '30000000-0000-4000-8000-000000000003', 0.500),
  ('Números enteros',   '30000000-0000-4000-8000-000000000003', 0.500),

  -- Medicina: requiere cálculo básico para dosificación, no matemática dura.
  ('Números enteros',   '30000000-0000-4000-8000-000000000004', 0.500),
  ('Decimales',         '30000000-0000-4000-8000-000000000004', 0.500),
  ('Fracciones',        '30000000-0000-4000-8000-000000000004', 0.400),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000004', 0.400),
  ('Geometría',         '30000000-0000-4000-8000-000000000004', 0.300),

  -- Enfermería: similar a medicina, foco en cálculo de dosis.
  ('Decimales',         '30000000-0000-4000-8000-000000000005', 0.500),
  ('Números enteros',   '30000000-0000-4000-8000-000000000005', 0.400),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000005', 0.400),
  ('Fracciones',        '30000000-0000-4000-8000-000000000005', 0.300),
  ('Geometría',         '30000000-0000-4000-8000-000000000005', 0.200),

  -- Economía:百分比 manda, decimales muy cerca.
  ('Porcentajes',       '30000000-0000-4000-8000-000000000006', 0.850),
  ('Decimales',         '30000000-0000-4000-8000-000000000006', 0.700),
  ('Números enteros',   '30000000-0000-4000-8000-000000000006', 0.600),
  ('Fracciones',        '30000000-0000-4000-8000-000000000006', 0.500),
  ('Geometría',         '30000000-0000-4000-8000-000000000006', 0.300),

  -- Administración: un poco más blanda que economía.
  ('Porcentajes',       '30000000-0000-4000-8000-000000000007', 0.700),
  ('Decimales',         '30000000-0000-4000-8000-000000000007', 0.600),
  ('Números enteros',   '30000000-0000-4000-8000-000000000007', 0.500),
  ('Fracciones',        '30000000-0000-4000-8000-000000000007', 0.400),
  ('Geometría',         '30000000-0000-4000-8000-000000000007', 0.300),

  -- Contabilidad: decimales y porcentajes al frente.
  ('Decimales',         '30000000-0000-4000-8000-000000000008', 0.850),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000008', 0.800),
  ('Números enteros',   '30000000-0000-4000-8000-000000000008', 0.700),
  ('Fracciones',        '30000000-0000-4000-8000-000000000008', 0.600),
  ('Geometría',         '30000000-0000-4000-8000-000000000008', 0.200),

  -- Ciencia de Datos: requiere todo el espectro cuantitativo, fuerte en % y decimales.
  ('Porcentajes',       '30000000-0000-4000-8000-000000000009', 0.900),
  ('Decimales',         '30000000-0000-4000-8000-000000000009', 0.900),
  ('Fracciones',        '30000000-0000-4000-8000-000000000009', 0.850),
  ('Números enteros',   '30000000-0000-4000-8000-000000000009', 0.700),
  ('Geometría',         '30000000-0000-4000-8000-000000000009', 0.500),

  -- Física: fuerte en enteros, fracciones y geometría.
  ('Números enteros',   '30000000-0000-4000-8000-000000000010', 0.800),
  ('Geometría',         '30000000-0000-4000-8000-000000000010', 0.800),
  ('Fracciones',        '30000000-0000-4000-8000-000000000010', 0.700),
  ('Decimales',         '30000000-0000-4000-8000-000000000010', 0.700),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000010', 0.600),

  -- Diseño Gráfico / UX: la geometría es el ancla matemática.
  ('Geometría',         '30000000-0000-4000-8000-000000000011', 0.850),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000011', 0.500),
  ('Decimales',         '30000000-0000-4000-8000-000000000011', 0.400),
  ('Fracciones',        '30000000-0000-4000-8000-000000000011', 0.300),
  ('Números enteros',   '30000000-0000-4000-8000-000000000011', 0.300),

  -- Docencia en Matemática: afin alta en todos los temas.
  ('Fracciones',        '30000000-0000-4000-8000-000000000012', 0.900),
  ('Números enteros',   '30000000-0000-4000-8000-000000000012', 0.900),
  ('Porcentajes',       '30000000-0000-4000-8000-000000000012', 0.850),
  ('Geometría',         '30000000-0000-4000-8000-000000000012', 0.800),
  ('Decimales',         '30000000-0000-4000-8000-000000000012', 0.800)
on conflict (topic, career_id) do update set affinity = excluded.affinity;

-- ============================================================================
-- get_parent_dashboard(): añade "strengths" y "suggestedCareers" por hijo.
-- Es aditivo: los campos previos (mastery, history, activity) no cambian.
-- ============================================================================
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
          where student_id = child.student_id and created_at >= current_date - 29 group by 1) a using(activity_date)), '[]'::jsonb),
      -- Top 3 temas por dominio (siempre, aunque todos estén bajos).
      -- El frontend decide el tono del mensaje según el nivel.
      'strengths', coalesce((select jsonb_agg(jsonb_build_object(
        'topic', s.topic, 'mastery', round((s.mastery * 100)::numeric, 0)
      ) order by s.mastery desc, s.topic)
        from (select sm.topic, sm.mastery
          from public.student_mastery_matrix sm
          where sm.student_id = child.student_id
          order by sm.mastery desc, sm.topic
          limit 3) s), '[]'::jsonb),
      -- Carreras afines: agregamos afinidad × dominio por carrera. Filtramos
      -- carreras cuyo "peak" (mejor tema afin al alumno) esté por debajo de
      -- 0.3 — eso descarta carreras donde el alumno no tiene todavía una
      -- fortaleza clara. Si ningún tema del alumno cruza el umbral, la lista
      -- queda vacía y la UI muestra un estado vacío motivador.
      'suggestedCareers', coalesce((select jsonb_agg(jsonb_build_object(
        'id', w.career_id,
        'name', w.name,
        'cluster', w.cluster,
        'description', w.description,
        'score', round(w.score::numeric, 3)
      ) order by w.score desc, w.name)
        from (select
            c.id as career_id,
            c.name,
            c.cluster,
            c.description,
            sum(tca.affinity * st.mastery) as score
          from public.careers c
          join public.topic_career_affinity tca on tca.career_id = c.id
          join public.student_mastery_matrix st
            on st.student_id = child.student_id and st.topic = tca.topic
          group by c.id, c.name, c.cluster, c.description
          having max(tca.affinity * st.mastery) >= 0.3
          order by sum(tca.affinity * st.mastery) desc, c.name
          limit 5) w), '[]'::jsonb)
    ) order by child.full_name), '[]'::jsonb)
  ) into v_result
  from public.tutor_student ts
  join public.profiles child on child.student_id = ts.student_id and child.role = 'alumno'
  where ts.tutor_id = auth.uid();
  return coalesce(v_result, jsonb_build_object('children', '[]'::jsonb));
end;
$$;

grant execute on function public.get_parent_dashboard() to authenticated;
revoke execute on function public.get_parent_dashboard() from public, anon;