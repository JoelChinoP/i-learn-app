import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, FileText, Link2, Loader2, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import {
  AiFunctionError,
  generateQuestions,
  ingestCourseContent,
  LLM_PROVIDER_LABEL,
  listInstructorContent,
  listInstructorDrafts,
  reviewDraft
} from '../../lib/aiQuestions';
import { useInstructorData } from './useInstructorData';
import type {
  AiDraftQuestion,
  CourseContent,
  CourseContentSourceType,
  DraftReviewEdits,
  LlmProviderId
} from '../../lib/types';

type StatusFilter = 'all' | AiDraftQuestion['status'];

const STATUS_BADGE: Record<AiDraftQuestion['status'], string> = {
  draft: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800'
};

const STATUS_LABEL: Record<AiDraftQuestion['status'], string> = {
  draft: 'Pendiente de revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada'
};

export function InstructorContenido() {
  const { data, loading } = useInstructorData();
  const section = data.sections[0] ?? null;

  const [contents, setContents] = useState<CourseContent[]>([]);
  const [drafts, setDrafts] = useState<AiDraftQuestion[]>([]);
  const [loadingContents, setLoadingContents] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('draft');

  const reload = useCallback(async (sectionId: string) => {
    setLoadingContents(true);
    setLoadingDrafts(true);
    try {
      const [c, d] = await Promise.all([listInstructorContent(sectionId), listInstructorDrafts(sectionId)]);
      setContents(c);
      setDrafts(d);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingContents(false);
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => {
    if (section) void reload(section.id);
  }, [section, reload]);

  const filteredDrafts = useMemo(() => {
    if (statusFilter === 'all') return drafts;
    return drafts.filter((draft) => draft.status === statusFilter);
  }, [drafts, statusFilter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Contenido y generación con IA"
        description="Sube material del curso y genera borradores de preguntas. Cada borrador requiere tu aprobación antes de llegar al alumno."
        breadcrumbs={[{ label: 'Instructor', to: '/instructor' }, { label: 'Contenido' }]}
      />

      {loading && <Skeleton className="h-32 rounded-2xl" />}
      {!loading && !section && (
        <EmptyState
          title="Aún no tienes una sección asignada"
          description="Pide al administrador que te asigne a una sección para empezar a generar contenido."
        />
      )}
      {section && (
        <div className="space-y-6">
          <ContentUploadSection sectionId={section.id} onUploaded={() => void reload(section.id)} />
          <ContentList contents={contents} loading={loadingContents} />
          <GenerateSection
            sectionId={section.id}
            contents={contents}
            onGenerated={() => void reload(section.id)}
          />
          <DraftQueue
            drafts={filteredDrafts}
            allDrafts={drafts}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            loading={loadingDrafts}
            onChanged={() => void reload(section.id)}
          />
        </div>
      )}
    </main>
  );
}

// ============================================================================
// Sub-componentes
// ============================================================================

interface ContentUploadSectionProps {
  sectionId: string;
  onUploaded: () => void;
}

function ContentUploadSection({ sectionId, onUploaded }: ContentUploadSectionProps) {
  const [sourceType, setSourceType] = useState<CourseContentSourceType>('text');
  const [topic, setTopic] = useState('');
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [pdf, setPdf] = useState<{ name: string; base64: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setText('');
    setUrl('');
    setPdf(null);
    setLabel('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
      reader.onload = () => {
        const result = reader.result as string;
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function onPdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPdf(null);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('El PDF supera 8 MB. Súbelo a Storage y pega la URL.');
      event.target.value = '';
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      setPdf({ name: file.name, base64 });
      if (!label) setLabel(file.name);
    } catch {
      toast.error('No se pudo leer el archivo');
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || !label.trim()) {
      toast.error('Completa el tema y la etiqueta del material');
      return;
    }
    if (sourceType === 'text' && text.trim().length < 20) {
      toast.error('El texto debe tener al menos 20 caracteres');
      return;
    }
    if (sourceType === 'url' && !/^https?:\/\//i.test(url.trim())) {
      toast.error('La URL debe empezar con http:// o https://');
      return;
    }
    if (sourceType === 'pdf' && !pdf) {
      toast.error('Adjunta un PDF');
      return;
    }
    setSubmitting(true);
    try {
      const response = await ingestCourseContent({
        section_id: sectionId,
        topic: topic.trim(),
        source_type: sourceType,
        source_label: label.trim(),
        raw_text: sourceType === 'text' ? text : undefined,
        source_url: sourceType === 'url' ? url.trim() : undefined,
        pdf_base64: sourceType === 'pdf' ? pdf?.base64 : undefined,
        pdf_mime_type: 'application/pdf'
      });
      toast.success(`Contenido listo (${response.chars.toLocaleString('es')} caracteres)`);
      reset();
      onUploaded();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-4" />
          Subir contenido del curso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block">Fuente</Label>
              <div className="flex gap-1 rounded-lg border p-1 text-sm">
                {(['text', 'url', 'pdf'] as const).map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setSourceType(opt)}
                    className={`flex-1 rounded-md px-2 py-1 transition-colors ${
                      sourceType === opt ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {opt === 'text' ? 'Texto' : opt === 'url' ? 'URL' : 'PDF'}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="content-topic" className="mb-1.5 block">Tema</Label>
              <Input
                id="content-topic"
                value={topic}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                placeholder="Ej. Fracciones"
                list="topic-suggestions"
              />
              <datalist id="topic-suggestions">
                <option value="Fracciones" />
                <option value="Números enteros" />
                <option value="Geometría" />
                <option value="Decimales" />
                <option value="Porcentajes" />
              </datalist>
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="content-label" className="mb-1.5 block">Etiqueta</Label>
              <Input
                id="content-label"
                value={label}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
                placeholder="Ej. Guía capítulo 3"
              />
            </div>
          </div>

          {sourceType === 'text' && (
            <div>
              <Label htmlFor="content-text" className="mb-1.5 block">Texto</Label>
              <Textarea
                id="content-text"
                value={text}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                rows={6}
                placeholder="Pega aquí el contenido del curso..."
              />
            </div>
          )}
          {sourceType === 'url' && (
            <div>
              <Label htmlFor="content-url" className="mb-1.5 block">URL</Label>
              <Input
                id="content-url"
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="https://..."
                inputMode="url"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                El servidor hará GET y limpiará el HTML. PDFs por URL no son soportados en MVP.
              </p>
            </div>
          )}
          {sourceType === 'pdf' && (
            <div>
              <Label htmlFor="content-pdf" className="mb-1.5 block">Archivo PDF (máx. 8 MB)</Label>
              <Input
                id="content-pdf"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e: ChangeEvent<HTMLInputElement>) => void onPdfChange(e)}
              />
              {pdf && (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="size-3" /> {pdf.name} — listo para enviar
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={reset}>
              Limpiar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Subir contenido
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ContentList({ contents, loading }: { contents: CourseContent[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-32 rounded-2xl" />;
  if (contents.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            Contenido subido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no has subido material. Empieza con la tarjeta de arriba — el contenido que subas será la base para generar preguntas.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" />
          Contenido subido ({contents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {contents.map((content) => (
          <ContentRow key={content.id} content={content} />
        ))}
      </CardContent>
    </Card>
  );
}

function ContentRow({ content }: { content: CourseContent }) {
  const statusClass =
    content.extracted_status === 'ready'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800'
      : content.extracted_status === 'failed'
      ? 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800'
      : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800';
  const sourceIcon = content.source_type === 'url' ? Link2 : FileText;
  const SourceIcon = sourceIcon;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <SourceIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate font-medium">{content.source_label}</span>
        <span className="text-xs text-muted-foreground">· {content.topic}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${statusClass}`}>
          {content.extracted_status}
        </span>
        <span className="text-xs text-muted-foreground">
          {content.processed_at
            ? formatDistanceToNow(new Date(content.processed_at), { addSuffix: true, locale: es })
            : 'pendiente'}
        </span>
      </div>
    </div>
  );
}

interface GenerateSectionProps {
  sectionId: string;
  contents: CourseContent[];
  onGenerated: () => void;
}

function GenerateSection({ sectionId, contents, onGenerated }: GenerateSectionProps) {
  const availableTopics = useMemo(() => {
    const set = new Set(contents.filter((c) => c.extracted_status === 'ready').map((c) => c.topic));
    return Array.from(set);
  }, [contents]);

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [count, setCount] = useState(3);
  const [provider, setProvider] = useState<LlmProviderId | 'auto'>('auto');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!topic && availableTopics.length > 0) setTopic(availableTopics[0]);
  }, [availableTopics, topic]);

  async function onGenerate() {
    if (!topic) {
      toast.error('Elige un tema que tenga contenido subido.');
      return;
    }
    setGenerating(true);
    try {
      const response = await generateQuestions({
        section_id: sectionId,
        topic,
        difficulty_level: difficulty,
        count,
        provider: provider === 'auto' ? undefined : provider,
        preferred_question_type: 'mixed'
      });
      toast.success(
        `${response.created} borrador(es) creados con ${LLM_PROVIDER_LABEL[response.provider]} (${response.model}).`
      );
      onGenerated();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="size-4" />
          Generar borradores con IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {availableTopics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Necesitas al menos un contenido subido y procesado para generar preguntas.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <Label htmlFor="gen-topic" className="mb-1.5 block">Tema</Label>
              <select
                id="gen-topic"
                value={topic}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTopic(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="gen-difficulty" className="mb-1.5 block">Dificultad</Label>
              <select
                id="gen-difficulty"
                value={difficulty}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setDifficulty(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    {d} — {['muy fácil', 'fácil', 'medio', 'desafiante', 'avanzado'][d - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="gen-count" className="mb-1.5 block">Cantidad</Label>
              <Input
                id="gen-count"
                type="number"
                min={1}
                max={8}
                value={count}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCount(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
              />
            </div>
            <div>
              <Label htmlFor="gen-provider" className="mb-1.5 block">Proveedor</Label>
              <select
                id="gen-provider"
                value={provider}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setProvider(e.target.value as LlmProviderId | 'auto')}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="auto">Por defecto</option>
                <option value="gemini">Gemini</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void onGenerate()} disabled={generating || availableTopics.length === 0}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generar borradores
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DraftQueueProps {
  drafts: AiDraftQuestion[];
  allDrafts: AiDraftQuestion[];
  statusFilter: StatusFilter;
  onFilterChange: (status: StatusFilter) => void;
  loading: boolean;
  onChanged: () => void;
}

function DraftQueue({ drafts, allDrafts, statusFilter, onFilterChange, loading, onChanged }: DraftQueueProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Cola de revisión ({allDrafts.length})
        </CardTitle>
        <div className="flex gap-1 rounded-lg border p-1 text-xs">
          {(['draft', 'approved', 'rejected', 'all'] as const).map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => onFilterChange(opt)}
              className={`rounded-md px-2 py-1 transition-colors ${
                statusFilter === opt ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {opt === 'all' ? 'Todas' : STATUS_LABEL[opt]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading && <Skeleton className="h-32 rounded-xl" />}
        {!loading && drafts.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay borradores en este filtro.</p>
        )}
        {!loading && drafts.length > 0 && (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <DraftRow key={draft.id} draft={draft} onChanged={onChanged} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DraftRow({ draft, onChanged }: { draft: AiDraftQuestion; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [editPrompt, setEditPrompt] = useState(draft.prompt);
  const [editCorrect, setEditCorrect] = useState(draft.correct_answer);
  const [editRubric, setEditRubric] = useState(draft.expected_answer_or_rubric);
  const [editOptions, setEditOptions] = useState((draft.options ?? []).join('\n'));

  async function approve(edits?: DraftReviewEdits) {
    setBusy('approve');
    try {
      const response = await reviewDraft({
        draft_id: draft.id,
        decision: 'approve',
        edits
      });
      toast.success(
        response.question_id
          ? `Aprobada (id ${response.question_id.slice(0, 8)}…). Quedó inactiva: actívala después desde el banco.`
          : 'Aprobada.'
      );
      setEditing(false);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy('reject');
    try {
      await reviewDraft({ draft_id: draft.id, decision: 'reject' });
      toast.success('Borrador descartado.');
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  const isPending = draft.status === 'draft';

  return (
    <li className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STATUS_BADGE[draft.status]}`}>
              {STATUS_LABEL[draft.status]}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {draft.topic} · dificultad {draft.difficulty_level}/5
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {draft.question_type === 'opcion_multiple' ? 'Opción múltiple' : 'Texto libre'}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {LLM_PROVIDER_LABEL[draft.generation_provider]} · {draft.generation_model}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium leading-snug">{draft.prompt}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Ocultar' : 'Ver más'}
          </Button>
          {isPending && (
            <>
              <Button size="sm" onClick={() => void approve()} disabled={busy !== null}>
                {busy === 'approve' ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Aprobar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} disabled={busy !== null}>
                Editar y aprobar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void reject()} disabled={busy !== null}>
                {busy === 'reject' ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                Rechazar
              </Button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 rounded-lg bg-muted/30 p-3 text-xs">
          {draft.question_type === 'opcion_multiple' && draft.options && (
            <div>
              <p className="font-semibold text-muted-foreground">Opciones:</p>
              <ul className="mt-1 list-disc pl-5">
                {draft.options.map((opt, i) => (
                  <li key={i} className={opt === draft.correct_answer ? 'font-semibold text-emerald-700 dark:text-emerald-300' : ''}>
                    {opt} {opt === draft.correct_answer && <span className="text-[10px]">✓ correcta</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {draft.question_type === 'texto_libre' && (
            <div>
              <p className="font-semibold text-muted-foreground">Respuesta esperada:</p>
              <p className="mt-1">{draft.correct_answer}</p>
            </div>
          )}
          <div>
            <p className="font-semibold text-muted-foreground">Rúbrica / explicación:</p>
            <p className="mt-1 whitespace-pre-wrap">{draft.expected_answer_or_rubric}</p>
          </div>
          {draft.knowledge_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {draft.knowledge_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          {draft.review_notes && (
            <div className="rounded bg-background px-2 py-1 text-[11px] italic text-muted-foreground">
              Notas del revisor: {draft.review_notes}
            </div>
          )}
        </div>
      )}

      {editing && isPending && (
        <div className="mt-3 space-y-3 rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Editar antes de aprobar</p>
          <div>
            <Label htmlFor={`edit-prompt-${draft.id}`} className="mb-1 block">Pregunta</Label>
            <Textarea
              id={`edit-prompt-${draft.id}`}
              rows={3}
              value={editPrompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditPrompt(e.target.value)}
            />
          </div>
          {draft.question_type === 'opcion_multiple' && (
            <div>
              <Label htmlFor={`edit-options-${draft.id}`} className="mb-1 block">Opciones (una por línea)</Label>
              <Textarea
                id={`edit-options-${draft.id}`}
                rows={4}
                value={editOptions}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditOptions(e.target.value)}
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`edit-correct-${draft.id}`} className="mb-1 block">Respuesta correcta</Label>
              <Input
                id={`edit-correct-${draft.id}`}
                value={editCorrect}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEditCorrect(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`edit-rubric-${draft.id}`} className="mb-1 block">Rúbrica</Label>
              <Textarea
                id={`edit-rubric-${draft.id}`}
                rows={3}
                value={editRubric}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditRubric(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={busy !== null}
              onClick={() => {
                const edits: DraftReviewEdits = {
                  prompt: editPrompt.trim(),
                  correct_answer: editCorrect.trim(),
                  expected_answer_or_rubric: editRubric.trim(),
                  options: editOptions
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                };
                void approve(edits);
              }}
            >
              {busy === 'approve' ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
              Guardar y aprobar
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof AiFunctionError) {
    const map: Record<string, string> = {
      MISSING_GEMINI_API_KEY: 'Falta la API key de Gemini en el servidor.',
      GEMINI_REJECTED: 'Gemini rechazó la solicitud (revisa el prompt o la cuota).',
      GEMINI_FAILED: 'No pudimos contactar a Gemini, intenta de nuevo.',
      GEMINI_EMPTY: 'El modelo devolvió una respuesta vacía.',
      GEMINI_PDF_FAILED: 'No pudimos extraer el texto del PDF.',
      NO_CONTENT: 'Sube contenido para este tema antes de generar preguntas.',
      NO_VALID_QUESTIONS: 'El modelo no generó preguntas con el shape esperado.',
      INVALID_MODEL_JSON: 'El modelo devolvió un JSON no parseable.',
      NOT_SECTION_OWNER: 'No eres instructor de esta sección.',
      DRAFT_NOT_FOUND: 'Borrador no encontrado.',
      DRAFT_NOT_PENDING: 'Este borrador ya fue revisado.',
      PDF_TOO_LARGE: 'El PDF supera el límite permitido.',
      MISSING_PDF: 'Adjunta un PDF.',
      MISSING_URL: 'Falta la URL.',
      TEXT_TOO_SHORT: 'El texto es demasiado corto.'
    };
    return map[error.code] ?? `Error del servidor: ${error.code}`;
  }
  if (error instanceof Error) return error.message;
  return 'Error inesperado.';
}