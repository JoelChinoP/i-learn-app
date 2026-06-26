import React from 'react';
import { CircleCheck, CircleAlert, CircleDashed } from 'lucide-react';
import { masteryMeta, type MasteryLevel } from '../../lib/mastery';
const ICONS: Record<MasteryLevel, React.ElementType> = {
  high: CircleCheck,
  medium: CircleDashed,
  low: CircleAlert
};
interface MasteryBadgeProps {
  mastery: number;
  /** Muestra también el porcentaje numérico junto a la etiqueta. */
  showValue?: boolean;
  className?: string;
}
/**
 * Badge de estado del semáforo. No depende solo del color: incluye ícono
 * + texto para accesibilidad (sección 3 de la especificación).
 */
export function MasteryBadge({
  mastery,
  showValue = false,
  className = ''
}: MasteryBadgeProps) {
  const meta = masteryMeta(mastery);
  const Icon = ICONS[meta.level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring} ${className}`}>
      
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
      {showValue &&
      <span className="font-mono tabular-nums">{Math.round(mastery)}%</span>
      }
    </span>);

}