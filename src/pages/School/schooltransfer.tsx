import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  ArrowUp,
  AlertCircle,
  Check,
  X,
  Lock,
  School,
  Store as StoreIcon,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllCharges,
  getAllSchoolUsers,
  getStoresBySchoolId,
  getUserDetails,
  getUserTransactions,
  transferFunds
} from '../../services';
import type { Charge, SchoolUser, User } from '../../types';

/* ----------------------------- constants & types ----------------------------- */

const TRANSACTIONS_FETCH_LIMIT = 30;
const RECENT_DEBITS_SHOWN = 6;

type Destination = 'user' | 'store';

interface Recipient {
  id: string;
  kind: Destination;
  name: string;
  subtitle: string;
  email: string;
  tag: string;
  profilePicture?: string;
  inactive: boolean;
}

interface RawTransaction {
  _id: string;
  transactionType?: string;
  category?: string;
  direction?: string;
  amount: number;
  charges?: number;
  description?: string;
  status?: string;
  createdAt: string;
  receiverWalletId?: { firstName?: string; lastName?: string; email?: string } | string | null;
  metadata?: { receiverEmail?: string };
}

/* --------------------------------- helpers ---------------------------------- */

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

const AVATAR_COLORS = [
  'bg-indigo-700',
  'bg-teal-600',
  'bg-amber-600',
  'bg-rose-700',
  'bg-violet-600',
  'bg-sky-700'
];
const avatarColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const naira = (n: number) => `₦${n.toLocaleString()}`;

const humanize = (s?: string) =>
  (s || 'Transfer').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const isDebit = (tx: RawTransaction) => tx.direction === 'debit' || tx.category === 'debit';

