import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
/** Switch de tema claro/oscuro compartido por las 3 vistas. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-pressed={isDark}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? 'Modo claro' : 'Modo oscuro'}</TooltipContent>
    </Tooltip>);

}
