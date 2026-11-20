import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ClipboardEvent,
    type FormEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
} from "react";
import {
    CalendarDays,
    ChevronDown,
    Eye,
    Hash,
    MoreHorizontal,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    UserMinus,
    UserPlus,
    X,
} from "lucide-react";
import {
    assignDidNumber,
    createDidNumbers,
    deleteDidNumber,
    getApiErrorMessage,
    getDidClients,
    getDidNumberById,
    getDidNumbers,
    unassignDidNumber,
    updateDidNumber,
    type UpdateDidPayload,
} from "../../services";
import type { DidNumber, DidRef, SkippedDidNumber } from "../../types/agent";
import type { StoreAgent } from "../../types";

/* ------------------------------------------------------------------ */
/* Helpers + shared styles                                             */
/* ------------------------------------------------------------------ */

const labelOf = (ref: DidRef | null | undefined): string | null => {
    if (!ref) return null;
    if (typeof ref === "string") return ref;
    return ref.name ?? ref.fullName ?? ref.email ?? ref._id ?? null;
};

const shortId = (id: string) => (id ? `…${id.slice(-6)}` : "");

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const agentLabel = (a: StoreAgent) => a.fullName || `${a.firstName} ${a.lastName}`.trim() || a.email || a.id;

const formatDate = (iso?: string | null, withTime = false) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return withTime
        ? d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

// ISO timestamp -> yyyy-mm-dd for <input type="date">.
const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

