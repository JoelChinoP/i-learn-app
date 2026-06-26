import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  CartesianGrid } from
'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Lightbulb,
  Clock3 } from
'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
'../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/shared/PageHeader';
import { MasteryBadge } from '../../components/shared/MasteryBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { ExportButton } from '../../components/shared/ExportButton';
import { masteryMeta } from '../../lib/mastery';
import { exportTextReport } from '../../lib/export';
import {
  MOCK_ACTIVITY_TIMELINE,
  MOCK_SUPPORT_SUGGESTIONS } from
'../../data/mock';
import { usePadreData } from './usePadreData';
import { useSelectedChild } from './childSelection';
export function PadreDashboard() {
  const { loadState, data } = usePadreData();
  const [childId, setChildId] = useSelectedChild(data?.children[0]?.id ?? '');
  const child =
  data?.byChild[childId] ?? data?.byChild[data?.children[0]?.id ?? ''];
  const summary = useMemo(() => {
    if (!child)
    return {
      avg: 0,
      alerts: 0
    };
    const avg = Math.round(
      child.selectedChildMastery.reduce((s, m) => s + m.mastery, 0) /
      Math.max(1, child.selectedChildMastery.length)
    );
    const alerts = child.selectedChildMastery.filter(
      (m) => m.alert || m.mastery < 50
    ).length;
    return {
      avg,
      alerts
    };
  }, [child]);
  const lastActivityLabel = child?.lastActivityDate ?
  formatDistanceToNow(new Date(child.lastActivityDate), {
    addSuffix: true,
    locale: es
  }) :
  null;
  const alertTopics =
  child?.selectedChildMastery.
  filter((m) => m.alert || m.mastery < 50).
  map((m) => m.topic) ?? [];
  const suggestions = MOCK_SUPPORT_SUGGESTIONS.filter((s) =>
  alertTopics.includes(s.topic)
  );
  const timeline = MOCK_ACTIVITY_TIMELINE[childId] ?? [];
  function downloadReport() {
    if (!child) return;
    const lines = [
    `Reporte de progreso — ${child.name}`,
    `Generado: ${format(new Date(), "d 'de' MMMM yyyy", {
      locale: es
    })}`,
    '',
    `Dominio promedio: ${summary.avg}%`,
    `Temas en alerta: ${summary.alerts}`,
    `Última actividad: ${lastActivityLabel ?? 'sin registro'}`,
    '',
    'Detalle por tema:',
    ...child.selectedChildMastery.map(
      (m) =>
      `  - ${masteryMeta(m.mastery).parentPhrase(m.topic)} (${m.mastery}%)`
    )];

    exportTextReport(
      lines.join('\n'),
      `reporte-${child.name.toLowerCase()}.txt`
    );
  }
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Progreso de tus hijos"
        description="Un vistazo rápido a cómo van, sin tecnicismos."
        breadcrumbs={[
        {
          label: 'Padre / Tutor'
        },
        {
          label: 'Resumen'
        }]
        }
        actions={
        loadState === 'ready' && child ?
        <ExportButton label="Descargar reporte" onExport={downloadReport} /> :
        undefined
        } />
      

      {loadState === 'loading' && <DashboardSkeleton />}

      {loadState === 'empty' &&
      <EmptyState
        title="No hay hijos vinculados todavía"
        description="Cuando se vincule un alumno a tu cuenta, su progreso aparecerá aquí." />

      }

      {loadState === 'ready' && data && child &&
      <>
          {data.children.length > 1 &&
        <Tabs value={childId} onValueChange={setChildId} className="mb-5">
              <TabsList>
                {data.children.map((c) =>
            <TabsTrigger key={c.id} value={c.id}>
                    {c.name}
                  </TabsTrigger>
            )}
              </TabsList>
            </Tabs>
        }

          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
            icon={<TrendingUp className="size-5" />}
            label="Dominio promedio"
            value={`${summary.avg}%`}
            tone={masteryMeta(summary.avg).text} />
          
            <SummaryCard
            icon={<AlertTriangle className="size-5" />}
            label="Temas en alerta"
            value={String(summary.alerts)}
            tone={
            summary.alerts > 0 ?
            'text-red-700 dark:text-red-400' :
            'text-emerald-700 dark:text-emerald-400'
            } />
          
            <SummaryCard
            icon={<CalendarClock className="size-5" />}
            label="Última actividad"
            value={lastActivityLabel ?? 'Sin registro'}
            small />
          
          </section>

          <Card className="mb-6 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nivel por tema</CardTitle>
            </CardHeader>
            <CardContent>
              <div
              className="h-56 w-full"
              role="img"
              aria-label={`Gráfico de dominio por tema de ${child.name}`}>
              
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                  data={child.selectedChildMastery}
                  margin={{
                    top: 8,
                    right: 8,
                    left: -16,
                    bottom: 0
                  }}>
                  
                    <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false} />
                  
                    <XAxis
                    dataKey="topic"
                    tick={{
                      fontSize: 12,
                      fill: 'var(--muted-foreground)'
                    }}
                    tickLine={false}
                    axisLine={{
                      stroke: 'var(--border)'
                    }} />
                  
                    <YAxis
                    domain={[0, 100]}
                    tick={{
                      fontSize: 12,
                      fill: 'var(--muted-foreground)'
                    }}
                    tickLine={false}
                    axisLine={false} />
                  
                    <Tooltip
                    cursor={{
                      fill: 'var(--muted)'
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      fontSize: 12
                    }}
                    formatter={(v: number) => [`${v}%`, 'Dominio']} />
                  
                    <Bar
                    dataKey="mastery"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={64}>
                    
                      {child.selectedChildMastery.map((m) =>
                    <Cell key={m.topic} fill={masteryMeta(m.mastery).hex} />
                    )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumen por tema</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {child.selectedChildMastery.map((m) => {
              const meta = masteryMeta(m.mastery);
              return (
                <div
                  key={m.topic}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  
                    <div className="flex items-center gap-3">
                      <span
                      className={`size-2.5 shrink-0 rounded-full ${meta.dot}`}
                      aria-hidden="true" />
                    
                      <p className="text-sm font-medium text-foreground">
                        {meta.parentPhrase(m.topic)}
                      </p>
                    </div>
                    <MasteryBadge mastery={m.mastery} />
                  </div>);

            })}
            </CardContent>
          </Card>

          {suggestions.length > 0 &&
        <Card className="mb-6 rounded-2xl border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb
                className="size-4 text-primary"
                aria-hidden="true" />
              {' '}
                  Cómo apoyarlo en casa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestions.map((s) =>
            <div key={s.topic}>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {s.topic}
                    </p>
                    <ul className="space-y-1">
                      {s.tips.map((tip, i) =>
                <li
                  key={i}
                  className="flex gap-2 text-sm text-muted-foreground">
                  
                          <span
                    className="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true" />
                  
                          {tip}
                        </li>
                )}
                    </ul>
                  </div>
            )}
              </CardContent>
            </Card>
        }

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ?
            <p className="py-2 text-sm text-muted-foreground">
                  Sin actividad registrada.
                </p> :

            <ol className="relative space-y-4 border-l border-border pl-5">
                  {timeline.map((e) =>
              <li key={e.id} className="relative">
                      <span className="absolute -left-[1.5rem] top-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock3 className="size-3" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {e.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.date), {
                    addSuffix: true,
                    locale: es
                  })}
                      </p>
                    </li>
              )}
                </ol>
            }
            </CardContent>
          </Card>
        </>
      }
    </main>);

}
function SummaryCard({
  icon,
  label,
  value,
  tone = 'text-foreground',
  small = false






}: {icon: React.ReactNode;label: string;value: string;tone?: string;small?: boolean;}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={`truncate font-semibold ${small ? 'text-sm' : 'text-xl'} ${tone}`}>
            
            {value}
          </p>
        </div>
      </CardContent>
    </Card>);

}
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) =>
        <Skeleton key={i} className="h-[72px] rounded-2xl" />
        )}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
    </div>);

}