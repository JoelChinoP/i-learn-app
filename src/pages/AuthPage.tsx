import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LoopLogo } from '../components/shared/LoopLogo';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth, rolePath } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Role } from '../lib/types';

export function AuthPage() {
  const { profile, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role>('alumno');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [classCode, setClassCode] = useState('MAT-DEMO-2026');
  const [studentLinkCode, setStudentLinkCode] = useState('');
  const [instructorCode, setInstructorCode] = useState('');
  const [consent, setConsent] = useState(false);

  if (!authLoading && profile) return <Navigate to={rolePath(profile.role)} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.functions.invoke('register-account', {
          body: { email, password, fullName, role, classCode, studentLinkCode, instructorCode, acceptConsent: consent },
        });
        if (error || data?.status !== 'registered') throw new Error(data?.error_code ?? error?.message ?? 'REGISTER_FAILED');
        if (data.student_link_code) {
          localStorage.setItem('aprendo.studentLinkCode', data.student_link_code);
          toast.success(`Cuenta creada. Código para tu tutor: ${data.student_link_code}`, { duration: 12_000 });
        } else toast.success('Cuenta creada');
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la operación');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          'radial-gradient(60% 60% at 50% 20%, rgba(77,52,182,0.35) 0%, rgba(0,0,0,0) 60%), radial-gradient(40% 40% at 80% 90%, rgba(156,255,15,0.10) 0%, rgba(0,0,0,0) 65%), #000',
      }}
    >
      <Card className="loop-fade-up w-full max-w-md rounded-2xl border border-[#56358C] bg-[#162E84]/85 backdrop-blur">
        <CardHeader className="text-center">
          <LoopLogo
            className={`mx-auto mb-3 ${mode === 'login' ? 'loop-login-logo w-64 sm:w-72' : 'w-48'}`}
          />
          <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#9CFF0F]">
            Loop · aprende en bucle
          </div>
          <CardTitle
            className="mt-2 text-3xl tracking-[0.12em] text-white"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {mode === 'login' ? 'INGRESAR' : 'CREAR CUENTA'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {mode === 'register' && <>
              <div className="space-y-1.5"><Label htmlFor="name">Nombre completo</Label><Input id="name" value={fullName} onChange={(event: ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)} required /></div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Rol</Label>
                <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="alumno">Alumno</option><option value="padre">Padre / Tutor</option><option value="instructor">Instructor</option>
                </select>
              </div>
              {(role === 'alumno' || role === 'instructor') && <div className="space-y-1.5"><Label htmlFor="class-code">Código de sección</Label><Input id="class-code" value={classCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setClassCode(event.target.value)} required /></div>}
              {role === 'padre' && <>
                <div className="space-y-1.5"><Label htmlFor="student-code">Código del alumno</Label><Input id="student-code" value={studentLinkCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setStudentLinkCode(event.target.value)} required /></div>
                <label className="flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={(value: boolean) => setConsent(value === true)} /><span>Acepto el consentimiento tutorial demo-v1 para procesar las respuestas académicas.</span></label>
              </>}
              {role === 'instructor' && <div className="space-y-1.5"><Label htmlFor="instructor-code">Código privado de instructor</Label><Input id="instructor-code" type="password" value={instructorCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setInstructorCode(event.target.value)} required /></div>}
            </>}
            <div className="space-y-1.5"><Label htmlFor="email">Correo</Label><Input id="email" type="email" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" minLength={8} value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} required /></div>
            <Button className="w-full" type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}{mode === 'login' ? 'Ingresar' : 'Registrarme'}</Button>
          </form>
          <button type="button" className="mt-5 w-full text-sm text-primary hover:underline" onClick={() => setMode((value) => value === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo una cuenta'}
          </button>
          <p className="mt-4 text-center text-xs text-white/45">Demo local: las cuentas se confirman automáticamente y no existe recuperación por correo.</p>
        </CardContent>
      </Card>
    </main>
  );
}
