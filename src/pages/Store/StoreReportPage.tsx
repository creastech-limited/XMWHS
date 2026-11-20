import { useCallback, useEffect, useState } from "react";
import { getStoreReportTable, getDidClients, getDidNumbers } from "../../services/api/userService";
import type { DidNumber, Pagination, StoreReportRow, StoreReportTable } from "../../types/agent";
import type { StoreAgent } from "../../types";
import { formatDate, formatDuration, formatMoney, formatSeconds } from "../../utils/format";
import DateRangeFilter from "../../components/Agent/DateRangeFilter";
import { presetRange, type DateRange, type PresetKey } from "../../utils/dateRange";


const LIMIT = 50;
// Page size used only when exporting (fewer requests than the on-screen LIMIT)
const EXPORT_LIMIT = 500;

const COLUMNS = [
    "Agent",
    "Date",
    "Source CLI",
    "Rounded up",
    "Customer charge",
    "CCPS",
    "CCPM",
    "CC",
    "Provider charge / sec",
    "Provider charge / min",
];

const ghostBtn =
    "rounded-lg px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";

const selectCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f1535] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100";

const dec = (v: number, d = 4) =>
    v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---------- CSV export helpers ---------- */

const csvCell = (v: unknown) => {
    if (v == null) return "";
    let s = String(v);
    // Guard against spreadsheet formula injection (e.g. a value starting with "=")
    if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
};

const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

