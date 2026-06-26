import { useEffect, useState, type ChangeEvent } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityHeatmap } from '../../components/shared/ActivityHeatmap';
import { EmptyState } from '../../components/shared/EmptyState';
import { MasteryBar } from '../../components/shared/MasteryBar';
import { PageHeader } from '../../components/shared/PageHeader';
import { TrendChart } from '../../components/shared/TrendChart';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabase';
import { useSelectedChild } from './childSelection';
import { usePadreData } from './usePadreData';

export function PadreDashboard() {
  const { loadState, data, error, reload } = usePadreData();
  const [childId, selectChild] = useSelectedChild(data.children[0]?.id ?? '');
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  useEffect(() => { if (data.children.length && !data.children.some((child) => child.id === childId)) selectChild(data.children[0].id); }, [data.children, childId, selectChild]);
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];

  async function linkStudent() {
    if (!code.trim()) return;
    setLinking(true);
    const { data: response, error: invokeError } = await supabase.functions.invoke('link-student', { body: { studentLinkCode: code, acceptConsent: true } });
    setLinking(false);
    if (invokeError || response?.status !== 'linked') return toast.error(response?.error_code ?? 'Código inválido o vencido');
    setCode('');
    toast.success('Alumno vinculado y consentimiento registrado');
    await reload();
  }

  return <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
    <PageHeader title="Progreso familiar" description="Métricas académicas agregadas de tus hijos vinculados." breadcrumbs={[{ label: 'Padre / Tutor' }, { label: 'Resumen' }]} />
    <Card className="mb-6 rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Link2 className="size-4" />Vincular otro alumno</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row"><div className="flex-1"><Label htmlFor="link-code" className="sr-only">Código del alumno</Label><Input id="link-code" value={code} onChange={(event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value.toUpperCase())} placeholder="ABCD-1234" /></div><Button disabled={!code.trim() || linking} onClick={() => void linkStudent()}>{linking && <Loader2 className="size-4 animate-spin" />}Vincular y consentir</Button></CardContent></Card>
    {loadState === 'loading' && <div className="space-y-4"><Skeleton className="h-14 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>}
    {loadState === 'error' && <EmptyState title="No pudimos cargar el dashboard" description={error ?? 'Inténtalo de nuevo.'} action={<Button onClick={() => void reload()}>Reintentar</Button>} />}
    {loadState === 'empty' && <EmptyState title="Aún no hay alumnos vinculados" description="Pide al alumno que genere un código y úsalo arriba para registrar el consentimiento." />}
    {loadState === 'ready' && child && <div className="space-y-6">
      <div className="flex flex-wrap gap-2">{data.children.map((item) => <Button key={item.id} variant={item.id === child.id ? 'default' : 'outline'} size="sm" onClick={() => selectChild(item.id)}>{item.name}</Button>)}</div>
      <div className="grid gap-6 lg:grid-cols-2"><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Dominio de {child.name}</CardTitle></CardHeader><CardContent className="space-y-4">{child.mastery.map((item) => <MasteryBar key={item.topic} topic={item.topic} mastery={item.mastery} />)}</CardContent></Card><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Actividad reciente</CardTitle></CardHeader><CardContent><ActivityHeatmap days={child.activity} /></CardContent></Card></div>
      {child.history.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Tendencia</CardTitle></CardHeader><CardContent><TrendChart data={child.history} /></CardContent></Card>}
    </div>}
  </main>;
}
