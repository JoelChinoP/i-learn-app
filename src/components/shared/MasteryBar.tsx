import React from 'react';
import { motion } from 'framer-motion';
import { masteryMeta } from '../../lib/mastery';
interface MasteryBarProps {
  topic: string;
  mastery: number;
  /** Tamaño compacto para usar dentro de tablas (vista Instructor). */
  compact?: boolean;
  /** Muestra el ícono/etiqueta del semáforo a la derecha. */
  showLabel?: boolean;
}
/**
 * Barra de dominio por tema con color semáforo y animación suave al
 * actualizarse el valor (sección 4 de la especificación).
 */
export function MasteryBar({
  topic,
  mastery,
  compact = false,
  showLabel = true
}: MasteryBarProps) {
  const meta = masteryMeta(mastery);
  const pct = Math.max(0, Math.min(100, mastery));
  if (compact) {
    return (
      <div
        className="flex items-center gap-2"
        aria-label={`${topic}: ${meta.label}, ${Math.round(pct)} por ciento`}>
        
        <div
          className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
          role="presentation">
          
          <motion.div
            className={`h-full rounded-full ${meta.bar}`}
            initial={false}
            animate={{
              width: `${pct}%`
            }}
            transition={{
              duration: 0.6,
              ease: 'easeOut'
            }} />
          
        </div>
        <span className="w-9 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {Math.round(pct)}%
        </span>
      </div>);

  }
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{topic}</span>
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${meta.text}`}>
          
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Dominio en ${topic}: ${meta.label}`}>
        
        <motion.div
          className={`h-full rounded-full ${meta.bar}`}
          initial={false}
          animate={{
            width: `${pct}%`
          }}
          transition={{
            duration: 0.7,
            ease: 'easeOut'
          }} />
        
      </div>
      {showLabel &&
      <p className={`mt-1 text-xs font-medium ${meta.text}`}>{meta.label}</p>
      }
    </div>);

}