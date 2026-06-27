import { describe, expect, it } from 'vitest';
import { parseJsonFromModel, validateAndNormalizeDraft } from '../../supabase/functions/_shared/draftValidation';

describe('draftValidation — parseJsonFromModel', () => {
  it('parses raw JSON', () => {
    expect(parseJsonFromModel<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown fences before parsing', () => {
    expect(parseJsonFromModel<{ ok: boolean }>('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('extracts JSON embedded in surrounding prose', () => {
    expect(parseJsonFromModel<{ x: string }>('Pensemos:\n{"x":"hola"}\nFin.')).toEqual({ x: 'hola' });
  });

  it('handles arrays as the top-level value', () => {
    expect(parseJsonFromModel<number[]>('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('does not break on escaped quotes inside strings', () => {
    expect(parseJsonFromModel<{ s: string }>('{"s":"un \\"texto\\" con comillas"}')).toEqual({
      s: 'un "texto" con comillas'
    });
  });

  it('throws INVALID_MODEL_JSON when there is nothing parseable', () => {
    expect(() => parseJsonFromModel('plain text only')).toThrowError('INVALID_MODEL_JSON');
  });
});

describe('draftValidation — validateAndNormalizeDraft', () => {
  const baseMc = {
    prompt: '¿Cuál es el resultado de 1/2 + 1/3?',
    question_type: 'opcion_multiple' as const,
    options: ['5/6', '2/5', '1/5', '2/6'],
    correct_answer: '5/6',
    expected_answer_or_rubric: 'Sumar fracciones con denominador común.',
    knowledge_tags: ['fracciones', 'suma']
  };

  it('accepts a well-formed multiple-choice draft', () => {
    const result = validateAndNormalizeDraft(baseMc);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.prompt).toBe(baseMc.prompt);
    expect(result.options).toEqual(baseMc.options);
    expect(result.knowledge_tags).toEqual(['fracciones', 'suma']);
  });

  it('rejects when the correct answer is not among the options', () => {
    const result = validateAndNormalizeDraft({ ...baseMc, correct_answer: '7/8' });
    expect(result).toEqual({ error: 'CORRECT_NOT_IN_OPTIONS' });
  });

  it('rejects a multiple-choice question with fewer than 2 options', () => {
    const result = validateAndNormalizeDraft({ ...baseMc, options: ['solo-una'] });
    expect(result).toEqual({ error: 'BAD_OPTIONS' });
  });

  it('accepts a text-libre draft and nulls out options', () => {
    const result = validateAndNormalizeDraft({
      prompt: 'Explica con tus palabras qué es una fracción equivalente.',
      question_type: 'texto_libre',
      correct_answer: 'Dos fracciones que representan la misma cantidad.',
      expected_answer_or_rubric: 'Aceptar respuestas que mencionen "misma cantidad" o un ejemplo válido.',
      knowledge_tags: ['fracciones']
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.question_type).toBe('texto_libre');
    expect(result.options).toBeNull();
  });

  it('rejects when question_type is invalid', () => {
    const result = validateAndNormalizeDraft({ ...baseMc, question_type: 'multiple_choice' });
    expect(result).toEqual({ error: 'BAD_QUESTION_TYPE' });
  });

  it('rejects when prompt is too short', () => {
    const result = validateAndNormalizeDraft({ ...baseMc, prompt: 'corto' });
    expect(result).toEqual({ error: 'BAD_PROMPT' });
  });

  it('rejects when rubric is too short', () => {
    const result = validateAndNormalizeDraft({ ...baseMc, expected_answer_or_rubric: 'x' });
    expect(result).toEqual({ error: 'BAD_RUBRIC' });
  });

  it('treats missing knowledge_tags as an empty array', () => {
    const result = validateAndNormalizeDraft({
      prompt: baseMc.prompt,
      question_type: baseMc.question_type,
      options: baseMc.options,
      correct_answer: baseMc.correct_answer,
      expected_answer_or_rubric: baseMc.expected_answer_or_rubric
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.knowledge_tags).toEqual([]);
  });

  it('rejects non-object inputs', () => {
    expect(validateAndNormalizeDraft('not an object')).toEqual({ error: 'NOT_OBJECT' });
    expect(validateAndNormalizeDraft(null)).toEqual({ error: 'NOT_OBJECT' });
  });
});