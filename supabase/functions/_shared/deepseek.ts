interface DeepSeekOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  jsonOutput?: boolean;
}

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

export async function deepSeekMessage(options: DeepSeekOptions): Promise<string> {
  const baseUrl = required('ANTHROPIC_BASE_URL').replace(/\/$/, '');
  const timeoutMs = Math.max(2_000, Number(Deno.env.get('DEEPSEEK_TIMEOUT_MS') ?? '5000'));
  const attempts = Math.max(1, Number(Deno.env.get('DEEPSEEK_MAX_ATTEMPTS') ?? '2'));
  const body = {
    model: required('ANTHROPIC_MODEL'),
    max_tokens: options.maxTokens ?? 500,
    temperature: options.jsonOutput ? 0 : 0.35,
    system: options.system,
    messages: [{ role: 'user', content: options.prompt }],
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': required('ANTHROPIC_API_KEY'),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
      clearTimeout(timeout);
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) throw new Error(`DEEPSEEK_${response.status}`);
        throw new Error('DEEPSEEK_REJECTED');
      }
      const payload = await response.json() as { content?: Array<{ type: string; text?: string }> };
      const text = payload.content?.find((part) => part.type === 'text')?.text?.trim();
      if (!text) throw new Error('DEEPSEEK_EMPTY');
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('DEEPSEEK_FAILED');
}

export function parseJsonObject<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('INVALID_MODEL_JSON');
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
