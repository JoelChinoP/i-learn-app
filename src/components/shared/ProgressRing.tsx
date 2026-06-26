import React from 'react';
import { motion } from 'framer-motion';
interface ProgressRingProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  /** Color del trazo (por defecto, primary). */
  color?: string;
  label?: string;
  children?: React.ReactNode;
}
/**
 * Anillo de progreso reutilizable (header de la vista Alumno / tarjetas resumen).
 */
export function ProgressRing({
  value,
  size = 72,
  strokeWidth = 7,
  color = 'var(--primary)',
  label,
  children
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct / 100 * circumference;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size
      }}
      role="img"
      aria-label={label ?? `Progreso ${Math.round(pct)} por ciento`}>
      
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth} />
        
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{
            strokeDashoffset: offset
          }}
          transition={{
            duration: 0.9,
            ease: 'easeOut'
          }} />
        
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ??
        <span className="font-mono text-sm font-bold tabular-nums text-foreground">
            {Math.round(pct)}%
          </span>
        }
      </div>
    </div>);

}