import { Flame, Sparkles, Zap } from 'lucide-react';

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;

interface XpProgressCardProps {
  total: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
  streakDays: number;
}

function xpToNext(current: number, levelStart: number, levelEnd: number) {
  // levelStart reserved for future per-level breakdown UI.
  void levelStart;
  return Math.max(0, levelEnd - current);
}

export function XpProgressCard({
  total,
  level,
  currentLevelXp,
  nextLevelXp,
  progressPct,
  streakDays,
}: XpProgressCardProps) {
  const remaining = xpToNext(total, currentLevelXp, nextLevelXp);
  const isMaxLevel = progressPct >= 100 && nextLevelXp <= currentLevelXp;
  return (
    <section className="rounded-2xl border border-[#56358C] bg-gradient-to-br from-[#162E84] via-[#1a0d2e] to-[#38123B] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
          Tu progreso
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
          <Sparkles className="size-3" /> Loop XP
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-[#56358C] bg-black/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[#ff8a4d]">
            <Flame className="size-4" aria-hidden="true" />
            <span className="text-2xl leading-none tabular-nums text-white" style={DISPLAY}>
              {streakDays}
            </span>
            <span className="ml-auto text-[9px] uppercase tracking-[0.16em] text-white/40">
              racha
            </span>
          </div>
        </div>
        <div
          className="rounded-xl border bg-black/40 px-3 py-2.5"
          style={{ borderColor: '#9CFF0F', boxShadow: '0 0 14px rgba(156,255,15,0.12)' }}
        >
          <div className="flex items-center gap-2 text-[#9CFF0F]">
            <Zap className="size-4" aria-hidden="true" />
            <span className="text-2xl leading-none tabular-nums text-white" style={DISPLAY}>
              NIV {level}
            </span>
            <span className="ml-auto text-[9px] uppercase tracking-[0.16em] text-white/40 tabular-nums">
              {total} XP
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
          <span className="text-white/55">
            {isMaxLevel ? 'Nivel máximo' : `A nivel ${level + 1}`}
          </span>
          <span className="font-mono tabular-nums text-[#9CFF0F]">
            {isMaxLevel ? 'MAX' : `${progressPct}%`}
          </span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-black/50 ring-1 ring-[#56358C]/40">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg,#4D34B6,#9CFF0F)',
              boxShadow: '0 0 8px rgba(156,255,15,0.55)',
            }}
          />
        </div>
        {!isMaxLevel && (
          <p className="mt-1 text-right text-[10px] tabular-nums text-white/35">
            {remaining} XP para subir
          </p>
        )}
      </div>
    </section>
  );
}
