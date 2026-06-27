import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { LoopMascot } from './LoopMascot';

export interface SidebarLink {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

interface AppShellProps {
  user: { name: string; email: string };
  roleLabel: string;
  settingsPath?: string;
  profilePath?: string;
  sidebar?: SidebarLink[];
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function AppShell({ user, roleLabel, settingsPath, profilePath, sidebar, onSignOut, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-full w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-[#56358C]/40 bg-black/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          {sidebar && (
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg text-white/70 hover:text-white lg:hidden"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <LoopMascot size={34} mood="idle" />
            <span
              className="text-xl tracking-[0.32em] text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              LOOP
            </span>
          </div>
          <span className="rounded-full border border-[#56358C] bg-[#38123B] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CFF0F]">
            {roleLabel}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <UserMenu name={user.name} email={user.email} settingsPath={settingsPath} profilePath={profilePath} onSignOut={onSignOut} />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        {sidebar && (
          <>
            <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-[#56358C]/30 bg-black/60 p-3 lg:block">
              <SidebarNav links={sidebar} />
            </aside>
            {mobileOpen && (
              <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
                <div className="absolute inset-y-0 left-0 w-64 border-r border-[#56358C] bg-black p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="font-semibold text-white">Menú</span>
                    <button type="button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" className="text-white/70">
                      <X className="size-4" />
                    </button>
                  </div>
                  <SidebarNav links={sidebar} onNavigate={() => setMobileOpen(false)} />
                </div>
              </div>
            )}
          </>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SidebarNav({ links, onNavigate }: { links: SidebarLink[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="Secciones">
      <ul className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#38123B] text-[#9CFF0F] ring-1 ring-[#56358C]'
                    : 'text-white/65 hover:bg-[#38123B]/60 hover:text-white'
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
