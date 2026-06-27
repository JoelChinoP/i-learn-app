// ============================================================================
// Gemini — wrapper sobre la API REST de Google AI Studio (generativelanguage).
// Mismo contrato que deepseek.ts: timeout, reintentos, JSON mode.
// Pensado para coexistir con DeepSeek (la selección del provider vive en llm.ts).
// ============================================================================

export interface GeminiOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonOutput?: boolean;
}

export interface GeminiResult {
  text: string;
  provider: 'gemini';
  model: string;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_ATTEMPTS = 2;

function envInt(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  const value = Number(raw ?? String(fallback));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

export async function geminiMessage(options: GeminiOptions): Promise<GeminiResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('MISSING_GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const timeoutMs = envInt('GEMINI_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const attempts = envInt('GEMINI_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS);

  const body = {
    contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: options.system }] },
    generationConfig: {
      temperature: options.temperature ?? (options.jsonOutput ? 0.1 : 0.4),
      maxOutputTokens: options.maxTokens ?? 1024,
      ...(options.jsonOutput ? { responseMimeType: 'application/json' } : {}),
    },
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
      clearTimeout(timer);
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) throw new Error(`GEMINI_${response.status}`);
        throw new Error('GEMINI_REJECTED');
      }
      const payload = (await response.json()) as GeminiResponse;
      const parts = payload.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((part) => part.text ?? '').join('').trim();
      if (!text) {
        // Safety block o respuesta vacía: lo tratamos como fallo recuperable.
        throw new Error('GEMINI_EMPTY');
      }
      return { text, provider: 'gemini', model };
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('GEMINI_FAILED');
}

/** Extrae texto de un PDF (base64) usando Gemini multimodal. */
export interface PdfExtractResult {
  text: string;
  provider: 'gemini';
  model: string;
  /** Si Gemini no pudo leer el PDF, el motivo viene aquí. */
  warning?: string;
}

export async function geminiExtractPdfText(pdfBase64: string, mimeType = 'application/pdf'): Promise<PdfExtractResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('MISSING_GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_PDF_MODEL') ?? Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const timeoutMs = envInt('GEMINI_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const attempts = envInt('GEMINI_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS);

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: pdfBase64 } },
        {
          text:
            'Extrae TODO el texto legible del PDF en español. ' +
            'Devuelve únicamente el texto corrido, sin comentarios, sin JSON, sin markdown. ' +
            'Si el documento tiene secciones, mantén los títulos principales como una línea en mayúsculas. ' +
            'Si una página es ilegible (escaneada sin OCR), indícalo con [ILEGIBLE] y sigue con la siguiente.'
        }
      ]
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 8000 },
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      });
      clearTimeout(timer);
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) throw new Error(`GEMINI_${response.status}`);
        throw new Error('GEMINI_REJECTED');
      }
      const payload = (await response.json()) as GeminiResponse;
      const text = (payload.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!text) throw new Error('GEMINI_EMPTY');
      return { text, provider: 'gemini', model };
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('GEMINI_PDF_FAILED');
}

// `parseJson` vive en `draftValidation.ts` para que vitest pueda probarlo sin
// importar el wrapper de Gemini. Lo re-exportamos aquí para no romper a los
// consumidores existentes.
export { parseJsonFromModel as parseJson } from './draftValidation.ts';