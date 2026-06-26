import React from 'react';
import { AlertTriangle, CalendarOff, X } from 'lucide-react';
import type { SectionAlert } from '../../data/mock';
interface AlertBannerProps {
  alert: SectionAlert;
  onAction?: () => void;
  onDismiss?: () => void;
}
/** Banner de alerta destacado (Instructor). */
export function AlertBanner({ alert, onAction, onDismiss }: AlertBannerProps) {
  const Icon = alert.type === 'inactividad' ? CalendarOff : AlertTriangle;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-3 dark:border-amber-700/50 dark:bg-amber-950/30">
      
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          {alert.message}
        </p>
        <p className="mt-0.5 truncate text-xs text-amber-800/80 dark:text-amber-300/80">
          {alert.affectedStudents.join(', ')}
        </p>
        {onAction &&
        <button
          type="button"
          onClick={onAction}
          className="mt-1.5 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-200">
          
            Ver afectados
          </button>
        }
      </div>
      {onDismiss &&
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Descartar alerta"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40">
        
          <X className="size-4" />
        </button>
      }
    </div>);

}