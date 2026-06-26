import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Send,
  ArrowRight,
  Loader2,
  RefreshCw,
  RotateCcw,
  Rabbit,
  Turtle } from
'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { Label } from '../components/ui/Label';
import { Skeleton } from '../components/ui/Skeleton';
import { ProgressRing } from '../components/shared/ProgressRing';
import { MasteryBar } from '../components/shared/MasteryBar';
import { ChatBubble } from '../components/shared/ChatBubble';
import { EmptyState } from '../components/shared/EmptyState';
import { ActivityHeatmap } from '../components/shared/ActivityHeatmap';
import { AccessibilityControls } from '../components/shared/AccessibilityControls';
import { MisTemas } from '../components/alumno/MisTemas';
import { SessionSummaryCard } from '../components/alumno/SessionSummaryCard';
import { GamificationPanel } from '../components/alumno/GamificationPanel';
import { Celebration } from '../components/alumno/Celebration';
import { masteryLevel } from '../lib/mastery';
import {
  MOCK_ALUMNO,
  MOCK_FEEDBACK,
  MOCK_MASTERY_AFTER_ANSWER,
  MOCK_SESSION_SUMMARY,
  MOCK_HEATMAP,
  type AlumnoViewData,
  type FeedbackMessage } from
'../data/mock';
type LoadState = 'loading' | 'error' | 'empty' | 'ready';
type AnswerState = 'idle' | 'submitting' | 'answered';
type Pace = 'rapido' | 'normal' | 'repaso';
const ALT_EXPLANATION =
'Te lo cuento de otra manera 👇 Pensá en porciones de pizza: 3/4 son tres porciones de cuatro, ' +
'y 1/2 es como cortar otra pizza igual en cuatro y tomar dos porciones (2/4). Juntás 3 + 2 = 5 porciones ' +
'de tamaño 1/4, o sea 5/4. ¡Listo!';
export function AlumnoView() {
  // TODO: reemplazar por datos reales (Supabase Realtime, solo lectura).
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [data, setData] = useState<AlumnoViewData | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selected, setSelected] = useState('');
  const [freeText, setFreeText] = useState('');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [mastery, setMastery] = useState<
    {
      topic: string;
      mastery: number;
    }[]>(
    []);
  const [reexplaining, setReexplaining] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [pace, setPace] = useState<Pace>('normal');
  const [celebration, setCelebration] = useState<string | null>(null);
  const masteryRef = useRef<
    {
      topic: string;
      mastery: number;
    }[]>(
    []);
  useEffect(() => {
    setLoadState('loading');
    const t = setTimeout(() => {
      setData(MOCK_ALUMNO);
      setMastery(MOCK_ALUMNO.masteryByTopic);
      masteryRef.current = MOCK_ALUMNO.masteryByTopic;
      setLoadState(MOCK_ALUMNO.currentQuestion ? 'ready' : 'empty');
    }, 900);
    return () => clearTimeout(t);
  }, []);
  const question = data?.currentQuestion;
  const canSubmit =
  answerState === 'idle' && (
  question?.type === 'opcion_multiple' ?
  selected.length > 0 :
  freeText.trim().length > 0);
  function applyNewMastery(
  next: {
    topic: string;
    mastery: number;
  }[])
  {
    const crossed = next.find((n) => {
      const prev = masteryRef.current.find((p) => p.topic === n.topic);
      return (
        prev &&
        masteryLevel(prev.mastery) !== 'high' &&
        masteryLevel(n.mastery) === 'high');

    });
    setMastery(next);
    masteryRef.current = next;
    if (crossed) setCelebration(`¡Dominaste ${crossed.topic}! 🎉`);
  }
  function handleSubmit() {
    if (!canSubmit) return;
    setAnswerState('submitting');
    // TODO: reemplazar por envío real + feedback del orquestador.
    setTimeout(() => {
      setFeedback(MOCK_FEEDBACK);
      applyNewMastery(MOCK_MASTERY_AFTER_ANSWER);
      setAnswerState('answered');
      setAnsweredCount((c) => c + 1);
    }, 1600);
  }
  // "No entendí, explícamelo de otra forma" → reusa el estado de carga del feedback.
  function handleReexplain() {
    setReexplaining(true);
    setFeedback(null);
    // TODO: reemplazar por nueva explicación real del orquestador.
    setTimeout(() => {
      setFeedback({
        ...MOCK_FEEDBACK,
        id: 'fb-alt',
        explanation: ALT_EXPLANATION
      });
      setReexplaining(false);
    }, 1500);
  }
  function handleNext() {
    setSelected('');
    setFreeText('');
    setFeedback(null);
    setAnswerState('idle');
    if (answeredCount % 3 === 0 && answeredCount > 0) setShowSummary(true);
  }
  function handlePractice() {
    setShowSummary(false);
    handleNext();
    document.getElementById('pregunta-actual')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
  const overall = mastery.length ?
  Math.round(mastery.reduce((s, m) => s + m.mastery, 0) / mastery.length) :
  0;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <Celebration trigger={celebration} onDone={() => setCelebration(null)} />

      {/* Header */}
      <section className="mb-6">
        {loadState === 'loading' ?
        <div className="flex items-center gap-4">
            <Skeleton className="size-[72px] rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div> :

        <div className="flex flex-wrap items-center gap-4">
            <ProgressRing
            value={overall}
            label={`Progreso general ${overall} por ciento`} />
          
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                ¡Hola, {data?.studentName}! 👋
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>Vas por buen camino, ¡sigue así!</span>
                {!!data?.streakDays &&
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    <Flame className="size-3.5" aria-hidden="true" />
                    {data.streakDays} días seguidos
                  </span>
              }
              </div>
            </div>
            <AccessibilityControls />
          </div>
        }
      </section>

      {loadState === 'error' &&
      <EmptyState
        title="No pudimos cargar tu actividad"
        description="Esto suele resolverse solo. Volvé a intentarlo en un momento."
        action={
        <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" /> Reintentar
            </Button>
        } />

      }

      {loadState === 'empty' &&
      <EmptyState
        illustration={<CalmIllustration />}
        title="Tu instructor todavía no asignó actividades"
        description="En cuanto haya algo para practicar, aparecerá aquí. ¡Volvé pronto!" />

      }

      {loadState === 'loading' &&
      <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2 pt-2">
              {[0, 1, 2, 3].map((i) =>
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
            )}
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      }

      {loadState === 'ready' && question &&
      <div className="space-y-6">
          <AnimatePresence>
            {showSummary &&
          <SessionSummaryCard
            summary={{
              ...MOCK_SESSION_SUMMARY,
              questionsAnswered: answeredCount
            }}
            onContinue={() => setShowSummary(false)}
            onFinish={() => setShowSummary(false)} />

          }
          </AnimatePresence>

          {!showSummary &&
        <>
              <Card id="pregunta-actual" className="rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">
                      Pregunta actual
                    </span>
                    <PaceSelector pace={pace} onChange={setPace} />
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    {question.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {question.type === 'opcion_multiple' ?
              <RadioGroup
                value={selected}
                onValueChange={setSelected}
                disabled={answerState !== 'idle'}
                className="gap-2.5">
                
                      {question.options?.map((opt, i) => {
                  const id = `opt-${i}`;
                  const active = selected === opt;
                  return (
                    <Label
                      key={id}
                      htmlFor={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-accent'} ${answerState !== 'idle' ? 'opacity-70' : ''}`}>
                      
                            <RadioGroupItem id={id} value={opt} />
                            <span className="font-medium text-foreground">
                              {opt}
                            </span>
                          </Label>);

                })}
                    </RadioGroup> :

              <Textarea
                placeholder="Escribí tu respuesta aquí…"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                disabled={answerState !== 'idle'}
                rows={4} />

              }

                  <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
                aria-busy={answerState === 'submitting'}>
                
                    {answerState === 'submitting' ?
                <>
                        <Loader2 className="size-4 animate-spin" /> Enviando…
                      </> :

                <>
                        <Send className="size-4" /> Enviar respuesta
                      </>
                }
                  </Button>
                </CardContent>
              </Card>

              <AnimatePresence mode="wait">
                {(answerState === 'submitting' || reexplaining) &&
            <motion.div
              key="fb-loading"
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              exit={{
                opacity: 0
              }}>
              
                    <div className="flex items-start gap-3">
                      <Skeleton className="size-9 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {reexplaining ?
                    'Buscando otra forma de explicarlo…' :
                    'Preparando tu feedback…'}
                        </p>
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <Skeleton className="h-4 w-5/6 rounded-lg" />
                        <Skeleton className="h-4 w-2/3 rounded-lg" />
                      </div>
                    </div>
                  </motion.div>
            }

                {answerState === 'answered' && feedback && !reexplaining &&
            <motion.div key={feedback.id} className="space-y-3">
                    <ChatBubble fallback={feedback.usedFallback}>
                      {feedback.explanation}
                    </ChatBubble>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                  variant="ghost"
                  size="sm"
                  className="sm:flex-1"
                  onClick={handleReexplain}>
                  
                        <RotateCcw className="size-4" /> No entendí, explícamelo
                        de otra forma
                      </Button>
                      <Button
                  variant="outline"
                  size="sm"
                  className="sm:flex-1"
                  onClick={handleNext}>
                  
                        Siguiente pregunta <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
            }
              </AnimatePresence>
            </>
        }

          {/* Dominio por tema */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tu dominio por tema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {mastery.map((m) =>
            <MasteryBar key={m.topic} topic={m.topic} mastery={m.mastery} />
            )}
            </CardContent>
          </Card>

          <MisTemas onPractice={handlePractice} />

          <GamificationPanel streakDays={data?.streakDays ?? 0} />

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Tu actividad de los últimos 30 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap days={MOCK_HEATMAP} />
            </CardContent>
          </Card>
        </div>
      }
    </main>);

}
function PaceSelector({
  pace,
  onChange



}: {pace: Pace;onChange: (p: Pace) => void;}) {
  const opts: {
    value: Pace;
    label: string;
    icon: React.ElementType;
  }[] = [
  {
    value: 'repaso',
    label: 'Repasar más',
    icon: Turtle
  },
  {
    value: 'normal',
    label: 'Normal',
    icon: ArrowRight
  },
  {
    value: 'rapido',
    label: 'Más rápido',
    icon: Rabbit
  }];

  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-muted p-0.5"
      role="group"
      aria-label="Ritmo de práctica">
      
      {opts.map(({ value, label, icon: Icon }) =>
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        aria-pressed={pace === value}
        title={label}
        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pace === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
        
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      )}
    </div>);

}
function CalmIllustration() {
  return (
    <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M18 26c2 2.5 10 2.5 12 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round" />
      
      <circle cx="19" cy="20" r="1.6" fill="currentColor" />
      <circle cx="29" cy="20" r="1.6" fill="currentColor" />
    </svg>);

}