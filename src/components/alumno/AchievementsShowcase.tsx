import { Sparkles } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { AchievementGrid } from './AchievementGrid';
import type { EarnedAchievement, LockedAchievement } from '../../lib/types';

interface AchievementsShowcaseProps {
  earned: EarnedAchievement[];
  locked: LockedAchievement[];
}

const ICON: Record<string, string> = {
  trophy: '🏆',
  flame: '🔥',
  target: '🎯',
  star: '⭐',
  medal: '🏅',
  mic: '🎙️',
  shuffle: '🔀',
  crown: '👑',
  sparkles: '✨',
};

export function AchievementsShowcase({ earned, locked }: AchievementsShowcaseProps) {
  const recent = [...earned].slice(0, 4);
  return (
    <CollapsibleSection
      title="Insignias"
      meta={
        <span>
          <span style={{ color: '#9CFF0F' }}>{earned.length}</span>/{earned.length + locked.length}
        </span>
      }
      preview={
        recent.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {recent.map((a) => (
                <span
                  key={a.id}
                  title={a.label}
                  className="flex size-9 items-center justify-center rounded-full border text-base"
                  style={{
                    background: '#0d1835',
                    borderColor: '#9CFF0F',
                    boxShadow: '0 0 10px rgba(156,255,15,0.18)',
                  }}
                >
                  {ICON[a.icon] ?? <Sparkles className="size-3.5 text-[#9CFF0F]" />}
                </span>
              ))}
            </div>
            {earned.length > 4 && (
              <p className="text-[10px] text-white/40">
                + {earned.length - 4} más · tocá para ver todas
              </p>
            )}
          </div>
        ) : (
          <p className="text-[10.5px] text-white/40">
            Aún sin insignias. Las primeras caen al responder bien.
          </p>
        )
      }
    >
      <AchievementGrid earned={earned} locked={locked} />
    </CollapsibleSection>
  );
}
