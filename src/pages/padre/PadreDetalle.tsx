import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '../../components/shared/EmptyState';
import { MasteryBadge } from '../../components/shared/MasteryBadge';
import { PageHeader } from '../../components/shared/PageHeader';
import { TrendChart } from '../../components/shared/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSelectedChild } from './childSelection';
import { usePadreData } from './usePadreData';

export function PadreDetalle() {
  const { loadState, data } = usePadreData();
  const [childId, selectChild] = useSelectedChild(data.children[0]?.id ?? '');
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];
  return <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8"><PageHeader title="Detalle y tendencia" description="Consulta histórica de solo lectura." breadcrumbs={[{ label: 'Padre / Tutor', to: '/padre' }, { label: 'Detalle' }]} />
    {loadState === 'loading' && <Skeleton className="h-72 rounded-2xl" />}
    {loadState === 'empty' && <EmptyState title="No hay alumnos vinculados" description="Vincula un alumno desde el resumen." />}
    {child && <div className="space-y-6"><div className="flex gap-2">{data.children.map((item) => <button key={item.id} className={`rounded-full px-3 py-1 text-sm ${item.id === child.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} onClick={() => selectChild(item.id)}>{item.name}</button>)}</div><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Estado actual</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{child.mastery.map((item) => <div key={item.topic} className="flex items-center justify-between rounded-xl border p-3"><span>{item.topic}</span><MasteryBadge mastery={item.mastery} showValue /></div>)}</CardContent></Card>{child.history.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Progreso en el tiempo</CardTitle></CardHeader><CardContent><TrendChart data={child.history} /></CardContent></Card>}<p className="text-sm text-muted-foreground">Última actividad: {child.lastActivityDate ? formatDistanceToNow(new Date(child.lastActivityDate), { addSuffix: true, locale: es }) : 'sin actividad registrada'}</p></div>}
  </main>;
}
