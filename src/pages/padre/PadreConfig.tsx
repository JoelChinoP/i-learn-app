import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { supabase } from '../../lib/supabase';

export function PadreConfig() {
  const [password, setPassword] = useState('');
  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    setPassword('');
    toast.success('Contraseña actualizada');
  }
  return <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8"><PageHeader title="Configuración" description="El dashboard académico es de solo lectura." breadcrumbs={[{ label: 'Padre / Tutor', to: '/padre' }, { label: 'Configuración' }]} /><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Seguridad de la cuenta</CardTitle></CardHeader><CardContent className="space-y-3"><Label htmlFor="new-password">Nueva contraseña</Label><Input id="new-password" type="password" minLength={8} value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} /><Button disabled={password.length < 8} onClick={() => void updatePassword()}>Cambiar contraseña</Button><p className="text-xs text-muted-foreground">Las preferencias académicas, notas y mensajes no forman parte de este demo de solo lectura.</p></CardContent></Card></main>;
}
