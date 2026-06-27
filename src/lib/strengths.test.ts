import { describe, expect, it } from 'vitest';
import {
  buildStrengthsMessage,
  CAREER_CLUSTER_CHIP,
  CAREER_CLUSTER_LABEL,
  maxStrengthMastery,
  strengthsMessage,
  strengthsTone
} from './strengths';
import type { MasteryPoint, SuggestedCareer } from './types';

describe('strengths helpers', () => {
  it('classifies tone by the maximum mastery observed', () => {
    expect(strengthsTone(null)).toBe('empty');
    expect(strengthsTone(0)).toBe('growing');
    expect(strengthsTone(49)).toBe('growing');
    expect(strengthsTone(50)).toBe('positive');
    expect(strengthsTone(92)).toBe('positive');
  });

  it('returns the max mastery across strengths, ignoring empty arrays', () => {
    expect(maxStrengthMastery([])).toBeNull();
    expect(
      maxStrengthMastery([
        { topic: 'Fracciones', mastery: 32 },
        { topic: 'Geometría', mastery: 71 }
      ])
    ).toBe(71);
  });

  it('keeps the cluster labels in Spanish and covers every documented cluster', () => {
    expect(CAREER_CLUSTER_LABEL.ingenieria).toBe('Ingeniería');
    expect(CAREER_CLUSTER_LABEL['arte-diseno']).toBe('Arte y diseño');
    expect(CAREER_CLUSTER_LABEL.educacion).toBe('Educación');
    // Garantiza que cada cluster tiene su chip de color precomputado
    // (evita que un cluster nuevo se quede sin estilo).
    expect(Object.keys(CAREER_CLUSTER_CHIP)).toEqual(Object.keys(CAREER_CLUSTER_LABEL));
  });

  it('produces a positive message when the student has a strong topic', () => {
    const message = strengthsMessage('Sofía', 78, true);
    expect(message.tone).toBe('positive');
    expect(message.subtitle).toContain('Sofía');
    // El mensaje SIEMPRE debe enfatizar que un bajo no define el futuro.
    expect(message.hint.toLowerCase()).toContain('fortale');
  });

  it('uses a softer "growing" tone when no topic crosses 50% yet', () => {
    const message = strengthsMessage('Diego', 32, false);
    expect(message.tone).toBe('growing');
    expect(message.subtitle).toContain('Diego');
    expect(message.hint).toMatch(/50 ?%/);
  });

  it('falls back to an empty-state message when there is no mastery data', () => {
    const message = strengthsMessage('Valeria', null, false);
    expect(message.tone).toBe('empty');
    expect(message.subtitle).toContain('Valeria');
    expect(message.subtitle.toLowerCase()).toContain('practicar');
  });

  it('builds the message straight from a child snapshot', () => {
    const child = {
      name: 'Mateo',
      strengths: [
        { topic: 'Geometría', mastery: 64 },
        { topic: 'Decimales', mastery: 41 }
      ] satisfies MasteryPoint[],
      suggestedCareers: [
        {
          id: '30000000-0000-4000-8000-000000000003',
          name: 'Arquitectura',
          cluster: 'arquitectura',
          description: 'Diseña espacios y edificios.',
          score: 0.61
        }
      ] satisfies SuggestedCareer[]
    };
    const message = buildStrengthsMessage(child);
    expect(message.tone).toBe('positive');
    expect(message.subtitle).toContain('Mateo');
  });
});