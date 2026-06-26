import { LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Avatar, AvatarFallback } from '../ui/Avatar';

interface UserMenuProps {
  name: string;
  email: string;
  settingsPath?: string;
  onSignOut: () => Promise<void>;
}

export function UserMenu({ name, email, settingsPath, onSignOut }: UserMenuProps) {
  const navigate = useNavigate();
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <DropdownMenu>
    <DropdownMenuTrigger className="flex items-center gap-2 rounded-full" aria-label="Menú de usuario"><Avatar size="sm"><AvatarFallback>{initials}</AvatarFallback></Avatar><span className="hidden text-sm font-medium sm:inline">{name}</span></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel><div className="flex flex-col"><span>{name}</span><span className="text-xs font-normal text-muted-foreground">{email}</span></div></DropdownMenuLabel>
      {settingsPath && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => navigate(settingsPath)}><Settings className="size-4" />Configuración</DropdownMenuItem></>}
      <DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => void onSignOut()}><LogOut className="size-4" />Cerrar sesión</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
