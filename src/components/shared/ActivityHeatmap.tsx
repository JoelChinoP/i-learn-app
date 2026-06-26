import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import type { HeatmapDay } from '../../lib/types';
function levelClass(count: number): string {
  if (count <= 0) return 'bg-muted';
  if (count <= 1) return 'bg-primary/25';
  if (count <= 2) return 'bg-primary/45';
  if (count <= 4) return 'bg-primary/70';
  return 'bg-primary';
}
/** Mapa de calor tipo "contribuciones" de los últimos 30 días (Alumno, Padre). */
export function ActivityHeatmap({ days }: {days: HeatmapDay[];}) {
  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5"
        role="list"
        aria-label="Actividad de los últimos 30 días">
        
        {days.map((d) =>
        <Tooltip key={d.date}>
            <TooltipTrigger asChild>
              <div
              role="listitem"
              tabIndex={0}
              aria-label={`${format(new Date(d.date), "d 'de' MMMM", {
                locale: es
              })}: ${d.count === 0 ? 'sin actividad' : `${d.count} actividad(es)`}`}
              className={`size-5 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${levelClass(d.count)}`} />
            
            </TooltipTrigger>
            <TooltipContent>
              {format(new Date(d.date), "d 'de' MMM", {
              locale: es
            })}{' '}
              · {d.count === 0 ? 'sin actividad' : `${d.count} actividad(es)`}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <span className="size-3 rounded-[3px] bg-muted" />
        <span className="size-3 rounded-[3px] bg-primary/25" />
        <span className="size-3 rounded-[3px] bg-primary/45" />
        <span className="size-3 rounded-[3px] bg-primary/70" />
        <span className="size-3 rounded-[3px] bg-primary" />
        <span>Más</span>
      </div>
    </div>);

}
