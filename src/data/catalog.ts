// Catálogo basado en el Currículo Nacional de Educación Básica (CNEB) del Perú,
// aprobado por RM N.° 281-2016-MINEDU y modificatorias. Cubre las áreas
// académicas de la Educación Secundaria (1.° a 5.°).
//
// Estructura:
//   Curso  ↔ Área curricular
//   Unidad ↔ Competencia del área
//   Tema   ↔ Capacidades / contenidos representativos de los desempeños
//
// Los `minutes` son estimaciones de sesión adaptativa Loop, no normados.

export interface CatalogTopic {
  id: string;
  label: string;
  hint: string;
  minutes: number;
  /** Grados donde el tema aparece con mayor peso (orientativo, 1–5). */
  grades?: number[];
}

export interface CatalogUnit {
  id: string;
  label: string;
  /** Competencia o aprendizaje esperado. */
  blurb: string;
  topics: CatalogTopic[];
}

export interface CatalogCourse {
  id: string;
  label: string;
  /** Sigla MINEDU (CM, CYT, DPCC, etc.). */
  code: string;
  accent: string;
  glyph: string;
  blurb: string;
  units: CatalogUnit[];
}

export const COURSE_CATALOG: CatalogCourse[] = [
  // ── 1. MATEMÁTICA ─────────────────────────────────────────────
  {
    id: 'mat',
    label: 'Matemática',
    code: 'MAT',
    accent: '#9CFF0F',
    glyph: 'Σ',
    blurb: 'Cuatro competencias del CNEB para resolver problemas con sentido.',
    units: [
      {
        id: 'mat-cant',
        label: 'Problemas de cantidad',
        blurb: 'Cantidades, equivalencias y operaciones con números reales.',
        topics: [
          { id: 'mat-cant-1', label: 'Números enteros y operaciones', hint: 'Signos, jerarquía, valor absoluto.', minutes: 12, grades: [1] },
          { id: 'mat-cant-2', label: 'Fracciones y decimales', hint: 'Equivalencias, operaciones, conversiones.', minutes: 12, grades: [1, 2] },
          { id: 'mat-cant-3', label: 'Razones y proporciones', hint: 'Regla de tres simple y compuesta.', minutes: 14, grades: [2] },
          { id: 'mat-cant-4', label: 'Porcentajes y aumentos sucesivos', hint: 'Descuentos, IGV, intereses.', minutes: 12, grades: [2, 3] },
          { id: 'mat-cant-5', label: 'Potencias y radicales', hint: 'Propiedades, racionalización.', minutes: 14, grades: [3, 4] },
          { id: 'mat-cant-6', label: 'Notación científica', hint: 'Magnitudes muy grandes y muy pequeñas.', minutes: 10, grades: [3, 4] },
          { id: 'mat-cant-7', label: 'Lógica proposicional', hint: 'Conectores, tablas de verdad.', minutes: 14, grades: [5] },
        ],
      },
      {
        id: 'mat-algeb',
        label: 'Regularidad, equivalencia y cambio',
        blurb: 'Álgebra y funciones para modelar relaciones.',
        topics: [
          { id: 'mat-alg-1', label: 'Expresiones algebraicas', hint: 'Reducción, valor numérico.', minutes: 12, grades: [1, 2] },
          { id: 'mat-alg-2', label: 'Ecuaciones lineales', hint: 'Una y dos variables.', minutes: 12, grades: [1, 2] },
          { id: 'mat-alg-3', label: 'Sistemas de ecuaciones 2×2', hint: 'Reducción, sustitución, gráfico.', minutes: 14, grades: [2, 3] },
          { id: 'mat-alg-4', label: 'Inecuaciones lineales', hint: 'Intervalos, recta numérica.', minutes: 12, grades: [3] },
          { id: 'mat-alg-5', label: 'Factorización', hint: 'Aspa simple, diferencia de cuadrados.', minutes: 14, grades: [3, 4] },
          { id: 'mat-alg-6', label: 'Ecuaciones cuadráticas', hint: 'Fórmula general, discriminante.', minutes: 14, grades: [4] },
          { id: 'mat-alg-7', label: 'Funciones lineal y cuadrática', hint: 'Gráfica, dominio y rango.', minutes: 16, grades: [4, 5] },
          { id: 'mat-alg-8', label: 'Progresiones aritmética y geométrica', hint: 'Término general, suma de n términos.', minutes: 14, grades: [5] },
        ],
      },
      {
        id: 'mat-forma',
        label: 'Forma, movimiento y localización',
        blurb: 'Geometría plana, del espacio y trigonometría.',
        topics: [
          { id: 'mat-geo-1', label: 'Ángulos y rectas', hint: 'Pares de ángulos, paralelas.', minutes: 10, grades: [1] },
          { id: 'mat-geo-2', label: 'Triángulos y congruencia', hint: 'Criterios LAL, ALA, LLL.', minutes: 12, grades: [1, 2] },
          { id: 'mat-geo-3', label: 'Polígonos y cuadriláteros', hint: 'Ángulos internos, áreas.', minutes: 12, grades: [2] },
          { id: 'mat-geo-4', label: 'Circunferencia y círculo', hint: 'Arcos, sectores, π.', minutes: 12, grades: [3] },
          { id: 'mat-geo-5', label: 'Áreas y perímetros', hint: 'Figuras compuestas.', minutes: 12, grades: [2, 3] },
          { id: 'mat-geo-6', label: 'Sólidos: prismas y pirámides', hint: 'Volumen y superficie.', minutes: 14, grades: [3, 4] },
          { id: 'mat-geo-7', label: 'Razones trigonométricas', hint: 'Sen, cos, tan en triángulo rectángulo.', minutes: 14, grades: [4, 5] },
          { id: 'mat-geo-8', label: 'Geometría analítica', hint: 'Punto, recta, distancia.', minutes: 14, grades: [5] },
        ],
      },
      {
        id: 'mat-datos',
        label: 'Gestión de datos e incertidumbre',
        blurb: 'Estadística descriptiva y probabilidad.',
        topics: [
          { id: 'mat-est-1', label: 'Tablas y gráficos estadísticos', hint: 'Barras, circulares, histograma.', minutes: 10, grades: [1, 2] },
          { id: 'mat-est-2', label: 'Medidas de tendencia central', hint: 'Media, mediana, moda.', minutes: 12, grades: [2, 3] },
          { id: 'mat-est-3', label: 'Medidas de dispersión', hint: 'Rango, varianza, desviación.', minutes: 12, grades: [4] },
          { id: 'mat-est-4', label: 'Probabilidad clásica', hint: 'Espacios muestrales y eventos.', minutes: 12, grades: [3, 4] },
          { id: 'mat-est-5', label: 'Probabilidad condicional', hint: 'Eventos dependientes e independientes.', minutes: 14, grades: [5] },
          { id: 'mat-est-6', label: 'Combinatoria', hint: 'Permutaciones y combinaciones.', minutes: 14, grades: [5] },
        ],
      },
    ],
  },

  // ── 2. COMUNICACIÓN ───────────────────────────────────────────
  {
    id: 'com',
    label: 'Comunicación',
    code: 'COM',
    accent: '#ff8a4d',
    glyph: '¶',
    blurb: 'Leer, escribir y hablar con propósito en lengua materna.',
    units: [
      {
        id: 'com-lee',
        label: 'Lee diversos tipos de textos escritos',
        blurb: 'Comprensión literal, inferencial y crítica.',
        topics: [
          { id: 'com-lee-1', label: 'Idea principal y secundarias', hint: 'Identificar el tema y el centro del párrafo.', minutes: 10, grades: [1, 2] },
          { id: 'com-lee-2', label: 'Inferencias y predicciones', hint: 'Leer entre líneas con evidencia.', minutes: 12, grades: [2, 3] },
          { id: 'com-lee-3', label: 'Tipos de texto y propósito', hint: 'Narrativo, expositivo, argumentativo.', minutes: 12, grades: [3] },
          { id: 'com-lee-4', label: 'Vocabulario por contexto', hint: 'Sinónimos, antónimos, polisemia.', minutes: 10, grades: [1, 2, 3] },
          { id: 'com-lee-5', label: 'Conectores lógicos', hint: 'Causa, contraste, secuencia.', minutes: 10, grades: [2, 3] },
          { id: 'com-lee-6', label: 'Análisis crítico de fuentes', hint: 'Sesgo, intención y verosimilitud.', minutes: 14, grades: [4, 5] },
        ],
      },
      {
        id: 'com-escribe',
        label: 'Escribe diversos tipos de textos',
        blurb: 'Planificación, textualización y revisión.',
        topics: [
          { id: 'com-esc-1', label: 'Coherencia y cohesión', hint: 'Que el texto fluya sin saltos.', minutes: 12, grades: [1, 2, 3] },
          { id: 'com-esc-2', label: 'Ortografía y tildación', hint: 'Reglas y tildes diacríticas.', minutes: 10, grades: [1, 2, 3, 4, 5] },
          { id: 'com-esc-3', label: 'Signos de puntuación', hint: 'Coma, punto y coma, dos puntos.', minutes: 10, grades: [1, 2, 3] },
          { id: 'com-esc-4', label: 'Estructura argumentativa', hint: 'Tesis, argumentos, contraargumentos.', minutes: 14, grades: [4, 5] },
          { id: 'com-esc-5', label: 'Ensayo y artículo de opinión', hint: 'Voz autoral y registro formal.', minutes: 16, grades: [5] },
          { id: 'com-esc-6', label: 'Citas y referencias', hint: 'APA básico, evitar plagio.', minutes: 12, grades: [4, 5] },
        ],
      },
      {
        id: 'com-literatura',
        label: 'Literatura y oralidad',
        blurb: 'Tradición literaria y comunicación oral efectiva.',
        topics: [
          { id: 'com-lit-1', label: 'Géneros literarios', hint: 'Narrativo, lírico, dramático.', minutes: 12, grades: [1, 2] },
          { id: 'com-lit-2', label: 'Literatura peruana e hispanoamericana', hint: 'Vallejo, García Márquez, Vargas Llosa.', minutes: 14, grades: [3, 4, 5] },
          { id: 'com-lit-3', label: 'Figuras literarias', hint: 'Metáfora, hipérbole, sinécdoque.', minutes: 12, grades: [2, 3] },
          { id: 'com-lit-4', label: 'Exposición oral', hint: 'Estructura y manejo del tiempo.', minutes: 14, grades: [3, 4] },
          { id: 'com-lit-5', label: 'Debate y argumentación oral', hint: 'Tomar postura y rebatir.', minutes: 14, grades: [4, 5] },
        ],
      },
    ],
  },

  // ── 3. CIENCIA Y TECNOLOGÍA ───────────────────────────────────
  {
    id: 'cyt',
    label: 'Ciencia y Tecnología',
    code: 'CYT',
    accent: '#4D34B6',
    glyph: 'ƒ',
    blurb: 'Indaga, explica el mundo físico y diseña soluciones.',
    units: [
      {
        id: 'cyt-fisica',
        label: 'Física',
        blurb: 'Materia, energía y movimiento.',
        topics: [
          { id: 'cyt-fis-1', label: 'Magnitudes y unidades', hint: 'SI, conversiones, vectores.', minutes: 12, grades: [1, 2] },
          { id: 'cyt-fis-2', label: 'Cinemática: MRU y MRUV', hint: 'Posición, velocidad, aceleración.', minutes: 14, grades: [3, 4] },
          { id: 'cyt-fis-3', label: 'Dinámica y leyes de Newton', hint: 'Fuerza, masa, aceleración.', minutes: 14, grades: [4] },
          { id: 'cyt-fis-4', label: 'Trabajo y energía', hint: 'Conservación de la energía mecánica.', minutes: 14, grades: [4, 5] },
          { id: 'cyt-fis-5', label: 'Electricidad y circuitos', hint: 'Voltaje, corriente, Ley de Ohm.', minutes: 14, grades: [5] },
          { id: 'cyt-fis-6', label: 'Ondas y sonido', hint: 'Frecuencia, longitud de onda, eco.', minutes: 12, grades: [4, 5] },
        ],
      },
      {
        id: 'cyt-quimica',
        label: 'Química',
        blurb: 'Estructura, propiedades y transformaciones de la materia.',
        topics: [
          { id: 'cyt-qui-1', label: 'Estados de la materia', hint: 'Cambios físicos y químicos.', minutes: 10, grades: [1] },
          { id: 'cyt-qui-2', label: 'Tabla periódica', hint: 'Grupos, periodos, propiedades.', minutes: 12, grades: [2, 3] },
          { id: 'cyt-qui-3', label: 'Enlace químico', hint: 'Iónico, covalente, metálico.', minutes: 12, grades: [3, 4] },
          { id: 'cyt-qui-4', label: 'Reacciones y estequiometría', hint: 'Balanceo y mol.', minutes: 14, grades: [4, 5] },
          { id: 'cyt-qui-5', label: 'Disoluciones y pH', hint: 'Ácidos, bases, neutralización.', minutes: 12, grades: [5] },
        ],
      },
      {
        id: 'cyt-biologia',
        label: 'Biología',
        blurb: 'Seres vivos, ecosistemas y salud.',
        topics: [
          { id: 'cyt-bio-1', label: 'Célula y biomoléculas', hint: 'Procariota, eucariota, ADN.', minutes: 12, grades: [1, 2] },
          { id: 'cyt-bio-2', label: 'Sistemas del cuerpo humano', hint: 'Digestivo, circulatorio, nervioso.', minutes: 14, grades: [2, 3] },
          { id: 'cyt-bio-3', label: 'Genética y herencia', hint: 'Mendel, ADN y mutaciones.', minutes: 14, grades: [4, 5] },
          { id: 'cyt-bio-4', label: 'Ecosistemas y biodiversidad', hint: 'Cadenas tróficas, biomas del Perú.', minutes: 12, grades: [3, 4] },
          { id: 'cyt-bio-5', label: 'Salud y educación sexual integral', hint: 'Prevención, ITS, anatomía reproductiva.', minutes: 14, grades: [3, 4, 5] },
        ],
      },
      {
        id: 'cyt-tierra',
        label: 'Tierra y universo',
        blurb: 'Procesos geológicos, climáticos y astronómicos.',
        topics: [
          { id: 'cyt-tie-1', label: 'Capas de la Tierra y placas tectónicas', hint: 'Sismos en Perú y vulcanismo.', minutes: 12, grades: [1, 2] },
          { id: 'cyt-tie-2', label: 'Clima y cambio climático', hint: 'Calentamiento global y mitigación.', minutes: 12, grades: [3, 4] },
          { id: 'cyt-tie-3', label: 'Sistema solar y universo', hint: 'Cuerpos celestes, leyes de Kepler.', minutes: 12, grades: [4, 5] },
        ],
      },
    ],
  },

  // ── 4. CIENCIAS SOCIALES ──────────────────────────────────────
  {
    id: 'ccss',
    label: 'Ciencias Sociales',
    code: 'CCSS',
    accent: '#ffd166',
    glyph: '◯',
    blurb: 'Historia, geografía y economía del Perú y el mundo.',
    units: [
      {
        id: 'ccss-hist',
        label: 'Construye interpretaciones históricas',
        blurb: 'Procesos del Perú y la humanidad.',
        topics: [
          { id: 'ccss-his-1', label: 'Culturas preincas', hint: 'Caral, Chavín, Mochica, Wari.', minutes: 12, grades: [1] },
          { id: 'ccss-his-2', label: 'Imperio incaico', hint: 'Organización, expansión, caída.', minutes: 14, grades: [1, 2] },
          { id: 'ccss-his-3', label: 'Conquista y virreinato', hint: 'Conquista, mita, encomienda.', minutes: 14, grades: [2] },
          { id: 'ccss-his-4', label: 'Independencia del Perú', hint: 'San Martín, Bolívar, Ayacucho.', minutes: 14, grades: [3] },
          { id: 'ccss-his-5', label: 'República y siglo XIX', hint: 'Caudillismo, guerra del Pacífico.', minutes: 14, grades: [3, 4] },
          { id: 'ccss-his-6', label: 'Perú siglo XX', hint: 'Oncenio, reformas, CVR.', minutes: 14, grades: [4, 5] },
          { id: 'ccss-his-7', label: 'Historia universal contemporánea', hint: 'Guerras mundiales, Guerra Fría, globalización.', minutes: 14, grades: [4, 5] },
        ],
      },
      {
        id: 'ccss-geo',
        label: 'Gestiona el espacio y el ambiente',
        blurb: 'Geografía física y humana, problemas ambientales.',
        topics: [
          { id: 'ccss-geo-1', label: 'Ocho regiones del Perú', hint: 'Pulgar Vidal: Costa, Sierra, Selva y subregiones.', minutes: 12, grades: [1, 2] },
          { id: 'ccss-geo-2', label: 'Departamentos y regiones', hint: '24 departamentos, capitales.', minutes: 10, grades: [1] },
          { id: 'ccss-geo-3', label: 'Recursos naturales del Perú', hint: 'Pesca, minería, biodiversidad.', minutes: 12, grades: [2, 3] },
          { id: 'ccss-geo-4', label: 'Riesgos y gestión de desastres', hint: 'Sismos, friajes, El Niño.', minutes: 12, grades: [3, 4] },
          { id: 'ccss-geo-5', label: 'Cambio climático y sostenibilidad', hint: 'Huella de carbono y ODS.', minutes: 14, grades: [4, 5] },
        ],
      },
      {
        id: 'ccss-eco',
        label: 'Gestiona los recursos económicos',
        blurb: 'Economía personal, familiar y nacional.',
        topics: [
          { id: 'ccss-eco-1', label: 'Necesidades y bienes', hint: 'Escasez y elección.', minutes: 10, grades: [1, 2] },
          { id: 'ccss-eco-2', label: 'Oferta, demanda y precios', hint: 'Funcionamiento del mercado.', minutes: 12, grades: [3] },
          { id: 'ccss-eco-3', label: 'Sistema financiero y ahorro', hint: 'Bancos, tasas, presupuesto personal.', minutes: 12, grades: [3, 4] },
          { id: 'ccss-eco-4', label: 'Economía del Perú', hint: 'PBI, sectores productivos, exportación.', minutes: 14, grades: [4, 5] },
        ],
      },
    ],
  },

  // ── 5. DESARROLLO PERSONAL, CIUDADANÍA Y CÍVICA ──────────────
  {
    id: 'dpcc',
    label: 'Desarrollo Personal y Ciudadanía',
    code: 'DPCC',
    accent: '#56358C',
    glyph: '◈',
    blurb: 'Identidad, convivencia y participación democrática.',
    units: [
      {
        id: 'dpcc-ident',
        label: 'Construye su identidad',
        blurb: 'Autoconocimiento, emociones y proyecto de vida.',
        topics: [
          { id: 'dpcc-id-1', label: 'Autoestima y autoconcepto', hint: 'Reconocer fortalezas y límites.', minutes: 10, grades: [1, 2] },
          { id: 'dpcc-id-2', label: 'Regulación emocional', hint: 'Identificar y gestionar emociones.', minutes: 12, grades: [1, 2, 3] },
          { id: 'dpcc-id-3', label: 'Sexualidad integral', hint: 'Identidad, género y respeto.', minutes: 12, grades: [3, 4] },
          { id: 'dpcc-id-4', label: 'Proyecto de vida', hint: 'Metas a corto y largo plazo.', minutes: 14, grades: [4, 5] },
          { id: 'dpcc-id-5', label: 'Toma de decisiones', hint: 'Criterios y consecuencias.', minutes: 12, grades: [3, 4] },
        ],
      },
      {
        id: 'dpcc-conv',
        label: 'Convive y participa democráticamente',
        blurb: 'Derechos, deberes y vida en sociedad.',
        topics: [
          { id: 'dpcc-cv-1', label: 'Derechos humanos', hint: 'Declaración universal y casos.', minutes: 12, grades: [2, 3] },
          { id: 'dpcc-cv-2', label: 'Estado peruano y poderes', hint: 'Ejecutivo, legislativo, judicial.', minutes: 12, grades: [3, 4] },
          { id: 'dpcc-cv-3', label: 'Constitución del Perú', hint: 'Derechos fundamentales.', minutes: 14, grades: [4, 5] },
          { id: 'dpcc-cv-4', label: 'Participación ciudadana', hint: 'Voto, organización, vigilancia.', minutes: 12, grades: [4, 5] },
          { id: 'dpcc-cv-5', label: 'Diversidad cultural', hint: 'Interculturalidad y pueblos originarios.', minutes: 12, grades: [2, 3, 4] },
          { id: 'dpcc-cv-6', label: 'Ética y resolución de conflictos', hint: 'Diálogo y mediación.', minutes: 12, grades: [3, 4] },
        ],
      },
    ],
  },

  // ── 6. INGLÉS COMO LENGUA EXTRANJERA ─────────────────────────
  {
    id: 'ing',
    label: 'Inglés',
    code: 'ING',
    accent: '#3aa1ff',
    glyph: 'EN',
    blurb: 'Lectura, escritura y oralidad en inglés según el MCER.',
    units: [
      {
        id: 'ing-lee',
        label: 'Lee diversos tipos de textos en inglés',
        blurb: 'Comprensión escrita y vocabulario activo.',
        topics: [
          { id: 'ing-lee-1', label: 'Present simple y vocabulario básico', hint: 'Routines, jobs, family.', minutes: 10, grades: [1] },
          { id: 'ing-lee-2', label: 'Past simple y narrativa breve', hint: 'Last weekend, last summer.', minutes: 12, grades: [2] },
          { id: 'ing-lee-3', label: 'Future tenses', hint: 'Will, going to, present continuous.', minutes: 12, grades: [3] },
          { id: 'ing-lee-4', label: 'Reading short articles', hint: 'Skimming, scanning y main idea.', minutes: 12, grades: [3, 4] },
          { id: 'ing-lee-5', label: 'Modal verbs', hint: 'Can, should, must, have to.', minutes: 12, grades: [4] },
          { id: 'ing-lee-6', label: 'Conditional sentences', hint: 'Zero, first, second conditional.', minutes: 14, grades: [4, 5] },
          { id: 'ing-lee-7', label: 'Passive voice', hint: 'Tenses passive forms.', minutes: 14, grades: [5] },
        ],
      },
      {
        id: 'ing-escribe',
        label: 'Escribe y se comunica oralmente',
        blurb: 'Producción de textos y oralidad guiada.',
        topics: [
          { id: 'ing-esc-1', label: 'Personal description', hint: 'Adjectives, family, hobbies.', minutes: 10, grades: [1] },
          { id: 'ing-esc-2', label: 'Daily routines', hint: 'Frequency adverbs y horarios.', minutes: 10, grades: [1, 2] },
          { id: 'ing-esc-3', label: 'Opinion writing', hint: 'Linkers y vocabulario académico.', minutes: 14, grades: [4, 5] },
          { id: 'ing-esc-4', label: 'Job interview basics', hint: 'Common questions y responses.', minutes: 12, grades: [5] },
          { id: 'ing-esc-5', label: 'Email writing', hint: 'Formal vs informal.', minutes: 12, grades: [3, 4] },
        ],
      },
    ],
  },
];

export function findTopic(topicId: string) {
  for (const course of COURSE_CATALOG) {
    for (const unit of course.units) {
      const topic = unit.topics.find((t) => t.id === topicId);
      if (topic) return { course, unit, topic };
    }
  }
  return null;
}

export function findCourse(courseId: string) {
  return COURSE_CATALOG.find((c) => c.id === courseId) ?? null;
}

/** Total de temas del catálogo — útil para el perfil. */
export function totalTopicsCount() {
  return COURSE_CATALOG.reduce(
    (sum, c) => sum + c.units.reduce((u, unit) => u + unit.topics.length, 0),
    0
  );
}
