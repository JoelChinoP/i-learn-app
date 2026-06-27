import { supabase } from './supabase';
import type { LeaderboardData, MissionProgress } from './types';

export type LeaderboardWindow = 'weekly' | 'monthly' | 'alltime';

export interface ClaimResult {
  already_claimed: boolean;
  xp_awarded: number;
  mission_code?: string;
  event?: { event_id: string; inserted: boolean; amount: number; source: string };
}

export async function claimMission(missionId: string): Promise<ClaimResult> {
  const { data, error } = await supabase.functions.invoke<ClaimResult>('claim-mission', {
    body: { mission_id: missionId },
  });
  if (error) throw error;
  if (!data) throw new Error('EMPTY_RESPONSE');
  return data;
}

export async function fetchLeaderboard(window: LeaderboardWindow): Promise<LeaderboardData> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_scope: 'section',
    p_window: window,
  });
  if (error) throw error;
  return data as LeaderboardData;
}

export async function setLeaderboardOptIn(enabled: boolean): Promise<void> {
  const { error } = await supabase.functions.invoke('toggle-leaderboard', {
    body: { enabled },
  });
  if (error) throw error;
}

export function missionProgressLabel(m: MissionProgress): string {
  const unit = m.target_kind === 'minutes_practiced' ? 'min' : '';
  return `${m.current}/${m.target_count}${unit ? ` ${unit}` : ''}`;
}
