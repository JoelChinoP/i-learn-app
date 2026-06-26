import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LineChart, Settings } from 'lucide-react';
import { AuthProvider, rolePath, useAuth } from './lib/auth';
import type { Role } from './lib/types';
import { ThemeProvider, useTheme } from './lib/theme';
import { TooltipProvider } from './components/ui/Tooltip';
import { Toaster } from './components/ui/Sonner';
import { AppShell, type SidebarLink } from './components/shared/AppShell';
import { AuthPage } from './pages/AuthPage';
import { AlumnoView } from './pages/AlumnoView';
import { PadreDashboard } from './pages/padre/PadreDashboard';
import { PadreDetalle } from './pages/padre/PadreDetalle';
import { PadreConfig } from './pages/padre/PadreConfig';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorAlumno } from './pages/instructor/InstructorAlumno';
import { InstructorConfig } from './pages/instructor/InstructorConfig';

const PADRE_SIDEBAR: SidebarLink[] = [
  { to: '/padre', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/padre/detalle', label: 'Detalle y tendencia', icon: LineChart },
  { to: '/padre/config', label: 'Configuración', icon: Settings },
];
const INSTRUCTOR_SIDEBAR: SidebarLink[] = [
  { to: '/instructor', label: 'Panel', icon: BarChart3, end: true },
  { to: '/instructor/config', label: 'Configuración', icon: Settings },
];

function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Cargando sesión…</div>;
  if (!profile) return <Navigate to="/auth" replace />;
  if (profile.role !== role) return <Navigate to={rolePath(profile.role)} replace />;
  return <>{children}</>;
}

function RoleLayout({ role, sidebar, children }: { role: Role; sidebar?: SidebarLink[]; children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  if (!profile) return null;
  const label = role === 'alumno' ? 'Alumno' : role === 'padre' ? 'Padre / Tutor' : 'Instructor';
  return <AppShell user={{ name: profile.full_name, email: profile.email }} roleLabel={label} settingsPath={role === 'alumno' ? undefined : `/${role}/config`} sidebar={sidebar} onSignOut={signOut}>{children}</AppShell>;
}

function RootRedirect() {
  const { loading, profile } = useAuth();
  if (loading) return null;
  return <Navigate to={profile ? rolePath(profile.role) : '/auth'} replace />;
}

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}

export function App() {
  return <ThemeProvider><TooltipProvider delayDuration={200}><AuthProvider><BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/alumno" element={<RequireRole role="alumno"><RoleLayout role="alumno"><AlumnoView /></RoleLayout></RequireRole>} />
      <Route path="/padre" element={<RequireRole role="padre"><RoleLayout role="padre" sidebar={PADRE_SIDEBAR}><PadreDashboard /></RoleLayout></RequireRole>} />
      <Route path="/padre/detalle" element={<RequireRole role="padre"><RoleLayout role="padre" sidebar={PADRE_SIDEBAR}><PadreDetalle /></RoleLayout></RequireRole>} />
      <Route path="/padre/config" element={<RequireRole role="padre"><RoleLayout role="padre" sidebar={PADRE_SIDEBAR}><PadreConfig /></RoleLayout></RequireRole>} />
      <Route path="/instructor" element={<RequireRole role="instructor"><RoleLayout role="instructor" sidebar={INSTRUCTOR_SIDEBAR}><InstructorDashboard /></RoleLayout></RequireRole>} />
      <Route path="/instructor/alumno/:studentId" element={<RequireRole role="instructor"><RoleLayout role="instructor" sidebar={INSTRUCTOR_SIDEBAR}><InstructorAlumno /></RoleLayout></RequireRole>} />
      <Route path="/instructor/config" element={<RequireRole role="instructor"><RoleLayout role="instructor" sidebar={INSTRUCTOR_SIDEBAR}><InstructorConfig /></RoleLayout></RequireRole>} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
    <ThemedToaster />
  </BrowserRouter></AuthProvider></TooltipProvider></ThemeProvider>;
}
