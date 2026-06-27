import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trophy, Flame, Target, Star, Medal, Mic, Sparkles, Shuffle, Crown, Lock } from 'lucide-react';
import type { EarnedAchievement, LockedAchievement } from '../../lib/types';

const ICONS: Record<string, typeof Trophy> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  star: Star,
  medal: Medal,
  mic: Mic,
  shuffle: Shuffle,
  crown: Crown,
  sparkles: Sparkles,
};

interface AchievementGridProps {
  earned: EarnedAchievement[];
  locked: LockedAchievement[];
}

export function AchievementGrid({ earned, locked }: AchievementGridProps) {
  const earnedIcons = new Map(earned.map((a) => [a.id, a.icon]));
  const tiles: Array<
    | { earned: true; id: string; label: string; icon: string; earnedAt: string; xp: number }
    | { earned: false; id: string; label: string; icon: string; xp: number }
  > = [
    ...earned.map((a) => ({
      earned: true as const,
      id: a.id,
      label: a.label,
      icon: a.icon,
      earnedAt: a.earned_at,
      xp: a.xp_reward,
    })),
    ...locked
      .filter((l) => !earnedIcons.has(l.id))
      .map((l) => ({
        earned: false as const,
        id: l.id,
        label: l.label,
        icon: l.icon,
        xp: l.xp_reward,
      })),
  ].slice(0, 16);

  if (tiles.length === 0) {
    return (
      <p className="rounded-xl border border-[#56358C] bg-black/30 p-3 text-center text-[11px] text-white/45">
        Las insignias se desbloquean al subir tu racha y dominio. ¡A darle!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(86px,1fr))] gap-2">
      {tiles.map((tile) => {
        const Icon = (tile.earned ? ICONS[tile.icon] : Lock) ?? Star;
        return (
          <div
            key={tile.id}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center"
            title={tile.label}
            style={{
              background: tile.earned ? '#0d1835' : 'rgba(13,24,53,0.4)',
              borderColor: tile.earned ? '#9CFF0F' : 'rgba(86,53,140,0.5)',
              opacity: tile.earned ? 1 : 0.55,
              boxShadow: tile.earned ? '0 0 12px rgba(156,255,15,0.18)' : 'none',
            }}
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: tile.earned ? '#9CFF0F' : '#38123B',
                color: tile.earned ? '#000' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span
              className="block w-full overflow-hidden text-[10.5px] font-semibold leading-[1.15] text-white"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textWrap: 'balance',
                wordBreak: 'break-word',
              }}
            >
              {tile.label}
            </span>
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">
              {tile.earned
                ? format(new Date(tile.earnedAt), 'd MMM', { locale: es })
                : `+${tile.xp} XP`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
