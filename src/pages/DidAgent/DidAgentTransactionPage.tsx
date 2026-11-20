import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
    Search as SearchIcon,
    Download,
    Check,
    Clock,
    X,
    Copy,
    RefreshCw,
    ArrowLeftRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    AlertCircle,
    Receipt,
    Loader2,
} from 'lucide-react';
import {
    getUserTransactions,
    getUserDisputes,
    createDisputeApi,
    getApiErrorMessage,
} from '../../services';

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

const PAGE_FETCH_LIMIT = 50;

// TODO: confirm the accepted `disputeType` values with the backend.
const DISPUTE_TYPES = [
    'Unauthorized transaction',
    'Incorrect amount',
    'Duplicate charge',
    'Debited but not completed',
    'Service not received',
    'Other',
];

const TYPE_LABELS: Record<string, string> = {
    did_invoice_payment: 'DID invoice',
    wallet_topup: 'Wallet funding',
    wallet_transfer_received: 'Transfer received',
    wallet_transfer_sent: 'Transfer sent',
    transfer_charge: 'Transfer charge',
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Status = 'Completed' | 'Pending' | 'Failed';

type Party = { name: string; email: string; phone?: string };

type Transaction = {
    id: string; // full id from the API
    displayId: string; // short id for the table, e.g. TXN-8B65A1
    reference?: string;
    status: Status;
    category: 'credit' | 'debit';
    rawType: string; // transactionType from the API
    typeLabel: string;
    amount: number;
    charges: number;
    balanceBefore?: number;
    balanceAfter?: number;
    from: Party;
    to: Party;
    counterparty: Party; // the other side of the transaction, from the agent's view
    gateway?: string;
    invoiceNumber?: string;
    description?: string;
    errorCode?: string;
    createdAt: string; // ISO
    updatedAt?: string;
    timestamp: number;
    dateKey: string; // YYYY-MM-DD (local)
};

type Wallet = { email?: string; firstName?: string; lastName?: string; phone?: string; type?: string };

type ApiPage = {
    transactions?: unknown[];
    data?: unknown;
    pagination?: { totalPages?: number };
};

type DisputeForm = { disputeType: string; description: string };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const naira = (n: number) => `₦${n.toLocaleString()}`;
const signedNaira = (n: number) => (n < 0 ? `−${naira(Math.abs(n))}` : naira(n));
const nairaExact = (n: number) =>
    `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const formatType = (type: string) =>
    TYPE_LABELS[type] ??
    (type ? titleCase(type.replace(/_(received|sent)$/, '').replace(/_/g, ' ').trim()) : 'Wallet Transfer');

const clip = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${formatTime(d)}`;
};

const dayLabel = (dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const base = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' as const } : {}),
    });
    if (date.toDateString() === today.toDateString()) return `Today, ${base}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${base}`;
    return `${date.toLocaleDateString('en-GB', { weekday: 'long' })}, ${base}`;
};

const initials = (name: string) =>
    name
        .replace(/@.*/, '')
        .split(/[\s._-]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';

const AVATAR_COLORS = ['bg-indigo-600', 'bg-teal-600', 'bg-amber-600', 'bg-rose-600', 'bg-sky-600'];
const avatarColor = (name: string) =>
    AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const pageList = (current: number, total: number): (number | '…')[] => {
    const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
    const sorted = [...set].sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
        out.push(p);
    });
    return out;
};

const toCsv = (rows: Transaction[]) => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Transaction ID', 'Reference', 'Date', 'Direction', 'Type', 'From', 'To', 'Amount', 'Charges', 'Status'];
    const lines = rows.map((t) =>
        [t.id, t.reference ?? '', formatDateTime(t.createdAt), t.category, t.typeLabel, t.from.name, t.to.name, t.amount, t.charges, t.status]
            .map(esc)
            .join(','),
    );
    return [header.map(esc).join(','), ...lines].join('\n');
};

const extractList = (res: ApiPage | unknown[]): unknown[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.transactions)) return res.transactions;
    if (Array.isArray(res.data)) return res.data;
    if (res.data) return [res.data];
    return [];
};

