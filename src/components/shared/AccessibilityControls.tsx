import { Accessibility } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Switch } from '../ui/CSwitch';
/** Controles de accesibilidad: tamaño de texto + alto contraste (Alumno). */
export function AccessibilityControls() {
  const { textSize, setTextSize, highContrast, setHighContrast } = useTheme();
  const sizes: {
    value: 'sm' | 'md' | 'lg';
    label: string;
  }[] = [
  {
    value: 'sm',
    label: 'A-'
  },
  {
    value: 'md',
    label: 'A'
  },
  {
    value: 'lg',
    label: 'A+'
  }];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Accessibility className="size-4" /> Accesibilidad
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4">
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">
            Tamaño de texto
          </Label>
          <div className="flex gap-1">
            {sizes.map((s) =>
            <Button
              key={s.value}
              variant={textSize === s.value ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTextSize(s.value)}
              aria-pressed={textSize === s.value}>
              
                {s.label}
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="hc-switch" className="text-sm">
            Alto contraste
          </Label>
          <Switch
            id="hc-switch"
            checked={highContrast}
            onCheckedChange={setHighContrast} />
          
        </div>
      </PopoverContent>
    </Popover>);

}
