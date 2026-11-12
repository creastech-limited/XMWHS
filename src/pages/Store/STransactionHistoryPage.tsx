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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { TransactionsResponse, UserResponse } from '../../types';
import { getUserDetails, getUserTransactions } from '../../services';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Status = 'Completed' | 'Pending' | 'Failed';

type Transaction = {
    id: string; // full id from the API
    displayId: string; // short id for the table, e.g. TXN-8B65A1
    reference?: string;
    status: Status;
    category: 'credit' | 'debit' | '';
    method: string;
    amount: number;
    charges: number;
    balanceBefore?: number;
    balanceAfter?: number;
    agent: string;
    agentEmail: string;
    agentPhone?: string;
    customer: string;
    customerEmail: string;
    customerPhone?: string;
    description?: string;
    errorCode?: string;
    createdAt: string; // ISO
    updatedAt?: string;
    timestamp: number;
    dateKey: string; // YYYY-MM-DD (local)
};

type AppUser = {
    _id: string;
    name: string;
    email: string;
    role: string;
    senderEmail?: string;
    senderWalletId?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
};

type Wallet = { email?: string; firstName?: string; lastName?: string; phone?: string };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const naira = (n: number) => `₦${n.toLocaleString()}`;
const nairaExact = (n: number) =>
    `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const formatMethod = (type: string) =>
    type ? titleCase(type.replace(/_(received|sent)$/, '').replace(/_/g, ' ').trim()) : 'Wallet Transfer';

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
    const header = ['Transaction ID', 'Reference', 'Date', 'Agent', 'Agent email', 'Customer', 'Customer email', 'Method', 'Type', 'Amount', 'Charges', 'Status'];
    const lines = rows.map((t) =>
        [t.id, t.reference ?? '', formatDateTime(t.createdAt), t.agent, t.agentEmail, t.customer, t.customerEmail, t.method, t.category, t.amount, t.charges, t.status]
            .map(esc)
            .join(','),
    );
    return [header.map(esc).join(','), ...lines].join('\n');
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

const AgentAvatar = ({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) => (
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

const STransactionHistoryPage = () => {
    const auth = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    const handleAuthError = useCallback(
        (message: string) => {
            setError(message);
            localStorage.removeItem('token');
            auth?.logout?.();
        },
        [auth],
    );

    const fetchUserDetails = useCallback(async (): Promise<AppUser> => {
        try {
            const data: UserResponse = await getUserDetails();

            let profile: AppUser | undefined;
            if (data.user?.data) {
                profile = data.user.data;
            } else if (data.data) {
                profile = data.data;
            } else if (data.user) {
                profile = data.user as AppUser;
            } else {
                profile = data as AppUser;
            }

            if (!profile) {
                throw new Error('Invalid user data received from API');
            }
            return profile;
        } catch (err) {
            console.error('Error fetching user details:', err);
            throw err;
        }
    }, []);

    const fetchTransactions = useCallback(async (): Promise<Transaction[]> => {
        try {
            const data: TransactionsResponse = await getUserTransactions();

            let list: unknown[] = [];
            if (data.transactions) {
                list = data.transactions;
            } else if (data.data) {
                list = Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                list = data;
            }

            const mapped: Transaction[] = list.map((txn, index: number) => {
                const t = txn as Record<string, unknown> & {
                    senderWalletId?: Wallet | string;
                    receiverWalletId?: Wallet | string;
                    metadata?: { senderEmail?: string; receiverEmail?: string };
                };

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

                // Parties: the agent is the receiver, the customer is the sender
                const category = String(t.category || '').toLowerCase();
                const resolveParty = (raw: Wallet | string | undefined, fallbackEmail: string | undefined, fallbackName: string) => {
                    const w = raw && typeof raw === 'object' ? raw : undefined;
                    const fullName = [w?.firstName, w?.lastName].filter(Boolean).join(' ');
                    const email = w?.email || fallbackEmail || '';
                    return { name: fullName || email || fallbackName, email, phone: w?.phone };
                };
                const agentParty = resolveParty(
                    t.receiverWalletId,
                    t.metadata?.receiverEmail,
                    String(t.agent || t.agentName || t.to || `Agent ${String.fromCharCode(65 + (index % 26))}`),
                );
                const customerParty = resolveParty(
                    t.senderWalletId,
                    t.metadata?.senderEmail,
                    String(t.customer || t.customerName || t.from || 'Customer'),
                );

                const id = String(t.id || t._id || `TX${1000 + index}`);
                const num = (v: unknown) => (typeof v === 'number' ? v : undefined);

                return {
                    id,
                    displayId: `TXN-${id.slice(-6).toUpperCase()}`,
                    reference: t.reference ? String(t.reference) : undefined,
                    status,
                    category: category === 'credit' || category === 'debit' ? category : '',
                    method: formatMethod(String(t.transactionType || '')),
                    amount: Math.abs(Number(t.amount) || 0),
                    charges: Math.abs(Number(t.charges) || 0),
                    balanceBefore: num(t.balanceBefore),
                    balanceAfter: num(t.balanceAfter),
                    agent: agentParty.name,
                    agentEmail: agentParty.email,
                    agentPhone: agentParty.phone,
                    customer: customerParty.name,
                    customerEmail: customerParty.email,
                    customerPhone: customerParty.phone,
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
                };
            });

            return mapped.sort((a, b) => b.timestamp - a.timestamp);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            throw err;
        }
    }, []);

    // Initialize authentication and fetch data
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true);
                setError(null);

                if (auth?.user?._id && auth?.token) {
                    persistUser(auth.user);
                    try {
                        setTransactions(await fetchTransactions());
                    } catch (txError) {
                        console.error('Error fetching transactions:', txError);
                        setError('Failed to load transactions');
                    }
                    setLoading(false);
                    return;
                }

                const storedToken = localStorage.getItem('token');
                if (!storedToken) {
                    throw new Error('No authentication token found');
                }

                const profile = await fetchUserDetails();
                persistUser(profile);

                auth?.login?.(
                    {
                        _id: profile._id,
                        name: profile.name,
                        email: profile.email,
                        role: profile.role,
                        status: profile.status || 'active',
                        senderEmail: profile.senderEmail,
                        senderWalletId: profile.senderWalletId,
                        createdAt: profile.createdAt || new Date().toISOString(),
                        updatedAt: profile.updatedAt || new Date().toISOString(),
                    } as const,
                    storedToken,
                );

                setTransactions(await fetchTransactions());
            } catch (err) {
                console.error('Auth initialization error:', err);
                handleAuthError('Authentication error. Please login again.');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [auth, fetchUserDetails, fetchTransactions, handleAuthError]);

    const refresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            setTransactions(await fetchTransactions());
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
                    t.agent.toLowerCase().includes(q) ||
                    t.agentEmail.toLowerCase().includes(q) ||
                    t.customer.toLowerCase().includes(q) ||
                    t.customerEmail.toLowerCase().includes(q) ||
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
        const credits = completed.filter((t) => t.category !== 'debit');
        const volume = credits.reduce((sum, t) => sum + t.amount, 0);
        return {
            volume,
            total: transactions.length,
            completed: completed.length,
            failed: failed.length,
            rate: transactions.length ? (completed.length / transactions.length) * 100 : 0,
            average: credits.length ? Math.round(volume / credits.length) : 0,
            creditCount: credits.length,
        };
    }, [transactions]);

    const filtersApplied = (searchQuery.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);
    const filteredTotal = useMemo(
        () =>
            filtered
                .filter((t) => t.status === 'Completed')
                .reduce((sum, t) => sum + (t.category === 'debit' ? -t.amount : t.amount), 0),
        [filtered],
    );

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
        return [...map.entries()].map(([dateKey, rows]) => ({
            dateKey,
            rows,
            total: rows
                .filter((t) => t.status === 'Completed')
                .reduce((sum, t) => sum + (t.category === 'debit' ? -t.amount : t.amount), 0),
        }));
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
        doc.text(`NGN ${txn.amount.toLocaleString()}`, centerX, 40, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const startY = 55;
        const details: [string, string][] = [
            ['Status:', txn.status.toUpperCase()],
            ['Agent:', txn.agent],
            ['Customer:', txn.customer],
            ['Method:', txn.method],
            ['Charges:', `NGN ${txn.charges.toLocaleString()}`],
            ['Transaction ID:', txn.id],
            ['Date:', formatDateTime(txn.createdAt)],
            ['Description:', txn.description || 'N/A'],
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

    const handleRaiseDispute = (txn: Transaction) => {
        // TODO: wire this to the dispute endpoint once it exists, e.g. await raiseDispute(txn.id, reason)
        console.info('Dispute requested for', txn.id);
    };

    /* --------------------------------- Render ---------------------------------- */

    const hasData = !loading && !error;

    return (
        <div className="text-slate-900 flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col px-4 sm:px-6 mt-4 mb-10 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1230] tracking-tight">Transactions</h1>
                        <p className="text-sm text-slate-500 mt-1">Every payment collected, searchable and exportable.</p>
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
                                label="Volume collected"
                                value={naira(stats.volume)}
                                sub={`Across ${stats.creditCount} completed payments`}
                            />
                            <StatCard label="Transactions" value={stats.total.toLocaleString()} sub="All time" />
                            <StatCard
                                label="Success rate"
                                value={`${stats.rate.toFixed(1)}%`}
                                sub={`${stats.completed} success · ${stats.failed} failed`}
                            />
                            <StatCard
                                label="Average ticket"
                                value={naira(stats.average)}
                                sub={`Based on ${stats.creditCount} successful payments`}
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
                                            placeholder="Search by ID, agent, or reference"
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
                                            label="Type"
                                            value={typeFilter}
                                            onChange={setTypeFilter}
                                            options={[
                                                { value: 'all', label: 'All' },
                                                { value: 'credit', label: 'Credit' },
                                                { value: 'debit', label: 'Debit' },
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
                                        totaling <span className="font-semibold text-slate-900">{naira(filteredTotal)}</span>
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
                                        <table className="min-w-[880px] w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                                                    <th scope="col" className="px-4 py-3 text-left">Transaction</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Agent</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Customer</th>
                                                    <th scope="col" className="px-4 py-3 text-left">Method</th>
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
                            tx={activeTx}
                            onClose={closeDrawer}
                            onDownload={() => generateReceiptPDF(activeTx).save(`XPay_${activeTx.displayId}.pdf`)}
                            onDispute={() => handleRaiseDispute(activeTx)}
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
            <td colSpan={6} className="px-4 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-900">{dayLabel(group.dateKey)}</span>
                <span className="text-xs text-slate-500 ml-2">
                    {group.rows.length} {group.rows.length === 1 ? 'transaction' : 'transactions'} · {naira(group.total)}
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
                            <AgentAvatar name={txn.agent} />
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate max-w-[200px]">{txn.agent}</div>
                                {txn.agentEmail && txn.agentEmail !== txn.agent && (
                                    <div className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">{txn.agentEmail}</div>
                                )}
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="h-6 w-6 shrink-0 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                                {initials(txn.customer)}
                            </span>
                            <span className="text-slate-900 truncate max-w-[180px]" title={txn.customerEmail || txn.customer}>
                                {txn.customer}
                            </span>
                        </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center h-6 px-2 rounded-md bg-slate-100 text-xs text-slate-700">{txn.method}</span>
                    </td>
                    <td
                        className={`px-4 py-3 whitespace-nowrap font-bold ${failed ? 'text-slate-400 line-through' : debit ? 'text-red-600' : 'text-slate-900'
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
    onClose,
    onDownload,
    onDispute,
}: {
    tx: Transaction;
    onClose: () => void;
    onDownload: () => void;
    onDispute: () => void;
}) => {
    const debit = tx.category === 'debit';
    const net = debit ? tx.amount + tx.charges : tx.amount - tx.charges;

    const second =
        tx.status === 'Completed'
            ? {
                title: 'Settled to wallet',
                meta: `${formatDateTime(tx.updatedAt || tx.createdAt)}${tx.balanceAfter !== undefined ? ` · New balance ${naira(tx.balanceAfter)}` : ''
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
            meta: `${formatDateTime(tx.createdAt)} · From ${tx.customer}`,
            state: 'done' as const,
        },
        second,
    ];

    return (
        <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-200 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Transaction</p>
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
                    <DetailRow label="Amount charged">{nairaExact(tx.amount)}</DetailRow>
                    <DetailRow label="Charges">{tx.charges ? `−${nairaExact(tx.charges)}` : nairaExact(0)}</DetailRow>
                    <DetailRow label={debit ? 'Total debited' : 'Net to wallet'}>
                        <span className={`font-bold ${debit ? 'text-red-600' : 'text-green-600'}`}>
                            {debit ? '−' : ''}
                            {nairaExact(net)}
                        </span>
                    </DetailRow>
                    <DetailRow label="Method">{tx.method}</DetailRow>
                    {tx.description && <DetailRow label="Note">{tx.description}</DetailRow>}
                </DrawerSection>

                <DrawerSection title="Parties">
                    <DetailRow label="Agent">
                        <AgentAvatar name={tx.agent} />
                        <span className="ml-2">{tx.agent}</span>
                    </DetailRow>
                    {tx.agentEmail && (
                        <DetailRow label="Email">
                            <span className="truncate max-w-[240px]">{tx.agentEmail}</span>
                        </DetailRow>
                    )}
                    {tx.agentPhone && <DetailRow label="Phone">{tx.agentPhone}</DetailRow>}
                    <DetailRow label="Customer">{tx.customer}</DetailRow>
                    {tx.customerEmail && tx.customerEmail !== tx.customer && (
                        <DetailRow label="Customer email">
                            <span className="truncate max-w-[220px]">{tx.customerEmail}</span>
                        </DetailRow>
                    )}
                    {tx.customerPhone && <DetailRow label="Customer phone">{tx.customerPhone}</DetailRow>}
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
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={onDispute}
                    className="inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                    <AlertTriangle className="w-4 h-4" />
                    Raise dispute
                </button>
                <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#0b1230] text-sm font-semibold text-white hover:bg-[#1a2352]"
                >
                    <Download className="w-4 h-4" />
                    Download receipt
                </button>
            </div>
        </>
    );
};

// Store user in localStorage for persistence
function persistUser(user: unknown) {
    localStorage.setItem('user', JSON.stringify(user));
}

export default STransactionHistoryPage;