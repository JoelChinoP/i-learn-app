import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
interface CelebrationProps {
  trigger: string | null;
  onDone?: () => void;
}
const CONFETTI = ['#7c3aed', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];
/** Micro-festejo breve y no intrusivo cuando un tema cruza el umbral verde. */
export function Celebration({ trigger, onDone }: CelebrationProps) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }, []);
  useEffect(() => {
    if (!trigger) return;
    const t = setTimeout(() => onDone?.(), 2600);
    return () => clearTimeout(t);
  }, [trigger, onDone]);
  return (
    <AnimatePresence>
      {trigger &&
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        role="status"
        aria-live="polite">
        
          {!reduced &&
        Array.from({
          length: 18
        }).map((_, i) =>
        <motion.span
          key={i}
          className="absolute top-16 size-2 rounded-sm"
          style={{
            background: CONFETTI[i % CONFETTI.length],
            left: `${10 + i * 4.5}%`
          }}
          initial={{
            y: -20,
            opacity: 0,
            rotate: 0
          }}
          animate={{
            y: 220,
            opacity: [0, 1, 1, 0],
            rotate: 360
          }}
          transition={{
            duration: 1.8,
            delay: i * 0.03,
            ease: 'easeIn'
          }} />

        )}
          <motion.div
          className="mt-20 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          initial={{
            scale: 0.7,
            y: -10
          }}
          animate={{
            scale: 1,
            y: 0
          }}
          exit={{
            scale: 0.7,
            opacity: 0
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 18
          }}>
          
            <PartyPopper className="size-4" aria-hidden="true" />
            {trigger}
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
