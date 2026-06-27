import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  /** Small label rendered on the right of the header (e.g. "3/16", "+ 200 XP"). */
  meta?: ReactNode;
  /** Compact preview always visible above the toggle. */
  preview?: ReactNode;
  children: ReactNode;
  /** Initial open state. Defaults to false to keep the rail compact. */
  defaultOpen?: boolean;
  /** Optional accent color for the chevron / border. */
  accent?: string;
}

export function CollapsibleSection({
  title,
  meta,
  preview,
  children,
  defaultOpen = false,
  accent = '#9CFF0F',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-[#56358C] bg-[#0d0d0d]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          {title}
        </span>
        {meta && (
          <span className="ml-auto text-[9px] uppercase tracking-[0.18em] text-white/40">
            {meta}
          </span>
        )}
        {open ? (
          <ChevronUp className="size-3.5 text-white/45" />
        ) : (
          <ChevronDown className="size-3.5 text-white/45" />
        )}
      </button>
      {preview && !open && <div className="px-4 pb-3">{preview}</div>}
      {open && <div className="border-t border-[#56358C]/30 px-4 py-3">{children}</div>}
    </section>
  );
}
