export interface BktParameters {
  learn: number;
  guess: number;
  slip: number;
}

export function updateBkt(
  prior: number,
  correct: boolean,
  parameters: BktParameters = { learn: 0.15, guess: 0.25, slip: 0.1 },
): number {
  const p = Math.max(0, Math.min(1, prior));
  const { learn, guess, slip } = parameters;
  const evidence = correct
    ? (p * (1 - slip)) / Math.max(Number.EPSILON, p * (1 - slip) + (1 - p) * guess)
    : (p * slip) / Math.max(Number.EPSILON, p * slip + (1 - p) * (1 - guess));
  return Math.max(0, Math.min(1, evidence + (1 - evidence) * learn));
}
