// ============================================================================
// LLM — abstracción multi-provider (Gemini ↔ DeepSeek).
//
// Cualquier Edge Function nueva debe importar `llmMessage` desde aquí en vez
// de tocar deepseek.ts / gemini.ts directamente. Esto permite:
//   - Cambiar el provider por defecto vía env (LLM_DEFAULT_PROVIDER).
//   - Pasar `provider: 'gemini' | 'deepseek'` por llamada para enrutar.
//   - Auditar fácilmente qué provider se usó (devuelto en el resultado).
//
// El módulo NO reemplaza el wrapper de DeepSeek legacy — `orchestrate-feedback`
// sigue usando `deepSeekMessage` directamente para no introducir regresiones.
// ============================================================================

import { deepSeekMessage } from './deepseek.ts';
import { geminiMessage, type GeminiOptions } from './gemini.ts';

export type LlmProvider = 'gemini' | 'deepseek';

export interface LlmMessageOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonOutput?: boolean;
  /** Provider explícito. Si se omite, usa LLM_DEFAULT_PROVIDER (default: gemini). */
  provider?: LlmProvider;
}

export interface LlmMessageResult {
  text: string;
  provider: LlmProvider;
  model: string;
}

function defaultProvider(): LlmProvider {
  const env = Deno.env.get('LLM_DEFAULT_PROVIDER');
  return env === 'deepseek' ? 'deepseek' : 'gemini';
}

export async function llmMessage(options: LlmMessageOptions): Promise<LlmMessageResult> {
  const provider = options.provider ?? defaultProvider();
  if (provider === 'gemini') {
    const result = await geminiMessage(toGeminiOptions(options));
    return result;
  }
  const text = await deepSeekMessage({
    system: options.system,
    prompt: options.prompt,
    maxTokens: options.maxTokens,
    jsonOutput: options.jsonOutput,
  });
  return {
    text,
    provider: 'deepseek',
    model: Deno.env.get('ANTHROPIC_MODEL') ?? 'unknown',
  };
}

function toGeminiOptions(options: LlmMessageOptions): GeminiOptions {
  return {
    system: options.system,
    prompt: options.prompt,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    jsonOutput: options.jsonOutput,
  };
}