const downloadCsv = (csv: string, filename: string) => {
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

const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-1 text-xl font-bold text-[#0f1535]">{value}</div>
    </div>
);

// const MatchPill = ({ ok }: { ok: boolean }) => (
//     <span
//         className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
//             }`}
//     >
//         {ok ? "Yes" : "No"}
//     </span>
// );

const StoreReportPage = () => {
    const [dates, setDates] = useState<{ preset: PresetKey; range: DateRange }>({
        preset: "today",
        range: presetRange("today"),
    });
    const [page, setPage] = useState(1);

    const [report, setReport] = useState<StoreReportTable | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const [agentId, setAgentId] = useState("");
    const [didNumberId, setDidNumberId] = useState("");
    const [agents, setAgents] = useState<StoreAgent[]>([]);
    const [dids, setDids] = useState<DidNumber[]>([]);

    useEffect(() => {
        getDidClients().then(setAgents).catch(() => setAgents([]));
        getDidNumbers().then(setDids).catch(() => setDids([]));
    }, []);

    // the agent a DID is assigned to (assignedTo is a string id or an object)
    // const assigneeId = (d: DidNumber) =>
    //     d.assignedTo && typeof d.assignedTo === "object" ? d.assignedTo._id : d.assignedTo;

    // const didOptions = agentId ? dids.filter((d) => assigneeId(d) === agentId) : dids;

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { from, to } = dates.range;
            const res = await getStoreReportTable({
                from,
                to,
                agentId: agentId || undefined,
                didNumberId: didNumberId || undefined,
                page,
                limit: LIMIT,
            });
            setReport(res.data);
            setPagination(res.pagination);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [dates.range, page, agentId, didNumberId]);

    useEffect(() => {
        load();
    }, [load]);

    const rows: StoreReportRow[] = report?.rows ?? [];
    const totals = report?.totals;

    const subtitle = report
        ? report.period.from === report.period.to
            ? formatDate(report.period.from)
            : `${formatDate(report.period.from)} – ${formatDate(report.period.to)}`
        : "Call report by agent.";

    const pickAgent = (id: string) => {
        setPage(1);
        setAgentId(id);
    };
    const pickDid = (id: string) => {
        setPage(1);
        setDidNumberId(id);
    };
    const clearFilters = () => {
        setPage(1);
        setAgentId("");
        setDidNumberId("");
    };

    const handleExport = async () => {
        if (!report) return;
        try {
            setExporting(true);
            setExportError(null);
            const { from, to } = dates.range;

            const allRows: StoreReportRow[] = [];
            let exportTotals = report.totals;
            let exportPeriod = report.period;
            let p = 1;
            let totalPages = 1;

            do {
                const res = await getStoreReportTable({
                    from,
                    to,
                    agentId: agentId || undefined,
                    didNumberId: didNumberId || undefined,
                    page: p,
                    limit: EXPORT_LIMIT,
                });
                allRows.push(...(res.data.rows ?? []));
                exportTotals = res.data.totals;
                exportPeriod = res.data.period;
                totalPages = res.pagination?.totalPages ?? 1;
                p += 1;
            } while (p <= totalPages);

            const agentName = agentId ? agents.find((a) => a.id === agentId)?.fullName ?? agentId : "All agents";
            const didLabel = didNumberId ? dids.find((d) => d._id === didNumberId)?.number ?? didNumberId : "All numbers";

            const lines: string[] = [];
            lines.push(csvRow(["Store report"]));
            lines.push(csvRow(["From", formatDate(exportPeriod.from)]));
            lines.push(csvRow(["To", formatDate(exportPeriod.to)]));
            lines.push(csvRow(["Agent", agentName]));
            lines.push(csvRow(["DID number", didLabel]));
            lines.push("");

            lines.push(csvRow(["Summary"]));
            lines.push(csvRow(["Total calls", exportTotals.calls]));
            lines.push(csvRow(["Total duration", formatDuration(exportTotals.totalDuration)]));
            lines.push(csvRow(["Billed duration", formatDuration(exportTotals.totalBilledDuration)]));
            lines.push(csvRow(["Charged by Vezeti", exportTotals.totalCallChargedVezeti]));
            lines.push(csvRow(["Charge from rate", exportTotals.totalCallChargeFromRate]));
            lines.push("");

            lines.push(csvRow(COLUMNS));
            if (allRows.length === 0) {
                lines.push(csvRow(["No calls found for this period."]));
            } else {
                allRows.forEach((r) => {
                    lines.push(
                        csvRow([
                            r.agent,
                            r.dt,
                            r.sourceCli,
                            formatSeconds(r.duration),
                            formatSeconds(r.durationRoundedUp),
                            r.customerCharge,
                            r.ccps,
                            r.ccpm,
                            r.cc,
                            r.pricePerSecond,
                            r.pricePerMin,
                        ])
                    );
                });
            }

            const parts = ["store-report", safeName(from), "to", safeName(to)];
            if (agentId) parts.push(safeName(agentName));
            if (didNumberId) parts.push(safeName(didLabel));
            downloadCsv(lines.join("\r\n"), `${parts.join("_")}.csv`);
        } catch (err: any) {
            setExportError(err?.response?.data?.message || "Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const canExport = !loading && !error && !!report && !exporting;

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0B1437]">Report</h2>
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
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
                        {exporting ? "Exporting…" : "Export CSV"}
                    </button>
                    {exportError && <p className="text-xs text-red-600">{exportError}</p>}

                    <DateRangeFilter
                        preset={dates.preset}
                        range={dates.range}
                        onChange={(preset, range) => {
                            setPage(1);
                            setDates({ preset, range });
                        }}
                    />
                </div>
            </div>

            <div className="mb-6 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    Agent
                    <select value={agentId} onChange={(e) => pickAgent(e.target.value)} className={selectCls}>
                        <option value="">All agents</option>
                        {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.fullName}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    DID number
                    <select value={didNumberId} onChange={(e) => pickDid(e.target.value)} className={selectCls}>
                        <option value="">All numbers</option>
                        {dids.map((d) => (
                            <option key={d._id} value={d._id}>
                                {d.number}
                            </option>
                        ))}
                    </select>
                </label>

                {(agentId || didNumberId) && (
                    <button type="button" onClick={clearFilters} className={`${ghostBtn} border border-slate-200`}>
                        Clear
                    </button>
                )}
            </div>

            {/* Totals for the whole period (not just this page) */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Total calls" value={totals ? totals.calls.toLocaleString() : "—"} />
                <StatCard label="Total duration" value={totals ? formatDuration(totals.totalDuration) : "—"} />
                <StatCard label="Billed duration" value={totals ? formatDuration(totals.totalBilledDuration) : "—"} />
                <StatCard label="Charged by Vezeti" value={totals ? formatMoney(totals.totalCallChargedVezeti) : "—"} />
                <StatCard label="Charge from rate" value={totals ? formatMoney(totals.totalCallChargeFromRate) : "—"} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white mb-20">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-sm">
                        <thead>
                            <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500">
                                {COLUMNS.map((c) => (
                                    <th key={c} className="whitespace-nowrap px-6 py-3.5">
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading &&
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {COLUMNS.map((c) => (
                                            <td key={c} className="px-6 py-5">
                                                <span className="block h-3 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                            {!loading && error && (
                                <tr>
                                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                                        <p className="mb-3">Couldn’t load the report. {error}</p>
                                        <button type="button" onClick={load} className={`${ghostBtn} border border-slate-200`}>
                                            Try again
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && rows.length === 0 && (
                                <tr>
                                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                                        No calls found for this period.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                rows.map((r, i) => (
                                    <tr key={`${r.dt}-${r.sourceCli}-${i}`} className="transition-colors hover:bg-slate-50/60">
                                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0f1535]">{r.agent}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{r.dt}</td>
                                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{r.sourceCli}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatSeconds(r.durationRoundedUp)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatMoney(r.customerCharge)}</td>
                                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{dec(r.ccps)}</td>
                                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{formatMoney(r.ccpm)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0f1535]">{formatMoney(r.cc)}</td>
                                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{dec(r.pricePerSecond)}</td>
                                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{formatMoney(r.pricePerMin)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                        <span className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} calls
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`${ghostBtn} border border-slate-200`}
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className={`${ghostBtn} border border-slate-200`}
                                disabled={page >= pagination.totalPages || loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreReportPage;