import { useEffect, useState, useCallback } from "react";
import { MoreHorizontal, X } from "lucide-react";
import {
    getStoreInvoices,
    getStoreInvoiceById,
    startDidInvoicePayment
} from "../../services/api/userService";
import { usePayInvoice } from "../../hooks/usePayInvoice";
import type { Invoice, Pagination, InvoiceDetail } from "../../types/agent";

const CURRENCY = "NGN";

const COLUMNS = [
    "Invoice #",
    "Agent",
    "Period",
    "Calls",
    "Duration",
    "Amount",
    "Status",
    "Invoice date",
    "View Invoice",
    // "Actions",
];

const ghostBtn =
    "rounded-lg px-4 py-2 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";

// const payBtn =
//     "whitespace-nowrap rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100";

const formatMoney = (amount: number) =>
    new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: CURRENCY,
    }).format(amount);

const formatDate = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "—";

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};

const statusClasses: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-emerald-50 text-emerald-700",
};

const StatusPill = ({ status }: { status: string }) => (
    <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status] ?? "bg-slate-100 text-slate-600"
            }`}
    >
        {status}
    </span>
);

/* ---------- Invoice modal ---------- */

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold text-[#0f1535]">{value}</div>
    </div>
);

const InvoiceModal = ({
    invoiceId,
    onClose,
    // onPay,
}: {
    invoiceId: string;
    onClose: () => void;
    onPay: (invoice: InvoiceDetail) => void;
}) => {
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getStoreInvoiceById(invoiceId);
                if (!cancelled) setInvoice(res.data);
            } catch (err: any) {
                if (!cancelled)
                    setError(err?.response?.data?.message || "Failed to load invoice");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [invoiceId]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#0f1535]">Invoice details</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading && (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <span key={i} className="block h-3 animate-pulse rounded bg-slate-100" />
                        ))}
                    </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}

                {invoice && (
                    <>
                        <div className="mb-6 flex items-center gap-3">
                            <h2 className="text-xl font-bold text-[#0f1535]">
                                {invoice.invoiceNumber}
                            </h2>
                            <StatusPill status={invoice.status} />
                        </div>

                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Agent" value={invoice.agentId.name} />
                            <Field label="Email" value={invoice.agentId.email} />
                            <Field label="Phone" value={invoice.agentId.phone} />
                            <Field
                                label="Period"
                                value={`${formatDate(invoice.periodStart)} – ${formatDate(
                                    invoice.periodEnd
                                )}`}
                            />
                            <Field label="Invoice date" value={formatDate(invoice.invoiceDate)} />
                            <Field label="Paid at" value={formatDate(invoice.paidAt)} />
                            <Field label="Total calls" value={invoice.callCount} />
                            <Field
                                label="Billed duration"
                                value={formatDuration(invoice.billedSeconds)}
                            />
                            <Field label="Source charge" value={formatMoney(invoice.sourceCharge)} />
                        </div>

                        <h4 className="mb-2 text-sm font-semibold text-[#0f1535]">
                            Breakdown by DID
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500">
                                        <th className="whitespace-nowrap px-4 py-3">Number</th>
                                        <th className="whitespace-nowrap px-4 py-3">Calls</th>
                                        <th className="whitespace-nowrap px-4 py-3">Billed min</th>
                                        <th className="whitespace-nowrap px-4 py-3">Rate/min</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.byDid.map((d) => (
                                        <tr key={d.didNumberId} className="transition-colors hover:bg-slate-50/60">
                                            <td className="px-4 py-3 font-semibold tabular-nums text-[#0f1535]">
                                                {d.number}
                                            </td>
                                            <td className="px-4 py-3 text-[#0f1535]">{d.calls}</td>
                                            <td className="px-4 py-3 text-[#0f1535]">{d.billedMinutes}</td>
                                            <td className="px-4 py-3 text-[#0f1535]">
                                                {formatMoney(d.clientPerMinute)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#0f1535]">
                                                {formatMoney(d.clientCharge)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-slate-100">
                                        <td colSpan={4} className="px-4 py-3 font-bold text-[#0f1535]">
                                            Total
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-[#0f1535]">
                                            {formatMoney(invoice.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* {invoice.status === "pending" && (
                            <div className="mt-6 text-right">
                                <button type="button" className={payBtn} onClick={() => onPay(invoice)}>
                                    Make Payment
                                </button>
                            </div>
                        )} */}
                    </>
                )}
            </div>
        </div>
    );
};

/* ---------- Page ---------- */

const StoreInvoicesPage = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [menu, setMenu] = useState<{ id: string; top: number; right: number } | null>(
        null
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getStoreInvoices({ page, limit: 50 });
            setInvoices(res.data);
            setPagination(res.pagination);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    useEffect(() => {
        if (!menu) return;
        const close = () => setMenu(null);
        window.addEventListener("click", close);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [menu]);

    const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.stopPropagation();
        if (menu?.id === id) return setMenu(null);
        const rect = e.currentTarget.getBoundingClientRect();
        setMenu({ id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
    };

    const { pay, payError } = usePayInvoice(
        startDidInvoicePayment,
        "/invoices/callback",
    );
    const handleMakePayment = (invoice: Invoice | InvoiceDetail) => pay(invoice._id);

    return (
        <div className="p-2">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0B1437]">Invoices</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Invoices raised for your store and their payment status.
                </p>
            </div>

            {/* White bordered card, same as the DID numbers page */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                        <thead>
                            <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500">
                                {COLUMNS.map((c) => (
                                    <th
                                        key={c}
                                        className={`whitespace-nowrap px-6 py-3.5 ${c === "Actions" ? "text-right" : ""
                                            }`}
                                    >
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
                                    <td
                                        colSpan={COLUMNS.length}
                                        className="px-6 py-12 text-center text-slate-500"
                                    >
                                        <p className="mb-3">Couldn’t load invoices. {error}</p>
                                        <button
                                            type="button"
                                            onClick={fetchInvoices}
                                            className={`${ghostBtn} border border-slate-200`}
                                        >
                                            Try again
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && invoices.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={COLUMNS.length}
                                        className="px-6 py-12 text-center text-slate-500"
                                    >
                                        No invoices yet.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                invoices.map((inv) => (
                                    <tr key={inv._id} className="transition-colors hover:bg-slate-50/60">
                                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0f1535]">
                                            {inv.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[#0f1535]">{inv.agentId?.name}</div>
                                            <div className="text-xs text-slate-400">{inv.agentId?.email}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">
                                            {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                                        </td>
                                        <td className="px-6 py-4 text-[#0f1535]">{inv.callCount}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">
                                            {formatDuration(inv.billedSeconds)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0f1535]">
                                            {formatMoney(inv.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusPill status={inv.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-[#0f1535]">
                                            {formatDate(inv.invoiceDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={(e) => openMenu(e, inv._id)}
                                                aria-label={`Open actions for ${inv.invoiceNumber}`}
                                                aria-haspopup="menu"
                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>

                                        {/* <td className="px-6 py-4 text-right">
                                            {inv.status === "pending" && (
                                                <button
                                                    type="button"
                                                    className={payBtn}
                                                    onClick={() => handleMakePayment(inv)}
                                                >
                                                    Make Payment
                                                </button>
                                            )}
                                        </td> */}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                        <span className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`${ghostBtn} border border-slate-200`}
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className={`${ghostBtn} border border-slate-200`}
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {menu && (
                <div
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: menu.top, right: menu.right }}
                    className="fixed z-[900] min-w-[160px] overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setSelectedId(menu.id);
                            setMenu(null);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-[#0f1535] transition-colors hover:bg-slate-50"
                    >
                        View invoice
                    </button>
                </div>
            )}

            {selectedId && (
                <InvoiceModal
                    invoiceId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onPay={handleMakePayment}
                />
            )}

            {payError && <p className="mb-4 text-sm text-red-600">{payError}</p>}
        </div>
    );
};

export default StoreInvoicesPage;