import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend } from
'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MasteryHistoryPoint } from '../../lib/types';
const SERIES_COLORS = [
'var(--primary)',
'#0ea5e9',
'#f59e0b',
'#ec4899',
'#14b8a6'];

interface TrendChartProps {
  data: MasteryHistoryPoint[];
  height?: number;
  ariaLabel?: string;
}
/** Gráfico de línea de tendencia temporal por tema (Padre, Instructor, Alumno). */
export function TrendChart({
  data,
  height = 256,
  ariaLabel = 'Tendencia de dominio en el tiempo'
}: TrendChartProps) {
  const { rows, topics } = useMemo(() => {
    const topicSet = Array.from(new Set(data.map((d) => d.topic)));
    const byDate = new Map<string, Record<string, number | string>>();
    for (const p of data) {
      if (!byDate.has(p.date))
      byDate.set(p.date, {
        date: p.date
      });
      const row = byDate.get(p.date);
      if (row) row[p.topic] = p.mastery;
    }
    const sorted = Array.from(byDate.values()).sort(
      (a, b) =>
      new Date(a.date as string).getTime() -
      new Date(b.date as string).getTime()
    );
    return {
      rows: sorted,
      topics: topicSet
    };
  }, [data]);
  return (
    <div
      className="w-full"
      style={{
        height
      }}
      role="img"
      aria-label={ariaLabel}>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{
            top: 8,
            right: 12,
            left: -16,
            bottom: 0
          }}>
          
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false} />
          
          <XAxis
            dataKey="date"
            tickFormatter={(d) =>
            format(new Date(d), 'd MMM', {
              locale: es
            })
            }
            tick={{
              fontSize: 11,
              fill: 'var(--muted-foreground)'
            }}
            tickLine={false}
            axisLine={{
              stroke: 'var(--border)'
            }}
            minTickGap={20} />
          
          <YAxis
            domain={[0, 100]}
            tick={{
              fontSize: 11,
              fill: 'var(--muted-foreground)'
            }}
            tickLine={false}
            axisLine={false} />
          
          <Tooltip
            labelFormatter={(d) =>
            format(new Date(d as string), "d 'de' MMMM", {
              locale: es
            })
            }
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--popover)',
              fontSize: 12
            }}
            formatter={(v: number, name: string) => [`${v}%`, name]} />
          
          <Legend
            wrapperStyle={{
              fontSize: 12
            }} />
          
          {topics.map((t, i) =>
          <Line
            key={t}
            type="monotone"
            dataKey={t}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 4
            }} />

          )}
        </LineChart>
      </ResponsiveContainer>
    </div>);

}
