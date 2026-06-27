import React from 'react';
import { LoopMascot } from './LoopMascot';
interface EmptyStateProps {
  /** Ilustración simple (SVG) a renderizar dentro del círculo. */
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}
/**
 * Estado vacío amigable con ilustración simple (sección 3 / 4 / 5 / 6).
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#56358C] bg-[#162E84]/20 px-6 py-12 text-center ${className}`}>
      <div className="mb-4 flex items-center justify-center">
        {illustration ?? <LoopMascot mood="idle" size={72} />}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description &&
        <p className="mt-1 max-w-sm text-sm text-white/55">
          {description}
        </p>
      }
      {action && <div className="mt-5">{action}</div>}
    </div>);
}