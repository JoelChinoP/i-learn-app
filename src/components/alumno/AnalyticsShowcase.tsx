import { BarChart3 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MasteryBar } from '../shared/MasteryBar';
import { ActivityHeatmap } from '../shared/ActivityHeatmap';
import { TrendChart } from '../shared/TrendChart';
import { clampPercent } from '../../lib/scale';
import { masteryMeta } from '../../lib/mastery';
import type { HeatmapDay, MasteryHistoryPoint, MasteryPoint } from '../../lib/types';

interface AnalyticsShowcaseProps {
  masteryByTopic: MasteryPoint[];
  activity: HeatmapDay[];
  history: MasteryHistoryPoint[];
}

function compactMastery(masteryByTopic: MasteryPoint[]): MasteryPoint[] {
  if (masteryByTopic.length === 0) return [];
  return [...masteryByTopic].sort((a, b) => b.mastery - a.mastery).slice(0, 2);
}

function activityCount(activity: HeatmapDay[]): number {
  return activity.reduce((sum, day) => sum + (day.count ?? 0), 0);
}

function CompactMasteryRow({ topic, mastery }: { topic: string; mastery: number }) {
  const meta = masteryMeta(mastery);
  const pct = clampPercent(mastery);
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-[11px] text-white/75">{topic}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/60">
        <div
          className={`h-full rounded-full ${meta.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-9 shrink-0 text-right font-mono text-[11px] tabular-nums ${meta.text}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export function AnalyticsShowcase({ masteryByTopic, activity, history }: AnalyticsShowcaseProps) {
  const topMastery = compactMastery(masteryByTopic);
  const totalAnswers = activityCount(activity);

  return (
    <CollapsibleSection
      title="Tu actividad"
      meta={
        <span>
          <span style={{ color: '#9CFF0F' }}>{totalAnswers}</span> resp.
        </span>
      }
      preview={
        <div className="space-y-2">
          {topMastery.length > 0 ? (
            <div className="space-y-1.5">
              {topMastery.map((m) => (
                <CompactMasteryRow key={m.topic} topic={m.topic} mastery={m.mastery} />
              ))}
            </div>
          ) : (
            <p className="text-[10.5px] text-white/40">Sin datos de dominio todavía.</p>
          )}
          <p className="flex items-center gap-1 text-[10px] text-white/35">
            <BarChart3 className="size-3" /> Tocá para ver heatmap e historial
          </p>
        </div>
      }
    >
      <div className="space-y-3">
        {masteryByTopic.length > 0 && (
          <Card className="rounded-xl border border-[#56358C] bg-black/30">
            <CardHeader>
              <CardTitle className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
                Dominio por tema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {masteryByTopic.map((item) => (
                <MasteryBar key={item.topic} topic={item.topic} mastery={item.mastery} />
              ))}
            </CardContent>
          </Card>
        )}

        {activity.length > 0 && (
          <Card className="rounded-xl border border-[#56358C] bg-black/30">
            <CardHeader>
              <CardTitle className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
                Actividad reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap days={activity} />
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card className="rounded-xl border border-[#56358C] bg-black/30">
            <CardHeader>
              <CardTitle className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#9CFF0F]">
                Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={history} />
            </CardContent>
          </Card>
        )}
      </div>
    </CollapsibleSection>
  );
}