const resolveParty = (raw: Wallet | string | undefined, fallbackEmail?: string, fallbackName = 'Unknown'): Party => {
    const w = raw && typeof raw === 'object' ? raw : undefined;
    if (w?.type === 'system') return { name: 'XPay', email: '' };
    if (w?.type === 'charges') return { name: 'Transfer charges', email: '' };
    const fullName = [w?.firstName, w?.lastName].filter(Boolean).join(' ');
    const email = w?.email || fallbackEmail || '';
    return { name: fullName || email || fallbackName, email, phone: w?.phone };
};

/* -------------------------------------------------------------------------- */
/*  Small presentational components                                            */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES: Record<Status, string> = {
    Completed: 'bg-green-50 text-green-700',
    Pending: 'bg-amber-50 text-amber-700',
    Failed: 'bg-red-50 text-red-700',
};
const STATUS_DOT: Record<Status, string> = {
    Completed: 'bg-green-500',
    Pending: 'bg-amber-500',
    Failed: 'bg-red-500',
};

const StatusPill = ({ status }: { status: Status }) => (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-semibold ${STATUS_STYLES[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
        {status}
    </span>
);

const PartyAvatar = ({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) => (
    <div
        className={`${size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'} shrink-0 rounded-lg ${avatarColor(name)} text-white font-bold flex items-center justify-center`}
    >
        {initials(name)}
    </div>
);

const StatCard = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-[#0b1230] mt-1.5">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
);

const FilterSelect = ({
    icon,
    label,
    value,
    onChange,
    options,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) => {
    const active = value !== 'all';
    return (
        <label
            className={`relative inline-flex items-center gap-2 h-9 pl-3 pr-8 rounded-lg border text-sm cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#0b1230]/20 ${active ? 'bg-indigo-50 border-indigo-200 text-[#0b1230]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
        >
            {icon}
            <span>{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        </label>
    );
};

const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            aria-label="Copy"
            onClick={async (e) => {
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText(value);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                } catch {
                    /* clipboard unavailable */
                }
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
};

const DrawerSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="px-5 py-5 border-b border-slate-200 last:border-b-0">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">{title}</h4>
        <dl className="space-y-2.5">{children}</dl>
    </section>
);

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 text-sm">
        <dt className="text-slate-500 shrink-0">{label}</dt>
        <dd className="text-slate-900 font-medium text-right min-w-0 flex items-center justify-end gap-1">{children}</dd>
    </div>
);

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const DidAgentTransactionPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Receipt drawer
    const [activeTx, setActiveTx] = useState<Transaction | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ------------------------------ Data fetching ------------------------------ */

    const fetchTransactions = useCallback(async (): Promise<Transaction[]> => {
        try {
            // The endpoint is paginated (50 per page by default), so pull every page.
            const firstRes = (await getUserTransactions({ page: 1, limit: PAGE_FETCH_LIMIT })) as unknown as ApiPage;
            const list: unknown[] = [...extractList(firstRes)];

            const totalPages = firstRes.pagination?.totalPages ?? 1;
            if (totalPages > 1) {
                const rest = await Promise.all(
                    Array.from({ length: totalPages - 1 }, (_, i) =>
                        getUserTransactions({ page: i + 2, limit: PAGE_FETCH_LIMIT }),
                    ),
                );
                rest.forEach((res) => list.push(...extractList(res as unknown as ApiPage)));
            }

            const seen = new Set<string>();

            const mapped: Transaction[] = [];
            list.forEach((txn, index) => {
                const t = txn as Record<string, unknown> & {
                    senderWalletId?: Wallet | string;
                    receiverWalletId?: Wallet | string;
                    metadata?: {
                        senderEmail?: string;
                        receiverEmail?: string;
                        gateway?: string;
                        method?: string;
                        invoiceNumber?: string;
                    };
                };

                const id = String(t.id || t._id || `TX${1000 + index}`);
                if (seen.has(id)) return;
                seen.add(id);

                // Status
                let status: Status = 'Completed';
                const s = typeof t.status === 'string' ? t.status.toLowerCase() : '';
                if (s.includes('pending') || s.includes('processing')) status = 'Pending';
                else if (s.includes('failed') || s.includes('cancelled') || s.includes('rejected')) status = 'Failed';

                // Date
                const rawDate = (t.date || t.createdAt) as string | number | Date | undefined;
                let d = rawDate ? new Date(rawDate) : new Date();
                if (Number.isNaN(d.getTime())) d = new Date();
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                // Direction is from the logged-in agent's point of view
                const dir = String(t.direction || t.category || '').toLowerCase();
                const category: 'credit' | 'debit' = dir === 'debit' ? 'debit' : 'credit';

                const from = resolveParty(t.senderWalletId, t.metadata?.senderEmail, 'Unknown sender');
                const to = resolveParty(t.receiverWalletId, t.metadata?.receiverEmail, 'Unknown receiver');

                const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
                const rawType = String(t.transactionType || '');
                const gateway = t.metadata?.gateway || t.metadata?.method;

                mapped.push({
                    id,
                    displayId: `TXN-${id.slice(-6).toUpperCase()}`,
                    reference: t.reference ? String(t.reference) : undefined,
                    status,
                    category,
                    rawType,
                    typeLabel: formatType(rawType),
                    amount: Math.abs(Number(t.amount) || 0),
                    charges: Math.abs(Number(t.charges) || 0),
                    balanceBefore: num(t.balanceBefore),
                    balanceAfter: num(t.balanceAfter),
                    from,
                    to,
                    counterparty: category === 'debit' ? to : from,
                    gateway: gateway ? titleCase(String(gateway)) : undefined,
                    invoiceNumber: t.metadata?.invoiceNumber,
                    description:
                        t.description && String(t.description) !== 'No description provided'
                            ? String(t.description)
                            : t.note
                                ? String(t.note)
                                : undefined,
                    errorCode: t.errorCode ? String(t.errorCode) : undefined,
                    createdAt: d.toISOString(),
                    updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
                    timestamp: d.getTime(),
                    dateKey,
                });
            });

            return mapped.sort((a, b) => b.timestamp - a.timestamp);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            throw err;
        }
    }, []);

    // Ids of transactions that already have a dispute (best effort, never blocks the page)
    const fetchDisputedIds = useCallback(async (): Promise<Set<string>> => {
        try {
            const res = await getUserDisputes();
            const list = res.disputes ?? res.data ?? [];
            const ids = list
                .map((dispute) => {
                    const raw = (dispute as unknown as Record<string, unknown>).transactionId;
                    if (raw && typeof raw === 'object') return String((raw as { _id?: string })._id ?? '');
                    return raw ? String(raw) : '';
                })
                .filter(Boolean);
            return new Set(ids);
        } catch (err) {
            console.error('Error fetching disputes:', err);
            return new Set();
        }
    }, []);

    const loadData = useCallback(async () => {
        const [txs, disputed] = await Promise.all([fetchTransactions(), fetchDisputedIds()]);
        setTransactions(txs);
        setDisputedIds(disputed);
    }, [fetchTransactions, fetchDisputedIds]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                await loadData();
            } catch (err) {
                console.error('Error loading transactions:', err);
                if (!cancelled) setError('Failed to load transactions. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadData]);

    const refresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            await loadData();
        } catch {
            setError('Failed to load transactions. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    /* ------------------------------ Derived data ------------------------------- */

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return transactions.filter((t) => {
            if (
                q &&
                !(
                    t.id.toLowerCase().includes(q) ||
                    t.displayId.toLowerCase().includes(q) ||
                    t.counterparty.name.toLowerCase().includes(q) ||
                    t.counterparty.email.toLowerCase().includes(q) ||
                    t.typeLabel.toLowerCase().includes(q) ||
                    (t.reference ?? '').toLowerCase().includes(q) ||
                    t.status.toLowerCase().includes(q)
                )
            )
                return false;
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            if (typeFilter !== 'all' && t.category !== typeFilter) return false;
            return true;
        });
    }, [transactions, searchQuery, statusFilter, typeFilter]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, typeFilter, pageSize]);

    const stats = useMemo(() => {
        const completed = transactions.filter((t) => t.status === 'Completed');
        const failed = transactions.filter((t) => t.status === 'Failed');
        const credits = completed.filter((t) => t.category === 'credit');
        const debits = completed.filter((t) => t.category === 'debit');
        return {
            moneyIn: credits.reduce((sum, t) => sum + t.amount, 0),
            moneyOut: debits.reduce((sum, t) => sum + t.amount, 0),
            creditCount: credits.length,
            debitCount: debits.length,
            total: transactions.length,
            completed: completed.length,
            failed: failed.length,
            rate: transactions.length ? (completed.length / transactions.length) * 100 : 0,
        };
    }, [transactions]);

    const net = (rows: Transaction[]) =>
        rows
            .filter((t) => t.status === 'Completed')
            .reduce((sum, t) => sum + (t.category === 'debit' ? -t.amount : t.amount), 0);

    const filtersApplied = (searchQuery.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);
    const filteredTotal = useMemo(() => net(filtered), [filtered]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageRows = filtered.slice(pageStart, pageStart + pageSize);

    const groups = useMemo(() => {
        const map = new Map<string, Transaction[]>();
        pageRows.forEach((t) => {
            const arr = map.get(t.dateKey) ?? [];
            arr.push(t);
            map.set(t.dateKey, arr);
        });
        return [...map.entries()].map(([dateKey, rows]) => ({ dateKey, rows, total: net(rows) }));
    }, [pageRows]);

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
    };

    /* --------------------------------- Actions --------------------------------- */

    const handleExport = () => {
        const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const openDrawer = (tx: Transaction) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setActiveTx(tx);
        requestAnimationFrame(() => requestAnimationFrame(() => setDrawerOpen(true)));
    };

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setActiveTx(null), 300);
    }, []);

    useEffect(() => {
        if (!activeTx) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeTx, closeDrawer]);

    const generateReceiptPDF = (txn: Transaction) => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [100, 150] });
        const centerX = 50;
        const debit = txn.category === 'debit';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(11, 18, 48);
        doc.text('XPAY DIGITAL', centerX, 15, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('TRANSACTION RECEIPT', centerX, 20, { align: 'center' });

        doc.setDrawColor(226, 232, 240);
        doc.line(10, 25, 90, 25);

        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text(`${debit ? '-' : ''}NGN ${txn.amount.toLocaleString()}`, centerX, 40, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const startY = 55;
        const details: [string, string][] = [
            ['Status:', txn.status.toUpperCase()],
            ['Type:', txn.typeLabel],
            ['From:', clip(txn.from.name)],
            ['To:', clip(txn.to.name)],
            ['Charges:', `NGN ${txn.charges.toLocaleString()}`],
            ['Transaction ID:', txn.id],
            ['Date:', formatDateTime(txn.createdAt)],
            ['Description:', clip(txn.description || 'N/A')],
        ];
        details.forEach(([label, value], i) => {
            doc.setTextColor(100, 116, 139);
            doc.text(label, 15, startY + i * 8);
            doc.setTextColor(30, 41, 59);
            doc.text(value, 85, startY + i * 8, { align: 'right' });
        });

        if (txn.reference) {
            doc.setFontSize(6);
            doc.setTextColor(100, 116, 139);
            doc.text(`Ref: ${txn.reference}`, centerX, startY + details.length * 8 + 6, { align: 'center' });
        }

        return doc;
    };

    // Throws on failure so the drawer form can show the error
    const handleSubmitDispute = async (txn: Transaction, form: DisputeForm) => {
        await createDisputeApi({
            disputeType: form.disputeType,
            description: form.description,
            transactionId: txn.id,
            paymentCategory: txn.rawType, // TODO: confirm accepted `paymentCategory` values with the backend
            amount: txn.amount,
            supportingDocuments: [], // TODO: wire up once there is an upload endpoint
        });
        setDisputedIds((prev) => new Set(prev).add(txn.id));
    };

    /* --------------------------------- Render ---------------------------------- */

    const hasData = !loading && !error;

    return (
        <div className="text-slate-900 flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col px-2 mt-4 mb-10 w-full">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1230] tracking-tight">Transactions</h1>
                        <p className="text-sm text-slate-500 mt-1">Every payment in and out of your wallet, searchable and exportable.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={!hasData || filtered.length === 0}
                        className="inline-flex shrink-0 items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
                            ))}
                        </div>
                        <div className="h-96 bg-slate-200 rounded-2xl" />
                    </div>
                ) : error ? (
                    <div className="bg-white border border-slate-200 rounded-2xl text-center py-12 px-4">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                        <p className="text-base font-semibold text-slate-900">{error}</p>
                        <button
                            onClick={refresh}
                            className="mt-4 inline-flex items-center h-10 px-4 rounded-lg bg-[#0b1230] text-white text-sm font-semibold hover:bg-[#1a2352]"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                            <StatCard
                                label="Money in"
                                value={naira(stats.moneyIn)}
                                sub={`${stats.creditCount} completed ${stats.creditCount === 1 ? 'credit' : 'credits'}`}
                            />
                            <StatCard
                                label="Money out"
                                value={naira(stats.moneyOut)}
                                sub={`${stats.debitCount} completed ${stats.debitCount === 1 ? 'debit' : 'debits'}`}
                            />
                            <StatCard label="Transactions" value={stats.total.toLocaleString()} sub="All time" />
                            <StatCard
                                label="Success rate"
                                value={`${stats.rate.toFixed(1)}%`}
                                sub={`${stats.completed} success · ${stats.failed} failed`}
                            />
                        </div>

                        {/* Table card */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-16">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-slate-200">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <div className="relative w-full sm:w-72">
                                        <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by ID, reference, or name"
                                            className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0b1230] focus:ring-2 focus:ring-[#0b1230]/15"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <FilterSelect
                                            icon={<Clock className="w-4 h-4" />}
                                            label="Status"
                                            value={statusFilter}
                                            onChange={setStatusFilter}
                                            options={[
                                                { value: 'all', label: 'All' },
                                                { value: 'Completed', label: 'Completed' },
                                                { value: 'Pending', label: 'Pending' },
                                                { value: 'Failed', label: 'Failed' },
                                            ]}
                                        />
                                        <FilterSelect
                                            icon={<ArrowLeftRight className="w-4 h-4" />}
                                            label="Direction"
                                            value={typeFilter}
                                            onChange={setTypeFilter}
                                            options={[
                                                { value: 'all', label: 'All' },
                                                { value: 'credit', label: 'Money in' },
                                                { value: 'debit', label: 'Money out' },
                                            ]}
                                        />

                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            disabled={filtersApplied === 0}
                                            className="h-9 px-2 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={refresh}
                                            disabled={refreshing}
                                            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                {filtersApplied > 0 && (
                                    <p className="text-xs text-slate-500 mt-3">
                                        {filtersApplied} {filtersApplied === 1 ? 'filter' : 'filters'} applied, showing{' '}
                                        <span className="font-semibold text-slate-900">
                                            {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
                                        </span>{' '}
                                        with a net of <span className="font-semibold text-slate-900">{signedNaira(filteredTotal)}</span>
                                    </p>
                                )}
                            </div>

                            {filtered.length === 0 ? (
                                <div className="text-center py-14 text-slate-500">
                                    <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-base font-semibold text-slate-900">
                                        {filtersApplied ? 'No transactions match your filters' : 'No transactions yet'}
                                    </p>
                                    {filtersApplied > 0 && (
                                        <button onClick={resetFilters} className="mt-2 text-sm font-semibold text-[#0b1230] hover:underline">
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[760px] w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                                                    <th scope="col" className="px-4 py-3 text-left">Transaction</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Counterparty</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Type</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Amount</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groups.map((group) => (
                                                    <GroupRows
                                                        key={group.dateKey}
                                                        group={group}
                                                        activeId={activeTx?.id}
                                                        onSelect={openDrawer}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2">
                                                Rows per page
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                                    className="h-8 px-2 rounded-md border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b1230]/20"
                                                >
                                                    {[10, 25, 50, 100].map((n) => (
                                                        <option key={n} value={n}>
                                                            {n}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <span>
                                                {pageStart + 1} to {Math.min(pageStart + pageSize, filtered.length)} of{' '}
                                                {filtered.length.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                aria-label="Previous page"
                                                disabled={currentPage === 1}
                                                onClick={() => setPage(currentPage - 1)}
                                                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            {pageList(currentPage, totalPages).map((p, i) =>
                                                p === '…' ? (
                                                    <span key={`gap-${i}`} className="w-6 text-center">
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPage(p)}
                                                        aria-current={p === currentPage ? 'page' : undefined}
                                                        className={`h-8 min-w-8 px-2 rounded-md text-sm font-semibold ${p === currentPage ? 'bg-[#0b1230] text-white' : 'text-slate-600 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ),
                                            )}
                                            <button
                                                aria-label="Next page"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setPage(currentPage + 1)}
                                                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ------------------------- Receipt drawer (slides from right) ------------------------- */}
            {activeTx && (
                <div className="fixed inset-0 z-[999]" role="dialog" aria-modal="true" aria-label="Transaction details">
                    <div
                        onClick={closeDrawer}
                        className={`absolute inset-0 bg-[#0b1230]/30 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <aside
                        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'
                            }`}
                    >
                        <DrawerContent
                            key={activeTx.id}
                            tx={activeTx}
                            disputed={disputedIds.has(activeTx.id)}
                            onClose={closeDrawer}
                            onDownload={() => generateReceiptPDF(activeTx).save(`XPay_${activeTx.displayId}.pdf`)}
                            onSubmitDispute={handleSubmitDispute}
                        />
                    </aside>
                </div>
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Table group (date header + rows)                                           */
/* -------------------------------------------------------------------------- */

const GroupRows = ({
    group,
    activeId,
    onSelect,
}: {
    group: { dateKey: string; rows: Transaction[]; total: number };
    activeId?: string;
    onSelect: (t: Transaction) => void;
}) => (
    <>
        <tr className="bg-slate-50/80 border-y border-slate-200">
            <td colSpan={5} className="px-4 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-900">{dayLabel(group.dateKey)}</span>
                <span className="text-xs text-slate-500 ml-2">
                    {group.rows.length} {group.rows.length === 1 ? 'transaction' : 'transactions'} · net {signedNaira(group.total)}
                </span>
            </td>
        </tr>
        {group.rows.map((txn) => {
            const debit = txn.category === 'debit';
            const failed = txn.status === 'Failed';
            return (
                <tr
                    key={txn.id}
                    tabIndex={0}
                    onClick={() => onSelect(txn)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(txn);
                        }
                    }}
                    className={`cursor-pointer border-b border-slate-100 transition-colors focus:outline-none focus-visible:bg-indigo-50 ${activeId === txn.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                >
                    <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-900">{txn.displayId}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatTime(new Date(txn.createdAt))}</div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <PartyAvatar name={txn.counterparty.name} />
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate max-w-[200px]">{txn.counterparty.name}</div>
                                <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                    {debit ? 'Sent to' : 'Received from'}
                                    {txn.counterparty.email ? ` · ${txn.counterparty.email}` : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center h-6 px-2 rounded-md bg-slate-100 text-xs text-slate-700">{txn.typeLabel}</span>
                    </td>
                    <td
                        className={`px-4 py-3 whitespace-nowrap font-bold ${failed ? 'text-slate-400 line-through' : debit ? 'text-red-600' : 'text-green-600'
                            }`}
                    >
                        {debit ? '−' : '+'}
                        {naira(txn.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <StatusPill status={txn.status} />
                    </td>
                </tr>
            );
        })}
    </>
);

/* -------------------------------------------------------------------------- */
/*  Drawer content                                                             */
/* -------------------------------------------------------------------------- */

const DrawerContent = ({
    tx,
    disputed,
    onClose,
    onDownload,
    onSubmitDispute,
}: {
    tx: Transaction;
    disputed: boolean;
    onClose: () => void;
    onDownload: () => void;
    onSubmitDispute: (tx: Transaction, form: DisputeForm) => Promise<void>;
}) => {
    const [mode, setMode] = useState<'details' | 'dispute' | 'submitted'>('details');
    const [disputeType, setDisputeType] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const debit = tx.category === 'debit';
    const netAmount = debit ? tx.amount + tx.charges : tx.amount - tx.charges;
    const balanceChanged =
        tx.balanceBefore !== undefined && tx.balanceAfter !== undefined && tx.balanceBefore !== tx.balanceAfter;

    const canSubmit = disputeType !== '' && description.trim().length >= 10 && !submitting;

    const submit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setFormError(null);
        try {
            await onSubmitDispute(tx, { disputeType, description: description.trim() });
            setMode('submitted');
        } catch (err) {
            setFormError(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const second =
        tx.status === 'Completed'
            ? {
                title: debit ? 'Payment completed' : 'Credited to wallet',
                meta: `${formatDateTime(tx.updatedAt || tx.createdAt)}${balanceChanged && tx.balanceAfter !== undefined ? ` · New balance ${naira(tx.balanceAfter)}` : ''
                    }`,
                state: 'done' as const,
            }
            : tx.status === 'Pending'
                ? { title: 'Awaiting confirmation', meta: 'This will update once the payment clears', state: 'pending' as const }
                : {
                    title: 'Payment failed',
                    meta: tx.errorCode ? `Error code: ${tx.errorCode}` : 'This payment did not go through',
                    state: 'failed' as const,
                };

    const steps = [
        {
            title: debit ? 'Payment sent' : 'Payment received',
            meta: `${formatDateTime(tx.createdAt)} · ${debit ? `To ${tx.to.name}` : `From ${tx.from.name}`}`,
            state: 'done' as const,
        },
        second,
    ];

    return (
        <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-200 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {mode === 'details' ? 'Transaction' : 'Raise a dispute'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-2xl font-bold text-[#0b1230]">{nairaExact(tx.amount)}</span>
                        <StatusPill status={tx.status} />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {mode === 'details' && (
                    <>
                        <DrawerSection title="Payment">
                            <DetailRow label="Transaction ID">
                                <span className="font-mono text-xs truncate max-w-[210px]">{tx.id}</span>
                                <CopyButton value={tx.id} />
                            </DetailRow>
                            {tx.reference && (
                                <DetailRow label="Reference">
                                    <span className="font-mono text-xs truncate max-w-[210px]">{tx.reference}</span>
                                    <CopyButton value={tx.reference} />
                                </DetailRow>
                            )}
                            <DetailRow label="Type">{tx.typeLabel}</DetailRow>
                            {tx.gateway && <DetailRow label="Gateway">{tx.gateway}</DetailRow>}
                            {tx.invoiceNumber && <DetailRow label="Invoice">{tx.invoiceNumber}</DetailRow>}
                            <DetailRow label="Amount">{nairaExact(tx.amount)}</DetailRow>
                            <DetailRow label="Charges">{tx.charges ? `−${nairaExact(tx.charges)}` : nairaExact(0)}</DetailRow>
                            <DetailRow label={debit ? 'Total debited' : 'Net received'}>
                                <span className={`font-bold ${debit ? 'text-red-600' : 'text-green-600'}`}>
                                    {debit ? '−' : ''}
                                    {nairaExact(netAmount)}
                                </span>
                            </DetailRow>
                            {tx.description && <DetailRow label="Note">{tx.description}</DetailRow>}
                        </DrawerSection>

                        <DrawerSection title="Parties">
                            <DetailRow label="From">
                                <PartyAvatar name={tx.from.name} />
                                <span className="ml-2 truncate max-w-[200px]">
                                    {tx.from.name}
                                    {debit ? ' (You)' : ''}
                                </span>
                            </DetailRow>
                            {tx.from.email && (
                                <DetailRow label="Email">
                                    <span className="truncate max-w-[240px]">{tx.from.email}</span>
                                </DetailRow>
                            )}
                            <DetailRow label="To">
                                <PartyAvatar name={tx.to.name} />
                                <span className="ml-2 truncate max-w-[200px]">
                                    {tx.to.name}
                                    {!debit ? ' (You)' : ''}
                                </span>
                            </DetailRow>
                            {tx.to.email && (
                                <DetailRow label="Email">
                                    <span className="truncate max-w-[240px]">{tx.to.email}</span>
                                </DetailRow>
                            )}
                            {tx.counterparty.phone && <DetailRow label="Phone">{tx.counterparty.phone}</DetailRow>}
                        </DrawerSection>

                        <DrawerSection title="Timeline">
                            <ol className="space-y-0">
                                {steps.map((step, i) => (
                                    <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
                                        {i < steps.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />}
                                        <span
                                            className={`relative z-10 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-white ${step.state === 'done' ? 'bg-green-500' : step.state === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                        >
                                            {step.state === 'done' ? (
                                                <Check className="w-3.5 h-3.5" />
                                            ) : step.state === 'pending' ? (
                                                <Clock className="w-3.5 h-3.5" />
                                            ) : (
                                                <X className="w-3.5 h-3.5" />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{step.meta}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </DrawerSection>
                    </>
                )}

                {mode === 'dispute' && (
                    <div className="px-5 py-5 space-y-5">
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-sm space-y-1.5">
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Transaction</span>
                                <span className="font-mono text-xs font-semibold text-slate-900">{tx.displayId}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">{debit ? 'Sent to' : 'Received from'}</span>
                                <span className="font-medium text-slate-900 truncate max-w-[220px]">{tx.counterparty.name}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-900">{formatDateTime(tx.createdAt)}</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="dispute-type" className="block text-sm font-semibold text-slate-900 mb-1.5">
                                What went wrong?
                            </label>
                            <div className="relative">
                                <select
                                    id="dispute-type"
                                    value={disputeType}
                                    onChange={(e) => setDisputeType(e.target.value)}
                                    disabled={submitting}
                                    className="appearance-none w-full h-10 pl-3 pr-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0b1230] focus:ring-2 focus:ring-[#0b1230]/15 disabled:opacity-60"
                                >
                                    <option value="" disabled>
                                        Select a reason
                                    </option>
                                    {DISPUTE_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="dispute-description" className="block text-sm font-semibold text-slate-900 mb-1.5">
                                Tell us more
                            </label>
                            <textarea
                                id="dispute-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={submitting}
                                rows={5}
                                placeholder="Describe the issue so we can look into it (at least 10 characters)"
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-[#0b1230] focus:ring-2 focus:ring-[#0b1230]/15 disabled:opacity-60"
                            />
                        </div>

                        {formError && (
                            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'submitted' && (
                    <div className="px-5 py-14 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <Check className="w-6 h-6" />
                        </div>
                        <p className="text-base font-semibold text-slate-900 mt-4">Dispute submitted</p>
                        <p className="text-sm text-slate-500 mt-1.5 max-w-[300px] mx-auto">
                            We have received your dispute for {tx.displayId} and will review it.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                {mode === 'details' && (
                    <>
                        <button
                            type="button"
                            onClick={() => setMode('dispute')}
                            disabled={disputed}
                            className="inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white"
                        >
                            {disputed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {disputed ? 'Dispute raised' : 'Raise dispute'}
                        </button>
                        <button
                            type="button"
                            onClick={onDownload}
                            className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#0b1230] text-sm font-semibold text-white hover:bg-[#1a2352]"
                        >
                            <Download className="w-4 h-4" />
                            Download receipt
                        </button>
                    </>
                )}

                {mode === 'dispute' && (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('details');
                                setFormError(null);
                            }}
                            disabled={submitting}
                            className="inline-flex items-center justify-center h-10 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={!canSubmit}
                            className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#0b1230] text-sm font-semibold text-white hover:bg-[#1a2352] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? 'Submitting…' : 'Submit dispute'}
                        </button>
                    </>
                )}

                {mode === 'submitted' && (
                    <>
                        <button
                            type="button"
                            onClick={() => setMode('details')}
                            className="inline-flex items-center justify-center h-10 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                            Back to details
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center h-10 rounded-lg bg-[#0b1230] text-sm font-semibold text-white hover:bg-[#1a2352]"
                        >
                            Done
                        </button>
                    </>
                )}
            </div>
        </>
    );
};

export default DidAgentTransactionPage;