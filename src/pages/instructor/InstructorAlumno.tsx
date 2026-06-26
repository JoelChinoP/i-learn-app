import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Plus,
  MessageSquare } from
'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
'../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
'../../components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'../../components/ui/Select';
import { PageHeader } from '../../components/shared/PageHeader';
import { TrendChart } from '../../components/shared/TrendChart';
import { MasteryBar } from '../../components/shared/MasteryBar';
import { EmptyState } from '../../components/shared/EmptyState';
import {
  MOCK_INSTRUCTOR_DETAIL,
  MOCK_STUDENT_HISTORY,
  MOCK_STUDENT_ANSWERS,
  TOPICS,
  MOCK_ALUMNO_HISTORY } from
'../../data/mock';
export function InstructorAlumno() {
  const { alias = '' } = useParams();
  const studentAlias = decodeURIComponent(alias);
  const navigate = useNavigate();
  const detail = MOCK_INSTRUCTOR_DETAIL[studentAlias] ?? [];
  const history = MOCK_STUDENT_HISTORY[studentAlias] ?? MOCK_ALUMNO_HISTORY;
  const answers = MOCK_STUDENT_ANSWERS[studentAlias] ?? [];
  const [note, setNote] = useState('');
  const [assignTopic, setAssignTopic] = useState<string>(TOPICS[0]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  if (!detail.length && !history.length) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          title="Alumno no encontrado"
          description="No hay datos para este alumno."
          action={
          <Button onClick={() => navigate('/instructor')}>
              Volver al panel
            </Button>
          } />
        
      </main>);

  }
  function assignReinforcement() {
    // TODO: guardar la asignación real (backend).
    setAssignDialogOpen(false);
    toast.success(`Refuerzo de ${assignTopic} asignado a ${studentAlias}`);
  }
  function saveNote() {
    // TODO: persistir anotación del instructor (backend).
    toast.success('Anotación guardada');
  }
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={studentAlias}
        description="Historial completo, respuestas y progreso en el tiempo."
        breadcrumbs={[
        {
          label: 'Instructor',
          to: '/instructor'
        },
        {
          label: 'Panel',
          to: '/instructor'
        },
        {
          label: studentAlias
        }]
        }
        actions={
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Asignar refuerzo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar refuerzo</DialogTitle>
                <DialogDescription>
                  Elegí un tema para asignarle práctica adicional a{' '}
                  {studentAlias}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label>Tema</Label>
                <Select value={assignTopic} onValueChange={setAssignTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) =>
                  <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={assignReinforcement}>Asignar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      

      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/instructor')}>
        
        <ArrowLeft className="size-4" /> Volver al panel
      </Button>

      <div className="space-y-6">
        {/* Progreso por tema */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dominio por tema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {detail.map((d) =>
            <MasteryBar key={d.topic} topic={d.topic} mastery={d.mastery} />
            )}
          </CardContent>
        </Card>

        {/* Tendencia en el tiempo */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progreso en el tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={history}
              ariaLabel={`Progreso de ${studentAlias} en el tiempo`} />
            
          </CardContent>
        </Card>

        {/* Respuestas y explicaciones recibidas */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Respuestas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {answers.length === 0 ?
            <p className="py-2 text-sm text-muted-foreground">
                Sin respuestas registradas aún.
              </p> :

            <ul className="divide-y divide-border">
                {answers.map((a) =>
              <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      {a.correct ?
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true" /> :


                  <XCircle
                    className="mt-0.5 size-4 shrink-0 text-red-600"
                    aria-hidden="true" />

                  }
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {a.question}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Explicación recibida:{' '}
                          </span>
                          {a.explanation}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(a.date), "d 'de' MMM, HH:mm", {
                        locale: es
                      })}
                        </p>
                      </div>
                    </div>
                  </li>
              )}
              </ul>
            }
          </CardContent>
        </Card>

        {/* Anotaciones del instructor */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4" aria-hidden="true" />{' '}
              Anotaciones (solo visibles para vos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Notas privadas sobre este alumno…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3} />
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveNote}
              disabled={!note.trim()}>
              
              Guardar anotación
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>);

}