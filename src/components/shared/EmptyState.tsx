import React from 'react';
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
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center ${className}`}>
      
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        {illustration ?? <DefaultIllustration />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description &&
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      }
      {action && <div className="mt-5">{action}</div>}
    </div>);

}
function DefaultIllustration() {
  return (
    <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true">
      <rect
        x="9"
        y="12"
        width="30"
        height="24"
        rx="3"
        stroke="currentColor"
        strokeWidth="2.5" />
      
      <path
        d="M16 22h16M16 28h10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round" />
      
    </svg>);

}