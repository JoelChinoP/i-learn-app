import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Loader2, RefreshCw, RotateCcw, Send, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityHeatmap } from '../components/shared/ActivityHeatmap';
import { ChatBubble } from '../components/shared/ChatBubble';
import { EmptyState } from '../components/shared/EmptyState';
import { MasteryBar } from '../components/shared/MasteryBar';
import { ProgressRing } from '../components/shared/ProgressRing';
import { TrendChart } from '../components/shared/TrendChart';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { Skeleton } from '../components/ui/Skeleton';
import { Textarea } from '../components/ui/Textarea';
import { supabase } from '../lib/supabase';
import type { StudentDashboard } from '../lib/types';

interface Feedback {
  id: string;
  response_id: string;
  explanation: string;
  used_fallback: boolean;
  version: number;
}

export function AlumnoView() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState('');
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reexplaining, setReexplaining] = useState(false);
  const [linkCode, setLinkCode] = useState(() => localStorage.getItem('aprendo.studentLinkCode') ?? '');
  const sessionId = useRef(crypto.randomUUID());
  const activeResponseId = useRef<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('get_student_dashboard');
    if (rpcError) throw rpcError;
    setDashboard(data as StudentDashboard);
  }, []);

  useEffect(() => {
    void loadDashboard().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar')).finally(() => setLoading(false));
  }, [loadDashboard]);

  useEffect(() => {
    if (!dashboard?.studentId) return;
    const channel = supabase.channel(`feedback-${dashboard.studentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedbacks', filter: `student_id=eq.${dashboard.studentId}` }, (payload) => {
        const next = payload.new as Feedback;
        if (!activeResponseId.current || next.response_id !== activeResponseId.current) return;
        setFeedback(next);
        setSubmitting(false);
        setReexplaining(false);
        void loadDashboard();
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [dashboard?.studentId, loadDashboard]);

  async function pollFeedback(responseId: string) {
    const { data } = await supabase.from('feedbacks').select('id,response_id,explanation,used_fallback,version')
      .eq('response_id', responseId).order('version', { ascending: false }).limit(1).maybeSingle();
    if (data) {
      setFeedback(data as Feedback);
      setSubmitting(false);
      setReexplaining(false);
      await loadDashboard();
    }
  }

  async function submitAnswer() {
    const question = dashboard?.currentQuestion;
    if (!question) return;
    const answer = question.type === 'opcion_multiple' ? selected : freeText;
    if (!answer.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    const { data, error: invokeError } = await supabase.functions.invoke('ingest-response', {
      body: { question_id: question.id, session_id: sessionId.current, raw_answer: answer },
    });
    if (invokeError || data?.status !== 'accepted') {
      setSubmitting(false);
      toast.error(data?.error_code === 'CONSENT_REQUIRED' ? 'Tu tutor debe dar consentimiento antes de responder.' : data?.error_code ?? invokeError?.message ?? 'No se pudo enviar');
      return;
    }
    activeResponseId.current = data.response_id;
    window.setTimeout(() => void pollFeedback(data.response_id), 30_000);
  }

  async function reexplain() {
    if (!feedback) return;
    activeResponseId.current = feedback.response_id;
    setReexplaining(true);
    const { data, error: invokeError } = await supabase.functions.invoke('reexplain-response', { body: { response_id: feedback.response_id } });
    if (invokeError || data?.status !== 'accepted') {
      setReexplaining(false);
      toast.error(data?.error_code ?? 'No se pudo generar otra explicación');
      return;
    }
    window.setTimeout(() => void pollFeedback(feedback.response_id), 10_000);
  }

  async function rotateLinkCode() {
    const { data, error: invokeError } = await supabase.functions.invoke('rotate-link-code', { body: {} });
    if (invokeError || !data?.student_link_code) return toast.error('No se pudo generar el código');
    localStorage.setItem('aprendo.studentLinkCode', data.student_link_code);
    setLinkCode(data.student_link_code);
    toast.success('Código renovado por 7 días');
  }

  function nextQuestion() {
    setSelected('');
    setFreeText('');
    setFeedback(null);
    activeResponseId.current = null;
    void loadDashboard();
  }

  if (loading) return <StudentSkeleton />;
  if (error) return <main className="mx-auto max-w-2xl p-6"><EmptyState title="No pudimos cargar tu actividad" description={error} action={<Button onClick={() => window.location.reload()}><RefreshCw className="size-4" />Reintentar</Button>} /></main>;
  if (!dashboard) return null;
  const overall = dashboard.masteryByTopic.length ? Math.round(dashboard.masteryByTopic.reduce((sum, item) => sum + item.mastery, 0) / dashboard.masteryByTopic.length) : 0;
  const question = dashboard.currentQuestion;

  return <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:py-8">
    <section className="flex flex-wrap items-center gap-4"><ProgressRing value={overall} label={`Progreso general ${overall} por ciento`} /><div><h1 className="text-2xl font-bold">¡Hola, {dashboard.studentName}!</h1><p className="text-sm text-muted-foreground">{dashboard.streakDays} día(s) de actividad esta semana · {dashboard.answeredCount} respuestas</p></div></section>

    {!dashboard.consentSigned && <Card className="rounded-2xl border-amber-300"><CardHeader><CardTitle className="text-base">Falta el consentimiento de tu tutor</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Comparte este código con tu padre o tutor. Caduca a los 7 días y se usa una sola vez.</p>{linkCode && <div className="flex items-center gap-2"><code className="rounded-lg bg-muted px-4 py-2 text-lg font-bold tracking-widest">{linkCode}</code><Share2 className="size-4" /></div>}<Button variant="outline" onClick={() => void rotateLinkCode()}><RotateCcw className="size-4" />{linkCode ? 'Renovar código' : 'Generar código'}</Button></CardContent></Card>}

    {dashboard.consentSigned && question ? <Card className="rounded-2xl"><CardHeader><p className="text-xs font-medium uppercase tracking-wide text-primary">{question.topic} · dificultad {question.difficultyLevel}</p><CardTitle className="text-lg">{question.text}</CardTitle></CardHeader><CardContent className="space-y-5">
      {question.type === 'opcion_multiple' ? <RadioGroup value={selected} onValueChange={setSelected} disabled={submitting || Boolean(feedback)} className="gap-2">{question.options?.map((option, index) => <Label key={option} htmlFor={`option-${index}`} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"><RadioGroupItem id={`option-${index}`} value={option} /><span>{option}</span></Label>)}</RadioGroup> : <Textarea value={freeText} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFreeText(event.target.value)} disabled={submitting || Boolean(feedback)} rows={4} placeholder="Escribe tu respuesta…" />}
      {!feedback && <Button className="w-full" size="lg" disabled={submitting || !(question.type === 'opcion_multiple' ? selected : freeText.trim())} onClick={() => void submitAnswer()}>{submitting ? <><Loader2 className="size-4 animate-spin" />Preparando feedback…</> : <><Send className="size-4" />Enviar respuesta</>}</Button>}
      {feedback && <div className="space-y-3"><ChatBubble fallback={feedback.used_fallback}>{feedback.explanation}</ChatBubble><div className="flex flex-wrap gap-2"><Button onClick={nextQuestion}>Siguiente pregunta</Button><Button variant="outline" disabled={reexplaining} onClick={() => void reexplain()}>{reexplaining && <Loader2 className="size-4 animate-spin" />}Explícamelo de otra forma</Button></div></div>}
    </CardContent></Card> : dashboard.consentSigned ? <EmptyState title="Completaste las actividades disponibles" description="Puedes repasar el catálogo desde el inicio." action={<Button onClick={() => void loadDashboard()}>Repasar</Button>} /> : null}

    <div className="grid gap-6 md:grid-cols-2"><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Dominio por tema</CardTitle></CardHeader><CardContent className="space-y-4">{dashboard.masteryByTopic.map((item) => <MasteryBar key={item.topic} topic={item.topic} mastery={item.mastery} />)}</CardContent></Card><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Actividad reciente</CardTitle></CardHeader><CardContent><ActivityHeatmap days={dashboard.activity} /></CardContent></Card></div>
    {dashboard.history.length > 0 && <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Progreso</CardTitle></CardHeader><CardContent><TrendChart data={dashboard.history} /></CardContent></Card>}
  </main>;
}

function StudentSkeleton() {
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></main>;
}
