import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
'../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/shared/PageHeader';
import { TrendChart } from '../../components/shared/TrendChart';
import { MasteryBadge } from '../../components/shared/MasteryBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { MOCK_PADRE_HISTORY } from '../../data/mock';
import { usePadreData } from './usePadreData';
import { useSelectedChild } from './childSelection';
export function PadreDetalle() {
  const { loadState, data } = usePadreData();
  const [childId, setChildId] = useSelectedChild(data?.children[0]?.id ?? '');
  const child =
  data?.byChild[childId] ?? data?.byChild[data?.children[0]?.id ?? ''];
  const hasMultiple = (data?.children.length ?? 0) > 1;
  const compareRows = useMemo(() => {
    if (!data || !hasMultiple) return [];
    const topics = new Set<string>();
    Object.values(data.byChild).forEach((c) =>
    c.selectedChildMastery.forEach((m) => topics.add(m.topic))
    );
    return Array.from(topics).map((topic) => ({
      topic,
      values: data.children.map((c) => ({
        name: c.name,
        mastery:
        data.byChild[c.id]?.selectedChildMastery.find(
          (m) => m.topic === topic
        )?.mastery ?? 0
      }))
    }));
  }, [data, hasMultiple]);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Detalle y tendencia"
        description="Cómo evoluciona en el tiempo, no solo una foto del momento."
        breadcrumbs={[
        {
          label: 'Padre / Tutor',
          to: '/padre'
        },
        {
          label: 'Detalle'
        }]
        } />
      

      {loadState === 'loading' &&
      <div className="space-y-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      }

      {loadState === 'empty' &&
      <EmptyState
        title="No hay datos para mostrar"
        description="Aún no hay historial disponible." />

      }

      {loadState === 'ready' && data && child &&
      <>
          {hasMultiple &&
        <Tabs value={childId} onValueChange={setChildId} className="mb-5">
              <TabsList>
                {data.children.map((c) =>
            <TabsTrigger key={c.id} value={c.id}>
                    {c.name}
                  </TabsTrigger>
            )}
              </TabsList>
            </Tabs>
        }

          <Card className="mb-6 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Tendencia (últimas 8 semanas) — {child.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
              data={
              MOCK_PADRE_HISTORY[childId] ??
              MOCK_PADRE_HISTORY[data.children[0].id]
              }
              ariaLabel={`Tendencia de dominio de ${child.name}`} />
            
            </CardContent>
          </Card>

          {hasMultiple &&
        <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Comparativa entre hijos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {compareRows.map((row) =>
            <div key={row.topic}>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {row.topic}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {row.values.map((v) =>
                <div
                  key={v.name}
                  className="flex items-center gap-3 rounded-xl border border-border p-3">
                  
                          <span className="w-16 shrink-0 truncate text-sm text-muted-foreground">
                            {v.name}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${v.mastery}%`
                      }} />
                    
                          </div>
                          <MasteryBadge mastery={v.mastery} showValue />
                        </div>
                )}
                    </div>
                  </div>
            )}
              </CardContent>
            </Card>
        }
        </>
      }
    </main>);

}