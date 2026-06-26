import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
interface ChatBubbleProps {
  children: React.ReactNode;
  /** Nota cuando se usó una explicación de respaldo (usedFallback). */
  fallback?: boolean;
}
/**
 * Burbuja de chat del "tutor" con avatar y animación de entrada (slide/fade-in),
 * tal como pide la sección 4 de la especificación.
 */
export function ChatBubble({ children, fallback = false }: ChatBubbleProps) {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{
        opacity: 0,
        y: 12
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.45,
        ease: 'easeOut'
      }}>
      
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        aria-hidden="true">
        
        <Sparkles className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            Tu tutor
          </span>
          {fallback &&
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              respuesta general
            </span>
          }
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground ring-1 ring-inset ring-primary/10">
          {children}
        </div>
      </div>
    </motion.div>);

}