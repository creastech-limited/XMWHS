import { useCallback, useEffect, useState } from "react";
import { PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { getMyDidCalls, getMyDidNumbers } from "../../services/api/userService";
import type { DidMeCall, DidMeNumber, Pagination } from "../../types/agent";
import { formatDate, formatDateTime, formatMoney, formatSeconds } from "../../utils/format";
import DateRangeFilter from "../../components/Agent/DateRangeFilter";
import { presetRange, type DateRange, type PresetKey } from "../../utils/dateRange";

const COLUMNS = ["Date", "Direction", "Caller", "Called", "DID", "Duration", "Billed", "Charge"];
const LIMIT = 50;

const ghostBtn =
  "rounded-lg px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";
const primaryBtn =
  "rounded-lg bg-[#0B1437] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B1437]/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100";
const inputCls =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f1535] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100";

type Filters = {
  didNumberId: string;
  direction: "" | "term" | "orig";
  number: string;
};
const EMPTY: Filters = { didNumberId: "", direction: "", number: "" };

const DirectionPill = ({ direction }: { direction: string }) => {
  const d = direction.toLowerCase();
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

const DidAgentCalls = () => {
  // dates: default is today
  const [dates, setDates] = useState<{ preset: PresetKey; range: DateRange }>({
    preset: "today",
    range: presetRange("today"),
  });

  // other filters
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<DidMeCall[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [dids, setDids] = useState<DidMeNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyDidNumbers().then(setDids).catch(() => setDids([]));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyDidCalls({
        from: dates.range.from,
        to: dates.range.to,
        didNumberId: applied.didNumberId,
        direction: applied.direction,
        number: applied.number.trim(),
        page,
        limit: LIMIT,
      });
      setRows(res.rows);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [dates, applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  const onDatesChange = (preset: PresetKey, range: DateRange) => {
    setPage(1);
    setDates({ preset, range });
  };

  const apply = () => {
    setPage(1);
    setApplied(draft);
  };

  const resetOthers = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  };

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const sameDay = dates.range.from === dates.range.to;

  return (
    <div className="p-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B1437]">Calls</h2>
          <p className="mt-1 text-sm text-slate-500">
            {sameDay
              ? formatDate(dates.range.from)
              : `${formatDate(dates.range.from)} – ${formatDate(dates.range.to)}`}
          </p>
        </div>
        <DateRangeFilter preset={dates.preset} range={dates.range} onChange={onDatesChange} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white mb-20">
        {/* Other filters */}
        <div className="flex flex-wrap items-end gap-3 px-6 py-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            DID number
            <select
              value={draft.didNumberId}
              onChange={(e) => set("didNumberId", e.target.value)}
              className={inputCls}
            >
              <option value="">All numbers</option>
              {dids.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.number}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Direction
            <select
              value={draft.direction}
              onChange={(e) => set("direction", e.target.value as Filters["direction"])}
              className={inputCls}
            >
              <option value="">All</option>
              <option value="term">Outbound</option>
              <option value="orig">Inbound</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Caller / called number
            <input
              type="text"
              inputMode="numeric"
              placeholder="Contains digits…"
              value={draft.number}
              onChange={(e) => set("number", e.target.value.replace(/[^\d+]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className={inputCls}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={apply} className={primaryBtn}>
              Apply
            </button>
            <button type="button" onClick={resetOthers} className={`${ghostBtn} border border-slate-200`}>
              Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500">
                {COLUMNS.map((c) => (
                  <th
                    key={c}
                    className={`whitespace-nowrap px-6 py-3.5 ${c === "Charge" ? "text-right" : ""}`}
                  >
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
                    <p className="mb-3">Couldn’t load calls. {error}</p>
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
                rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDateTime(c.date)}</td>
                    <td className="px-6 py-4">
                      <DirectionPill direction={c.direction} />
                    </td>
                    <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{c.caller}</td>
                    <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{c.called}</td>
                    <td className="px-6 py-4 tabular-nums text-[#0f1535]">{c.did}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatSeconds(c.durationSeconds)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatSeconds(c.billedSeconds)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-[#0f1535]">
                      {c.charge == null ? "—" : formatMoney(c.charge)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} calls
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

export default DidAgentCalls;