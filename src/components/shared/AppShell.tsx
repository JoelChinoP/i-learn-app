import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

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
  sidebar?: SidebarLink[];
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function AppShell({ user, roleLabel, settingsPath, sidebar, onSignOut, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-full w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          {sidebar && <button type="button" className="flex size-9 items-center justify-center rounded-lg lg:hidden" aria-label="Abrir menú" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></button>}
          <div className="flex items-center gap-2"><div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkle /></div><span className="text-sm font-semibold">Aprendo</span></div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{roleLabel}</span>
          <div className="ml-auto flex items-center gap-2"><ThemeToggle /><UserMenu name={user.name} email={user.email} settingsPath={settingsPath} onSignOut={onSignOut} /></div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        {sidebar && <>
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border p-3 lg:block"><SidebarNav links={sidebar} /></aside>
          {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 border-r bg-background p-3 shadow-xl"><div className="mb-2 flex items-center justify-between px-2"><span className="font-semibold">Menú</span><button type="button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X className="size-4" /></button></div><SidebarNav links={sidebar} onNavigate={() => setMobileOpen(false)} /></div>
          </div>}
        </>}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SidebarNav({ links, onNavigate }: { links: SidebarLink[]; onNavigate?: () => void }) {
  return <nav aria-label="Secciones"><ul className="space-y-1">{links.map(({ to, label, icon: Icon, end }) => <li key={to}><NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><Icon className="size-4" />{label}</NavLink></li>)}</ul></nav>;
}

function Sparkle() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z" /></svg>;
}
