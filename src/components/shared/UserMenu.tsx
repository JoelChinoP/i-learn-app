import React from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'../ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
interface UserMenuProps {
  name: string;
  email: string;
  settingsPath?: string;
}
/** Avatar + menú de usuario, compartido por las 3 vistas. */
export function UserMenu({ name, email, settingsPath }: UserMenuProps) {
  const navigate = useNavigate();
  const initials = name.
  split(' ').
  map((p) => p[0]).
  slice(0, 2).
  join('').
  toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Menú de usuario">
        
        <Avatar size="sm">
          <AvatarImage src="" alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium text-foreground sm:inline">
          {name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast.info('Perfil (demo)')}>
          <User className="size-4" /> Mi perfil
        </DropdownMenuItem>
        {settingsPath &&
        <DropdownMenuItem onSelect={() => navigate(settingsPath)}>
            <Settings className="size-4" /> Configuración
          </DropdownMenuItem>
        }
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => toast.success('Sesión cerrada (demo)')}>
          
          <LogOut className="size-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);

}