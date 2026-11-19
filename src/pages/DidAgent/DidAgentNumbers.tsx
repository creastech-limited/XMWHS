import { useCallback, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { getMyDidNumbers } from "../../services/api/userService";
import type { DidMeNumber } from "../../types/agent";
import { formatDate } from "../../utils/format";

const COLUMNS = ["Number", "Assigned on", "Created", "Expires", "Status"];

const ghostBtn =
  "rounded-lg px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";

const StatusPill = ({ status }: { status: string }) => {
  const active = status?.toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
};

const DidAgentNumbers = () => {
  const [rows, setRows] = useState<DidMeNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRows(await getMyDidNumbers());
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0B1437]">Numbers</h2>
        <p className="mt-1 text-sm text-slate-500">DID numbers assigned to you.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
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
                Array.from({ length: 4 }).map((_, i) => (
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
                    <p className="mb-3">Couldn’t load numbers. {error}</p>
                    <button type="button" onClick={load} className={`${ghostBtn} border border-slate-200`}>
                      Try again
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                    No numbers assigned to you yet.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                rows.map((row) => (
                  <tr key={row._id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0B1437]/5 text-[#0B1437]">
                          <Phone size={18} />
                        </span>
                        <span className="font-semibold tabular-nums text-[#0f1535]">{row.number}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDate(row.assignedAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDate(row.didCreationDate)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDate(row.didExpiryDate)}</td>
                    <td className="px-6 py-4">
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DidAgentNumbers;