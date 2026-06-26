import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
interface Crumb {
  label: string;
  to?: string;
}
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}
/** Título de sección + breadcrumbs + acciones, para orientarse en el producto. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions
}: PageHeaderProps) {
  return (
    <div className="mb-5">
      {breadcrumbs && breadcrumbs.length > 0 &&
      <nav aria-label="Ruta de navegación" className="mb-1.5">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((c, i) =>
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {c.to ?
            <Link
              to={c.to}
              className="hover:text-foreground hover:underline">
              
                    {c.label}
                  </Link> :

            <span className="text-foreground">{c.label}</span>
            }
                {i < breadcrumbs.length - 1 &&
            <ChevronRight className="size-3" aria-hidden="true" />
            }
              </li>
          )}
          </ol>
        </nav>
      }
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description &&
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          }
        </div>
        {actions &&
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
        }
      </div>
    </div>);

}