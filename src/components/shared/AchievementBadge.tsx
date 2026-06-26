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
  medal: Medal
};
/** Insignia de logro (Alumno). Estado bloqueado cuando earnedAt es null. */
export function AchievementBadge({
  achievement


}: {achievement: Achievement;}) {
  const earned = !!achievement.earnedAt;
  const earnedAt = achievement.earnedAt;
  const Icon = earned ? ICONS[achievement.icon] ?? Star : Lock;
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${earned ? 'border-amber-300/70 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-950/30' : 'border-dashed border-border bg-muted/40 opacity-70'}`}>
      
      <span
        className={`flex size-11 items-center justify-center rounded-full ${earned ? 'bg-amber-400 text-amber-950' : 'bg-muted text-muted-foreground'}`}>
        
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xs font-medium leading-tight text-foreground">
        {achievement.label}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {earnedAt ?
        `Logrado ${format(new Date(earnedAt), 'd MMM', {
          locale: es
        })}` :
        'Bloqueado'}
      </span>
    </div>);

}
