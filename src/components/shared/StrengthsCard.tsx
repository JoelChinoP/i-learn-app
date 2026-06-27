import { Compass, Sparkles, Sprout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MasteryBadge } from './MasteryBadge';
import {
  buildStrengthsMessage,
  CAREER_CLUSTER_CHIP,
  CAREER_CLUSTER_LABEL,
  type StrengthsCardInput
} from '../../lib/strengths';

interface StrengthsCardProps {
  child: StrengthsCardInput;
}

/**
 * Bloque "Fortalezas y caminos" del dashboard del padre.
 * Refuerza el mensaje de producto: una materia baja no cierra caminos.
 * Sólo consume datos agregados que ya vienen de `get_parent_dashboard()`.
 */
export function StrengthsCard({ child }: StrengthsCardProps) {
  const message = buildStrengthsMessage(child);
  const ToneIcon = message.tone === 'empty' ? Sprout : message.tone === 'growing' ? Sprout : Sparkles;
  const toneAccent =
    message.tone === 'empty'
      ? 'text-slate-500 dark:text-slate-400'
      : message.tone === 'growing'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <Card className="rounded-2xl border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 via-background to-background dark:border-emerald-900/50 dark:from-emerald-950/20">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="size-4 text-emerald-600 dark:text-emerald-400" />
            {message.title}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{message.subtitle}</p>
        </div>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-inset ring-border ${toneAccent}`}
          aria-hidden="true"
        >
          <ToneIcon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {child.strengths.length > 0 && (
          <section aria-labelledby={`strengths-${child.name}-topics`}>
            <h3
              id={`strengths-${child.name}-topics`}
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Donde {child.name} destaca
            </h3>
            <ul className="flex flex-wrap gap-2">
              {child.strengths.map((topic) => (
                <li key={topic.topic} className="flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <MasteryBadge mastery={topic.mastery} showValue />
                </li>
              ))}
            </ul>
          </section>
        )}

        {child.suggestedCareers.length > 0 && (
          <section aria-labelledby={`strengths-${child.name}-careers`}>
            <h3
              id={`strengths-${child.name}-careers`}
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Caminos que se conectan con sus fortalezas
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {child.suggestedCareers.map((career) => {
                const chipClass =
                  CAREER_CLUSTER_CHIP[career.cluster] ??
                  'bg-muted text-foreground ring-border';
                const clusterLabel = CAREER_CLUSTER_LABEL[career.cluster] ?? career.cluster;
                return (
                  <li
                    key={career.id}
                    className="rounded-xl border bg-background p-3 transition-colors hover:border-emerald-300 dark:hover:border-emerald-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{career.name}</span>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${chipClass}`}
                      >
                        {clusterLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{career.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="rounded-lg bg-background/60 px-3 py-2 text-xs italic text-muted-foreground ring-1 ring-inset ring-border">
          {message.hint}
        </p>
      </CardContent>
    </Card>
  );
}