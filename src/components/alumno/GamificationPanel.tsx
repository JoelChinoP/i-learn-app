import { Flame, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { AchievementBadge } from '../shared/AchievementBadge';
import { MOCK_ACHIEVEMENTS, MOCK_XP } from '../../data/mock';
/** Racha + nivel/XP + insignias (gamificación ligera, prioridad media). */
export function GamificationPanel({ streakDays }: {streakDays: number;}) {
  // TODO: reemplazar por datos reales de gamificación.
  const xp = MOCK_XP;
  const xpPct = Math.round(xp.current / xp.nextLevel * 100);
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tu progreso y logros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Flame className="size-5" aria-hidden="true" />
              <span className="text-2xl font-bold tabular-nums">
                {streakDays}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              días seguidos
            </p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="size-5" aria-hidden="true" />
              <span className="text-2xl font-bold tabular-nums">
                Nivel {xp.level}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {xp.current} / {xp.nextLevel} XP
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso al nivel {xp.level + 1}</span>
            <span className="font-mono tabular-nums">{xpPct}%</span>
          </div>
          <Progress value={xpPct} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Insignias</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {MOCK_ACHIEVEMENTS.map((a) =>
            <AchievementBadge key={a.id} achievement={a} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>);

}
