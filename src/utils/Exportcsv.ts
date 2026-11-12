// src/utils/exportCsv.ts
export type CsvValue = string | number | boolean | null | undefined;

// Quote every field, double any inner quotes, and neutralise spreadsheet formulas
// (cells starting with = or @) so an agent name can't run as a formula in Excel.
const escapeCell = (v: CsvValue): string => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const toCsv = (headers: string[], rows: CsvValue[][]): string =>
  [headers, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n');

export const downloadCsv = (filename: string, headers: string[], rows: CsvValue[][]) => {
  // BOM so Excel reads UTF-8 (names with accents) correctly
  const blob = new Blob(['\uFEFF', toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'store';