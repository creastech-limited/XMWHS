import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getDidCdrImports } from "../../services/api/userService";
import type { CdrImportRecord } from "../../types/store";
import type { Pagination } from "../../types/store";
import { formatDate, formatDateTime, formatMoney } from "../../utils/format";

const COLUMNS = ["", "File", "Imported", "Period", "Rows", "Saved", "Duplicates", "Unmatched", "Status"];
const LIMIT = 20;

const ghostBtn =
  "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";

const StatusPill = ({ status, title }: { status: string; title?: string | null }) => {
  const s = status?.toLowerCase();
  const cls =
    s === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : s === "failed"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-700";
  return (
    <span title={title ?? undefined} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
};

const ImportHistory = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [rows, setRows] = useState<CdrImportRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDidCdrImports({ page, limit: LIMIT });
      setRows(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page]);

  // refreshKey changes after a successful import
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section className="mt-8 mb-20">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">Import history</h2>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500">
                {COLUMNS.map((c, i) => (
                  <th key={i} className="whitespace-nowrap px-6 py-3.5">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((_c, j) => (
                      <td key={j} className="px-6 py-5">
                        <span className="block h-3 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                    <p className="mb-3">Couldn’t load imports. {error}</p>
                    <button type="button" onClick={load} className={ghostBtn}>Try again</button>
                  </td>
                </tr>
              )}

              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                    No imports yet.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                rows.map((r) => {
                  const invoices = r.invoices ?? [];
                  const open = openId === r._id;
                  return (
                    <Fragment key={r._id}>
                      <tr className="transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-4">
                          {invoices.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setOpenId(open ? null : r._id)}
                              aria-label={open ? "Hide invoices" : "Show invoices"}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0f1535]">{r.fileName}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">{formatDateTime(r.importedAt)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">
                          {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                        </td>
                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{r.totalRows.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold tabular-nums text-[#0f1535]">{r.inserted.toLocaleString()}</td>
                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{r.duplicates.toLocaleString()}</td>
                        <td className="px-6 py-4 tabular-nums text-[#0f1535]">{r.unmatched.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <StatusPill status={r.status} title={r.errorMessage} />
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-slate-50/60">
                          <td />
                          <td colSpan={COLUMNS.length - 1} className="px-6 py-4">
                            <div className="mb-2 text-xs font-semibold text-slate-500">
                              Invoices raised by this import
                            </div>
                            <table className="w-full max-w-xl text-sm">
                              <tbody>
                                {invoices.map((inv) => (
                                  <tr key={inv._id} className="border-t border-slate-100 first:border-0">
                                    <td className="py-2 font-semibold text-[#0f1535]">{inv.invoiceNumber}</td>
                                    <td className="py-2 text-[#0f1535]">{inv.callCount} calls</td>
                                    <td className="py-2 text-right font-semibold text-[#0f1535]">
                                      {formatMoney(inv.totalAmount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} imports
            </span>
            <div className="flex gap-2">
              <button type="button" className={ghostBtn} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button type="button" className={ghostBtn} disabled={page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ImportHistory;