import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, RotateCcw, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '../components/shared/EmptyState';
import { LoopLoader, LoopMascot } from '../components/shared/LoopMascot';
import { AchievementsShowcase } from '../components/alumno/AchievementsShowcase';
import { AnalyticsShowcase } from '../components/alumno/AnalyticsShowcase';
import { ProgressFooter } from '../components/alumno/ProgressFooter';
import { AudioRecorder } from '../components/alumno/AudioRecorder';
import { SessionSetup, type SessionSetupValue } from '../components/alumno/SessionSetup';
import { DailyMissionsCard } from '../components/alumno/DailyMissionsCard';
import { LeaderboardCard } from '../components/alumno/LeaderboardCard';
import { Celebration } from '../components/alumno/Celebration';
import { Flame, Keyboard, Mic, Settings2, BrainCog } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { StudentDashboard } from '../lib/types';

interface Feedback {
  id: string;
  response_id: string;
  explanation: string;
  used_fallback: boolean;
  version: number;
}

type Phase = 'question' | 'sending' | 'processing' | 'feedback';
type LearnMode = 'practica' | 'evaluacion';

const MODE_STORAGE_KEY = 'loop.learnMode';
const SETUP_STORAGE_KEY = 'loop.sessionSetup';
const dashboardCache = new Map<string, StudentDashboard>();

function readStoredSetup(): SessionSetupValue | null {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionSetupValue>;
    if (!parsed?.topicId || !parsed?.topicLabel || !parsed?.questionPref) return null;
    return parsed as SessionSetupValue;
  } catch {
    return null;
  }
}

const DISPLAY_FONT = { fontFamily: '"Bebas Neue", sans-serif' } as const;

