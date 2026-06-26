import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { supabase } from '../../lib/supabase';
import { useInstructorData } from './useInstructorData';

export function InstructorConfig() {
  const { data } = useInstructorData();
  const [password, setPassword] = useState('');
  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    setPassword(''); toast.success('Contraseña actualizada');
  }
  return <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"><PageHeader title="Configuración" description="Información de cuenta y secciones asignadas." breadcrumbs={[{ label: 'Instructor', to: '/instructor' }, { label: 'Configuración' }]} /><div className="space-y-6"><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Secciones de solo lectura</CardTitle></CardHeader><CardContent>{data.sections.length ? <ul className="list-disc pl-5 text-sm">{data.sections.map((section) => <li key={section.id}>{section.name}</li>)}</ul> : <p className="text-sm text-muted-foreground">Sin secciones asignadas.</p>}</CardContent></Card><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Cambiar contraseña</CardTitle></CardHeader><CardContent className="space-y-3"><Label htmlFor="instructor-password">Nueva contraseña</Label><Input id="instructor-password" type="password" minLength={8} value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} /><Button disabled={password.length < 8} onClick={() => void updatePassword()}>Actualizar</Button></CardContent></Card></div></main>;
}
