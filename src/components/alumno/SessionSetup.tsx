import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  ListChecks,
  MessageSquareText,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Layers,
  Target,
} from 'lucide-react';
import { LoopMascot } from '../shared/LoopMascot';
import type { MasteryPoint } from '../../lib/types';
import { COURSE_CATALOG, type CatalogCourse, type CatalogUnit } from '../../data/catalog';

export type QuestionPref = 'multiple' | 'open' | 'mix';

export interface SessionSetupValue {
  courseId: string;
  unitId: string;
  topicId: string;
  topicLabel: string;
  courseLabel: string;
  unitLabel: string;
  questionPref: QuestionPref;
}

interface SessionSetupProps {
  /** Dominio por tema (label → 0–100). Usado para colorear avance del tema. */
  mastery: MasteryPoint[];
  initial?: SessionSetupValue | null;
  onClose: () => void;
  onComplete: (value: SessionSetupValue) => void;
  /** Primer arranque: oculta la X. */
  required?: boolean;
}

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;

const TYPE_OPTIONS: Array<{
  id: QuestionPref;
  title: string;
  hint: string;
  icon: typeof ListChecks;
}> = [
  { id: 'multiple', title: 'Múltiple', hint: 'Cuatro opciones, una correcta.', icon: ListChecks },
  { id: 'open', title: 'Abierta', hint: 'Responde con texto o audio.', icon: MessageSquareText },
  { id: 'mix', title: 'Mixto', hint: 'Loop decide al vuelo.', icon: Shuffle },
];

function masteryFor(label: string, mastery: MasteryPoint[]) {
  return mastery.find((m) => m.topic.toLowerCase() === label.toLowerCase())?.mastery ?? 0;
}

function unitMastery(unit: CatalogUnit, mastery: MasteryPoint[]) {
  if (!unit.topics.length) return 0;
  return Math.round(
    unit.topics.reduce((acc, t) => acc + masteryFor(t.label, mastery), 0) / unit.topics.length
  );
}

function courseMastery(course: CatalogCourse, mastery: MasteryPoint[]) {
  if (!course.units.length) return 0;
  return Math.round(
    course.units.reduce((acc, u) => acc + unitMastery(u, mastery), 0) / course.units.length
  );
}

function diffTone(m: number) {
  if (m >= 75) return { tone: '#9CFF0F', label: 'Veterano' };
  if (m >= 45) return { tone: '#4D34B6', label: 'En racha' };
  if (m > 0) return { tone: '#56358C', label: 'Calentando' };
  return { tone: '#ff8a4d', label: 'Sin pisar' };
}

