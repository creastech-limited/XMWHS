import { useCallback, useEffect, useState } from "react";
import { getMyDidReport } from "../../services/api/userService";
import type { DidMeReport } from "../../types/agent";
import { formatDate, formatDuration, formatMoney, formatRate } from "../../utils/format";
import DateRangeFilter from "../../components/Agent/DateRangeFilter";
import { presetRange, type DateRange, type PresetKey } from "../../utils/dateRange";

const ghostBtn =
  "rounded-lg px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";

const money = (n: number | null | undefined) => (n == null ? "—" : formatMoney(n));

const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5">
    <div className="text-sm text-slate-500">{label}</div>
    <div className="mt-1 text-xl font-bold text-[#0f1535]">{value}</div>
  </div>
);

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`whitespace-nowrap px-6 py-3.5 ${right ? "text-right" : ""}`}>{children}</th>
);

const headRow = "border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500";

/* ---------- CSV export helpers ---------- */
const csvCell = (v: unknown) => {
  if (v == null) return "";
  let s = String(v);
  // Guard against spreadsheet formula injection (e.g. a number starting with "+")
  if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

const buildCsv = (report: DidMeReport) => {
  const lines: string[] = [];

  lines.push(csvRow(["DID report"]));
  lines.push(csvRow(["From", formatDate(report.period.from)]));
  lines.push(csvRow(["To", formatDate(report.period.to)]));
  lines.push("");

  lines.push(csvRow(["Summary"]));
  lines.push(csvRow(["Total calls", report.totals.calls]));
  lines.push(csvRow(["Billed minutes", report.totals.billedMinutes]));
  lines.push(csvRow(["Billed duration", formatDuration(report.totals.billedSeconds)]));
  lines.push(csvRow(["Rate / min", formatRate(report.totals.clientPerMinute)]));
  lines.push(csvRow(["Total charge", formatMoney(report.totals.clientCharge)]));
  lines.push("");

  lines.push(csvRow(["By DID number"]));
  lines.push(csvRow(["Number", "Calls", "Billed min", "Rate / min", "Charge"]));
  if (report.byDid.length === 0) {
    lines.push(csvRow(["No calls in this period."]));
  } else {
    report.byDid.forEach((d) => {
      lines.push(
        csvRow([
          d.number ?? "—",
          d.calls ?? 0,
          d.billedMinutes ?? 0,
          formatRate(d.clientPerMinute),
          money(d.clientCharge),
        ])
      );
    });
  }
  lines.push("");

  lines.push(csvRow(["Calls by duration"]));
  lines.push(csvRow(["Duration band", "Calls", "Avg / min"]));
  report.callBands.forEach((b) => {
    lines.push(csvRow([b.band, b.calls, formatRate(b.avgPerMin)]));
  });

  return lines.join("\r\n");
};

const downloadCsv = (csv: string, filename: string) => {
  // BOM so Excel reads UTF-8 (e.g. the "—" character) correctly
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const safeName = (v: unknown) => String(v ?? "").replace(/[^\w.-]+/g, "-");

/* ---------- Page ---------- */

const DidAgentReport = () => {
  const [report, setReport] = useState<DidMeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dates, setDates] = useState<{ preset: PresetKey; range: DateRange }>({
    preset: "today",
    range: presetRange("today"),
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setReport(await getMyDidReport({ from: dates.range.from, to: dates.range.to }));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    load();
  }, [load]);

  // Exports exactly what's on screen: the report for the currently selected date range.
  const handleExport = () => {
    if (!report) return;
    const filename = `did-report_${safeName(dates.range.from)}_to_${safeName(dates.range.to)}.csv`;
    downloadCsv(buildCsv(report), filename);
  };

  const canExport = !loading && !error && !!report;

  return (
    <div className="p-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B1437]">Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            {report
              ? `${formatDate(report.period.from)} – ${formatDate(report.period.to)}`
              : "Your call report and charges."}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className={`${ghostBtn} inline-flex items-center gap-2 border border-slate-200`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16h12" />
            </svg>
            Export CSV
          </button>

          <DateRangeFilter
            preset={dates.preset}
            range={dates.range}
            onChange={(preset, range) => setDates({ preset, range })}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center text-slate-500">
          <p className="mb-3">Couldn’t load the report. {error}</p>
          <button type="button" onClick={load} className={`${ghostBtn} border border-slate-200`}>
            Try again
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5">
              <span className="block h-3 w-16 animate-pulse rounded bg-slate-100" />
              <span className="mt-3 block h-5 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && report && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total calls" value={report.totals.calls} />
            <StatCard label="Billed minutes" value={report.totals.billedMinutes} />
            <StatCard label="Billed duration" value={formatDuration(report.totals.billedSeconds)} />
            <StatCard label="Rate / min" value={formatRate(report.totals.clientPerMinute)} />
            <StatCard label="Total charge" value={formatMoney(report.totals.clientCharge)} />
          </div>

          <h3 className="mb-3 mt-8 text-sm font-semibold text-[#0f1535]">By DID number</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className={headRow}>
                    <Th>Number</Th>
                    <Th>Calls</Th>
                    <Th>Billed min</Th>
                    <Th>Rate / min</Th>
                    <Th right>Charge</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.byDid.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No calls in this period.
                      </td>
                    </tr>
                  )}
                  {report.byDid.map((d, i) => (
                    <tr key={d.number ?? i} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{d.number ?? "—"}</td>
                      <td className="px-6 py-4 text-[#0f1535]">{d.calls ?? 0}</td>
                      <td className="px-6 py-4 text-[#0f1535]">{d.billedMinutes ?? 0}</td>
                      <td className="px-6 py-4 text-[#0f1535]">{formatRate(d.clientPerMinute)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-[#0f1535]">{money(d.clientCharge)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h3 className="mb-3 mt-8 text-sm font-semibold text-[#0f1535]">Calls by duration</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white mb-20">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className={headRow}>
                    <Th>Duration band</Th>
                    <Th>Calls</Th>
                    <Th>Avg / min</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.callBands.map((b) => (
                    <tr key={b.band} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-semibold text-[#0f1535]">{b.band}</td>
                      <td className="px-6 py-4 text-[#0f1535]">{b.calls}</td>
                      <td className="px-6 py-4 text-[#0f1535]">{formatRate(b.avgPerMin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DidAgentReport;