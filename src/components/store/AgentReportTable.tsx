import React from 'react';
import type { DidClientReport } from '../../types/agent';

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

type Fmt = 'int' | 'number' | 'money' | 'duration';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

const fmtInt = (n: number) => n.toLocaleString('en-NG', { maximumFractionDigits: 0 });
const fmtNumber = (n: number) => n.toLocaleString('en-NG', { maximumFractionDigits: 2 });
const fmtMoney = (n: number) =>
  n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Seconds -> "45s", "2m 05s", "1h 02m 05s"
const fmtDuration = (totalSeconds: number) => {
  const s = Math.round(totalSeconds);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}h ${pad(m)}m ${pad(sec)}s` : `${m}m ${pad(sec)}s`;
};

const format = (value: unknown, fmt: Fmt): string => {
  const n = num(value);
  switch (fmt) {
    case 'int':
      return fmtInt(n);
    case 'number':
      return fmtNumber(n);
    case 'money':
      return fmtMoney(n);
    case 'duration':
      return fmtDuration(n);
  }
};

// For fields that can be null when there were no calls in the band.
const fmtPerMin = (v: number | null | undefined) =>
  typeof v === 'number' && Number.isFinite(v) ? fmtMoney(v) : '—';

const humanize = (key: string) => {
  const s = key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Used for the "By DID" table, whose columns come straight from the API.
const renderCell = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    if (/seconds?|duration/i.test(key)) return fmtDuration(value);
    if (/charge|margin|amount|cost|rate|permin|price/i.test(key)) return fmtMoney(value);
    return fmtNumber(value);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/* ------------------------------------------------------------------ */
/* Row definitions                                                     */
/* ------------------------------------------------------------------ */

const TOTALS_ROWS: { key: keyof DidClientReport['totals']; label: string; fmt: Fmt }[] = [
  { key: 'calls', label: 'Calls', fmt: 'int' },
  // { key: 'actualSeconds', label: 'Actual duration', fmt: 'duration' },
  { key: 'billedSeconds', label: 'Billed duration', fmt: 'duration' },
  { key: 'billedMinutes', label: 'Billed minutes', fmt: 'number' },
  // { key: 'sourceCharge', label: 'Source charge', fmt: 'money' },
  { key: 'clientCharge', label: 'Client charge', fmt: 'money' },
  // { key: 'margin', label: 'Margin', fmt: 'money' },
  { key: 'clientPerMinute', label: 'Client rate per minute', fmt: 'money' },
];

const REPORT_TOTALS_ROWS: { key: keyof DidClientReport['reportTotals']; label: string; fmt: Fmt }[] = [
  { key: 'calls', label: 'Calls', fmt: 'int' },
  { key: 'totalDuration', label: 'Total duration', fmt: 'duration' },
  { key: 'totalBilledDuration', label: 'Billed duration (rounded up)', fmt: 'duration' },
  // { key: 'totalCallChargedVezeti', label: 'Call charged (Vezeti)', fmt: 'money' },
  // { key: 'totalCallChargeFromRate', label: 'Total call charge (from rate)', fmt: 'money' },
];

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const th = 'whitespace-nowrap px-4 py-2.5 text-xs font-medium text-slate-500';
const td = 'whitespace-nowrap px-4 py-2.5 text-sm';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
    <div className="overflow-x-auto rounded-lg border border-slate-200">{children}</div>
  </section>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{value}</p>
  </div>
);

const KeyValueTable: React.FC<{ rows: { label: string; value: string }[] }> = ({ rows }) => (
  <table className="w-full">
    <thead className="border-b border-slate-100 bg-slate-50/60">
      <tr>
        <th className={`${th} text-left`}>Metric</th>
        <th className={`${th} text-right`}>Value</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {rows.map((r) => (
        <tr key={r.label}>
          <td className={`${td} text-slate-600`}>{r.label}</td>
          <td className={`${td} text-right font-medium tabular-nums text-slate-900`}>{r.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

interface AgentReportTableProps {
  report: DidClientReport;
}

const AgentReportTable: React.FC<AgentReportTableProps> = ({ report }) => {
  const totals = report.totals ?? ({} as DidClientReport['totals']);
  const reportTotals = report.reportTotals ?? ({} as DidClientReport['reportTotals']);
  const bands = report.callBands ?? [];
  const byDid = report.byDid ?? [];
  const byDidColumns = Array.from(new Set(byDid.flatMap((r) => Object.keys(r))));
  const isNumericColumn = (col: string) => byDid.some((r) => typeof r[col] === 'number');

  return (
    <div className="space-y-5">
      {num(totals.calls) === 0 && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          No calls were recorded in this period.
        </p>
      )}

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Calls" value={format(totals.calls, 'int')} />
        <StatCard label="Billed minutes" value={format(totals.billedMinutes, 'number')} />
        <StatCard label="Client charge" value={format(totals.clientCharge, 'money')} />
        <StatCard label="Margin" value={format(totals.margin, 'money')} />
      </div>

      {/* Totals */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Totals">
          <KeyValueTable rows={TOTALS_ROWS.map((r) => ({ label: r.label, value: format(totals[r.key], r.fmt) }))} />
        </Section>
        <Section title="Report totals">
          <KeyValueTable
            rows={REPORT_TOTALS_ROWS.map((r) => ({ label: r.label, value: format(reportTotals[r.key], r.fmt) }))}
          />
        </Section>
      </div>

      {/* Call length bands */}
      <Section title="Calls by length">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className={`${th} text-left`}>Band</th>
              <th className={`${th} text-right`}>Calls</th>
              <th className={`${th} text-right`}>Avg / min</th>
              {/* <th className={`${th} text-right`}>Lowest / min</th> */}
              {/* <th className={`${th} text-right`}>Highest / min</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No band data.
                </td>
              </tr>
            ) : (
              bands.map((b) => (
                <tr key={b.band}>
                  <td className={`${td} font-medium text-slate-900`}>{b.band}</td>
                  <td className={`${td} text-right tabular-nums text-slate-700`}>{fmtInt(num(b.calls))}</td>
                  <td className={`${td} text-right tabular-nums text-slate-700`}>{fmtPerMin(b.avgPerMin)}</td>
                  {/* <td className={`${td} text-right tabular-nums text-slate-700`}>{fmtPerMin(b.lowestPerMin)}</td> */}
                  {/* <td className={`${td} text-right tabular-nums text-slate-700`}>{fmtPerMin(b.highestPerMin)}</td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Section>

      {/* By DID number */}
      <Section title="By DID number">
        {byDid.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No calls on any DID number in this period.</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                {byDidColumns.map((col) => (
                  <th key={col} className={`${th} ${isNumericColumn(col) ? 'text-right' : 'text-left'}`}>
                    {humanize(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byDid.map((row, i) => (
                <tr key={i}>
                  {byDidColumns.map((col) => (
                    <td
                      key={col}
                      className={`${td} text-slate-700 ${isNumericColumn(col) ? 'text-right tabular-nums' : ''}`}
                    >
                      {renderCell(col, row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
};

export default AgentReportTable;