export function SessionSetup({ mastery, initial, onClose, onComplete, required = false }: SessionSetupProps) {
  const initialCourse = useMemo(
    () => COURSE_CATALOG.find((c) => c.id === initial?.courseId) ?? COURSE_CATALOG[0],
    [initial?.courseId]
  );
  const initialUnit = useMemo(
    () => initialCourse.units.find((u) => u.id === initial?.unitId) ?? initialCourse.units[0],
    [initialCourse, initial?.unitId]
  );

  const [courseId, setCourseId] = useState(initialCourse.id);
  const [unitId, setUnitId] = useState(initialUnit.id);
  const [topicId, setTopicId] = useState(initial?.topicId ?? initialUnit.topics[0].id);
  const [questionPref, setQuestionPref] = useState<QuestionPref>(initial?.questionPref ?? 'mix');
  // En móvil avanzamos por pasos; en escritorio se ve todo a la vez.
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  const course = COURSE_CATALOG.find((c) => c.id === courseId)!;
  const unit = course.units.find((u) => u.id === unitId) ?? course.units[0];
  const topic = unit.topics.find((t) => t.id === topicId) ?? unit.topics[0];
  const topicM = masteryFor(topic.label, mastery);

  // Al cambiar curso, resetear unit/topic a primero válido.
  useEffect(() => {
    const c = COURSE_CATALOG.find((x) => x.id === courseId)!;
    if (!c.units.find((u) => u.id === unitId)) {
      setUnitId(c.units[0].id);
      setTopicId(c.units[0].topics[0].id);
    }
  }, [courseId, unitId]);

  // Al cambiar unidad, resetear topic.
  useEffect(() => {
    if (!unit.topics.find((t) => t.id === topicId)) setTopicId(unit.topics[0].id);
  }, [unit, topicId]);

  function start() {
    onComplete({
      courseId: course.id,
      unitId: unit.id,
      topicId: topic.id,
      topicLabel: topic.label,
      courseLabel: course.label,
      unitLabel: unit.label,
      questionPref,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Catálogo de retos"
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          'radial-gradient(80% 50% at 50% 0%, rgba(77,52,182,0.25) 0%, rgba(0,0,0,0) 65%), #050008',
      }}
    >
      {/* TOP BAR */}
      <header className="flex items-center gap-3 border-b border-[#56358C]/40 bg-black/70 px-4 py-3 backdrop-blur sm:px-8">
        <div className="loop-neon-pulse rounded-full">
          <LoopMascot size={42} mood="idle" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#9CFF0F]">
            <Sparkles className="size-3.5" /> Catálogo · Currículo Nacional · Secundaria
          </div>
          <h1
            className="truncate text-2xl leading-none tracking-[0.06em] text-white sm:text-3xl"
            style={DISPLAY}
          >
            ELIGE TU SIGUIENTE RONDA
          </h1>
        </div>
        {!required && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar catálogo"
            className="flex size-9 items-center justify-center rounded-full border border-[#56358C] text-white/65 transition hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </header>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* Mobile stepper */}
        <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] lg:hidden">
          <MobilePip n={1} active={mobileStep >= 1} label="Curso" />
          <span className="h-px flex-1 bg-[#56358C]/50" />
          <MobilePip n={2} active={mobileStep >= 2} label="Unidad" />
          <span className="h-px flex-1 bg-[#56358C]/50" />
          <MobilePip n={3} active={mobileStep >= 3} label="Tema" />
        </div>

        <div className="mx-auto grid w-full max-w-[1480px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ── COL 1 · CURSOS ──────────────────────────────────── */}
          <section
            className={`flex flex-col gap-2 ${mobileStep === 1 ? 'block' : 'hidden'} lg:block`}
            aria-label="Cursos"
          >
            <ColumnHeader index={1} label="Cursos" subtitle="Tu zona de combate" />
            <div className="flex flex-col gap-2">
              {COURSE_CATALOG.map((c) => {
                const m = courseMastery(c, mastery);
                const sel = c.id === courseId;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setCourseId(c.id);
                      if (window.innerWidth < 1024) setMobileStep(2);
                    }}
                    className="group flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all"
                    style={{
                      background: sel ? 'linear-gradient(135deg,#162E84,#38123B)' : '#0d1835',
                      borderColor: sel ? c.accent : '#56358C',
                      boxShadow: sel ? `0 0 18px ${c.accent}33` : 'none',
                    }}
                  >
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{
                        background: sel ? c.accent : '#38123B',
                        color: sel ? '#000' : c.accent,
                        fontFamily: '"Bebas Neue", sans-serif',
                      }}
                    >
                      {c.glyph}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="truncate text-[18px] leading-tight tracking-[0.04em] text-white"
                          style={DISPLAY}
                        >
                          {c.label.toUpperCase()}
                        </span>
                        <span className="shrink-0 rounded-sm bg-black/50 px-1 py-0.5 text-[8.5px] font-mono uppercase tracking-[0.12em] text-white/45">
                          {c.code}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] text-white/55">{c.blurb}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-black/60">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${m}%`, background: `linear-gradient(90deg,#4D34B6,${c.accent})` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-white/75">{m}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── COL 2 · UNIDADES ────────────────────────────────── */}
          <section
            className={`flex flex-col gap-2 ${mobileStep === 2 ? 'block' : 'hidden'} lg:block`}
            aria-label="Unidades"
          >
            <ColumnHeader index={2} label={`Unidades de ${course.label}`} subtitle={`${course.units.length} bloques`} />
            <div className="flex flex-col gap-2">
              {course.units.map((u, i) => {
                const m = unitMastery(u, mastery);
                const sel = u.id === unitId;
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      setUnitId(u.id);
                      if (window.innerWidth < 1024) setMobileStep(3);
                    }}
                    className="flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all"
                    style={{
                      background: sel ? 'linear-gradient(135deg,#162E84,#0d1835)' : '#0d1835',
                      borderColor: sel ? '#9CFF0F' : '#56358C',
                      boxShadow: sel ? '0 0 16px rgba(156,255,15,0.18)' : 'none',
                    }}
                  >
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border tabular-nums"
                      style={{
                        background: sel ? '#9CFF0F' : 'transparent',
                        borderColor: sel ? '#9CFF0F' : '#56358C',
                        color: sel ? '#000' : '#9CFF0F',
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: 18,
                      }}
                      aria-hidden="true"
                    >
                      U{i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate text-[17px] leading-tight tracking-[0.04em] text-white"
                          style={DISPLAY}
                        >
                          {u.label.toUpperCase()}
                        </span>
                        <span
                          className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]"
                          style={{ borderColor: '#56358C', color: '#9CFF0F' }}
                        >
                          {u.topics.length} temas
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-white/55">{u.blurb}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-black/60">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${m}%`, background: 'linear-gradient(90deg,#4D34B6,#9CFF0F)' }}
                          />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-white/75">{m}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Mobile back */}
            <MobileBackButton onClick={() => setMobileStep(1)} label="Volver a cursos" />
          </section>

          {/* ── COL 3 · TEMAS ───────────────────────────────────── */}
          <section
            className={`flex flex-col gap-2 ${mobileStep === 3 ? 'block' : 'hidden'} lg:block`}
            aria-label="Temas"
          >
            <ColumnHeader index={3} label={`Temas · ${unit.label}`} subtitle={unit.blurb} />
            <div className="grid gap-2 sm:grid-cols-2">
              {unit.topics.map((t) => {
                const m = masteryFor(t.label, mastery);
                const sel = t.id === topicId;
                const diff = diffTone(m);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTopicId(t.id)}
                    className="group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all"
                    style={{
                      background: sel ? 'linear-gradient(135deg,#162E84,#38123B)' : '#0d1835',
                      borderColor: sel ? '#9CFF0F' : '#56358C',
                      boxShadow: sel ? '0 0 18px rgba(156,255,15,0.22)' : 'none',
                    }}
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Target className="size-3.5" style={{ color: sel ? '#9CFF0F' : diff.tone }} />
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]"
                        style={{
                          background: `${diff.tone}22`,
                          color: diff.tone,
                          border: `1px solid ${diff.tone}55`,
                        }}
                      >
                        {diff.label}
                      </span>
                    </div>
                    <div
                      className="text-[17px] leading-tight tracking-[0.04em] text-white"
                      style={DISPLAY}
                    >
                      {t.label.toUpperCase()}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-white/60">{t.hint}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
                      <span className="flex items-center gap-1 text-white/45">
                        <Clock className="size-3" /> {t.minutes}m
                      </span>
                      <span className="font-bold tabular-nums text-white/75">{m}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <MobileBackButton onClick={() => setMobileStep(2)} label="Volver a unidades" />
          </section>
        </div>
      </div>

      {/* STICKY FOOTER · formato + start */}
      <footer className="border-t border-[#56358C]/40 bg-black/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center gap-2.5">
            <Layers className="size-4 shrink-0 text-[#9CFF0F]" />
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
              Tu reto
            </div>
            <div className="truncate text-sm text-white">
              <span className="font-bold">{course.label}</span>
              <span className="mx-1.5 text-white/30">/</span>
              <span className="text-white/80">{unit.label}</span>
              <span className="mx-1.5 text-white/30">/</span>
              <span className="font-bold text-[#9CFF0F]">{topic.label}</span>
              {topicM > 0 && (
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {topicM}% dominio
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:ml-auto">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
              Formato:
            </span>
            <div role="radiogroup" className="flex items-center gap-1 rounded-full border border-[#56358C] bg-black/60 p-1">
              {TYPE_OPTIONS.map((opt) => {
                const sel = questionPref === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setQuestionPref(opt.id)}
                    title={opt.hint}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] transition-colors"
                    style={{
                      background: sel ? 'linear-gradient(135deg,#162E84,#4D34B6)' : 'transparent',
                      color: sel ? '#fff' : 'rgba(255,255,255,0.55)',
                      border: sel ? '1px solid #9CFF0F' : '1px solid transparent',
                    }}
                  >
                    <Icon className="size-3" />
                    {opt.title}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            className="loop-neon-pulse flex items-center justify-center gap-2 rounded-full bg-[#9CFF0F] px-5 py-3 text-[16px] tracking-[0.18em] text-black"
            style={DISPLAY}
          >
            EMPEZAR RETO <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ColumnHeader({ index, label, subtitle }: { index: number; label: string; subtitle?: string }) {
  return (
    <div className="sticky top-0 z-10 mb-1 flex items-baseline gap-2 bg-gradient-to-b from-black/80 to-transparent pb-2 pt-1 backdrop-blur-sm">
      <span
        className="text-[10px] font-bold tabular-nums text-[#9CFF0F]"
        style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.2em' }}
      >
        0{index}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white">{label}</div>
        {subtitle && (
          <div className="line-clamp-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function MobilePip({ n, active, label }: { n: number; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: active ? '#9CFF0F' : '#38123B',
          color: active ? '#000' : 'rgba(255,255,255,0.6)',
          border: `1px solid ${active ? '#9CFF0F' : '#56358C'}`,
        }}
      >
        {n}
      </span>
      <span
        className="text-[10px] uppercase tracking-[0.22em]"
        style={{ color: active ? '#9CFF0F' : 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
    </div>
  );
}

function MobileBackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex items-center gap-1.5 self-start rounded-full border border-[#56358C] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 lg:hidden"
    >
      <ChevronLeft className="size-3.5" /> {label}
    </button>
  );
}
