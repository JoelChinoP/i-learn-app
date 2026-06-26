import sanitizeHtml from 'npm:sanitize-html@2.17.0';

export function cleanAnswer(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('INVALID_REQUEST');
  const maxLength = Number(Deno.env.get('ANSWER_MAX_LENGTH') ?? '4000');
  const clean = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} })
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) throw new Error('EMPTY_ANSWER');
  if (clean.length > maxLength) throw new Error('ANSWER_TOO_LONG');
  return clean;
}
