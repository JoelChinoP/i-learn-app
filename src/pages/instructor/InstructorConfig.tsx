import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend } from
'recharts';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
'../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/CSwitch';
import { PageHeader } from '../../components/shared/PageHeader';
import { TOPICS } from '../../data/mock';
// TODO: reemplazar por secciones reales del instructor.
const MOCK_SECTION_COMPARE = TOPICS.map((topic) => ({
  topic,
  '7° A': Math.round(50 + Math.random() * 30),
  '7° B': Math.round(50 + Math.random() * 30)
}));
export function InstructorConfig() {
  const [alertInactivity, setAlertInactivity] = useState(true);
  const [alertLowMastery, setAlertLowMastery] = useState(true);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Configuración"
        description="Comparativa entre secciones y preferencias de alertas."
        breadcrumbs={[
        {
          label: 'Instructor',
          to: '/instructor'
        },
        {
          label: 'Configuración'
        }]
        } />
      

      {/* Comparar secciones */}
      <Card className="mb-6 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comparar secciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="h-64 w-full"
            role="img"
            aria-label="Comparación de dominio promedio entre secciones">
            
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_SECTION_COMPARE}
                margin={{
                  top: 8,
                  right: 8,
                  left: -16,
                  bottom: 0
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false} />
                
                <XAxis
                  dataKey="topic"
                  tick={{
                    fontSize: 12,
                    fill: 'var(--muted-foreground)'
                  }}
                  tickLine={false}
                  axisLine={{
                    stroke: 'var(--border)'
                  }} />
                
                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 12,
                    fill: 'var(--muted-foreground)'
                  }}
                  tickLine={false}
                  axisLine={false} />
                
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--popover)',
                    fontSize: 12
                  }}
                  formatter={(v: number) => [`${v}%`]} />
                
                <Legend
                  wrapperStyle={{
                    fontSize: 12
                  }} />
                
                <Bar
                  dataKey="7° A"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40} />
                
                <Bar
                  dataKey="7° B"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias de alertas */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alertas del panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="alert-inact" className="text-sm font-normal">
              Avisar por inactividad (7+ días)
            </Label>
            <Switch
              id="alert-inact"
              checked={alertInactivity}
              onCheckedChange={setAlertInactivity} />
            
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="alert-low" className="text-sm font-normal">
              Avisar por bajo dominio en un tema
            </Label>
            <Switch
              id="alert-low"
              checked={alertLowMastery}
              onCheckedChange={setAlertLowMastery} />
            
          </div>
          <Button onClick={() => toast.success('Preferencias guardadas')}>
            Guardar
          </Button>
        </CardContent>
      </Card>
    </main>);

}