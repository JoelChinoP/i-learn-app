import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
'../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/CSwitch';
import { Slider } from '../../components/ui/Slider';
import { PageHeader } from '../../components/shared/PageHeader';
import { TOPICS } from '../../data/mock';
export function PadreConfig() {
  // TODO: persistir configuración real de alertas (backend).
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [threshold, setThreshold] = useState<number[]>([50]);
  const [perTopic, setPerTopic] = useState<Record<string, boolean>>(() =>
  Object.fromEntries(TOPICS.map((t) => [t, true]))
  );
  const [note, setNote] = useState('');
  function sendNote() {
    if (!note.trim()) return;
    // TODO: enviar nota real al instructor (backend).
    toast.success('Mensaje enviado al instructor');
    setNote('');
  }
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Configuración"
        description="Definí cuándo querés que te avisemos y dejá notas al instructor."
        breadcrumbs={[
        {
          label: 'Padre / Tutor',
          to: '/padre'
        },
        {
          label: 'Configuración'
        }]
        } />
      

      <Card className="mb-6 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="alerts-on" className="text-sm">
              Recibir alertas
            </Label>
            <Switch
              id="alerts-on"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled} />
            
          </div>

          <div
            className={alertsEnabled ? '' : 'pointer-events-none opacity-50'}>
            
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm">Avisarme si el dominio baja de</Label>
              <span className="font-mono text-sm font-semibold text-primary tabular-nums">
                {threshold[0]}%
              </span>
            </div>
            <Slider
              value={threshold}
              onValueChange={setThreshold}
              min={10}
              max={90}
              step={5} />
            

            <p className="mb-2 mt-5 text-sm font-medium text-foreground">
              Temas a vigilar
            </p>
            <div className="space-y-2">
              {TOPICS.map((t) =>
              <div
                key={t}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                
                  <Label htmlFor={`topic-${t}`} className="text-sm font-normal">
                    {t}
                  </Label>
                  <Switch
                  id={`topic-${t}`}
                  size="sm"
                  checked={perTopic[t]}
                  onCheckedChange={(v) =>
                  setPerTopic((p) => ({
                    ...p,
                    [t]: v
                  }))
                  } />
                
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => toast.success('Preferencias de alertas guardadas')}>
            
            Guardar preferencias
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nota para el instructor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Escribí una pregunta o comentario para el instructor…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4} />
          
          <Button onClick={sendNote} disabled={!note.trim()}>
            <Send className="size-4" /> Enviar
          </Button>
        </CardContent>
      </Card>
    </main>);

}