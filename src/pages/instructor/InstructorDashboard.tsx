import React, { useMemo, useState, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line } from
'recharts';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
'../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'../../components/ui/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'../../components/ui/Select';
import { PageHeader } from '../../components/shared/PageHeader';
import { MasteryBar } from '../../components/shared/MasteryBar';
import { MasteryBadge } from '../../components/shared/MasteryBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { AlertBanner } from '../../components/shared/AlertBanner';
import { ExportButton } from '../../components/shared/ExportButton';
import { masteryLevel, masteryMeta } from '../../lib/mastery';
import { exportToCSV } from '../../lib/export';
import { MOCK_SECTION_ALERTS, MOCK_SECTION_TREND } from '../../data/mock';
import { useInstructorData } from './useInstructorData';
type SortKey = 'studentAlias' | 'topic' | 'mastery' | 'lastActivity';
type SortDir = 'asc' | 'desc';
export function InstructorDashboard() {
  const navigate = useNavigate();
  const { loadState, rows } = useInstructorData();
  const [topicFilter, setTopicFilter] = useState('todos');
  const [alertFilter, setAlertFilter] = useState('todos');
  const [recencyFilter, setRecencyFilter] = useState('todos');
  const [studentFilter, setStudentFilter] = useState<string[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('mastery');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [alerts, setAlerts] = useState(MOCK_SECTION_ALERTS);
  const topics = useMemo(
    () => Array.from(new Set(rows.map((r) => r.topic))),
    [rows]
  );
  const filtered = useMemo(() => {
    let out = [...rows];
    if (topicFilter !== 'todos')
    out = out.filter((r) => r.topic === topicFilter);
    if (alertFilter !== 'todos')
    out = out.filter((r) => masteryLevel(r.mastery) === alertFilter);
    if (recencyFilter !== 'todos') {
      const maxH =
      recencyFilter === '24h' ?
      24 :
      recencyFilter === '7d' ?
      24 * 7 :
      Infinity;
      out = out.filter((r) => {
        const h = differenceInHours(new Date(), new Date(r.lastActivity));
        return recencyFilter === 'inactivos' ? h >= 24 * 7 : h <= maxH;
      });
    }
    if (studentFilter)
    out = out.filter((r) => studentFilter.includes(r.studentAlias));
    out.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'mastery') cmp = a.mastery - b.mastery;else
      if (sortKey === 'lastActivity')
      cmp =
      new Date(a.lastActivity).getTime() -
      new Date(b.lastActivity).getTime();else
      cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [
  rows,
  topicFilter,
  alertFilter,
  recencyFilter,
  studentFilter,
  sortKey,
  sortDir]
  );
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');else
    {
      setSortKey(key);
      setSortDir('asc');
    }
  }
  const distribution = useMemo(() => {
    const buckets = {
      low: 0,
      medium: 0,
      high: 0
    };
    rows.forEach((r) => buckets[masteryLevel(r.mastery)] += 1);
    return [
    {
      name: 'Necesita refuerzo',
      value: buckets.low,
      hex: masteryMeta(20).hex
    },
    {
      name: 'Dominio medio',
      value: buckets.medium,
      hex: masteryMeta(60).hex
    },
    {
      name: 'Buen dominio',
      value: buckets.high,
      hex: masteryMeta(90).hex
    }];

  }, [rows]);
  function handleExport() {
    exportToCSV(filtered, 'seccion-alumnos.csv', [
    {
      key: 'studentAlias',
      label: 'Alumno'
    },
    {
      key: 'topic',
      label: 'Tema'
    },
    {
      key: 'mastery',
      label: 'Dominio'
    },
    {
      key: 'lastActivity',
      label: 'Última actividad'
    }]
    );
  }
  const filtersActive =
  topicFilter !== 'todos' ||
  alertFilter !== 'todos' ||
  recencyFilter !== 'todos' ||
  studentFilter;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Panel de la sección"
        description="Detectá rápido quién necesita ayuda."
        breadcrumbs={[
        {
          label: 'Instructor'
        },
        {
          label: 'Panel'
        }]
        }
        actions={
        loadState === 'ready' ?
        <ExportButton
          label="Exportar CSV"
          onExport={handleExport}
          successMessage="CSV exportado" /> :

        undefined
        } />
      

      {loadState === 'loading' && <DashboardSkeleton />}

      {loadState === 'empty' &&
      <EmptyState
        title="No hay alumnos asignados a esta sección todavía."
        description="Cuando se asignen alumnos, su progreso aparecerá aquí." />

      }

      {loadState === 'ready' &&
      <div className="space-y-6">
          {alerts.length > 0 &&
        <div className="space-y-2">
              {alerts.map((a, i) =>
          <AlertBanner
            key={i}
            alert={a}
            onAction={() => setStudentFilter(a.affectedStudents)}
            onDismiss={() =>
            setAlerts((prev) => prev.filter((_, idx) => idx !== i))
            } />

          )}
            </div>
        }

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Distribución de dominio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                className="h-48 w-full"
                role="img"
                aria-label="Distribución de dominio de la sección por nivel">
                
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    data={distribution}
                    layout="vertical"
                    margin={{
                      top: 4,
                      right: 16,
                      left: 8,
                      bottom: 0
                    }}>
                    
                      <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      horizontal={false} />
                    
                      <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fontSize: 12,
                        fill: 'var(--muted-foreground)'
                      }}
                      tickLine={false}
                      axisLine={{
                        stroke: 'var(--border)'
                      }} />
                    
                      <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
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
                      formatter={(v: number) => [
                      `${v} alumno(s)`,
                      'Cantidad']
                      } />
                    
                      <Bar
                      dataKey="value"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={28}>
                      
                        {distribution.map((d) =>
                      <Cell key={d.name} fill={d.hex} />
                      )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Dominio promedio (semana a semana)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                className="h-48 w-full"
                role="img"
                aria-label="Tendencia de dominio promedio de la sección">
                
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                    data={MOCK_SECTION_TREND}
                    margin={{
                      top: 8,
                      right: 12,
                      left: -16,
                      bottom: 0
                    }}>
                    
                      <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false} />
                    
                      <XAxis
                      dataKey="week"
                      tick={{
                        fontSize: 11,
                        fill: 'var(--muted-foreground)'
                      }}
                      tickLine={false}
                      axisLine={{
                        stroke: 'var(--border)'
                      }} />
                    
                      <YAxis
                      domain={[0, 100]}
                      tick={{
                        fontSize: 11,
                        fill: 'var(--muted-foreground)'
                      }}
                      tickLine={false}
                      axisLine={false} />
                    
                      <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--popover)',
                        fontSize: 12
                      }}
                      formatter={(v: number) => [`${v}%`, 'Promedio']} />
                    
                      <Line
                      type="monotone"
                      dataKey="promedio"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 4
                      }} />
                    
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros avanzados */}
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
            label="Tema"
            value={topicFilter}
            onChange={setTopicFilter}
            options={[
            {
              value: 'todos',
              label: 'Todos los temas'
            },
            ...topics.map((t) => ({
              value: t,
              label: t
            }))]
            } />
          
            <FilterSelect
            label="Nivel"
            value={alertFilter}
            onChange={setAlertFilter}
            options={[
            {
              value: 'todos',
              label: 'Todos los niveles'
            },
            {
              value: 'low',
              label: 'Necesita refuerzo'
            },
            {
              value: 'medium',
              label: 'Dominio medio'
            },
            {
              value: 'high',
              label: 'Buen dominio'
            }]
            } />
          
            <FilterSelect
            label="Actividad"
            value={recencyFilter}
            onChange={setRecencyFilter}
            options={[
            {
              value: 'todos',
              label: 'Cualquier fecha'
            },
            {
              value: '24h',
              label: 'Últimas 24 h'
            },
            {
              value: '7d',
              label: 'Últimos 7 días'
            },
            {
              value: 'inactivos',
              label: 'Inactivos +7 días'
            }]
            } />
          
            {filtersActive &&
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => {
              setTopicFilter('todos');
              setAlertFilter('todos');
              setRecencyFilter('todos');
              setStudentFilter(null);
            }}>
            
                Limpiar filtros
              </button>
          }
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} de {rows.length} registros
            </span>
          </div>

          {filtered.length === 0 ?
        <EmptyState
          title="Sin resultados"
          description="Ajustá los filtros para ver alumnos." /> :


        <>
              <Card className="hidden overflow-hidden rounded-2xl md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHead
                    label="Alumno"
                    active={sortKey === 'studentAlias'}
                    dir={sortDir}
                    onClick={() => toggleSort('studentAlias')} />
                  
                      <SortHead
                    label="Tema"
                    active={sortKey === 'topic'}
                    dir={sortDir}
                    onClick={() => toggleSort('topic')} />
                  
                      <SortHead
                    label="Nivel de dominio"
                    active={sortKey === 'mastery'}
                    dir={sortDir}
                    onClick={() => toggleSort('mastery')} />
                  
                      <SortHead
                    label="Última actividad"
                    active={sortKey === 'lastActivity'}
                    dir={sortDir}
                    onClick={() => toggleSort('lastActivity')} />
                  
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r, i) =>
                <TableRow
                  key={`${r.studentAlias}-${i}`}
                  className="cursor-pointer"
                  onClick={() =>
                  navigate(
                    `/instructor/alumno/${encodeURIComponent(r.studentAlias)}`
                  )
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(
                        `/instructor/alumno/${encodeURIComponent(r.studentAlias)}`
                      );
                    }
                  }}>
                  
                        <TableCell className="font-medium text-foreground">
                          {r.studentAlias}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.topic}
                        </TableCell>
                        <TableCell>
                          <MasteryBar
                      topic={r.topic}
                      mastery={r.mastery}
                      compact />
                    
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(r.lastActivity), {
                      addSuffix: true,
                      locale: es
                    })}
                        </TableCell>
                        <TableCell>
                          <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden="true" />
                    
                        </TableCell>
                      </TableRow>
                )}
                  </TableBody>
                </Table>
              </Card>

              <div className="space-y-3 md:hidden">
                {filtered.map((r, i) =>
            <Card
              key={`${r.studentAlias}-${i}`}
              className="cursor-pointer rounded-2xl"
              onClick={() =>
              navigate(
                `/instructor/alumno/${encodeURIComponent(r.studentAlias)}`
              )
              }>
              
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {r.studentAlias}
                        </span>
                        <MasteryBadge mastery={r.mastery} showValue />
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {r.topic}
                      </p>
                      <MasteryBar topic={r.topic} mastery={r.mastery} compact />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.lastActivity), {
                    addSuffix: true,
                    locale: es
                  })}
                      </p>
                    </CardContent>
                  </Card>
            )}
              </div>
            </>
        }
        </div>
      }
    </main>);

}
function FilterSelect({
  label,
  value,
  onChange,
  options








}: {label: string;value: string;onChange: (v: string) => void;options: {value: string;label: string;}[];}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) =>
          <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>);

}
function SortHead({
  label,
  active,
  dir,
  onClick





}: {label: string;active: boolean;dir: SortDir;onClick: () => void;}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ordenar por ${label}${active ? dir === 'asc' ? ', ascendente' : ', descendente' : ''}`}>
        
        {label}
        <ArrowUpDown
          className={`size-3.5 ${active ? 'text-primary' : 'text-muted-foreground/60'}`}
          aria-hidden="true" />
        
      </button>
    </TableHead>);

}
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>);

}