import { useState } from 'react';
import { Check, Sparkles, Target, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { MissionProgress } from '../../lib/types';
import { claimMission } from '../../lib/gamification';

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;

interface DailyMissionsCardProps {
  daily: MissionProgress[];
  weekly: MissionProgress[];
  onClaimed?: (mission: MissionProgress, xpAwarded: number) => void;
}

function MissionRow({
  mission,
  onClaim,
}: {
  mission: MissionProgress;
  onClaim: (m: MissionProgress) => void;
}) {
  const [busy, setBusy] = useState(false);
  const handleClaim = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await claimMission(mission.id);
      if (result.already_claimed) {
        toast.info('Ya habías reclamado esta recompensa.');
        onClaim(mission);
        return;
      }
      toast.success(`+${result.xp_awarded} XP — ${mission.title}`);
      onClaim(mission);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo reclamar';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };
  const isClaimable = mission.completed && !mission.claimed;
  return (
    <div
      className="rounded-xl border p-3 transition"
      style={{
        background: mission.claimed
          ? 'rgba(56,18,59,0.35)'
          : mission.completed
            ? 'linear-gradient(135deg,#162E84,#38123B)'
            : '#0d1835',
        borderColor: isClaimable ? '#9CFF0F' : mission.claimed ? 'rgba(86,53,140,0.5)' : '#56358C',
        boxShadow: isClaimable ? '0 0 14px rgba(156,255,15,0.18)' : 'none',
        opacity: mission.claimed ? 0.7 : 1,
      }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Target
              className="size-3.5 shrink-0"
              style={{ color: isClaimable ? '#9CFF0F' : 'rgba(255,255,255,0.45)' }}
            />
            <span
              className="truncate text-[14px] leading-tight tracking-[0.04em] text-white"
              style={DISPLAY}
            >
              {mission.title.toUpperCase()}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-white/55">{mission.hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9CFF0F]">
          +{mission.xp_reward} XP
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-black/60">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${mission.progress_pct}%`,
              background: mission.claimed
                ? 'linear-gradient(90deg,#56358C,#38123B)'
                : 'linear-gradient(90deg,#4D34B6,#9CFF0F)',
            }}
          />
        </div>
        <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/65">
          {mission.current}/{mission.target_count}
        </span>
        {isClaimable ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={busy}
            className="loop-neon-pulse shrink-0 rounded-full bg-[#9CFF0F] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-black disabled:opacity-60"
          >
            {busy ? '…' : 'Reclamar'}
          </button>
        ) : mission.claimed ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
            <Check className="inline size-3" /> Listo
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function DailyMissionsCard({ daily, weekly, onClaimed }: DailyMissionsCardProps) {
  const dailyUndone = daily.filter((m) => !m.claimed);
  const dailyDone = daily.filter((m) => m.claimed).slice(0, 2);
  const dailyShown = [...dailyUndone, ...dailyDone].slice(0, 3);
  const weeklyUndone = weekly.filter((m) => !m.claimed);
  const weeklyDone = weekly.filter((m) => m.claimed).slice(0, 1);
  const weeklyShown = [...weeklyUndone, ...weeklyDone].slice(0, 3);

  const claim = (m: MissionProgress) => onClaimed?.(m, m.xp_reward);

  return (
    <section className="rounded-2xl border border-[#56358C] bg-[#0d0d0d] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
          <Sparkles className="size-3.5" /> Misiones
        </div>
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-white/30">
          <Trophy className="size-3" /> {daily.filter((m) => m.claimed).length}/{daily.length}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-white/40">
          Diarias
        </div>
        {dailyShown.length === 0 ? (
          <p className="text-[11px] text-white/40">Sin misiones activas.</p>
        ) : (
          dailyShown.map((m) => <MissionRow key={m.id} mission={m} onClaim={claim} />)
        )}
      </div>

      {weeklyShown.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-white/40">
            Semanales
          </div>
          {weeklyShown.map((m) => <MissionRow key={m.id} mission={m} onClaim={claim} />)}
        </div>
      )}
    </section>
  );
}
