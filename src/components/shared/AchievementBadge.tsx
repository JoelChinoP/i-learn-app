import React from 'react';
import { Trophy, Flame, Target, Star, Medal, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Achievement } from '../../data/mock';

const ICONS: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  star: Star,
  medal: Medal,
};

/** Insignia de logro Loop. Las desbloqueadas brillan en neón. */
export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const earned = !!achievement.earnedAt;
  const Icon = earned ? ICONS[achievement.icon] ?? Star : Lock;
  return (
    <div
      className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors"
      title={achievement.label}
      style={{
        background: earned ? '#0d1835' : 'rgba(13,24,53,0.4)',
        borderColor: earned ? '#9CFF0F' : 'rgba(86,53,140,0.5)',
        opacity: earned ? 1 : 0.6,
        boxShadow: earned ? '0 0 14px rgba(156,255,15,0.18)' : 'none',
      }}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{
          background: earned ? '#9CFF0F' : '#38123B',
          color: earned ? '#000' : 'rgba(255,255,255,0.4)',
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
        {achievement.label}
      </span>
      <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">
        {achievement.earnedAt
          ? format(new Date(achievement.earnedAt), 'd MMM', { locale: es })
          : 'Bloqueado'}
      </span>
    </div>
  );
}