const getCounterparty = (tx: RawTransaction) => {
  const w =
    tx.receiverWalletId && typeof tx.receiverWalletId === 'object' ? tx.receiverWalletId : undefined;
  const email = (w?.email || tx.metadata?.receiverEmail || '').toLowerCase();
  const name =
    [w?.firstName, w?.lastName].filter(Boolean).join(' ') ||
    str(tx.description) ||
    humanize(tx.transactionType);
  return { name, email };
};

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${time}`;
};

const statusStyle = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'successful') return { label: 'Paid', cls: 'text-green-600' };
  if (s === 'pending') return { label: 'Pending', cls: 'text-amber-600' };
  return { label: humanize(status || 'Failed'), cls: 'text-red-600' };
};

const userToRecipient = (u: SchoolUser): Recipient | null => {
  const r = u as SchoolUser & { firstName?: string; lastName?: string; status?: string };
  const email = str(r.email);
  if (!email) return null;
  const name =
    str(r.name) || [str(r.firstName), str(r.lastName)].filter(Boolean).join(' ') || email;
  return {
    id: r._id,
    kind: 'user',
    name,
    subtitle: email,
    email,
    tag: str(r.role) || 'user',
    profilePicture: str(r.profilePicture) || undefined,
    inactive: str(r.status).toLowerCase() === 'inactive'
  };
};

const storeToRecipient = (raw: unknown): Recipient | null => {
  const s = (raw || {}) as Record<string, unknown>;
  const email = str(s.email);
  if (!email) return null;
  const owner =
    str(s.name) || [str(s.firstName), str(s.lastName)].filter(Boolean).join(' ');
  const storeName = str(s.storeName);
  return {
    id: str(s._id) || email,
    kind: 'store',
    name: storeName || owner || email,
    subtitle: storeName && owner ? `${owner} · ${email}` : email,
    email,
    tag: str(s.storeType) || 'store',
    profilePicture: str(s.profilePicture) || undefined,
    inactive: str(s.status).toLowerCase() === 'inactive'
  };
};

const Avatar: React.FC<{ recipient: Pick<Recipient, 'name' | 'email' | 'profilePicture'>; size?: string }> = ({
  recipient,
  size = 'w-10 h-10'
}) =>
  recipient.profilePicture ? (
    <img
      src={recipient.profilePicture}
      alt={recipient.name}
      className={`${size} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${size} rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold ${avatarColor(
        recipient.email || recipient.name
      )}`}
    >
      {initials(recipient.name)}
    </div>
  );

/**
 * Shared wrapper for every state of this page.
 * SchoolLayout already provides: min-h-screen, header, fixed sidebar and footer.
 */
const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="flex-1 min-w-0 p-4 sm:p-6 md:ml-64">
    <div className="w-full max-w-6xl mx-auto">{children}</div>
  </main>
);

const CenteredState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageShell>
    <div className="flex items-center justify-center min-h-[60vh]">{children}</div>
  </PageShell>
);

/* -------------------------------- component --------------------------------- */

const SchoolTransferPage: React.FC = () => {
  const { token } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [fetchingUserDetails, setFetchingUserDetails] = useState(true);

  const [destination, setDestination] = useState<Destination>('user');
  const [userRecipients, setUserRecipients] = useState<Recipient[]>([]);
  const [storeRecipients, setStoreRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [showPinDialog, setPinDialogOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transactionFee, setTransactionFee] = useState(0);

  const [debits, setDebits] = useState<RawTransaction[]>([]);
  const [loadingDebits, setLoadingDebits] = useState(true);

  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, severity: 'success' | 'error') => {
    setToast({ message, severity });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const hasPermission = user?.role === 'school' && user?.schoolCanTransfer === true;

  /* ------------------------------- data loading ------------------------------- */

  const fetchTransactionCharges = useCallback(async () => {
    try {
      const data = await getAllCharges();
      if (Array.isArray(data)) {
        const c = data.find(
          (charge: Charge) =>
            charge.name.toLowerCase().includes('transfer') && charge.status === 'Active'
        );
        if (c) setTransactionFee(c.amount);
      }
    } catch (error) {
      console.error('Error fetching transaction charges:', error);
      setTransactionFee(0);
    }
  }, []);

  const fetchUserDetails = useCallback(
    async (force = false): Promise<User | null> => {
      try {
        const data = await getUserDetails(force);

        let userData: Partial<User> | null = null;
        let walletBalance = 0;

        if (data.user?.data) {
          userData = data.user.data;
          if (data.user?.wallet?.balance !== undefined) walletBalance = data.user.wallet.balance;
        } else if (data.data) {
          userData = data.data;
        } else if (data.user) {
          userData = data.user;
        } else {
          userData = data;
        }

        if (!userData) throw new Error('User data is missing in response');

        const userProfile: User = {
          _id: userData._id ?? '',
          name:
            userData.name ??
            (userData.firstName && userData.lastName
              ? `${userData.firstName} ${userData.lastName}`.trim()
              : userData.firstName ?? userData.lastName ?? 'User'),
          email: userData.email ?? '',
          role: userData.role ?? '',
          status: userData.status || 'Active',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          firstName: userData.firstName ?? '',
          lastName: userData.lastName ?? '',
          phone: userData.phone,
          schoolId: userData.schoolId,
          schoolName: userData.schoolName,
          schoolType: userData.schoolType,
          schoolAddress: userData.schoolAddress,
          ownership: userData.ownership,
          schoolCanTransfer: userData.schoolCanTransfer === true,
          balance: walletBalance,
          wallet: { balance: walletBalance },
          accountNumber: userData.accountNumber,
          isPinSet: userData.isPinSet,
          profilePicture: userData.profilePicture,
          qrcode: userData.qrcode,
          agentCanTopup: userData.agentCanTopup,
          agentCanTransfer: userData.agentCanTransfer,
          agentCanWithdraw: userData.agentCanWithdraw,
          schoolCanTopup: userData.schoolCanTopup,
          storeCanTopup: userData.storeCanTopup,
          storeCanTransfer: userData.storeCanTransfer,
          storeCanWithdraw: userData.storeCanWithdraw,
          studentCanTopup: userData.studentCanTopup,
          studentCanTransfer: userData.studentCanTransfer,
          studentCanWithdraw: userData.studentCanWithdraw,
          studentCanPayBill: userData.studentCanPayBill,
          bankDetails: userData.bankDetails
        };

        setUser(userProfile);
        return userProfile;
      } catch (error) {
        console.error('Error fetching user details:', error);
        showToast('Failed to load user details. Please try again.', 'error');
        return null;
      }
    },
    [showToast]
  );

  const fetchDebits = useCallback(async () => {
    try {
      setLoadingDebits(true);
      const res = (await getUserTransactions({
        page: 1,
        limit: TRANSACTIONS_FETCH_LIMIT
      })) as unknown as { data?: RawTransaction[]; transactions?: RawTransaction[] };
      const list = res.data || res.transactions || [];
      setDebits(Array.isArray(list) ? list.filter(isDebit) : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setDebits([]);
    } finally {
      setLoadingDebits(false);
    }
  }, []);

  // Profile + fee on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        showToast('Authentication required. Please log in again.', 'error');
        setFetchingUserDetails(false);
        return;
      }
      try {
        setFetchingUserDetails(true);
        await Promise.all([fetchUserDetails(), fetchTransactionCharges()]);
      } finally {
        if (!cancelled) setFetchingUserDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, fetchUserDetails, fetchTransactionCharges, showToast]);

  // Recipients (users + stores) and recent debits, once permission is confirmed
  const userId = user?._id;
  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!hasPermission || !userId) return;
    let cancelled = false;

    (async () => {
      setLoadingRecipients(true);
      const [usersRes, storesRes] = await Promise.allSettled([
        getAllSchoolUsers(),
        schoolId ? getStoresBySchoolId(schoolId) : Promise.resolve([])
      ]);
      if (cancelled) return;

      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value as unknown;
        const rows: SchoolUser[] = Array.isArray(d)
          ? d
          : (d as { users?: SchoolUser[]; data?: SchoolUser[] }).users ||
          (d as { data?: SchoolUser[] }).data ||
          [];
        setUserRecipients(
          rows
            .filter((u) => u._id !== userId && str(u.role).toLowerCase() !== 'store')
            .map(userToRecipient)
            .filter((r): r is Recipient => r !== null)
        );
      } else {
        showToast('Failed to load school users.', 'error');
      }

      if (storesRes.status === 'fulfilled') {
        setStoreRecipients(
          (storesRes.value as unknown[])
            .map(storeToRecipient)
            .filter((r): r is Recipient => r !== null)
        );
      } else {
        showToast('Failed to load stores.', 'error');
      }

      setLoadingRecipients(false);
    })();

    fetchDebits();

    return () => {
      cancelled = true;
    };
  }, [hasPermission, userId, schoolId, fetchDebits, showToast]);

  /* ------------------------------- derived data ------------------------------- */

  const allRecipients = useMemo(
    () => [...userRecipients, ...storeRecipients],
    [userRecipients, storeRecipients]
  );

  const visibleRecipients = useMemo(() => {
    const list = destination === 'user' ? userRecipients : storeRecipients;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [r.name, r.email, r.subtitle, r.tag].some((v) => v.toLowerCase().includes(term))
    );
  }, [destination, userRecipients, storeRecipients, searchTerm]);

  const recentRecipients = useMemo(() => {
    const seen = new Set<string>();
    const out: Recipient[] = [];
    for (const tx of debits) {
      const { email } = getCounterparty(tx);
      if (!email || seen.has(email)) continue;
      const match = allRecipients.find((r) => r.email.toLowerCase() === email);
      if (match) {
        seen.add(email);
        out.push(match);
      }
      if (out.length === 5) break;
    }
    return out;
  }, [debits, allRecipients]);

  const transferredThisMonth = useMemo(() => {
    const now = new Date();
    return debits
      .filter((tx) => {
        const d = new Date(tx.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [debits]);

  const amountNum = Number(amount);
  const totalDebit = amountNum + transactionFee;
  const balance = typeof user?.balance === 'number' ? user.balance : 0;

  /* --------------------------------- actions ---------------------------------- */

  const chooseDestination = (d: Destination) => {
    setDestination(d);
    setSearchTerm('');
    if (selected && selected.kind !== d) setSelected(null);
  };

  const pickRecipient = (r: Recipient) => {
    if (r.inactive) return;
    setDestination(r.kind);
    setSelected(r);
  };

  const handleContinue = () => {
    if (!selected || !amount || amountNum <= 0) return;
    if (balance < totalDebit) {
      showToast(
        `Insufficient balance. You need ${naira(totalDebit)} (including ${naira(transactionFee)} fee).`,
        'error'
      );
      return;
    }
    setPinDialogOpen(true);
  };

  const handleSubmitTransfer = async () => {
    if (!selected || !pin) return;
    setTransferLoading(true);

    try {
      const data = await transferFunds({
        receiverEmail: selected.email,
        amount: amountNum,
        pin
      });

      if (data.message === 'Transfer successful') {
        showToast(`${naira(amountNum)} successfully sent to ${selected.name}!`, 'success');
        setSelected(null);
        setAmount('');
        setNote('');
        // Refresh balance (bypass cache) and the recent list
        await Promise.all([fetchUserDetails(true), fetchDebits()]);
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      // transferFunds already maps PIN / balance errors to friendly messages
      showToast(error instanceof Error ? error.message : 'Transfer failed. Please try again.', 'error');
    } finally {
      setTransferLoading(false);
      setPinDialogOpen(false);
      setPin('');
    }
  };

  /* ------------------------------- guard states ------------------------------- */

  if (fetchingUserDetails) {
    return (
      <CenteredState>
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-r-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-indigo-800">Loading...</p>
        </div>
      </CenteredState>
    );
  }

  if (user?.role !== 'school') {
    return (
      <CenteredState>
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            This feature is only available for school accounts. Your account role is:{' '}
            {user?.role || 'unknown'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </CenteredState>
    );
  }

  if (!user?.schoolCanTransfer) {
    return (
      <CenteredState>
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Feature Not Available</h2>
          <p className="text-gray-600 mb-4">
            School transfer feature is not enabled for your account. Please contact your
            administrator to enable this feature for your school.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>School:</strong> {user?.schoolName || 'Your School'}
            </p>
            <p className="text-sm text-blue-600 mt-1">Transfer permissions are currently disabled</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </CenteredState>
    );
  }

  /* ---------------------------------- render ---------------------------------- */

  const destinationCards: { key: Destination; label: string; icon: React.ReactNode; tint: string }[] = [
    { key: 'user', label: 'Xpay Account', icon: <UserIcon className="w-4 h-4" />, tint: 'bg-indigo-100 text-indigo-600' },
    { key: 'store', label: 'Store', icon: <StoreIcon className="w-4 h-4" />, tint: 'bg-teal-100 text-teal-600' }
  ];

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Transfer</h1>
        <p className="text-sm text-slate-500">Send money to Xpay users and stores in your school.</p>
      </div>

      {/* Stats banner */}
      <div className="rounded-xl bg-[#0B1236] text-white p-5 sm:p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <p className="text-xs text-slate-400">Available balance</p>
          <p className="text-3xl font-bold mt-1">{naira(balance)}</p>
          <p className="text-xs text-slate-400 mt-1 truncate">{user.schoolName || 'School'}</p>
        </div>
        <div className="sm:border-l sm:border-white/10 sm:pl-6">
          <p className="text-xs text-slate-400">Transferred this month</p>
          <p className="text-2xl font-bold mt-1">{naira(transferredThisMonth)}</p>
          <p className="text-xs text-slate-400 mt-1">From your recent debits</p>
        </div>
        <div className="sm:border-l sm:border-white/10 sm:pl-6">
          <p className="text-xs text-slate-400">Transfer fee</p>
          <p className="text-2xl font-bold mt-1">{naira(transactionFee)}</p>
          <p className="text-xs text-slate-400 mt-1">Charged per transfer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
        {/* Send money */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm min-w-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-slate-900">Send money</h2>
            <p className="text-xs text-slate-500">Pick a destination, choose a recipient, confirm with PIN.</p>
          </div>

          <div className="p-5 space-y-5">
            {/* Destination */}
            <div>
              <p className="text-sm font-medium text-slate-800 mb-2">Where to?</p>
              <div className="grid grid-cols-2 gap-3">
                {destinationCards.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => chooseDestination(c.key)}
                    className={`rounded-lg border p-4 flex flex-col items-center gap-2 transition-colors ${destination === c.key
                        ? 'border-slate-900 ring-1 ring-slate-900 bg-white'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.tint}`}>
                      {c.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent recipients */}
            {recentRecipients.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-800 mb-2">Recent recipients</p>
                <div className="flex gap-4 overflow-x-auto pb-1">
                  {recentRecipients.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => pickRecipient(r)}
                      className="flex flex-col items-center gap-1 w-16 shrink-0"
                    >
                      <span
                        className={`rounded-full ${selected?.id === r.id ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                          }`}
                      >
                        <Avatar recipient={r} size="w-11 h-11" />
                      </span>
                      <span className="text-xs text-slate-600 truncate w-full text-center">
                        {r.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recipient picker */}
            <div>
              <p className="text-sm font-medium text-slate-800 mb-2">
                {destination === 'user' ? 'Recipient' : 'Store'}
              </p>

              {selected ? (
                <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-3">
                  <Avatar recipient={selected} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{selected.name}</p>
                    <p className="text-xs text-slate-600 truncate">{selected.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={
                        destination === 'user'
                          ? 'Search by name, email, or role...'
                          : 'Search by store name, owner, or email...'
                      }
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {loadingRecipients ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-slate-900 mx-auto"></div>
                      </div>
                    ) : visibleRecipients.length === 0 ? (
                      <p className="text-center text-sm text-gray-500 py-8">
                        {searchTerm
                          ? 'No matches found.'
                          : destination === 'user'
                            ? 'No school users available.'
                            : 'No stores available.'}
                      </p>
                    ) : (
                      visibleRecipients.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          disabled={r.inactive}
                          onClick={() => pickRecipient(r)}
                          className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${r.inactive
                              ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <Avatar recipient={r} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
                            <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                          </div>
                          {r.inactive ? (
                            <span className="text-[11px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          ) : (
                            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                              {r.tag}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Amount</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-4 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent">
                <span className="text-gray-500 mr-2">₦</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full py-3 text-lg font-semibold text-black outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Note <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. November salary"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Fee summary */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-xs text-slate-600">
              <span>Transfer fee</span>
              <span>
                {naira(transactionFee)} <span className="mx-2 text-gray-300">|</span> Total debited:{' '}
                <strong className="text-slate-900">{naira(amountNum > 0 ? totalDebit : transactionFee)}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected || !amount || amountNum <= 0 || transferLoading}
              className="w-full bg-[#0B1236] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#141c4d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Continue to confirm</span>
            </button>
          </div>
        </section>

        {/* Recent debits */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm min-w-0">
          <div className="px-5 pt-4 border-b border-gray-100">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 pb-3 border-b-2 border-slate-900 -mb-px">
              Recent
              <span className="text-[11px] bg-slate-900 text-white rounded px-1.5 py-0.5">
                {Math.min(debits.length, RECENT_DEBITS_SHOWN)}
              </span>
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {loadingDebits ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-slate-900 mx-auto"></div>
              </div>
            ) : debits.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-10">No transfers yet.</p>
            ) : (
              debits.slice(0, RECENT_DEBITS_SHOWN).map((tx) => {
                const { name, email } = getCounterparty(tx);
                const match = allRecipients.find((r) => r.email.toLowerCase() === email);
                const st = statusStyle(tx.status);
                return (
                  <div key={tx._id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                      <ArrowUp className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {match && (
                          <span
                            className={`mr-1.5 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${match.kind === 'store'
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-indigo-50 text-indigo-700'
                              }`}
                          >
                            {match.kind === 'store' ? 'Store' : 'Xpay'}
                          </span>
                        )}
                        {formatWhen(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-red-600">-{naira(Number(tx.amount) || 0)}</p>
                      <p className={`text-xs ${st.cls}`}>{st.label}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* PIN Dialog */}
      {showPinDialog && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter PIN to Confirm Transfer</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Transfer {naira(amountNum)} to {selected.name}
              </p>
              <p className="text-xs text-gray-500">
                Total debit: {naira(totalDebit)} (including {naira(transactionFee)} fee)
              </p>
            </div>

            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your 4-digit PIN"
              maxLength={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-black"
              autoFocus
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setPinDialogOpen(false);
                  setPin('');
                }}
                disabled={transferLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTransfer}
                disabled={!pin || pin.length !== 4 || transferLoading}
                className="flex-1 bg-[#0B1236] text-white px-4 py-2 rounded-lg hover:bg-[#141c4d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {transferLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Confirm Transfer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[200]">
          <div
            className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 text-white ${toast.severity === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}
          >
            {toast.severity === 'success' ? (
              <Check className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white hover:text-gray-200"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default SchoolTransferPage;