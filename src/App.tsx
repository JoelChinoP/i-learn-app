import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './lib/theme';
import { TooltipProvider } from './components/ui/Tooltip';
import { Toaster } from './components/ui/Sonner';
import { AppShell, type SidebarLink } from './components/shared/AppShell';
import { LayoutDashboard, LineChart, Settings, BarChart3 } from 'lucide-react';
import { AlumnoView } from './pages/AlumnoView';
import { PadreDashboard } from './pages/padre/PadreDashboard';
import { PadreDetalle } from './pages/padre/PadreDetalle';
import { PadreConfig } from './pages/padre/PadreConfig';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorAlumno } from './pages/instructor/InstructorAlumno';
import { InstructorConfig } from './pages/instructor/InstructorConfig';
const PADRE_SIDEBAR: SidebarLink[] = [
{
  to: '/padre',
  label: 'Resumen',
  icon: LayoutDashboard,
  end: true
},
{
  to: '/padre/detalle',
  label: 'Detalle y tendencia',
  icon: LineChart
},
{
  to: '/padre/config',
  label: 'Configuración',
  icon: Settings
}];

const INSTRUCTOR_SIDEBAR: SidebarLink[] = [
{
  to: '/instructor',
  label: 'Panel',
  icon: BarChart3,
  end: true
},
{
  to: '/instructor/config',
  label: 'Configuración',
  icon: Settings
}];

function AlumnoLayout({ children }: {children: React.ReactNode;}) {
  return (
    <AppShell
      user={{
        name: 'Valeria',
        email: 'valeria@aprendo.edu'
      }}>
      
      {children}
    </AppShell>);

}
function PadreLayout({ children }: {children: React.ReactNode;}) {
  return (
    <AppShell
      user={{
        name: 'Carla Pérez',
        email: 'carla@familia.com'
      }}
      settingsPath="/padre/config"
      sidebar={PADRE_SIDEBAR}>
      
      {children}
    </AppShell>);

}
function InstructorLayout({ children }: {children: React.ReactNode;}) {
  return (
    <AppShell
      user={{
        name: 'Prof. Gómez',
        email: 'gomez@aprendo.edu'
      }}
      settingsPath="/instructor/config"
      sidebar={INSTRUCTOR_SIDEBAR}>
      
      {children}
    </AppShell>);

}
function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster theme={theme} position="bottom-right" richColors closeButton />);

}
export function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/alumno" replace />} />

            <Route
              path="/alumno"
              element={
              <AlumnoLayout>
                  <AlumnoView />
                </AlumnoLayout>
              } />
            

            <Route
              path="/padre"
              element={
              <PadreLayout>
                  <PadreDashboard />
                </PadreLayout>
              } />
            
            <Route
              path="/padre/detalle"
              element={
              <PadreLayout>
                  <PadreDetalle />
                </PadreLayout>
              } />
            
            <Route
              path="/padre/config"
              element={
              <PadreLayout>
                  <PadreConfig />
                </PadreLayout>
              } />
            

            <Route
              path="/instructor"
              element={
              <InstructorLayout>
                  <InstructorDashboard />
                </InstructorLayout>
              } />
            
            <Route
              path="/instructor/alumno/:alias"
              element={
              <InstructorLayout>
                  <InstructorAlumno />
                </InstructorLayout>
              } />
            
            <Route
              path="/instructor/config"
              element={
              <InstructorLayout>
                  <InstructorConfig />
                </InstructorLayout>
              } />
            

            <Route path="*" element={<Navigate to="/alumno" replace />} />
          </Routes>
          <ThemedToaster />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>);

}