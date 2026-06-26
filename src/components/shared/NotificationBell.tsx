import React, { useState } from 'react';
import { Bell, CircleAlert, TrendingUp, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'../ui/DropdownMenu';
import { Button } from '../ui/Button';
interface NotificationItem {
  id: string;
  icon: 'alert' | 'trend' | 'achievement';
  text: string;
  date: string;
  read: boolean;
}
// TODO: reemplazar por notificaciones reales (Supabase Realtime).
const MOCK_NOTIFICATIONS: NotificationItem[] = [
{
  id: 'n1',
  icon: 'alert',
  text: 'Valeria necesita refuerzo en Fracciones',
  date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  read: false
},
{
  id: 'n2',
  icon: 'achievement',
  text: '¡Mateo desbloqueó una insignia nueva!',
  date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  read: false
},
{
  id: 'n3',
  icon: 'trend',
  text: 'El dominio promedio de la sección subió 5%',
  date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  read: true
}];

const ICONS = {
  alert: CircleAlert,
  trend: TrendingUp,
  achievement: Trophy
} as const;
export function NotificationBell() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;
  return (
    <DropdownMenu
      onOpenChange={(o) =>
      o &&
      setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read: true
      }))
      )
      }>
      
      <DropdownMenuTrigger
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}>
        
        <Bell className="size-5" />
        {unread > 0 &&
        <span
          className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-red-500 ring-2 ring-background"
          aria-hidden="true" />

        }
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ?
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Sin notificaciones
          </p> :

        <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => {
            const Icon = ICONS[n.icon];
            return (
              <li
                key={n.id}
                className="flex items-start gap-3 px-2 py-2.5 text-sm hover:bg-accent">
                
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground">{n.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.date), {
                      addSuffix: true,
                      locale: es
                    })}
                    </p>
                  </div>
                </li>);

          })}
          </ul>
        }
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setItems([])}>
            
            Marcar todo como leído
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>);

}