import { useCallback, useEffect, useState } from "react";
import { PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { getMyDidDashboard } from "../../services/api/userService";
import type { DidMeDashboard } from "../../types/agent";
import DateRangeFilter from "../../components/Agent/DateRangeFilter";
import { presetRange, type DateRange, type PresetKey } from "../../utils/dateRange";
import {
    formatDate,
    formatDateTime,
    formatDuration,
    formatMoney,
    formatRate,
    formatSeconds,
} from "../../utils/format";

const ghostBtn =
    "rounded-lg px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";
const headRow =
    "border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500";

const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-1 text-xl font-bold text-[#0f1535]">{value}</div>
    </div>
);

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th className={`whitespace-nowrap px-6 py-3.5 ${right ? "text-right" : ""}`}>{children}</th>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-3 mt-8 text-sm font-semibold text-[#0f1535]">{children}</h3>
);

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">{children}</div>
    </div>
);

const EmptyRow = ({ cols, text }: { cols: number; text: string }) => (
    <tr>
        <td colSpan={cols} className="px-6 py-12 text-center text-slate-500">
            {text}
        </td>
    </tr>
);

const StatusPill = ({ status }: { status: string }) => {
    const active = status?.toLowerCase() === "active";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {status}
        </span>
    );
};

const DirectionPill = ({ direction }: { direction: string }) => {
    const d = direction?.toLowerCase();
    if (d === "term")
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                <PhoneOutgoing size={12} /> Outbound
            </span>
        );
    if (d === "orig")
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <PhoneIncoming size={12} /> Inbound
            </span>
        );
    return <span className="text-slate-400">—</span>;
};

const DidAgentDashboard = () => {
    const [data, setData] = useState<DidMeDashboard | null>(null);
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
            setData(await getMyDidDashboard({ from: dates.range.from, to: dates.range.to }));
        } catch (err: any) {
            setError(err?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [dates]);

    useEffect(() => {
        load();
    }, [load]);

    // const apply = () => setApplied({ from: from || undefined, to: to || undefined });
    // const reset = () => {
    //     setFrom("");
    //     setTo("");
    //     setApplied({});
    // };

    return (
        <div className="p-2">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0B1437]">Dashboard</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {data
                            ? `${formatDate(data.period.from)} – ${formatDate(data.period.to)}`
                            : "Your DID totals and activity."}
                    </p>
                </div>

                <DateRangeFilter
                    preset={dates.preset}
                    range={dates.range}
                    onChange={(preset, range) => setDates({ preset, range })}
                />
            </div>

            {error && (
                <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center text-slate-500">
                    <p className="mb-3">Couldn’t load the dashboard. {error}</p>
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

            {!loading && !error && data && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <StatCard label="Total calls" value={data.totals.calls.toLocaleString()} />
                        <StatCard label="Billed minutes" value={data.totals.billedMinutes.toLocaleString()} />
                        <StatCard label="Billed duration" value={formatDuration(data.totals.billedSeconds)} />
                        <StatCard label="Rate / min" value={formatRate(data.totals.clientPerMinute)} />
                        <StatCard label="Total charge" value={formatMoney(data.totals.clientCharge)} />
                    </div>

                    <SectionTitle>My numbers</SectionTitle>
                    <Card>
                        <table className="w-full min-w-[640px] border-collapse text-sm">
                            <thead>
                                <tr className={headRow}>
                                    <Th>Number</Th>
                                    <Th>Assigned on</Th>
                                    <Th>Expires</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.numbers.length === 0 && <EmptyRow cols={4} text="No numbers assigned to you yet." />}
                                {data.numbers.map((n) => (
                                    <tr key={n._id} className="transition-colors hover:bg-slate-50/60">
                                        <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{n.number}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDate(n.assignedAt)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDate(n.didExpiryDate)}</td>
                                        <td className="px-6 py-4">
                                            <StatusPill status={n.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <SectionTitle>Usage by DID</SectionTitle>
                    <Card>
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
                                {data.byDid.length === 0 && <EmptyRow cols={5} text="No calls in this period." />}
                                {data.byDid.map((d) => (
                                    <tr key={d.didNumberId} className="transition-colors hover:bg-slate-50/60">
                                        <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{d.number}</td>
                                        <td className="px-6 py-4 text-[#0f1535]">{d.calls.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-[#0f1535]">{d.billedMinutes.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-[#0f1535]">{formatRate(d.clientPerMinute)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-[#0f1535]">
                                            {formatMoney(d.clientCharge)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <SectionTitle>Recent calls</SectionTitle>
                    <div className="mb-20">
                        <Card>
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead>
                                    <tr className={headRow}>
                                        <Th>Date</Th>
                                        <Th>Direction</Th>
                                        <Th>Caller</Th>
                                        <Th>Destination</Th>
                                        <Th>DID</Th>
                                        <Th>Duration</Th>
                                        <Th>Billed</Th>
                                        <Th right>Charge</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.recentCalls.length === 0 && <EmptyRow cols={8} text="No calls in this period." />}
                                    {data.recentCalls.map((c) => (
                                        <tr key={c._id} className="transition-colors hover:bg-slate-50/60">
                                            <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDateTime(c.callDate)}</td>
                                            <td className="px-6 py-4">
                                                <DirectionPill direction={c.direction} />
                                            </td>
                                            <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{c.sourceCli}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold tabular-nums text-[#0f1535]">{c.destNumber}</div>
                                                {c.destName && <div className="text-xs text-slate-400">{c.destName}</div>}
                                            </td>
                                            <td className="px-6 py-4 tabular-nums text-[#0f1535]">{c.didNumber?.number ?? "—"}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">
                                                {formatSeconds(c.callActualDuration)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">
                                                {formatSeconds(c.callBilledDuration)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-[#0f1535]">
                                                {formatMoney(c.creastechCharge)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                </>
            )}
        </div>
    );
};

export default DidAgentDashboard;