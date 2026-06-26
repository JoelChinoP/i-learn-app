import { useMemo, useState, type ChangeEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/shared/EmptyState';
import { ExportButton } from '../../components/shared/ExportButton';
import { MasteryBar } from '../../components/shared/MasteryBar';
import { PageHeader } from '../../components/shared/PageHeader';
import { TrendChart } from '../../components/shared/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { exportToCSV } from '../../lib/export';
import { useInstructorData } from './useInstructorData';

export function InstructorDashboard() {
  const { data, loading, error } = useInstructorData();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const rows = useMemo(() => data.rows.filter((row) => `${row.studentAlias} ${row.topic}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.mastery - b.mastery), [data.rows, search]);
  const trend = data.trend.map((point) => ({ date: point.week, topic: 'Promedio', mastery: point.average }));
  return <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"><PageHeader title="Panel de la sección" description={data.sections.map((section) => section.name).join(', ') || 'Analítica agregada de solo lectura'} breadcrumbs={[{ label: 'Instructor' }, { label: 'Panel' }]} actions={rows.length ? <ExportButton label="Exportar CSV" onExport={() => exportToCSV(rows, 'seccion-alumnos.csv', [{ key: 'studentAlias', label: 'Alumno' }, { key: 'topic', label: 'Tema' }, { key: 'mastery', label: 'Dominio' }, { key: 'lastActivity', label: 'Última actividad' }])} /> : undefined} />
    {loading && <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>}
    {error && <EmptyState title="No pudimos cargar la sección" description={error} />}
    {!loading && !error && data.rows.length === 0 && <EmptyState title="No hay alumnos en la sección" description="Los alumnos aparecerán cuando se registren con el código de clase." />}
    {!loading && data.rows.length > 0 && <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><Metric label="Registros" value={data.rows.length} /><Metric label="Necesitan refuerzo" value={data.rows.filter((row) => row.mastery < 50).length} /><Metric label="Buen dominio" value={data.rows.filter((row) => row.mastery >= 75).length} /></div>
      {trend.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Dominio promedio semanal</CardTitle></CardHeader><CardContent><TrendChart data={trend} height={220} /></CardContent></Card>}
      <Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Filtrar por alias o tema" className="max-w-sm" />
      <Card className="overflow-hidden rounded-2xl"><Table><TableHeader><TableRow><TableHead>Alumno</TableHead><TableHead>Tema</TableHead><TableHead>Dominio</TableHead><TableHead>Actividad</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={`${row.studentId}-${row.topic}`} className="cursor-pointer" onClick={() => navigate(`/instructor/alumno/${row.studentId}`)}><TableCell className="font-medium">{row.studentAlias}</TableCell><TableCell>{row.topic}</TableCell><TableCell className="min-w-48"><MasteryBar topic={row.topic} mastery={row.mastery} compact /></TableCell><TableCell>{formatDistanceToNow(new Date(row.lastActivity), { addSuffix: true, locale: es })}</TableCell></TableRow>)}</TableBody></Table></Card>
    </div>}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>;
}
