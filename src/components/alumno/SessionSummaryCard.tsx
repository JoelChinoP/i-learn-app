import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { SessionSummary } from '../../lib/types';
interface SessionSummaryCardProps {
  summary: SessionSummary;
  onContinue: () => void;
  onFinish: () => void;
}
function motivationalMessage(pct: number): string {
  if (pct >= 80) return '¡Excelente trabajo! Estás dominando esto. 🌟';
  if (pct >= 50) return '¡Buen progreso! Cada práctica te hace mejor. 💪';
  return '¡Sigue practicando! Los errores son parte de aprender. 🚀';
}
/** Tarjeta de cierre de sesión (prioridad alta). */
export function SessionSummaryCard({
  summary,
  onContinue,
  onFinish
}: SessionSummaryCardProps) {
  const pct = Math.round(
    summary.correctCount / Math.max(1, summary.questionsAnswered) * 100
  );
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.4
      }}>
      
      <Card className="rounded-2xl">
        <CardContent className="space-y-5 p-6 text-center">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              ¡Sesión completada!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {motivationalMessage(pct)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat
              icon={<ListChecks className="size-5" />}
              value={String(summary.questionsAnswered)}
              label="respondidas" />
            
            <Stat
              icon={<CheckCircle2 className="size-5" />}
              value={`${pct}%`}
              label="de aciertos"
              highlight />
            
            <Stat
              icon={<Clock className="size-5" />}
              value={`${summary.durationMinutes}m`}
              label="de práctica" />
            
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" size="lg" onClick={onContinue}>
              Seguir practicando
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={onFinish}>
              
              Terminar por hoy
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>);

}
function Stat({
  icon,
  value,
  label,
  highlight = false





}: {icon: React.ReactNode;value: string;label: string;highlight?: boolean;}) {
  return (
    <div
      className={`rounded-xl p-3 ${highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
      
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>);

}
