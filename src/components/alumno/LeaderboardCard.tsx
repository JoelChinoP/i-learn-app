import { useEffect, useState } from 'react';
import { Crown, EyeOff, Eye, RefreshCw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { fetchLeaderboard, setLeaderboardOptIn, type LeaderboardWindow } from '../../lib/gamification';
import type { LeaderboardData, LeaderboardEntry } from '../../lib/types';

const DISPLAY = { fontFamily: '"Bebas Neue", sans-serif' } as const;
const WINDOW_TABS: Array<{ id: LeaderboardWindow; label: string }> = [
  { id: 'weekly', label: 'Semana' },
  { id: 'monthly', label: 'Mes' },
  { id: 'alltime', label: 'Histórico' },
];

function relativeXp(windowXp: number, totalXp: number, window: LeaderboardWindow): string {
  if (window === 'alltime') return `${totalXp} XP`;
  return `${windowXp} XP`;
}

function RowHighlight({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const podium = entry.rank <= 3;
  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
      style={{
        background: isMe
          ? 'linear-gradient(135deg,#162E84,#38123B)'
          : podium
            ? 'rgba(77,52,182,0.18)'
            : 'rgba(13,24,53,0.4)',
        borderColor: isMe ? '#9CFF0F' : podium ? 'rgba(156,255,15,0.3)' : 'rgba(86,53,140,0.5)',
        boxShadow: isMe ? '0 0 12px rgba(156,255,15,0.18)' : 'none',
      }}
    >
      <div
        className="flex w-7 shrink-0 items-center justify-center text-[14px] tabular-nums"
        style={{ ...DISPLAY, color: podium ? '#9CFF0F' : 'rgba(255,255,255,0.55)' }}
        aria-label={`Posición ${entry.rank}`}
      >
        {medal ?? entry.rank}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[13px] tracking-[0.04em] text-white"
          style={DISPLAY}
        >
          {entry.alias.toUpperCase()}
        </div>
        <div className="text-[10px] text-white/40">
          #{entry.rank} · total {entry.total_xp} XP
        </div>
      </div>
      <div className="shrink-0 text-right text-[12px] font-bold tabular-nums text-[#9CFF0F]" style={DISPLAY}>
        {relativeXp(entry.window_xp, entry.total_xp, 'weekly')}
      </div>
    </div>
  );
}

interface LeaderboardCardProps {
  studentId: string;
  optIn: boolean;
  onOptInChange: (next: boolean) => void;
}

export function LeaderboardCard({ studentId, optIn, onOptInChange }: LeaderboardCardProps) {
  const [window, setWindow] = useState<LeaderboardWindow>('weekly');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!optIn) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLeaderboard(window)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [optIn, window]);

  async function toggle() {
    if (toggling) return;
    setToggling(true);
    const next = !optIn;
    try {
      await setLeaderboardOptIn(next);
      onOptInChange(next);
      toast.success(next ? 'Apareces en el leaderboard.' : 'Saliste del leaderboard.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar');
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-[#56358C] bg-[#0d0d0d]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
          <span className="flex items-center gap-1.5">
            <Trophy className="size-3.5" /> Leaderboard · tu sección
          </span>
          <button
            type="button"
            onClick={toggle}
            disabled={toggling}
            className="flex items-center gap-1 rounded-full border border-[#56358C] bg-black/40 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 transition hover:text-white disabled:opacity-50"
          >
            {optIn ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {optIn ? 'Visible' : 'Oculto'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!optIn ? (
          <div className="rounded-xl border border-dashed border-[#56358C] bg-black/30 p-4 text-center text-[11px] text-white/55">
            <EyeOff className="mx-auto mb-1.5 size-4 text-white/40" />
            Estás fuera del leaderboard. Nadie ve tu XP ni tu posición.
            <div className="mt-2">
              <Button
                size="sm"
                onClick={toggle}
                disabled={toggling}
                className="mx-auto bg-[#9CFF0F] text-black"
              >
                {toggling ? '…' : 'Volver a aparecer'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div role="tablist" className="grid grid-cols-3 rounded-full border border-[#56358C] bg-black/40 p-1">
              {WINDOW_TABS.map((tab) => {
                const sel = tab.id === window;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={sel}
                    onClick={() => setWindow(tab.id)}
                    className="rounded-full py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] transition-colors"
                    style={{
                      background: sel ? 'linear-gradient(135deg,#162E84,#4D34B6)' : 'transparent',
                      color: sel ? '#fff' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-xl border border-[#56358C]/30 bg-black/30"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-center text-[11px] text-red-200">
                {error}
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => setWindow(window)}>
                    <RefreshCw className="size-3" /> Reintentar
                  </Button>
                </div>
              </div>
            ) : data && data.rows.length > 0 ? (
              <div className="space-y-1.5">
                {data.rows.slice(0, 10).map((entry) => (
                  <RowHighlight
                    key={entry.student_id}
                    entry={entry}
                    isMe={entry.student_id === studentId}
                  />
                ))}
                {data.my_rank && data.my_rank > 10 && (
                  <div className="mt-2 rounded-xl border border-[#9CFF0F] bg-[#162E84] p-2 text-center text-[11px] text-white/80">
                    <Crown className="mr-1 inline size-3 text-[#9CFF0F]" /> Estás en el puesto{' '}
                    <span className="font-bold text-[#9CFF0F]">#{data.my_rank}</span> de la sección.
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-[#56358C] bg-black/30 p-3 text-center text-[11px] text-white/50">
                Aún no hay suficiente actividad para mostrar el ranking.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
