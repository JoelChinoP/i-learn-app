import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { MasteryBar } from '../../components/shared/MasteryBar';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useInstructorData } from './useInstructorData';

export function InstructorAlumno() {
  const { studentId = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useInstructorData();
  const rows = data.rows.filter((row) => row.studentId === studentId);
  const alias = rows[0]?.studentAlias ?? 'Alumno';
  return <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8"><PageHeader title={alias} description="Progreso seudonimizado de solo lectura." breadcrumbs={[{ label: 'Instructor', to: '/instructor' }, { label: alias }]} />
    <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/instructor')}><ArrowLeft className="size-4" />Volver</Button>
    {loading && <Skeleton className="h-64 rounded-2xl" />}
    {!loading && rows.length === 0 && <EmptyState title="Alumno no encontrado" description="No pertenece a una sección asignada a este instructor." />}
    {rows.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Dominio por tema</CardTitle></CardHeader><CardContent className="space-y-5">{rows.map((row) => <MasteryBar key={row.topic} topic={row.topic} mastery={row.mastery} />)}</CardContent></Card>}
  </main>;
}
