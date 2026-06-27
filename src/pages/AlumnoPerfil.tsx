import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, Trophy, Sparkles, ChevronRight, Target, Calendar } from 'lucide-react';
import { LoopLoader, LoopMascot } from '../components/shared/LoopMascot';
import { AchievementBadge } from '../components/shared/AchievementBadge';
import { ActivityHeatmap } from '../components/shared/ActivityHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { StudentDashboard } from '../lib/types';
import { MOCK_ACHIEVEMENTS, MOCK_XP } from '../data/mock';
import { COURSE_CATALOG, totalTopicsCount } from '../data/catalog';

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;

interface RankRow {
  courseId: string;
  label: string;
  code: string;
  accent: string;
  glyph: string;
  mastery: number;
  topicsCovered: number;
  topicsTotal: number;
}

function buildRanking(dashboard: StudentDashboard | null): RankRow[] {
  const byLabel = new Map(
    dashboard?.masteryByTopic.map((m) => [m.topic.toLowerCase(), m.mastery]) ?? []
  );
  return COURSE_CATALOG.map((course) => {
    const allTopics = course.units.flatMap((u) => u.topics);
    const matched = allTopics
      .map((t) => byLabel.get(t.label.toLowerCase()))
      .filter((v): v is number => v !== undefined);
    const mastery = matched.length
      ? Math.round(matched.reduce((a, b) => a + b, 0) / matched.length)
      : 0;
    return {
      courseId: course.id,
      label: course.label,
      code: course.code,
      accent: course.accent,
      glyph: course.glyph,
      mastery,
      topicsCovered: matched.length,
      topicsTotal: allTopics.length,
    };
  }).sort((a, b) => b.mastery - a.mastery);
}