const statusStyles: Record<string, { pill: string; dot: string }> = {
    active: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    available: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    assigned: { pill: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
    expired: { pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
};
const fallbackStatus = { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };

const inputBase =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pr-3 text-sm text-[#0f1535] " +
    "placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 " +
    "disabled:opacity-60";
const inputClass = `${inputBase} pl-10`;
const plainInputClass = `${inputBase} pl-3`;

const primaryBtn =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-semibold text-white " +
    "transition-colors hover:bg-[#162052] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

const ghostBtn =
    "whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-[#0f1535] transition-colors hover:bg-slate-100 " +
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60";

function StatusPill({ status }: { status: string }) {
    const style = statusStyles[status?.toLowerCase()] ?? fallbackStatus;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {capitalize(status || "unknown")}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

function Field({ id, label, hint, children }: { id?: string; label: string; hint?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold text-slate-700">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

function IconWrap({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Add drawer (single + bulk, each number with its own details)        */
/* ------------------------------------------------------------------ */

const MAX_ROWS = 50;

interface NumberRow {
    key: string;
    number: string;
    vezetiRef: string;
    didCreationDate: string;
    didExpiryDate: string;
    notes: string;
}

let rowSeq = 0;
const newRow = (seed: Partial<NumberRow> = {}): NumberRow => ({
    key: `row-${++rowSeq}`,
    number: "",
    vezetiRef: "",
    didCreationDate: "",
    didExpiryDate: "",
    notes: "",
    ...seed,
});

const cleanNumber = (n: string) => n.replace(/[\s-]/g, "");

interface AddDidDrawerProps {
    open: boolean;
    onClose: () => void;
    onCreated: (docs: DidNumber[]) => void;
}

function AddDidDrawer({ open, onClose, onCreated }: AddDidDrawerProps) {
    const [initialRow] = useState(() => newRow());
    const [rows, setRows] = useState<NumberRow[]>([initialRow]);
    const [openKey, setOpenKey] = useState(initialRow.key);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [outcome, setOutcome] = useState<{ added: number; skipped: SkippedDidNumber[] } | null>(null);
    const firstInput = useRef<HTMLInputElement>(null);

    const filledCount = rows.filter((r) => cleanNumber(r.number)).length;

    const updateRow = (key: string, patch: Partial<NumberRow>) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const removeRow = (key: string) => {
        if (rows.length <= 1) return;
        const next = rows.filter((r) => r.key !== key);
        setRows(next);
        if (openKey === key) setOpenKey(next[next.length - 1].key);
    };

    // New number: expand it, collapse the rest, and carry the dates over from the previous one.
    const addRow = () => {
        if (rows.length >= MAX_ROWS) return;
        const last = rows[rows.length - 1];
        const row = newRow({ didCreationDate: last.didCreationDate, didExpiryDate: last.didExpiryDate });
        setRows((prev) => [...prev, row]);
        setOpenKey(row.key);
    };

    // Pasting a list (one per line, or comma-separated) creates one card per number.
    const handlePaste = (key: string) => (e: ClipboardEvent<HTMLInputElement>) => {
        const tokens = e.clipboardData
            .getData("text")
            .split(/[\r\n,;]+/)
            .map((t) => t.trim())
            .filter(Boolean);
        if (tokens.length < 2) return;
        e.preventDefault();
        setRows((prev) => {
            const i = prev.findIndex((r) => r.key === key);
            if (i === -1) return prev;
            const base = prev[i];
            const next = [...prev];
            next[i] = { ...base, number: tokens[0] };
            next.splice(
                i + 1,
                0,
                ...tokens.slice(1).map((t) =>
                    newRow({ number: t, didCreationDate: base.didCreationDate, didExpiryDate: base.didExpiryDate })
                )
            );
            return next.slice(0, MAX_ROWS);
        });
    };

    // Clear messages when the drawer closes.
    useEffect(() => {
        if (!open) {
            setError("");
            setOutcome(null);
        }
    }, [open]);

    // Focus the first field and close on Escape.
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => firstInput.current?.focus(), 300);
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            clearTimeout(t);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, submitting, onClose]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setOutcome(null);

        // Show the problem and open the card it belongs to (collapsed cards can't show it themselves).
        const fail = (key: string, message: string) => {
            setOpenKey(key);
            setError(message);
        };

        const cleaned = rows.map((r) => ({ ...r, number: cleanNumber(r.number) })).filter((r) => r.number);
        if (cleaned.length === 0) return setError("Enter at least one number.");

        for (const r of cleaned) {
            if (!/^\d{6,15}$/.test(r.number)) return fail(r.key, `${r.number} doesn't look like a valid number.`);
            if (!r.didCreationDate || !r.didExpiryDate)
                return fail(r.key, `Set the creation and expiry dates for ${r.number}.`);
            if (r.didExpiryDate < r.didCreationDate)
                return fail(r.key, `The expiry date for ${r.number} can't be before its creation date.`);
        }

        const seen = new Set<string>();
        const dupes = new Set<string>();
        cleaned.forEach((r) => (seen.has(r.number) ? dupes.add(r.number) : seen.add(r.number)));
        if (dupes.size) return setError(`These numbers are listed more than once: ${[...dupes].join(", ")}`);

        setSubmitting(true);
        try {
            const result = await createDidNumbers(
                cleaned.map((r) => ({
                    number: r.number,
                    didCreationDate: r.didCreationDate,
                    didExpiryDate: r.didExpiryDate,
                    ...(r.vezetiRef.trim() ? { vezetiRef: r.vezetiRef.trim() } : {}),
                    ...(r.notes.trim() ? { notes: r.notes.trim() } : {}),
                }))
            );

            if (result.created.length) onCreated(result.created);

            if (result.skipped.length === 0) {
                const fresh = newRow();
                setRows([fresh]);
                setOpenKey(fresh.key);
                onClose();
            } else {
                // Keep only the numbers that weren't added (with all their details) so they can be fixed and retried.
                const skippedSet = new Set(result.skipped.map((s) => s.number));
                const remaining = cleaned.filter((r) => skippedSet.has(r.number));
                setRows(remaining);
                setOpenKey(remaining[0].key);
                setOutcome({ added: result.created.length, skipped: result.skipped });
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div
                onClick={() => !submitting && onClose()}
                aria-hidden="true"
                className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="did-drawer-title"
                aria-hidden={!open}
                className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none ${open ? "visible translate-x-0" : "invisible translate-x-full"
                    }`}
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 id="did-drawer-title" className="text-lg font-bold text-[#0f1535]">
                            Add DID numbers
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">Each number has its own dates and notes.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                        {rows.map((row, i) => {
                            const isOpen = row.key === openKey;
                            const panelId = `did-row-${row.key}`;
                            return (
                                <div key={row.key} className="rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 px-3 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setOpenKey(isOpen ? "" : row.key)}
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                                        >
                                            <ChevronDown
                                                size={16}
                                                className={`flex-shrink-0 text-slate-400 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold tabular-nums text-[#0f1535]">
                                                    {cleanNumber(row.number) || `Number ${i + 1}`}
                                                </span>
                                                {!isOpen && row.didExpiryDate && (
                                                    <span className="block text-xs text-slate-500">Expires {formatDate(row.didExpiryDate)}</span>
                                                )}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeRow(row.key)}
                                            disabled={rows.length === 1}
                                            aria-label={`Remove number ${i + 1}`}
                                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-slate-100 hover:text-red-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:pointer-events-none disabled:opacity-30"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <div id={panelId} className="space-y-4 border-t border-slate-100 px-4 py-4">
                                            <div className="grid grid-cols-[1fr_8.5rem] gap-3">
                                                <Field id={`${panelId}-number`} label="Number">
                                                    <IconWrap icon={<Phone size={16} />}>
                                                        <input
                                                            id={`${panelId}-number`}
                                                            ref={i === 0 ? firstInput : undefined}
                                                            autoFocus={i > 0}
                                                            value={row.number}
                                                            onChange={(e) => updateRow(row.key, { number: e.target.value })}
                                                            onPaste={handlePaste(row.key)}
                                                            placeholder="2018880180"
                                                            inputMode="tel"
                                                            maxLength={10}
                                                            autoComplete="off"
                                                            required
                                                            className={inputClass}
                                                        />
                                                    </IconWrap>
                                                </Field>
                                                <Field id={`${panelId}-ref`} label="Provider">
                                                    <IconWrap icon={<Hash size={16} />}>
                                                        <input
                                                            id={`${panelId}-ref`}
                                                            value={row.vezetiRef}
                                                            onChange={(e) => updateRow(row.key, { vezetiRef: e.target.value })}
                                                            placeholder="VZ-0180"
                                                            className={inputClass}
                                                            required
                                                        />
                                                    </IconWrap>
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Field id={`${panelId}-created`} label="Creation date">
                                                    <input
                                                        id={`${panelId}-created`}
                                                        type="date"
                                                        value={row.didCreationDate}
                                                        onChange={(e) => updateRow(row.key, { didCreationDate: e.target.value })}
                                                        className={plainInputClass}
                                                        required
                                                    />
                                                </Field>
                                                <Field id={`${panelId}-expiry`} label="Expiry date">
                                                    <input
                                                        id={`${panelId}-expiry`}
                                                        type="date"
                                                        value={row.didExpiryDate}
                                                        min={row.didCreationDate || undefined}
                                                        onChange={(e) => updateRow(row.key, { didExpiryDate: e.target.value })}
                                                        className={plainInputClass}
                                                        required
                                                    />
                                                </Field>
                                            </div>

                                            <Field id={`${panelId}-notes`} label="Notes (optional)">
                                                <textarea
                                                    id={`${panelId}-notes`}
                                                    value={row.notes}
                                                    onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                                                    rows={2}
                                                    placeholder="e.g. Creastech main line"
                                                    className={`${plainInputClass} resize-none`}
                                                />
                                            </Field>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="flex items-center justify-between gap-3 pt-1">
                            <button
                                type="button"
                                onClick={addRow}
                                disabled={rows.length >= MAX_ROWS}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50"
                            >
                                <Plus size={16} />
                                Add another number
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Tip: paste a list (one per line, or comma-separated) into a number field to create a card for each. Each number must be unique.
                        </p>

                        {outcome && (
                            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                                <p className="font-semibold">
                                    {outcome.added} added, {outcome.skipped.length} not added.
                                </p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                                    {outcome.skipped.map((s) => (
                                        <li key={s.number}>
                                            <span className="font-mono">{s.number}</span>: {s.reason}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-1.5 text-xs">Only the numbers that weren't added are left in the form.</p>
                            </div>
                        )}

                        {error && (
                            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                {error}
                            </p>
                        )}
                    </div>

                    <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                        <button type="button" onClick={onClose} disabled={submitting} className={ghostBtn}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className={primaryBtn}>
                            {submitting ? "Adding…" : filledCount > 1 ? `Add ${filledCount} numbers` : "Add number"}
                        </button>
                    </footer>
                </form>
            </aside>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Details modal                                                       */
/* ------------------------------------------------------------------ */

function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={wide ? "sm:col-span-2" : undefined}>
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="mt-1 break-words text-sm text-[#0f1535]">{children}</dd>
        </div>
    );
}

interface DidDetailsModalProps {
    row: DidNumber | null;
    onClose: () => void;
    nameOf: (ref: DidRef | null | undefined) => string | null;
}

function DidDetailsModal({ row, onClose, nameOf }: DidDetailsModalProps) {
    const [detail, setDetail] = useState<DidNumber | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const closeRef = useRef<HTMLButtonElement>(null);
    const id = row?._id;

    // Show what the list already has right away, then refresh from GET /api/did/store/numbers/:id.
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setDetail(null);
        setError("");
        setLoading(true);
        getDidNumberById(id)
            .then((d) => !cancelled && setDetail(d))
            .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!row) return;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [row, onClose]);

    if (!row) return null;

    const d: DidNumber = detail ? { ...row, ...detail } : row;
    const assignee = nameOf(d.assignedTo);
    const history = d.assignmentHistory ?? [];

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="did-details-title"
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0B1437]/5 text-[#0B1437]">
                            <Phone size={20} />
                        </span>
                        <div>
                            <h2 id="did-details-title" className="text-lg font-bold tabular-nums text-[#0f1535]">
                                {d.number}
                            </h2>
                            <div className="mt-1 flex items-center gap-2">
                                <StatusPill status={d.status} />
                                {loading && <span className="text-xs text-slate-400">Updating…</span>}
                            </div>
                        </div>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="space-y-5 overflow-y-auto px-6 py-5">
                    {error && (
                        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                            Couldn’t refresh these details, so this is what the list had. {error}
                        </p>
                    )}

                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <Detail label="Creation date">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={14} className="text-slate-400" />
                                {formatDate(d.didCreationDate)}
                            </span>
                        </Detail>
                        <Detail label="Expiry date">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={14} className="text-slate-400" />
                                {formatDate(d.didExpiryDate)}
                            </span>
                        </Detail>
                        <Detail label="Vezeti ref">{d.vezetiRef || "—"}</Detail>
                        <Detail label="Source">{d.source ? capitalize(d.source) : "—"}</Detail>
                        <Detail label="Assigned to">{assignee ?? <span className="text-slate-400">Unassigned</span>}</Detail>
                        <Detail label="Assigned at">{formatDate(d.assignedAt, true)}</Detail>
                        <Detail label="Added on">{formatDate(d.createdAt, true)}</Detail>
                        <Detail label="ID">
                            <span className="font-mono text-xs">{d._id}</span>
                        </Detail>
                        <Detail label="Notes" wide>
                            {d.notes || <span className="text-slate-400">No notes</span>}
                        </Detail>
                        <Detail label={`Assignment history (${history.length})`} wide>
                            {history.length === 0 ? (
                                <span className="text-slate-400">Never assigned</span>
                            ) : (
                                <ol className="list-decimal space-y-0.5 pl-5">
                                    {history.map((h) => {
                                        const agent = typeof h.agentId === "object" ? h.agentId : null;
                                        const name =
                                            agent?.name ||
                                            [agent?.firstName, agent?.lastName].filter(Boolean).join(" ") ||
                                            nameOf(h.agentId) ||
                                            "Unknown";

                                        return (
                                            <li key={h._id}>
                                                {name}
                                                <span className="ml-2 text-xs text-slate-400">
                                                    {formatDate(h.from)} – {h.to ? formatDate(h.to) : "Present"}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </Detail>
                    </dl>
                </div>

                <footer className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                    <button type="button" onClick={onClose} className={primaryBtn}>
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Edit number modal                                                   */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = ["active", "available", "assigned", "expired"]; // trim to what your API accepts

interface EditDidModalProps {
    row: DidNumber | null;
    onClose: () => void;
    onSaved: (row: DidNumber, patch: UpdateDidPayload) => void;
}

function EditDidModal({ row, onClose, onSaved }: EditDidModalProps) {
    const [form, setForm] = useState<UpdateDidPayload>({
        status: "active",
        didCreationDate: "",
        didExpiryDate: "",
        notes: "",
        vezetiRef: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const id = row?._id;

    // Prefill whenever the modal opens for a number.
    useEffect(() => {
        if (!row) return;
        setForm({
            status: row.status || "active",
            didCreationDate: toDateInput(row.didCreationDate),
            didExpiryDate: toDateInput(row.didExpiryDate),
            notes: row.notes ?? "",
            vezetiRef: row.vezetiRef ?? "",
        });
        setError("");
        setSubmitting(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!row) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [row, submitting, onClose]);

    if (!row) return null;

    const set = <K extends keyof UpdateDidPayload>(key: K, value: UpdateDidPayload[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (form.didExpiryDate < form.didCreationDate) return setError("The expiry date can't be before the creation date.");
        setError("");
        setSubmitting(true);
        try {
            const payload: UpdateDidPayload = {
                ...form,
                notes: form.notes.trim(),
                vezetiRef: form.vezetiRef.trim(),
            };
            await updateDidNumber(row._id, payload);
            onSaved(row, payload);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => !submitting && onClose()}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-did-title"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 id="edit-did-title" className="text-lg font-bold text-[#0f1535]">
                            Edit number
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Update the details for <span className="font-semibold tabular-nums text-[#0f1535]">{row.number}</span>.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="space-y-5 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-2 gap-3">
                        <Field id="edit-status" label="Status">
                            <div className="relative">
                                <select
                                    id="edit-status"
                                    value={form.status}
                                    onChange={(e) => set("status", e.target.value)}
                                    className={`${plainInputClass} appearance-none pr-10`}
                                >
                                    {Array.from(new Set([form.status, ...STATUS_OPTIONS])).map((s) => (
                                        <option key={s} value={s}>
                                            {capitalize(s)}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </Field>
                        <Field id="edit-vezeti" label="Vezeti ref">
                            <input
                                id="edit-vezeti"
                                value={form.vezetiRef}
                                onChange={(e) => set("vezetiRef", e.target.value)}
                                placeholder="VZ-0180"
                                className={plainInputClass}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field id="edit-created" label="Creation date">
                            <input
                                id="edit-created"
                                type="date"
                                value={form.didCreationDate}
                                onChange={(e) => set("didCreationDate", e.target.value)}
                                required
                                className={plainInputClass}
                            />
                        </Field>
                        <Field id="edit-expiry" label="Expiry date">
                            <input
                                id="edit-expiry"
                                type="date"
                                value={form.didExpiryDate}
                                min={form.didCreationDate || undefined}
                                onChange={(e) => set("didExpiryDate", e.target.value)}
                                required
                                className={plainInputClass}
                            />
                        </Field>
                    </div>

                    <Field id="edit-notes" label="Notes (optional)">
                        <textarea
                            id="edit-notes"
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            rows={3}
                            className={`${plainInputClass} resize-none`}
                        />
                    </Field>

                    {error && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                </div>

                <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button type="button" onClick={onClose} disabled={submitting} className={ghostBtn}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className={primaryBtn}>
                        {submitting ? "Saving…" : "Save changes"}
                    </button>
                </footer>
            </form>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Assign agent modal                                                  */
/* ------------------------------------------------------------------ */

interface AssignAgentModalProps {
    row: DidNumber | null;
    agents: StoreAgent[];
    agentsLoading: boolean;
    agentsError: string;
    onRetryAgents: () => void;
    onClose: () => void;
    onAssigned: (row: DidNumber, agent: StoreAgent) => void;
}

function AssignAgentModal({ row, agents, agentsLoading, agentsError, onRetryAgents, onClose, onAssigned }: AssignAgentModalProps) {
    const [agentId, setAgentId] = useState("");
    const [from, setFrom] = useState(todayLocal());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const id = row?._id;

    // Start with a clean form each time the modal opens for a number.
    useEffect(() => {
        if (!id) return;
        setAgentId("");
        setFrom(todayLocal());
        setError("");
        setSubmitting(false);
    }, [id]);

    useEffect(() => {
        if (!row) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [row, submitting, onClose]);

    if (!row) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) return setError("Select an agent.");
        setError("");
        setSubmitting(true);
        try {
            await assignDidNumber(row._id, { agentId: agent.id, from });
            onAssigned(row, agent);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => !submitting && onClose()}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="assign-title"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 id="assign-title" className="text-lg font-bold text-[#0f1535]">
                            Assign agent
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Give <span className="font-semibold tabular-nums text-[#0f1535]">{row.number}</span> to an agent.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="space-y-5 overflow-y-auto px-6 py-5">
                    <Field id="assign-agent" label="Agent">
                        <div className="relative">
                            <select
                                id="assign-agent"
                                value={agentId}
                                onChange={(e) => setAgentId(e.target.value)}
                                required
                                disabled={agentsLoading || agents.length === 0}
                                className={`${plainInputClass} appearance-none pr-10`}
                            >
                                <option value="">{agentsLoading ? "Loading agents…" : "Select an agent"}</option>
                                {agents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {agentLabel(a)}
                                        {a.email ? ` (${a.email})` : ""}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        {!agentsLoading && agentsError && (
                            <p className="text-xs text-red-600">
                                Couldn’t load agents. {agentsError}{" "}
                                <button type="button" onClick={onRetryAgents} className="font-semibold underline">
                                    Try again
                                </button>
                            </p>
                        )}
                        {!agentsLoading && !agentsError && agents.length === 0 && (
                            <p className="text-xs text-slate-500">No agents found for this store yet.</p>
                        )}
                    </Field>

                    <Field id="assign-from" label="Assigned from" hint="The date this agent starts using the number.">
                        <input
                            id="assign-from"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            required
                            className={plainInputClass}
                        />
                    </Field>

                    {error && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                </div>

                <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button type="button" onClick={onClose} disabled={submitting} className={ghostBtn}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting || agentsLoading || agents.length === 0} className={primaryBtn}>
                        {submitting ? "Assigning…" : "Assign number"}
                    </button>
                </footer>
            </form>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const COLUMNS = ["ID", "Number", "Assigned to", "Status", "Actions"];

const menuItemBase =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500";

export default function StoreDidNumberPage() {
    const [rows, setRows] = useState<DidNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState<DidNumber | null>(null);
    const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Agents (for the assign dropdown and for showing names instead of ids)
    const [agents, setAgents] = useState<StoreAgent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [agentsError, setAgentsError] = useState("");

    // Row actions
    const [assignTarget, setAssignTarget] = useState<DidNumber | null>(null);
    const [editTarget, setEditTarget] = useState<DidNumber | null>(null);
    const [menuRow, setMenuRow] = useState<DidNumber | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [unassigningId, setUnassigningId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setRows(await getDidNumbers());
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const closeDrawer = useCallback(() => setDrawerOpen(false), []);
    const closeDetails = useCallback(() => setSelected(null), []);
    const closeAssign = useCallback(() => setAssignTarget(null), []);
    const closeEdit = useCallback(() => setEditTarget(null), []);
    const closeMenu = useCallback(() => setMenuRow(null), []);

    const loadAgents = useCallback(async () => {
        setAgentsLoading(true);
        setAgentsError("");
        try {
            setAgents(await getDidClients());
        } catch (err) {
            setAgentsError(getApiErrorMessage(err));
        } finally {
            setAgentsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAgents();
    }, [loadAgents]);

    const refreshRows = useCallback(async () => {
        try {
            setRows(await getDidNumbers());
        } catch {
        }
    }, []);

    const agentNames = useMemo(() => new Map(agents.map((a) => [a.id, agentLabel(a)])), [agents]);

    const nameOf = useCallback(
        (ref: DidRef | null | undefined): string | null => {
            if (!ref) return null;
            const id = typeof ref === "string" ? ref : ref._id;
            return agentNames.get(id) ?? labelOf(ref);
        },
        [agentNames]
    );

    // What the table shows: a name when we have one, otherwise a shortened id.
    const assigneeText = (ref: DidRef | null | undefined) => {
        const label = nameOf(ref);
        if (!label) return null;
        return typeof ref === "string" && !agentNames.has(ref) ? shortId(label) : label;
    };

    const openMenu = (e: ReactMouseEvent<HTMLButtonElement>, row: DidNumber) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({
            top: Math.min(rect.bottom + 4, window.innerHeight - 220), // four items + divider
            left: Math.max(8, Math.min(rect.right - 192, window.innerWidth - 200)),
        });
        setMenuRow(row);
    };

    // The menu is fixed-positioned, so close it if the page moves underneath it.
    useEffect(() => {
        if (!menuRow) return;
        window.addEventListener("scroll", closeMenu, true);
        window.addEventListener("resize", closeMenu);
        return () => {
            window.removeEventListener("scroll", closeMenu, true);
            window.removeEventListener("resize", closeMenu);
        };
    }, [menuRow, closeMenu]);

    const handleAssigned = async (row: DidNumber, agent: StoreAgent) => {
        setAssignTarget(null);
        setNotice({ type: "success", text: `${row.number} assigned to ${agentLabel(agent)}.` });
        // Show the new assignee straight away, then let the refetch bring in the real status.
        setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, assignedTo: agent.id } : r)));
        await refreshRows();
    };

    const handleUnassign = async (row: DidNumber) => {
        const who = nameOf(row.assignedTo) ?? "the current agent";
        if (!window.confirm(`Unassign ${row.number} from ${who}?`)) return;

        setUnassigningId(row._id);
        try {
            await unassignDidNumber(row._id);
            setNotice({ type: "success", text: `${row.number} unassigned.` });
            await refreshRows();
        } catch (err) {
            setNotice({ type: "error", text: `Couldn’t unassign ${row.number}. ${getApiErrorMessage(err)}` });
        } finally {
            setUnassigningId(null);
        }
    };

    const handleEdited = async (row: DidNumber, patch: UpdateDidPayload) => {
        setEditTarget(null);
        setNotice({ type: "success", text: `${row.number} updated.` });
        // Show the changes straight away, then let the refetch bring in the server's version.
        setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, ...patch } : r)));
        await refreshRows();
    };

    const handleDelete = async (row: DidNumber) => {
        const warning = row.assignedTo ? ` It's currently assigned to ${nameOf(row.assignedTo) ?? "an agent"}.` : "";
        if (!window.confirm(`Delete ${row.number}?${warning} This can't be undone.`)) return;

        setDeletingId(row._id);
        try {
            await deleteDidNumber(row._id);
            setRows((prev) => prev.filter((r) => r._id !== row._id));
            setNotice({ type: "success", text: `${row.number} deleted.` });
        } catch (err) {
            setNotice({ type: "error", text: `Couldn’t delete ${row.number}. ${getApiErrorMessage(err)}` });
        } finally {
            setDeletingId(null);
        }
    };

    const handleCreated = (docs: DidNumber[]) => {
        setRows((prev) => [...docs, ...prev]);
        setNotice({ type: "success", text: `${docs.length} ${docs.length === 1 ? "number" : "numbers"} added.` });
    };

    const filters = useMemo(() => {
        const statuses = Array.from(new Set(rows.map((r) => r.status).filter(Boolean)));
        return [{ key: "all", label: "All" }, ...statuses.map((s) => ({ key: s, label: capitalize(s) }))];
    }, [rows]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: rows.length };
        rows.forEach((r) => {
            c[r.status] = (c[r.status] ?? 0) + 1;
        });
        return c;
    }, [rows]);

    const visibleRows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter !== "all" && r.status !== statusFilter) return false;
            if (!q) return true;
            return [r.number, r._id, r.vezetiRef, nameOf(r.assignedTo)]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q));
        });
    }, [rows, query, statusFilter, nameOf]);

    return (
        <div>
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f1535]">DID numbers</h1>
                    <p className="mt-1 text-slate-500">The numbers registered to your store and who they’re assigned to.</p>
                </div>
                <button type="button" onClick={() => setDrawerOpen(true)} className={primaryBtn}>
                    <Plus size={18} />
                    Add DID numbers
                </button>
            </header>

            {notice && (
                <div
                    role={notice.type === "error" ? "alert" : "status"}
                    className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${notice.type === "error"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                        }`}
                >
                    <span>{notice.text}</span>
                    <button
                        type="button"
                        onClick={() => setNotice(null)}
                        aria-label="Dismiss"
                        className="rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white mb-20">
                {/* Toolbar: search + status filter */}
                <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by number, Vezeti ref or client"
                            aria-label="Search DID numbers"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-[#0f1535] placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Filter by status">
                        {filters.map(({ key, label }) => {
                            const active = statusFilter === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setStatusFilter(key)}
                                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 ${active ? "bg-[#0B1437] text-white" : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    {label} <span className={`ml-1 ${active ? "text-slate-300" : "text-slate-400"}`}>{counts[key] ?? 0}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                        <thead>
                            <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-sm font-semibold text-slate-500">
                                {COLUMNS.map((c) => (
                                    <th key={c} className={`whitespace-nowrap px-6 py-3.5 ${c === "Actions" ? "text-right" : ""}`}>
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
                                        <p className="mb-3">Couldn’t load DID numbers. {error}</p>
                                        <button type="button" onClick={load} className={`${ghostBtn} border border-slate-200`}>
                                            Try again
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && rows.length === 0 && (
                                <tr>
                                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                                        No DID numbers yet. Add the first one to get started.
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && rows.length > 0 && visibleRows.length === 0 && (
                                <tr>
                                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-500">
                                        No numbers match your search or filter.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                visibleRows.map((row) => {
                                    const assignee = nameOf(row.assignedTo);
                                    return (
                                        <tr key={row._id} className="transition-colors hover:bg-slate-50/60">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500" title={row._id}>
                                                {shortId(row._id)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(row)}
                                                    className="group flex items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                                                    aria-label={`View details for ${row.number}`}
                                                >
                                                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0B1437]/5 text-[#0B1437]">
                                                        <Phone size={18} />
                                                    </span>
                                                    <span className="font-semibold tabular-nums text-[#0f1535] group-hover:underline">
                                                        {row.number}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignee ? (
                                                    <span className="text-[#0f1535]" title={assignee}>
                                                        {assigneeText(row.assignedTo)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">Unassigned</span>
                                                )}
                                            </td>
                                            {/* <td className="px-6 py-4 text-[#0f1535]">{row.assignmentHistory?.length ?? 0}</td> */}
                                            <td className="px-6 py-4">
                                                <StatusPill status={row.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => openMenu(e, row)}
                                                    disabled={unassigningId === row._id || deletingId === row._id}
                                                    aria-label={`Open actions for ${row.number}`}
                                                    aria-haspopup="menu"
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </section>

            <AddDidDrawer open={drawerOpen} onClose={closeDrawer} onCreated={handleCreated} />
            <DidDetailsModal row={selected} onClose={closeDetails} nameOf={nameOf} />
            <EditDidModal row={editTarget} onClose={closeEdit} onSaved={handleEdited} />

            <AssignAgentModal
                row={assignTarget}
                agents={agents}
                agentsLoading={agentsLoading}
                agentsError={agentsError}
                onRetryAgents={loadAgents}
                onClose={closeAssign}
                onAssigned={handleAssigned}
            />

            {/* Row actions menu */}
            {menuRow && (
                <>
                    <div className="fixed inset-0 z-[55]" onClick={closeMenu} />
                    <div
                        role="menu"
                        className="fixed z-[56] w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        <button
                            role="menuitem"
                            type="button"
                            onClick={() => {
                                const r = menuRow;
                                closeMenu();
                                setSelected(r);
                            }}
                            className={`${menuItemBase} text-slate-700`}
                        >
                            <Eye size={16} className="text-slate-500" />
                            View details
                        </button>

                        <button
                            role="menuitem"
                            type="button"
                            onClick={() => {
                                const r = menuRow;
                                closeMenu();
                                setEditTarget(r);
                            }}
                            className={`${menuItemBase} text-slate-700`}
                        >
                            <Pencil size={16} className="text-slate-500" />
                            Edit number
                        </button>

                        {menuRow.assignedTo ? (
                            <button
                                role="menuitem"
                                type="button"
                                onClick={() => {
                                    const r = menuRow;
                                    closeMenu();
                                    handleUnassign(r);
                                }}
                                className={`${menuItemBase} text-red-600`}
                            >
                                <UserMinus size={16} />
                                Unassign agent
                            </button>
                        ) : (
                            <button
                                role="menuitem"
                                type="button"
                                onClick={() => {
                                    const r = menuRow;
                                    closeMenu();
                                    setAssignTarget(r);
                                }}
                                className={`${menuItemBase} text-blue-600`}
                            >
                                <UserPlus size={16} />
                                Assign agent
                            </button>
                        )}

                        <div className="my-1 border-t border-slate-100" />

                        <button
                            role="menuitem"
                            type="button"
                            onClick={() => {
                                const r = menuRow;
                                closeMenu();
                                handleDelete(r);
                            }}
                            className={`${menuItemBase} text-red-600`}
                        >
                            <Trash2 size={16} />
                            Delete number
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}