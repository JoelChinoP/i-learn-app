import { useState } from 'react';
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
  const [signingOut, setSigningOut] = useState(false);
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await onSignOut();
      navigate('/auth', { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return <DropdownMenu>
    <DropdownMenuTrigger className="flex items-center gap-2 rounded-full" aria-label="Menú de usuario"><Avatar size="sm"><AvatarFallback>{initials}</AvatarFallback></Avatar><span className="hidden text-sm font-medium sm:inline">{name}</span></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel><div className="flex flex-col"><span>{name}</span><span className="text-xs font-normal text-muted-foreground">{email}</span></div></DropdownMenuLabel>
      {settingsPath && <><DropdownMenuSeparator /><DropdownMenuItem className="cursor-pointer" onClick={() => navigate(settingsPath)}><Settings className="size-4" />Configuración</DropdownMenuItem></>}
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer" variant="destructive" aria-disabled={signingOut} onClick={() => void handleSignOut()}><LogOut className="size-4" />{signingOut ? 'Cerrando…' : 'Cerrar sesión'}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