export function AlumnoPerfil() {
  const { profile } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_student_dashboard');
        if (alive && data) setDashboard(data as StudentDashboard);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-md p-8">
        <LoopLoader message="Cargando tu perfil" />
      </main>
    );
  }

  const xp = MOCK_XP;
  const xpPct = Math.round((xp.current / xp.nextLevel) * 100);
  const earned = MOCK_ACHIEVEMENTS.filter((a) => a.earnedAt).length;
  const totalAchievements = MOCK_ACHIEVEMENTS.length;
  const ranking = buildRanking(dashboard);
  const totalTopics = totalTopicsCount();
  const accuracy = dashboard && dashboard.answeredCount > 0
    ? Math.round((dashboard.correctCount / dashboard.answeredCount) * 100)
    : 0;
  const streak = dashboard?.streakDays ?? 0;
  const studentName = profile?.full_name ?? dashboard?.studentName ?? 'Estudiante';
  const firstName = studentName.split(' ')[0];
  const initials = studentName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <main className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-6">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-3xl border border-[#56358C] p-5 sm:p-8"
        style={{
          background:
            'radial-gradient(60% 80% at 0% 0%, rgba(77,52,182,0.45) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 80% at 100% 100%, rgba(156,255,15,0.18) 0%, rgba(0,0,0,0) 60%), linear-gradient(135deg, #162E84 0%, #0d1835 50%, #38123B 100%)',
        }}
      >
        {/* Constelación de fondo: anillos concéntricos sutiles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border border-[#9CFF0F]/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full border border-[#9CFF0F]/15"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="loop-neon-pulse rounded-full">
              <LoopMascot size={96} mood={streak >= 7 ? 'happy' : 'idle'} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#9CFF0F]">
                <Sparkles className="size-3.5" /> Perfil Loop · {initials}
              </div>
              <h1
                className="mt-1 text-4xl leading-none tracking-[0.06em] text-white sm:text-5xl"
                style={DISPLAY}
              >
                {firstName.toUpperCase()}
              </h1>
              <p className="mt-1.5 max-w-md text-xs text-white/60">
                {streak >= 7
                  ? `Estás encendido, ${firstName}. Loop te sigue el paso ${streak} días seguidos.`
                  : streak > 0
                  ? `Llevas ${streak} día(s) en racha. Una sesión más y se nota.`
                  : 'Tu primera sesión te abre la racha. ¿Empezamos?'}
              </p>
            </div>
          </div>

          {/* HERO STATS */}
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:ml-auto">
            <HeroStat icon={<Flame className="size-4" />} label="Racha" value={String(streak)} unit="días" tone="#ff8a4d" />
            <HeroStat icon={<Zap className="size-4" />} label={`Nivel ${xp.level}`} value={String(xpPct)} unit="% al next" tone="#9CFF0F" />
            <HeroStat icon={<Target className="size-4" />} label="Precisión" value={String(accuracy)} unit="%" tone="#4D34B6" />
            <HeroStat icon={<Trophy className="size-4" />} label="Insignias" value={`${earned}/${totalAchievements}`} unit="" tone="#ffd166" />
          </div>
        </div>

        {/* XP BAR */}
        <div className="relative mt-6">
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
            <span className="text-white/55">Camino al nivel {xp.level + 1}</span>
            <span className="font-mono tabular-nums text-[#9CFF0F]">{xp.current} / {xp.nextLevel} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/60 ring-1 ring-[#56358C]/40">
            <div
              className="h-full rounded-full"
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg, #4D34B6 0%, #9CFF0F 100%)',
                boxShadow: '0 0 12px rgba(156,255,15,0.55)',
              }}
            />
          </div>
        </div>
      </section>

      {/* GRID */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* COURSE RANKING */}
        <section>
          <SectionTitle index={1} title="Ranking de cursos" subtitle="Tu mapa de dominio según el currículo nacional." />
          <div className="mt-3 grid gap-2.5">
            {ranking.map((row, i) => (
              <div
                key={row.courseId}
                className="grid items-center gap-3 rounded-2xl border border-[#56358C] bg-[#0d0d0d] p-3 sm:grid-cols-[40px_44px_minmax(0,1fr)_120px_auto]"
              >
                <div
                  className="text-center tabular-nums text-white/45"
                  style={{ ...DISPLAY, fontSize: 22 }}
                >
                  #{i + 1}
                </div>
                <div
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{
                    background: `${row.accent}1f`,
                    color: row.accent,
                    border: `1px solid ${row.accent}55`,
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 22,
                  }}
                >
                  {row.glyph}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="truncate text-[18px] leading-tight tracking-[0.04em] text-white"
                      style={DISPLAY}
                    >
                      {row.label.toUpperCase()}
                    </span>
                    <span className="shrink-0 rounded-sm bg-black/50 px-1 py-0.5 text-[8.5px] font-mono uppercase tracking-[0.12em] text-white/45">
                      {row.code}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.18em] text-white/40">
                    {row.topicsCovered}/{row.topicsTotal} temas tocados
                  </div>
                </div>
                <div>
                  <div className="h-[6px] overflow-hidden rounded-full bg-black/60">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.mastery}%`,
                        background: `linear-gradient(90deg,#4D34B6,${row.accent})`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[10px] font-bold tabular-nums text-white/65">{row.mastery}%</div>
                </div>
                <Link
                  to="/alumno"
                  className="hidden items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CFF0F] hover:text-white sm:flex"
                  aria-label={`Entrenar ${row.label}`}
                >
                  Entrenar <ChevronRight className="size-3.5" />
                </Link>
              </div>
            ))}
            <div className="px-1 text-center text-[10px] uppercase tracking-[0.22em] text-white/30">
              {ranking.length} áreas · {totalTopics} temas en el catálogo
            </div>
          </div>
        </section>

        {/* SIDE COLUMN */}
        <aside className="flex flex-col gap-5">
          {/* ACHIEVEMENTS */}
          <section>
            <SectionTitle index={2} title="Vitrina de insignias" subtitle={`${earned} desbloqueadas de ${totalAchievements}`} />
            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
              {MOCK_ACHIEVEMENTS.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          </section>

          {/* ACTIVITY */}
          {dashboard && (
            <section>
              <SectionTitle index={3} title="Calendario de combate" subtitle="Cada cuadro es un día con sesión." />
              <Card className="mt-3 rounded-2xl border border-[#56358C] bg-[#0d0d0d]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9CFF0F]">
                    Últimos 90 días
                  </CardTitle>
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
                    <Calendar className="size-3" /> {dashboard.answeredCount} respuestas
                  </span>
                </CardHeader>
                <CardContent>
                  <ActivityHeatmap days={dashboard.activity} />
                </CardContent>
              </Card>
            </section>
          )}
        </aside>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          to="/alumno"
          className="loop-neon-pulse flex items-center gap-2 rounded-full bg-[#9CFF0F] px-5 py-3 text-[14px] tracking-[0.18em] text-black"
          style={DISPLAY}
        >
          VOLVER AL RING <ChevronRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}

function HeroStat({ icon, label, value, unit, tone }: { icon: React.ReactNode; label: string; value: string; unit: string; tone: string }) {
  return (
    <div
      className="rounded-2xl border bg-black/45 p-3 backdrop-blur"
      style={{ borderColor: `${tone}55` }}
    >
      <div
        className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em]"
        style={{ color: tone }}
      >
        {icon} {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[34px] leading-none tabular-nums text-white" style={DISPLAY}>
          {value}
        </span>
        {unit && <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">{unit}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ index, title, subtitle }: { index: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[10px] font-bold tabular-nums text-[#9CFF0F]"
        style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.2em' }}
      >
        0{index}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white">{title}</div>
        {subtitle && <div className="line-clamp-1 text-[10px] uppercase tracking-[0.18em] text-white/40">{subtitle}</div>}
      </div>
    </div>
  );
}