export function AlumnoView() {
  const { profile } = useAuth();
  const cacheKey = profile?.student_id ?? 'anonymous';
  const cachedDashboard = dashboardCache.get(cacheKey) ?? null;
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(cachedDashboard);
  const [loading, setLoading] = useState(!cachedDashboard);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [freeText, setFreeText] = useState('');
  const [openInput, setOpenInput] = useState<'text' | 'audio'>('text');
  const [audio, setAudio] = useState<{ blob: Blob; durationSec: number; dataUrl: string } | null>(null);
  const [phase, setPhase] = useState<Phase>('question');
  const [processingPct, setProcessingPct] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reexplaining, setReexplaining] = useState(false);
  const [linkCode, setLinkCode] = useState(() => localStorage.getItem('aprendo.studentLinkCode') ?? '');
  const [mode, setMode] = useState<LearnMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return stored === 'evaluacion' ? 'evaluacion' : 'practica';
  });
  // Métricas locales de la sesión de evaluación (sin micro-aprendizaje, contamos aciertos/total).
  const [evalStats, setEvalStats] = useState<{ answered: number; correct: number }>({ answered: 0, correct: 0 });
  const [setup, setSetup] = useState<SessionSetupValue | null>(() => readStoredSetup());
  const [showSetup, setShowSetup] = useState(false);
  const [missionCelebration, setMissionCelebration] = useState<string | null>(null);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean>(true);
  const sessionId = useRef(crypto.randomUUID());
  const activeResponseId = useRef<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const processingIvRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (setup) localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
  }, [setup]);

  // Si no hay setup almacenado y ya cargó el dashboard, abrir el panel automáticamente.
  useEffect(() => {
    if (!setup && dashboard?.consentSigned) setShowSetup(true);
  }, [setup, dashboard?.consentSigned]);

  const clearFeedbackPolling = useCallback(() => {
    if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    pollIntervalRef.current = null;
    pollTimeoutRef.current = null;
  }, []);

  const stopProcessing = useCallback(() => {
    if (processingIvRef.current) window.clearInterval(processingIvRef.current);
    processingIvRef.current = null;
  }, []);

  useEffect(() => {
    const nextCachedDashboard = dashboardCache.get(cacheKey) ?? null;
    setDashboard(nextCachedDashboard);
    setLoading(!nextCachedDashboard);
    setFeedback(null);
    setPhase('question');
    activeResponseId.current = null;
    clearFeedbackPolling();
    stopProcessing();
  }, [cacheKey, clearFeedbackPolling, stopProcessing]);

  const loadDashboard = useCallback(async () => {
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('get_student_dashboard', {
      p_topic: setup?.topicLabel ?? null,
      p_question_pref: setup?.questionPref ?? 'mix',
    });
    if (rpcError) throw rpcError;
    const next = data as StudentDashboard;
    dashboardCache.set(cacheKey, next);
    setDashboard(next);
    setLeaderboardOptIn(next.leaderboardOptIn);
  }, [cacheKey, setup?.questionPref, setup?.topicLabel]);

  useEffect(() => {
    let active = true;
    if (!dashboardCache.has(cacheKey)) setLoading(true);
    void loadDashboard()
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [cacheKey, loadDashboard]);

  useEffect(() => () => { clearFeedbackPolling(); stopProcessing(); }, [clearFeedbackPolling, stopProcessing]);

  useEffect(() => {
    if (!dashboard?.studentId) return;
    const channel = supabase.channel(`feedback-${dashboard.studentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedbacks', filter: `student_id=eq.${dashboard.studentId}` }, (payload) => {
        const next = payload.new as Feedback;
        if (!activeResponseId.current || next.response_id !== activeResponseId.current) return;
        clearFeedbackPolling();
        stopProcessing();
        setFeedback(next);
        setPhase('feedback');
        setProcessingPct(100);
        setReexplaining(false);
        if (mode === 'evaluacion') setEvalStats((s) => ({ ...s, answered: s.answered + 1 }));
        void loadDashboard();
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [dashboard?.studentId, loadDashboard, clearFeedbackPolling, stopProcessing, mode]);

  async function pollFeedback(responseId: string): Promise<boolean> {
    const { data } = await supabase.from('feedbacks').select('id,response_id,explanation,used_fallback,version')
      .eq('response_id', responseId).order('version', { ascending: false }).limit(1).maybeSingle();
    if (data) {
      clearFeedbackPolling();
      stopProcessing();
      setFeedback(data as Feedback);
      setPhase('feedback');
      setProcessingPct(100);
      setReexplaining(false);
      if (mode === 'evaluacion') setEvalStats((s) => ({ ...s, answered: s.answered + 1 }));
      await loadDashboard();
      return true;
    }
    return false;
  }

  function startFeedbackPolling(responseId: string, timeoutMs = 30_000) {
    clearFeedbackPolling();
    void pollFeedback(responseId);
    pollIntervalRef.current = window.setInterval(() => { void pollFeedback(responseId); }, 1_200);
    pollTimeoutRef.current = window.setTimeout(() => {
      clearFeedbackPolling();
      stopProcessing();
      if (activeResponseId.current === responseId) {
        setPhase('question');
        setReexplaining(false);
        toast.error('El feedback está tardando más de lo esperado. Inténtalo de nuevo en unos segundos.');
      }
    }, timeoutMs);
  }

  function startProcessingTicker() {
    stopProcessing();
    const t0 = Date.now();
    const dur = 5000;
    processingIvRef.current = window.setInterval(() => {
      const elapsed = Date.now() - t0;
      setProcessingPct(Math.min(92, (elapsed / dur) * 100));
    }, 120);
  }

  async function submitAnswer() {
    const question = dashboard?.currentQuestion;
    if (!question) return;
    let answer: string;
    if (question.type === 'opcion_multiple') {
      answer = selected;
    } else if (openInput === 'audio') {
      if (!audio) return;
      answer = `[audio:${Math.round(audio.durationSec)}s] ${audio.dataUrl.slice(0, 64)}…`;
    } else {
      answer = freeText;
    }
    if (!answer.trim()) return;
    setPhase('sending');
    setFeedback(null);
    const { data, error: invokeError } = await supabase.functions.invoke('ingest-response', {
      body: { question_id: question.id, session_id: sessionId.current, raw_answer: answer },
    });
    if (invokeError || data?.status !== 'accepted') {
      setPhase('question');
      toast.error(data?.error_code === 'CONSENT_REQUIRED' ? 'Tu tutor debe dar consentimiento antes de responder.' : data?.error_code ?? invokeError?.message ?? 'No se pudo enviar');
      return;
    }
    activeResponseId.current = data.response_id;
    setPhase('processing');
    setProcessingPct(0);
    startProcessingTicker();
    startFeedbackPolling(data.response_id);
  }

  async function reexplain() {
    if (!feedback) return;
    activeResponseId.current = feedback.response_id;
    setReexplaining(true);
    setPhase('processing');
    setProcessingPct(0);
    startProcessingTicker();
    const { data, error: invokeError } = await supabase.functions.invoke('reexplain-response', { body: { response_id: feedback.response_id } });
    if (invokeError || data?.status !== 'accepted') {
      setReexplaining(false);
      setPhase('feedback');
      stopProcessing();
      toast.error(data?.error_code ?? 'No se pudo generar otra explicación');
      return;
    }
    startFeedbackPolling(feedback.response_id, 15_000);
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
    setAudio(null);
    setFeedback(null);
    setPhase('question');
    setProcessingPct(0);
    activeResponseId.current = null;
    clearFeedbackPolling();
    stopProcessing();
    void loadDashboard();
  }

  const overall = useMemo(() => {
    if (!dashboard?.masteryByTopic.length) return 0;
    return Math.round(dashboard.masteryByTopic.reduce((sum, item) => sum + item.mastery, 0) / dashboard.masteryByTopic.length);
  }, [dashboard]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <LoopLoader message="Calentando motores" />
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto max-w-md p-6">
        <EmptyState
          illustration={<LoopMascot mood="sad" size={64} capsule={false} />}
          title="Loop tropezó con un cable"
          description={error}
          action={<Button onClick={() => window.location.reload()}><RefreshCw className="size-4" />Reintentar</Button>}
        />
      </main>
    );
  }
  if (!dashboard) return null;
  const question = dashboard.currentQuestion;
  const dominioColor = overall >= 70 ? '#9CFF0F' : overall >= 40 ? '#4D34B6' : '#56358C';
  const dominioBg = overall >= 70
    ? 'linear-gradient(90deg,#4D34B6,#9CFF0F)'
    : overall >= 40
    ? 'linear-gradient(90deg,#38123B,#4D34B6)'
    : '#38123B';
  const dominioLabel = overall >= 80 ? '¡Dominado!' : overall >= 60 ? 'Progresando' : overall >= 30 ? 'En desarrollo' : 'Iniciando';

  const canSend = question?.type === 'opcion_multiple'
    ? selected !== ''
    : openInput === 'audio'
      ? audio !== null
      : freeText.trim().length > 0;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-5 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="mx-auto flex w-full max-w-[560px] flex-col gap-4 lg:mx-0 lg:max-w-none">

        {/* HEADER */}
        <div className="flex items-center gap-3 py-1">
          <LoopMascot size={42} mood={phase === 'processing' ? 'thinking' : phase === 'feedback' ? 'happy' : 'idle'} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CFF0F]">
              {dashboard.streakDays > 0 ? `¡Racha viva, ${dashboard.studentName.split(' ')[0]}!` : `A ensuciarse las manos, ${dashboard.studentName.split(' ')[0]}`}
            </div>
            <div className="truncate text-[21px] leading-tight text-white" style={DISPLAY_FONT}>
              {(setup?.topicLabel ?? question?.topic ?? 'tu progreso').toUpperCase()}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/alumno/perfil"
              className="flex items-center gap-1 rounded-full border border-[#ff8a4d]/40 bg-black/60 px-2 py-1 transition hover:border-[#ff8a4d]"
              title={`${dashboard.streakDays} días seguidos · abrir perfil`}
              aria-label="Abrir mi perfil"
            >
              <Flame className="size-3.5 text-[#ff8a4d]" />
              <span className="text-xs font-bold tabular-nums text-white">{dashboard.streakDays}</span>
            </Link>
            <div className="text-right">
              <div className="leading-none text-[34px]" style={{ ...DISPLAY_FONT, color: dominioColor }}>{overall}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">DOMINIO</div>
            </div>
          </div>
        </div>

        {/* SETUP PILL */}
        {setup && (
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#56358C] bg-black/40 px-3 py-2 text-left transition hover:border-[#9CFF0F]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <BrainCog className="size-4 shrink-0 text-[#9CFF0F]" />
              <div className="min-w-0 flex-1 truncate">
                <div className="text-[9px] uppercase tracking-[0.22em] text-white/40">
                  {setup.courseLabel} <span className="text-white/25">/</span> {setup.unitLabel}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold text-white">{setup.topicLabel}</span>
                  <span className="shrink-0 rounded-full bg-[#38123B] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9CFF0F]">
                    {setup.questionPref === 'multiple' ? 'Múltiple' : setup.questionPref === 'open' ? 'Abierta' : 'Mixto'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
              <Settings2 className="size-3.5" /> Cambiar
            </div>
          </button>
        )}

        {/* MODE SWITCHER · Práctica ↔ Evaluación */}
        <div
          role="tablist"
          aria-label="Modo de sesión"
          className="relative grid grid-cols-2 rounded-full border border-[#56358C] bg-black/60 p-1"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300"
            style={{
              transform: mode === 'practica' ? 'translateX(4px)' : 'translateX(calc(100% + 4px))',
              background: mode === 'practica'
                ? 'linear-gradient(135deg,#162E84,#4D34B6)'
                : 'linear-gradient(135deg,#38123B,#9CFF0F33)',
              boxShadow: mode === 'evaluacion' ? '0 0 14px rgba(156,255,15,0.35)' : 'none',
              border: mode === 'evaluacion' ? '1px solid #9CFF0F' : '1px solid #56358C',
            }}
          />
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'practica'}
            onClick={() => setMode('practica')}
            disabled={phase !== 'question' && phase !== 'feedback'}
            className="relative z-10 rounded-full py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] transition-colors"
            style={{ color: mode === 'practica' ? '#fff' : 'rgba(255,255,255,0.45)' }}
          >
            Práctica
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'evaluacion'}
            onClick={() => setMode('evaluacion')}
            disabled={phase !== 'question' && phase !== 'feedback'}
            className="relative z-10 rounded-full py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] transition-colors"
            style={{ color: mode === 'evaluacion' ? '#9CFF0F' : 'rgba(255,255,255,0.45)' }}
          >
            Evaluación
          </button>
        </div>
        <p className="-mt-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
          {mode === 'practica'
            ? 'Loop te corrige al vuelo. Falla bonito, aprende rápido.'
            : `Modo arena · ${evalStats.answered} disparos · sin pistas`}
        </p>

        {/* DOMAIN BAR */}
        <div>
          <div className="h-[7px] overflow-hidden rounded-full border border-[#56358C]/30 bg-[#111]">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: `${overall}%`, background: dominioBg, boxShadow: overall >= 70 ? '0 0 6px #9CFF0F55' : 'none' }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="text-[11px] font-bold" style={{ color: dominioColor }}>{dominioLabel}</div>
            <div className="text-[10px] text-white/25">nivel de dominio</div>
          </div>
        </div>

        {/* CONSENT NOTICE */}
        {!dashboard.consentSigned && (
          <Card className="rounded-2xl border border-[#56358C] bg-[#38123B]">
            <CardHeader>
              <CardTitle className="text-base text-white">Falta el consentimiento de tu tutor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/70">Comparte este código con tu padre o tutor. Caduca a los 7 días y se usa una sola vez.</p>
              {linkCode && (
                <div className="flex items-center gap-2">
                  <code className="rounded-lg bg-black px-4 py-2 text-lg font-bold tracking-widest text-[#9CFF0F]">{linkCode}</code>
                  <Share2 className="size-4 text-white/50" />
                </div>
              )}
              <Button variant="outline" onClick={() => void rotateLinkCode()} className="border-[#56358C] text-white">
                <RotateCcw className="size-4" />{linkCode ? 'Renovar código' : 'Generar código'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* QUESTION CARD */}
        {dashboard.consentSigned && question && (
          <>
            <div className="rounded-2xl border border-[#56358C] bg-[#162E84] p-5">
              <div className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
                Reto en curso · nivel {question.difficultyLevel} · {question.type === 'opcion_multiple' ? 'francotirador' : 'explicador'}
              </div>
              <div className="text-[15px] font-semibold leading-[1.55] text-white">
                {question.text}
              </div>
            </div>

            {phase === 'question' && (
              <>
                {question.type === 'opcion_multiple' ? (
                  <div className="flex flex-col gap-2">
                    {(question.options ?? []).map((option) => {
                      const sel = selected === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelected(option)}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-colors"
                          style={{
                            background: sel ? '#1a3a6e' : '#0d1835',
                            borderColor: sel ? '#9CFF0F' : '#56358C',
                          }}
                        >
                          <span
                            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2"
                            style={{
                              borderColor: sel ? '#9CFF0F' : '#56358C',
                              background: sel ? '#162E84' : 'transparent',
                            }}
                          >
                            {sel && <span className="size-2 rounded-full bg-[#9CFF0F]" />}
                          </span>
                          <span className="flex-1 text-sm leading-[1.45]" style={{ color: sel ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div
                      role="tablist"
                      aria-label="Tipo de respuesta"
                      className="grid grid-cols-2 gap-1 rounded-full border border-[#56358C] bg-black/60 p-1"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={openInput === 'text'}
                        onClick={() => setOpenInput('text')}
                        className="flex items-center justify-center gap-2 rounded-full py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors"
                        style={{
                          background: openInput === 'text' ? 'linear-gradient(135deg,#162E84,#4D34B6)' : 'transparent',
                          color: openInput === 'text' ? '#fff' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        <Keyboard className="size-3.5" /> Texto
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={openInput === 'audio'}
                        onClick={() => setOpenInput('audio')}
                        className="flex items-center justify-center gap-2 rounded-full py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors"
                        style={{
                          background: openInput === 'audio' ? 'linear-gradient(135deg,#38123B,#9CFF0F33)' : 'transparent',
                          color: openInput === 'audio' ? '#9CFF0F' : 'rgba(255,255,255,0.5)',
                          border: openInput === 'audio' ? '1px solid #9CFF0F' : '1px solid transparent',
                        }}
                      >
                        <Mic className="size-3.5" /> Audio
                      </button>
                    </div>

                    {openInput === 'text' ? (
                      <div className="overflow-hidden rounded-xl border-[1.5px] border-[#56358C] bg-[#0c0c0c]">
                        <textarea
                          value={freeText}
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFreeText(event.target.value)}
                          placeholder="Escribe tu respuesta aquí…"
                          className="block min-h-[140px] w-full resize-none bg-transparent p-3.5 text-[15px] leading-[1.6] text-white outline-none"
                        />
                        <div className="flex justify-between border-t border-[#56358C]/20 px-3.5 py-1.5">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                            Texto plano
                          </span>
                          <span className="text-[11px] text-[#56358C]">{freeText.length} car.</span>
                        </div>
                      </div>
                    ) : (
                      <AudioRecorder onChange={setAudio} disabled={phase !== 'question'} />
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void submitAnswer()}
                  disabled={!canSend}
                  className={`rounded-xl px-4 py-4 text-center text-[22px] tracking-[0.18em] transition ${canSend ? 'loop-neon-pulse' : ''}`}
                  style={{
                    ...DISPLAY_FONT,
                    background: canSend ? '#9CFF0F' : '#191919',
                    color: canSend ? '#000' : 'rgba(255,255,255,0.2)',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                  }}
                >
                  {openInput === 'audio' && question.type === 'texto_libre' ? 'LANZAR AUDIO →' : 'DAR EL GOLPE →'}
                </button>
              </>
            )}

            {phase === 'sending' && (
              <div className="loop-fade-up flex items-center gap-3.5 rounded-2xl border border-[#56358C] bg-[#162E84] p-4">
                <LoopMascot size={42} mood="thinking" capsule={false} />
                <div>
                  <div className="text-sm font-semibold text-white">Lanzando respuesta al ring…</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="size-[7px] rounded-full bg-[#9CFF0F]" style={{ animation: 'loop-dot-blink 1.3s ease infinite 0s' }} />
                    <span className="size-[7px] rounded-full bg-[#9CFF0F]" style={{ animation: 'loop-dot-blink 1.3s ease infinite 0.22s' }} />
                    <span className="size-[7px] rounded-full bg-[#9CFF0F]" style={{ animation: 'loop-dot-blink 1.3s ease infinite 0.44s' }} />
                  </div>
                </div>
              </div>
            )}

            {phase === 'processing' && (
              <div className="loop-fade-up rounded-2xl border border-[#56358C] bg-[#38123B] p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <LoopMascot size={36} mood="thinking" capsule={false} />
                  <div>
                    <div className="text-sm font-bold text-white">Loop está pensando fuerte…</div>
                    <div className="mt-0.5 text-xs text-white/65">Aguanta unos segundos, esto vale XP.</div>
                  </div>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full transition-[width] duration-200 ease-linear"
                    style={{
                      width: `${Math.round(processingPct)}%`,
                      background: 'linear-gradient(90deg, #4D34B6, #9CFF0F)',
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="text-[11px] text-white/35">Procesando inteligencia adaptativa</div>
                  <div className="text-[11px] font-bold text-[#9CFF0F]">{Math.round(processingPct)}%</div>
                </div>
              </div>
            )}

            {phase === 'feedback' && feedback && mode === 'practica' && (
              <div className="loop-fade-up flex flex-col gap-2.5">
                <div className="rounded-[16px_16px_16px_4px] border border-[#56358C] bg-[#38123B] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <LoopMascot size={28} mood="happy" />
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9CFF0F]">
                      Loop · Coach al instante
                    </div>
                  </div>
                  <div className="text-sm leading-[1.65] text-white/90">{feedback.explanation}</div>
                  {feedback.used_fallback && (
                    <div className="mt-2 text-[11px] uppercase tracking-wider text-white/40">Explicación de respaldo</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="rounded-xl border-[1.5px] border-[#9CFF0F] bg-[#162E84] px-4 py-3 text-center text-[20px] tracking-[0.16em] text-[#9CFF0F] transition hover:bg-[#1e3a9c]"
                  style={DISPLAY_FONT}
                >
                  SIGUIENTE RONDA →
                </button>
                <button
                  type="button"
                  onClick={() => void reexplain()}
                  disabled={reexplaining}
                  className="rounded-xl border border-[#56358C] bg-transparent px-4 py-2.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/75 transition hover:bg-[#38123B]/40 disabled:opacity-50"
                >
                  {reexplaining ? 'Buscando otro ángulo…' : 'Dímelo de otra forma'}
                </button>
              </div>
            )}

            {phase === 'feedback' && mode === 'evaluacion' && (
              <div className="loop-fade-up flex flex-col gap-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-[#9CFF0F]/40 bg-black/60 px-4 py-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#9CFF0F] text-black">✓</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">Tiro contabilizado</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Sin spoilers · estás en evaluación
                    </div>
                  </div>
                  <div className="text-right" style={DISPLAY_FONT}>
                    <div className="text-2xl leading-none text-[#9CFF0F]">{evalStats.answered}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-white/35">enviadas</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="loop-neon-pulse rounded-xl bg-[#9CFF0F] px-4 py-3 text-center text-[20px] tracking-[0.18em] text-black"
                  style={DISPLAY_FONT}
                >
                  SIGUIENTE RONDA →
                </button>
              </div>
            )}
          </>
        )}

        {dashboard.consentSigned && !question && (
          <EmptyState
            illustration={<LoopMascot mood="happy" size={64} capsule={false} />}
            title="¡Run completo!"
            description="Te zampaste todos los retos disponibles. ¿Otra vuelta para afinar la racha?"
            action={<Button onClick={() => void loadDashboard()}>Otra ronda</Button>}
          />
        )}

        {/* NEXT STEP */}
        <div
          className="flex items-center gap-3 rounded-xl border bg-[#0d0d0d] px-4 py-3.5"
          style={{ borderColor: overall >= 70 ? 'rgba(156,255,15,0.27)' : '#56358C' }}
        >
          <div className="text-xl shrink-0">{overall >= 70 ? '⚡' : '🔁'}</div>
          <div className="flex-1">
            <div
              className="mb-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em]"
              style={{ color: overall >= 70 ? '#9CFF0F' : '#4D34B6' }}
            >
              {overall >= 70 ? '¡Boss vencido!' : 'Plan de combate'}
            </div>
            <div className="text-xs leading-[1.4] text-white/65">
              {overall >= 70
                ? 'Loop te abre el siguiente tema. ¿Listo para subir de nivel?'
                : 'Una o dos preguntas más y este tema cae. No bajes la guardia.'}
            </div>
          </div>
        </div>

        </section>

        {/* SIDE RAIL — desktop side panel, mobile stacks below.
            XP/streak moved to a sticky footer (ProgressFooter) so it stays visible
            without scrolling. Side rail keeps: missions → leaderboard → colapsables. */}
        <aside className="flex flex-col gap-2.5 lg:sticky lg:top-20 lg:self-start">
          <DailyMissionsCard
            daily={dashboard.missions.daily}
            weekly={dashboard.missions.weekly}
            onClaimed={(mission) => {
              setMissionCelebration(mission.title);
              void loadDashboard();
            }}
          />

          <LeaderboardCard
            studentId={dashboard.studentId}
            optIn={leaderboardOptIn}
            onOptInChange={setLeaderboardOptIn}
          />

          <AchievementsShowcase
            earned={dashboard.achievements.earned}
            locked={dashboard.achievements.locked}
          />

          <AnalyticsShowcase
            masteryByTopic={dashboard.masteryByTopic}
            activity={dashboard.activity}
            history={dashboard.history}
          />

          <div className="pt-1 text-center text-[10px] uppercase tracking-[0.32em] text-white/25">
            {dashboard.answeredCount} respuestas registradas
          </div>
        </aside>
      </div>

      {showSetup && (
        <SessionSetup
          mastery={dashboard.masteryByTopic}
          initial={setup}
          required={!setup}
          onClose={() => setShowSetup(false)}
          onComplete={(value) => {
            setSetup(value);
            setShowSetup(false);
            setEvalStats({ answered: 0, correct: 0 });
            setSelected('');
            setFreeText('');
            setAudio(null);
            setFeedback(null);
            setPhase('question');
            activeResponseId.current = null;
            clearFeedbackPolling();
            stopProcessing();
          }}
        />
      )}

      <Celebration
        trigger={missionCelebration ? `¡Misión completada! ${missionCelebration}` : null}
        onDone={() => setMissionCelebration(null)}
      />

      <ProgressFooter
        xp={dashboard.xp}
        streakDays={dashboard.streakDays}
        recentXp={dashboard.achievements.recent_xp}
        studentName={dashboard.studentName}
        onOpenSetup={() => setShowSetup(true)}
      />
    </main>
  );
}
