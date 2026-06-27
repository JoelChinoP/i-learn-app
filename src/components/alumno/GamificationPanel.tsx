import { AchievementGrid } from './AchievementGrid';
import { XpProgressCard } from './XpProgressCard';
import type { EarnedAchievement, LockedAchievement, StudentDashboard } from '../../lib/types';

interface GamificationPanelProps {
  dashboard: Pick<
    StudentDashboard,
    'xp' | 'streakDays' | 'achievements'
  >;
}

export function GamificationPanel({ dashboard }: GamificationPanelProps) {
  const earned: EarnedAchievement[] = dashboard.achievements.earned;
  const locked: LockedAchievement[] = dashboard.achievements.locked;

  return (
    <div className="space-y-4">
      <XpProgressCard
        total={dashboard.xp.total}
        level={dashboard.xp.level}
        currentLevelXp={dashboard.xp.currentLevelXp}
        nextLevelXp={dashboard.xp.nextLevelXp}
        progressPct={dashboard.xp.progressPct}
        streakDays={dashboard.streakDays}
      />

      <section className="rounded-2xl border border-[#56358C] bg-[#0d0d0d] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
            Vitrina de insignias
          </p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
            {earned.length} desbloqueadas
          </p>
        </div>
        <AchievementGrid earned={earned} locked={locked} />
      </section>
    </div>
  );
}
