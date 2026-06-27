/**
 * Loop — la mascota del producto.
 * Cápsula oscura con borde violeta y dos ojos neón.
 * El "loop" del nombre se encarna en los ojos circulares que parpadean.
 */
import { LoopLogo } from './LoopLogo';

export type LoopMood = 'idle' | 'thinking' | 'happy' | 'sad' | 'sleep';

interface LoopMascotProps {
  size?: number;
  mood?: LoopMood;
  label?: string;
  className?: string;
  /** Si es false, no pinta el fondo de cápsula (solo la cara, útil sobre superficies oscuras). */
  capsule?: boolean;
}

const MOOD_EYE: Record<LoopMood, { d: string; tint: string }> = {
  idle:     { d: 'M0,0 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0', tint: '#9CFF0F' },
  thinking: { d: 'M-4,-1 q4,3 8,0',                            tint: '#9CFF0F' },
  happy:    { d: 'M-4,1 q4,-5 8,0',                            tint: '#9CFF0F' },
  sad:      { d: 'M-4,-1 q4,4 8,0',                            tint: '#ff6b9a' },
  sleep:    { d: 'M-4,0 L4,0',                                 tint: '#9CFF0F' },
};

export function LoopMascot({ size = 56, mood = 'idle', label = 'Loop', className = '', capsule = true }: LoopMascotProps) {
  const eye = MOOD_EYE[mood];
  return (
    <span
      role="img"
      aria-label={label}
      className={className}
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        borderRadius: '50%',
        background: capsule ? '#38123B' : 'transparent',
        border: capsule ? '2px solid #56358C' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: capsule ? '0 0 0 transparent' : 'none',
        flexShrink: 0,
      }}
    >
      <svg viewBox="-20 -10 40 20" width={size * 0.7} height={size * 0.35} aria-hidden="true">
        {mood === 'idle' || mood === 'sleep' ? (
          <g fill={eye.tint}>
            <circle cx="-7" cy="0" r="3" style={{ transformOrigin: '-7px 0', animation: 'loop-blink 4.6s ease infinite' }} />
            <circle cx="7"  cy="0" r="3" style={{ transformOrigin: '7px 0',  animation: 'loop-blink 4.6s ease infinite' }} />
          </g>
        ) : mood === 'thinking' ? (
          <g fill="none" stroke={eye.tint} strokeWidth="2.4" strokeLinecap="round">
            <path d="M-10,-2 q3,4 6,0" />
            <path d="M4,-2 q3,4 6,0" />
          </g>
        ) : mood === 'happy' ? (
          <g fill="none" stroke={eye.tint} strokeWidth="2.4" strokeLinecap="round">
            <path d="M-10,2 q3,-6 6,0" />
            <path d="M4,2 q3,-6 6,0" />
          </g>
        ) : (
          <g fill="none" stroke={eye.tint} strokeWidth="2.4" strokeLinecap="round">
            <path d="M-10,-1 q3,4 6,0" />
            <path d="M4,-1 q3,4 6,0" />
          </g>
        )}
      </svg>
    </span>
  );
}

/** Loader: la mascota pensando + tres puntos neón parpadeantes. */
export function LoopLoader({ message = 'Cargando…', size = 56 }: { message?: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center loop-fade-up">
      <LoopMascot mood="thinking" size={size} />
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#9CFF0F]" style={{ animation: 'loop-dot-blink 1.3s ease infinite 0s' }} />
        <span className="size-2 rounded-full bg-[#9CFF0F]" style={{ animation: 'loop-dot-blink 1.3s ease infinite 0.22s' }} />
        <span className="size-2 rounded-full bg-[#9CFF0F]" style={{ animation: 'loop-dot-blink 1.3s ease infinite 0.44s' }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CFF0F]">{message}</p>
    </div>
  );
}

/** Splash de pantalla completa: usar en boot inicial. */
export function LoopSplash({ message = 'Iniciando Loop' }: { message?: string }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-5">
        <LoopLogo className="loop-neon-pulse w-52" />
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">{message}</p>
      </div>
    </div>
  );
}
