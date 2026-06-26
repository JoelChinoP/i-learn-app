import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { GraduationCap, Users, LayoutDashboard, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
export interface SidebarLink {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}
interface AppShellProps {
  user: {
    name: string;
    email: string;
  };
  settingsPath?: string;
  sidebar?: SidebarLink[];
  children: React.ReactNode;
}
const ROLES = [
{
  to: '/alumno',
  label: 'Alumno',
  icon: GraduationCap
},
{
  to: '/padre',
  label: 'Padre / Tutor',
  icon: Users
},
{
  to: '/instructor',
  label: 'Instructor',
  icon: LayoutDashboard
}];

/**
 * Armazón compartido por las 3 vistas: topbar (logo, switch de rol, campana,
 * tema, usuario) + sidebar opcional para sub-pantallas (Padre, Instructor).
 */
export function AppShell({
  user,
  settingsPath,
  sidebar,
  children
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const activeRole = ROLES.find((r) => location.pathname.startsWith(r.to));
  return (
    <div className="flex min-h-full w-full flex-col bg-background font-heading text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          {sidebar &&
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}>
            
              <Menu className="size-5" />
            </button>
          }

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkle />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Aprendo
            </span>
          </div>

          {/* Switch de rol (centro) */}
          <nav aria-label="Cambiar de vista" className="ml-2 hidden md:block">
            <ul className="flex items-center gap-1 rounded-full bg-muted p-1">
              {ROLES.map(({ to, label, icon: Icon }) =>
              <li key={to}>
                  <NavLink
                  to={to}
                  className={() =>
                  `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeRole?.to === to ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
                  }>
                  
                    <Icon className="size-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{label}</span>
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu
              name={user.name}
              email={user.email}
              settingsPath={settingsPath} />
            
          </div>
        </div>

        {/* Switch de rol — mobile */}
        <nav
          aria-label="Cambiar de vista"
          className="border-t border-border px-3 py-2 md:hidden">
          
          <ul className="flex items-center justify-around">
            {ROLES.map(({ to, label, icon: Icon }) =>
            <li key={to}>
                <NavLink
                to={to}
                className={() =>
                `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] font-medium ${activeRole?.to === to ? 'text-primary' : 'text-muted-foreground'}`
                }>
                
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        {sidebar &&
        <>
            {/* Sidebar — escritorio */}
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border p-3 lg:block">
              <SidebarNav links={sidebar} />
            </aside>

            {/* Sidebar — drawer mobile */}
            {mobileOpen &&
          <div
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true">
            
                <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)} />
            
                <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-background p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-sm font-semibold">Menú</span>
                    <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                  aria-label="Cerrar menú">
                  
                      <X className="size-4" />
                    </button>
                  </div>
                  <SidebarNav
                links={sidebar}
                onNavigate={() => setMobileOpen(false)} />
              
                </div>
              </div>
          }
          </>
        }

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>);

}
function SidebarNav({
  links,
  onNavigate



}: {links: SidebarLink[];onNavigate?: () => void;}) {
  return (
    <nav aria-label="Secciones">
      <ul className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) =>
        <li key={to}>
            <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`
            }>
            
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        )}
      </ul>
    </nav>);

}
function Sparkle() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
      aria-hidden="true">
      
      <path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z" />
    </svg>);

}