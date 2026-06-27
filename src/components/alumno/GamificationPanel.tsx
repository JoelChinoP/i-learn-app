import { Flame, Zap } from 'lucide-react';
import { AchievementBadge } from '../shared/AchievementBadge';
import { MOCK_ACHIEVEMENTS, MOCK_XP } from '../../data/mock';

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;

/** Racha + nivel/XP + insignias en estética Loop. */
export function GamificationPanel({ streakDays }: { streakDays: number }) {
  const xp = MOCK_XP;
  const xpPct = Math.round((xp.current / xp.nextLevel) * 100);

  return (
    <section className="rounded-2xl border border-[#56358C] bg-gradient-to-br from-[#162E84] via-[#1a0d2e] to-[#38123B] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
          Tu progreso
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          Loop XP
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#56358C] bg-black/40 p-3">
          <div className="flex items-center gap-2 text-[#ff8a4d]">
            <Flame className="size-5" aria-hidden="true" />
            <span className="text-3xl leading-none tabular-nums text-white" style={DISPLAY}>
              {streakDays}
            </span>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
            días en racha
          </p>
        </div>
        <div
          className="rounded-xl border bg-black/40 p-3"
          style={{ borderColor: '#9CFF0F', boxShadow: '0 0 14px rgba(156,255,15,0.12)' }}
        >
          <div className="flex items-center gap-2 text-[#9CFF0F]">
            <Zap className="size-5" aria-hidden="true" />
            <span className="text-3xl leading-none tabular-nums text-white" style={DISPLAY}>
              NIV {xp.level}
            </span>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
            {xp.current} / {xp.nextLevel} XP
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
          <span className="text-white/55">Progreso a nivel {xp.level + 1}</span>
          <span className="font-mono tabular-nums text-[#9CFF0F]">{xpPct}%</span>
        </div>
        <div className="h-[6px] overflow-hidden rounded-full bg-black/50 ring-1 ring-[#56358C]/40">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${xpPct}%`,
              background: 'linear-gradient(90deg,#4D34B6,#9CFF0F)',
              boxShadow: '0 0 8px rgba(156,255,15,0.55)',
            }}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">
            Vitrina de insignias
          </p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
            Descongela las bloqueadas
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(86px,1fr))] gap-2">
          {MOCK_ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
