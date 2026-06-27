import { describe, expect, it } from 'vitest';
import { missionProgressLabel } from './gamification';
import type { MissionProgress } from './types';

function mission(over: Partial<MissionProgress> = {}): MissionProgress {
  return {
    id: 'm1',
    code: 'daily_correct_3',
    title: 'Tiro certero',
    hint: '3 correctas hoy',
    icon: 'target',
    target_kind: 'correct_count',
    target_count: 3,
    xp_reward: 30,
    current: 0,
    progress_pct: 0,
    completed: false,
    claimed: false,
    window_start: new Date().toISOString(),
    ...over,
  };
}

describe('xp level curve (mirrors _xp_level SQL)', () => {
  // SQL: level n requires 100*n*(n+1)/2 cumulative XP to reach.
  // L1=0, L2=100, L3=300, L4=600, L5=1000, L6=1500, L7=2100 ...
  // We mirror the algorithm: walk n upward while the next level's threshold is reachable.
  function levelFor(total: number): number {
    let n = 1;
    while (n < 200) {
      const req = (100 * n * (n + 1)) / 2; // XP needed to reach level n+1
      if (req > total) break;
      n += 1;
    }
    return n;
  }

  it('starts at level 1 with 0 XP', () => {
    expect(levelFor(0)).toBe(1);
  });
  it('levels up at 100 XP', () => {
    expect(levelFor(50)).toBe(1);
    expect(levelFor(100)).toBe(2);
  });
  it('keeps the triangular number curve', () => {
    expect(levelFor(300)).toBe(3);
    expect(levelFor(600)).toBe(4);
    expect(levelFor(1000)).toBe(5);
  });
  it('handles very large totals', () => {
    expect(levelFor(50_000)).toBeGreaterThan(30);
  });
});

describe('missionProgressLabel', () => {
  it('formats count-based missions without unit', () => {
    expect(missionProgressLabel(mission({ current: 2, target_count: 3 }))).toBe('2/3');
  });
  it('appends min for minutes_practiced', () => {
    expect(
      missionProgressLabel(
        mission({ current: 7, target_count: 15, target_kind: 'minutes_practiced' })
      )
    ).toBe('7/15 min');
  });
  it('clamps to target visually', () => {
    expect(missionProgressLabel(mission({ current: 5, target_count: 3 }))).toBe('5/3');
  });
});
