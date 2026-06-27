// ingest-course-content — recibe contenido subido por el docente y lo prepara
// para que `generate-questions` pueda usarlo como contexto.
//
// Fuentes soportadas:
//   - text:  el docente pega texto crudo.
//   - url:   el docente entrega una URL; el servidor hace GET y limpia HTML básico.
//   - pdf:   PDF en base64; se extrae el texto con Gemini multimodal.
//
// Resultado: una fila en `course_content` con `raw_text` poblado y
// `extracted_status = 'ready'` (o `'failed'` con `extracted_error`).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { errorCode, json } from '../_shared/http.ts';
import { geminiExtractPdfText } from '../_shared/gemini.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';

interface IngestRequest {
  section_id: string;
  topic: string;
  source_type: 'text' | 'url' | 'pdf';
  source_label: string;
  raw_text?: string;
  source_url?: string;
  pdf_base64?: string;
  pdf_mime_type?: string;
}

const MAX_TEXT_CHARS = 200_000;
const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB encoded — los PDFs más grandes deberían ir a Storage.

function stripHtml(html: string): string {
  // Limpieza ligera: quitamos scripts/styles y luego todas las etiquetas.
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');
  const text = withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

function truncate(text: string): string {
  return text.length > MAX_TEXT_CHARS ? `${text.slice(0, MAX_TEXT_CHARS)}\n\n[TRUNCADO]` : text;
}

async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'i-learn-content-ingestor/1.0' },
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const html = await response.text();
    return truncate(stripHtml(html));
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  try {
    const { user } = await requireUser(req, 'instructor');
    const admin = serviceClient();
    const body = (await req.json()) as IngestRequest;

    if (!body.section_id || !body.topic || !body.source_type || !body.source_label) {
      throw new Error('INVALID_REQUEST');
    }

    // Verificar que el instructor es dueño de la sección.
    const { data: enrollment } = await admin
      .from('instructor_section')
      .select('section_id')
      .eq('instructor_id', user.id)
      .eq('section_id', body.section_id)
      .maybeSingle();
    if (!enrollment) throw new Error('NOT_SECTION_OWNER');

    // Insertar la fila en estado 'processing' primero para reservar el slot.
    const insert = await admin
      .from('course_content')
      .insert({
        section_id: body.section_id,
        topic: body.topic,
        source_type: body.source_type,
        source_label: body.source_label,
        raw_text: null,
        extracted_status: 'processing',
        uploaded_by: user.id,
      })
      .select('id')
      .single();
    if (insert.error || !insert.data) throw new Error(insert.error?.message ?? 'INSERT_FAILED');
    const contentId = insert.data.id as string;

    let extracted: string;
    try {
      if (body.source_type === 'text') {
        if (!body.raw_text || body.raw_text.trim().length < 20) throw new Error('TEXT_TOO_SHORT');
        extracted = truncate(body.raw_text.trim());
      } else if (body.source_type === 'url') {
        if (!body.source_url) throw new Error('MISSING_URL');
        extracted = await fetchUrlText(body.source_url);
      } else if (body.source_type === 'pdf') {
        if (!body.pdf_base64) throw new Error('MISSING_PDF');
        if (body.pdf_base64.length > MAX_PDF_BYTES * 1.4) throw new Error('PDF_TOO_LARGE');
        const result = await geminiExtractPdfText(body.pdf_base64, body.pdf_mime_type ?? 'application/pdf');
        extracted = truncate(result.text);
      } else {
        throw new Error('UNSUPPORTED_SOURCE_TYPE');
      }
    } catch (extractionError) {
      await admin
        .from('course_content')
        .update({
          extracted_status: 'failed',
          extracted_error: errorCode(extractionError),
        })
        .eq('id', contentId);
      return json({ error_code: errorCode(extractionError), content_id: contentId }, 422);
    }

    await admin
      .from('course_content')
      .update({
        raw_text: extracted,
        extracted_status: 'ready',
        processed_at: new Date().toISOString(),
        extracted_error: null,
      })
      .eq('id', contentId);

    return json({
      status: 'ready',
      content_id: contentId,
      chars: extracted.length,
    });
  } catch (error) {
    const code = errorCode(error);
    return json(
      { error_code: code },
      code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422
    );
  }
});

// Export helper para tests unitarios (no se importa en runtime).
export const __testing = { stripHtml, truncate };