// ============================================================================
// Utilidades de exportación del lado del cliente (sin backend).
// ============================================================================

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Exporta un arreglo de objetos a CSV (compatible con Excel). */
export function exportToCSV<T extends Record<string, unknown>>(
rows: T[],
filename: string,
columns?: {key: keyof T;label: string;}[])
{
  if (rows.length === 0) {
    downloadBlob('\uFEFF', filename, 'text/csv;charset=utf-8;');
    return;
  }
  const cols =
  columns ??
  (Object.keys(rows[0]) as (keyof T)[]).map((k) => ({
    key: k,
    label: String(k)
  }));
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.map((c) => escape(c.label)).join(',');
  const body = rows.
  map((r) => cols.map((c) => escape(r[c.key])).join(',')).
  join('\n');
  downloadBlob(`\uFEFF${header}\n${body}`, filename, 'text/csv;charset=utf-8;');
}

/** Exporta texto plano (reporte simple para el padre). */
export function exportTextReport(content: string, filename: string) {
  downloadBlob(content, filename, 'text/plain;charset=utf-8;');
}