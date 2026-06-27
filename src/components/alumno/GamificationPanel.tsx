import { XpProgressCard } from './XpProgressCard';
import type { StudentDashboard } from '../../lib/types';

interface GamificationPanelProps {
  dashboard: Pick<StudentDashboard, 'xp' | 'streakDays'>;
}

/** Tarjeta compacta de XP + racha. La vitrina de insignias se renderiza aparte como showcase colapsable. */
export function GamificationPanel({ dashboard }: GamificationPanelProps) {
  return (
    <XpProgressCard
      total={dashboard.xp.total}
      level={dashboard.xp.level}
      currentLevelXp={dashboard.xp.currentLevelXp}
      nextLevelXp={dashboard.xp.nextLevelXp}
      progressPct={dashboard.xp.progressPct}
      streakDays={dashboard.streakDays}
    />
  );
}
