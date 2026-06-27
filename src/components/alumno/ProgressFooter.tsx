import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Zap, X, TrendingUp, Settings2 } from 'lucide-react';
import type { RecentXpEvent, StudentDashboard } from '../../lib/types';

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;

interface ProgressFooterProps {
  xp: StudentDashboard['xp'];
  streakDays: number;
  recentXp: RecentXpEvent[];
  studentName: string;
  onOpenSetup?: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  correct_answer: 'Respuesta correcta',
  audio_answer: 'Audio',
  mission_reward: 'Misión reclamada',
  achievement_reward: 'Insignia desbloqueada',
  streak_bonus: 'Bonus de racha',
  daily_login: 'Inicio de sesión',
  topic_touch: 'Tema tocado',
};

const SOURCE_TONE: Record<string, string> = {
  correct_answer: '#9CFF0F',
  audio_answer: '#ff8a4d',
  mission_reward: '#4D34B6',
  achievement_reward: '#9CFF0F',
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'ahora';
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
  return `hace ${Math.floor(diffSec / 86400)} d`;
}

export function ProgressFooter({
  xp,
  streakDays,
  recentXp,
  studentName,
  onOpenSetup,
}: ProgressFooterProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isMaxLevel = xp.progressPct >= 100 && xp.nextLevelXp <= xp.currentLevelXp;
  const remaining = Math.max(0, xp.nextLevelXp - xp.total);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const firstName = studentName.split(' ')[0] ?? 'Loopper';

  return (
    <>
      {/* Spacer so the page content never hides behind the fixed footer. */}
      <div aria-hidden="true" className="h-16 sm:h-14" />

      {open && (
        <button
          type="button"
          aria-label="Cerrar detalle de progreso"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-black/40 backdrop-blur-[2px]"
        />
      )}

      <div
        ref={wrapperRef}
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="relative border-t border-[#56358C]/70 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md"
          style={{
            background:
              'linear-gradient(180deg, rgba(13,13,13,0.92) 0%, rgba(8,8,15,0.97) 100%)',
          }}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute bottom-full left-1/2 mb-2 w-[min(420px,calc(100vw-1.5rem))] -translate-x-1/2 px-3"
              >
                <div className="rounded-2xl border border-[#56358C] bg-[#0d0d0d]/96 p-4 shadow-2xl backdrop-blur">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
                        Tu progreso
                      </p>
                      <p
                        className="text-[18px] leading-none tracking-[0.04em] text-white"
                        style={DISPLAY}
                      >
                        {firstName.toUpperCase()}, NIV {xp.level}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Cerrar"
                      className="flex size-7 items-center justify-center rounded-full border border-[#56358C] text-white/65 transition hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#56358C]/60 bg-black/40 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
                      <span className="text-white/55">
                        {isMaxLevel ? 'Nivel máximo' : `A nivel ${xp.level + 1}`}
                      </span>
                      <span className="font-mono tabular-nums text-[#9CFF0F]">
                        {isMaxLevel ? 'MAX' : `${xp.progressPct}%`}
                      </span>
                    </div>
                    <div className="h-[5px] overflow-hidden rounded-full bg-black/60">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${xp.progressPct}%`,
                          background: 'linear-gradient(90deg,#4D34B6,#9CFF0F)',
                          boxShadow: '0 0 8px rgba(156,255,15,0.55)',
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] tabular-nums text-white/55">
                      <span>
                        {xp.total} / {xp.nextLevelXp} XP
                      </span>
                      {!isMaxLevel && <span className="text-[#9CFF0F]">+{remaining} para subir</span>}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.22em] text-white/45">
                      <TrendingUp className="size-3" /> Últimos eventos
                    </p>
                    {recentXp.length === 0 ? (
                      <p className="text-[11px] text-white/40">
                        Sin eventos todavía. Responde una pregunta para empezar.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {recentXp.slice(0, 5).map((event, idx) => {
                          const tone = SOURCE_TONE[event.source] ?? '#9CFF0F';
                          return (
                            <li
                              key={`${event.source}-${event.created_at}-${idx}`}
                              className="flex items-center gap-2 text-[11px]"
                            >
                              <span
                                className="inline-block size-1.5 shrink-0 rounded-full"
                                style={{ background: tone }}
                              />
                              <span className="min-w-0 flex-1 truncate text-white/75">
                                +{event.amount} {SOURCE_LABEL[event.source] ?? event.source}
                              </span>
                              <span className="shrink-0 text-[10px] text-white/40">
                                {relativeTime(event.created_at)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {onOpenSetup && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onOpenSetup();
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#56358C] bg-black/40 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70 transition hover:border-[#9CFF0F] hover:text-white"
                    >
                      <Settings2 className="size-3.5" /> Cambiar tema
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6">
            <div
              className="flex shrink-0 items-center gap-1.5"
              title={`${streakDays} día(s) en racha`}
            >
              <Flame className="size-4 text-[#ff8a4d]" aria-hidden="true" />
              <span
                className="text-xl leading-none tabular-nums text-white sm:text-2xl"
                style={DISPLAY}
              >
                {streakDays}
              </span>
            </div>

            <div aria-hidden="true" className="h-5 w-px shrink-0 bg-[#56358C]/70" />

            <div
              className="flex shrink-0 items-center gap-1.5"
              title={`Nivel ${xp.level} · ${xp.total} XP`}
            >
              <Zap className="size-4 text-[#9CFF0F]" aria-hidden="true" />
              <span
                className="text-xl leading-none tabular-nums text-white sm:text-2xl"
                style={DISPLAY}
              >
                NIV {xp.level}
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-white/40 sm:inline tabular-nums">
                · {xp.total} XP
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-label="Ver detalle de progreso"
              className="group relative ml-auto flex h-8 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full border border-[#56358C] bg-black/40 px-2.5 transition hover:border-[#9CFF0F]/60"
            >
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${xp.progressPct}%`,
                    background: 'linear-gradient(90deg,#4D34B6,#9CFF0F)',
                    boxShadow: '0 0 6px rgba(156,255,15,0.4)',
                  }}
                />
              </div>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-[#9CFF0F]">
                {isMaxLevel ? 'MAX' : `${xp.progressPct}%`}
              </span>
              {open && (
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#4D34B6]/20 to-[#9CFF0F]/20" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
