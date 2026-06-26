export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function unitToPercent(value: number): number {
  return Math.round(clampPercent(value * 100));
}
