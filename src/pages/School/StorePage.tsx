import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Store as StoreIcon,
  Search,
  Plus,
  MoreVertical,
  Download,
  Mail,
  Clock,
  Coffee,
  BookOpen,
  Tag,
  Shirt,
  Pill,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  XCircle,
  CheckCircle,
  Link as LinkIcon,
  List,
  LayoutGrid,
  TrendingUp,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

// Services
import {
  getUserDetails,
  getStoresBySchoolId,
  resetStorePassword,
  activateStore,
  deactivateStore,
  createStore,
} from '../../services/api/userService';

import type { UserResponse, SnackbarState } from '../../types/user';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type StoreStatus = 'active' | 'pending' | 'suspended';
type SortKey = 'revenue_desc' | 'revenue_asc' | 'newest' | 'oldest' | 'name';
type ViewMode = 'list' | 'grid';
type ConfirmAction = 'activate' | 'deactivate' | 'approve';

interface AgentRow {
  id: string;
  name: string;
  active: boolean;
}

interface StoreRow {
  _id: string;
  storeCode: string;
  storeName: string;
  storeType: string;
  ownerName: string;
  email: string;  
  phone: string;
  location: string;
  status: StoreStatus;
  createdAt: string;
  agents: AgentRow[];
  activeAgents: AgentRow[];
  volume: number;
  txns: number;
  isStandAlone: boolean;
}

interface NewStoreForm {
  storeName: string;
  storeType: string;
  location: string;
  ownerName: string;
  email: string;
  phone: string;
}

const STANDALONE_SCHOOL_ID = 'FFZ960384';

const STORE_TYPES = ['Cafeteria', 'Bookstore', 'Supplies', 'Uniform', 'Pharmacy', 'Other'] as const;

const TYPE_ICONS: Record<string, { icon: React.ElementType; tile: string }> = {
  Cafeteria: { icon: Coffee, tile: 'bg-amber-100 text-amber-700' },
  Bookstore: { icon: BookOpen, tile: 'bg-indigo-100 text-indigo-700' },
  Supplies: { icon: Tag, tile: 'bg-teal-100 text-teal-700' },
  Uniform: { icon: Shirt, tile: 'bg-pink-100 text-pink-700' },
  Pharmacy: { icon: Pill, tile: 'bg-emerald-100 text-emerald-700' },
  Other: { icon: HelpCircle, tile: 'bg-slate-100 text-slate-600' },
};

const TYPE_BADGE: Record<string, string> = {
  Cafeteria: 'bg-amber-100 text-amber-800',
  Bookstore: 'bg-indigo-100 text-indigo-800',
  Supplies: 'bg-teal-100 text-teal-800',
  Uniform: 'bg-pink-100 text-pink-800',
  Pharmacy: 'bg-emerald-100 text-emerald-800',
  Other: 'bg-slate-100 text-slate-700',
};

const STATUS_BADGE: Record<StoreStatus, { label: string; cls: string; dot: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  suspended: { label: 'Suspended', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-orange-600',
  'bg-indigo-700',
  'bg-teal-600',
  'bg-pink-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-rose-600',
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'revenue_desc', label: 'Revenue · High to low' },
  { value: 'revenue_asc', label: 'Revenue · Low to high' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name · A to Z' },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};

const hashIndex = (value: string, mod: number) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h % mod;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'S';

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const nairaCompact = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `₦${(n / 1_000).toFixed(1)}K` : naira(n);

const daysAgo = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
};

const formatJoined = (iso: string) => {
  const n = daysAgo(iso);
  if (n === null) return 'N/A';
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const relativeDay = (iso: string) => {
  const n = daysAgo(iso);
  if (n === null) return 'recently';
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  return `${n} days ago`;
};

const normalizeStatus = (raw: unknown): StoreStatus => {
  const s = str(raw).toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'pending') return 'pending';
  return 'suspended'; // inactive / suspended / deactivated
};

const unwrapList = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.stores)) return r.stores;
  }
  return [];
};

/** Maps one raw API store (the new response shape) onto what the UI needs. */
const normalizeStore = (raw: Record<string, unknown>, index: number): StoreRow => {
  const id = str(raw._id) || str(raw.id) || str(raw.store_id) || `store-${index}`;

  const agents: AgentRow[] = (Array.isArray(raw.agents) ? raw.agents : [])
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .map((a, i) => ({
      id: str(a.id) || `${id}-agent-${i}`,
      name: str(a.fullName) || `${str(a.firstName)} ${str(a.lastName)}`.trim() || 'Agent',
      active: str(a.status).toLowerCase() === 'active',
    }));

  const ownerName =
    str(raw.name) || `${str(raw.firstName)} ${str(raw.lastName)}`.trim() || str(raw.email).split('@')[0] || '—';

  return {
    _id: id,
    storeCode: `STR-${id.slice(-6).toUpperCase()}`,
    storeName: str(raw.storeName) || str(raw.name) || 'Unnamed store',
    storeType: str(raw.storeType) || 'Other',
    ownerName,
    email: str(raw.email),
    phone: str(raw.phone),
    location: str(raw.location),
    status: normalizeStatus(raw.status),
    createdAt: str(raw.createdAt) || str(raw.registrationDate),
    agents,
    activeAgents: agents.filter((a) => a.active),
    volume: num(raw.totalAmountMade),
    txns: num(raw.salesCount),
    isStandAlone: Boolean(raw.isStandAlone) || str(raw.schoolId) === STANDALONE_SCHOOL_ID,
  };
};

const pageWindow = (page: number, pageCount: number): number[] => {
  const size = Math.min(5, pageCount);
  let start = Math.max(1, page - Math.floor(size / 2));
  if (start + size - 1 > pageCount) start = Math.max(1, pageCount - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
};

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

const StoreAvatar: React.FC<{ name: string; muted?: boolean; size?: string }> = ({ name, muted, size = 'h-9 w-9' }) => (
  <div
    className={`${size} shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
      muted ? 'bg-slate-300' : AVATAR_COLORS[hashIndex(name, AVATAR_COLORS.length)]
    }`}
  >
    {initials(name)}
  </div>
);

const AgentStack: React.FC<{ store: StoreRow }> = ({ store }) => {
  if (store.status === 'pending') return <span className="text-slate-400">—</span>;
  const list = store.activeAgents;
  if (list.length === 0) return <span className="text-xs text-slate-400">0 active</span>;
  const shown = list.slice(0, 3);
  const extra = list.length - shown.length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {shown.map((a) => (
          <span
            key={a.id}
            title={a.name}
            className={`h-6 w-6 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white ${
              AVATAR_COLORS[hashIndex(a.name, AVATAR_COLORS.length)]
            }`}
          >
            {initials(a.name)}
          </span>
        ))}
        {extra > 0 && (
          <span className="h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-semibold text-slate-600">
            +{extra}
          </span>
        )}
      </div>
      <span className="text-sm text-slate-700">{list.length}</span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: StoreStatus }> = ({ status }) => {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[type] || TYPE_BADGE.Other}`}>
    {type}
  </span>
);

const VolumeCell: React.FC<{ store: StoreRow }> = ({ store }) => {
  if (store.status === 'pending') return <span className="text-slate-400">—</span>;
  return (
    <div>
      <div className={`text-sm font-semibold ${store.status === 'suspended' ? 'text-slate-400' : 'text-slate-900'}`}>
        {naira(store.volume)}
      </div>
      <div className="text-xs text-slate-400">{store.txns} txns</div>
    </div>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
  highlight?: boolean;
}> = ({ label, value, onChange, options, icon, highlight }) => (
  <label
    className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
      highlight ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
    }`}
  >
    {icon}
    <span>{label}</span>
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-transparent pr-4 font-semibold text-slate-900 focus:outline-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
  </label>
);

/* -------------------------------------------------------------------------- */
/*  Add store drawer                                                           */
/* -------------------------------------------------------------------------- */

const EMPTY_FORM: NewStoreForm = {
  storeName: '',
  storeType: 'Cafeteria',
  location: '',
  ownerName: '',
  email: '',
  phone: '',
};

const AddStoreDrawer: React.FC<{
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (form: NewStoreForm) => Promise<boolean>;
}> = ({ open, submitting, onClose, onSubmit }) => {
  const [form, setForm] = useState<NewStoreForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof NewStoreForm, string>>>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset + focus whenever the drawer opens
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setErrors({});
    const t = setTimeout(() => firstFieldRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [open]);

  // Esc to close + lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, submitting, onClose]);

  const set = (key: keyof NewStoreForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er: Partial<Record<keyof NewStoreForm, string>> = {};
    if (!form.storeName.trim()) er.storeName = 'Enter the store name.';
    if (!form.ownerName.trim()) er.ownerName = 'Enter the owner’s name.';
    if (!form.email.trim()) er.email = 'Enter an email so we can send the invitation.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = 'Enter a valid email address.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    await onSubmit({
      ...form,
      storeName: form.storeName.trim(),
      ownerName: form.ownerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
    });
  };

  const inputCls = (err?: string) =>
    `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${
      err ? 'border-red-400' : 'border-slate-200'
    }`;

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${open ? 'visible' : 'invisible'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-900/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => !submitting && onClose()}
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label="Add a store"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add a store</h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a store record for a vendor. They’ll receive an invitation to set up their account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Store details</h3>

            <div>
              <label htmlFor="storeName" className="mb-1.5 block text-xs font-semibold text-slate-800">
                Store name
              </label>
              <input
                id="storeName"
                ref={firstFieldRef}
                value={form.storeName}
                onChange={set('storeName')}
                placeholder="e.g. Julie Store"
                className={inputCls(errors.storeName)}
              />
              {errors.storeName && <p className="mt-1 text-xs text-red-600">{errors.storeName}</p>}
            </div>

            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-slate-800">Type</legend>
              <div className="grid grid-cols-3 gap-2">
                {STORE_TYPES.map((t) => {
                  const { icon: Icon, tile } = TYPE_ICONS[t];
                  const selected = form.storeType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setForm((f) => ({ ...f, storeType: t }))}
                      className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-slate-900 bg-white text-slate-900 ring-1 ring-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-md ${tile}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {t}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="location" className="mb-1.5 block text-xs font-semibold text-slate-800">
                Location on campus
              </label>
              <input
                id="location"
                value={form.location}
                onChange={set('location')}
                placeholder="e.g. Block A, next to the main gate"
                className={inputCls()}
              />
              <p className="mt-1.5 text-xs text-slate-400">Helps students find the store. Nothing more technical than that.</p>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Owner contact</h3>

            <div>
              <label htmlFor="ownerName" className="mb-1.5 block text-xs font-semibold text-slate-800">
                Owner name
              </label>
              <input
                id="ownerName"
                value={form.ownerName}
                onChange={set('ownerName')}
                placeholder="e.g. Mercy Kalu"
                className={inputCls(errors.ownerName)}
              />
              {errors.ownerName && <p className="mt-1 text-xs text-red-600">{errors.ownerName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-800">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="owner@email.com"
                  className={inputCls(errors.email)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-slate-800">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="0803 000 0000"
                  className={inputCls()}
                />
              </div>
            </div>
            {errors.email && <p className="-mt-2 text-xs text-red-600">{errors.email}</p>}
            <p className="text-xs text-slate-400">
              The owner will receive an invitation to set up their store password and start adding agents.
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">The store will go live after you approve it.</p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create store
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const authToken = authContext?.token || localStorage.getItem('token');

  // School
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [storeLink, setStoreLink] = useState('');

  // Data
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('revenue_desc');
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // UI
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState<{ store: StoreRow; top: number; left: number } | null>(null);
  const [confirm, setConfirm] = useState<{ store: StoreRow; action: ConfirmAction } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const notify = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Auto-hide snackbar
  useEffect(() => {
    if (!snackbar.open) return;
    const t = setTimeout(() => setSnackbar((p) => ({ ...p, open: false })), 3000);
    return () => clearTimeout(t);
  }, [snackbar.open, snackbar.message]);

  /* ---- 1) user profile → schoolId, schoolName, registration link ---- */
  useEffect(() => {
    if (!authToken) return;

    const run = async () => {
      try {
        const data: UserResponse = await getUserDetails();
        let profile: Record<string, unknown>;
        if (data.user?.data) profile = data.user.data as Record<string, unknown>;
        else if (data.user) profile = data.user as Record<string, unknown>;
        else if (data.data) profile = data.data as Record<string, unknown>;
        else profile = data as Record<string, unknown>;

        const nested = (profile?.data as Record<string, unknown>) || {};
        const id = str(profile?.schoolId);
        const name = str(profile?.schoolName) || str(nested.schoolName) || str(profile?.name);
        const linkPath = str(profile?.Link) || str(nested.Link);

        if (!id) throw new Error('School ID not found in user profile');

        setSchoolId(id);
        setSchoolName(name);
        setStoreLink(
          `${window.location.origin}/stores/new${linkPath}?schoolId=${id}&schoolName=${encodeURIComponent(name)}`
        );
      } catch (err) {
        console.error(err);
        notify(err instanceof Error ? err.message : 'Failed to fetch user profile', 'error');
      }
    };
    run();
  }, [authToken, notify]);

  /* ---- 2) stores ---- */
  const fetchStores = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await getStoresBySchoolId(schoolId);
      const list = unwrapList(res)
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map(normalizeStore);
      setStores(list);
    } catch (err) {
      console.error('Fetch error:', err);
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (authToken && schoolId) fetchStores();
  }, [authToken, schoolId, fetchStores]);

  /* ---- derived ---- */
  const stats = useMemo(() => {
    const active = stores.filter((s) => s.status === 'active').length;
    const pending = stores.filter((s) => s.status === 'pending');
    const volume = stores.reduce((sum, s) => sum + s.volume, 0);
    const agents = stores.reduce((sum, s) => sum + s.activeAgents.length, 0);
    const mix = STORE_TYPES.map((t) => ({
      type: t,
      count: stores.filter((s) => (STORE_TYPES.includes(s.storeType as never) ? s.storeType : 'Other') === t).length,
    })).filter((m) => m.count > 0);
    return { active, pending, volume, agents, mix };
  }, [stores]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = stores.filter((s) => {
      const matchesSearch =
        !q ||
        s.storeName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.storeCode.toLowerCase().includes(q) ||
        s._id.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || s.storeType === typeFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    const time = (s: StoreRow) => new Date(s.createdAt).getTime() || 0;
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'revenue_asc':
          return a.volume - b.volume;
        case 'newest':
          return time(b) - time(a);
        case 'oldest':
          return time(a) - time(b);
        case 'name':
          return a.storeName.localeCompare(b.storeName);
        default:
          return b.volume - a.volume;
      }
    });
  }, [stores, searchQuery, typeFilter, statusFilter, sort]);

  const typeOptions = useMemo(
    () => [...new Set(stores.map((s) => s.storeType).filter(Boolean))],
    [stores]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(page * rowsPerPage, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, statusFilter, sort, rowsPerPage]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const filtersDirty =
    searchQuery !== '' || typeFilter !== 'all' || statusFilter !== 'all' || sort !== 'revenue_desc';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setSort('revenue_desc');
  };

  /* ---- actions ---- */
  const handleCopyLink = async () => {
    if (!storeLink) return notify('School information is not available.', 'error');
    try {
      await navigator.clipboard.writeText(storeLink);
      notify('Registration link copied to clipboard!');
    } catch {
      notify('Failed to copy registration link', 'error');
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) return notify('No stores available to export', 'warning');

    const headers = ['Store ID', 'Store', 'Type', 'Owner', 'Email', 'Phone', 'Location', 'Status', 'Active agents', 'Volume (NGN)', 'Transactions', 'Joined'];
    const esc = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((s) =>
      [
        s._id,
        s.storeName,
        s.storeType,
        s.ownerName,
        s.email,
        s.phone,
        s.location,
        STATUS_BADGE[s.status].label,
        s.activeAgents.length,
        s.volume,
        s.txns,
        s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '',
      ]
        .map(esc)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stores_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    notify('Stores exported successfully');
  };

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, store: StoreRow) => {
    e.stopPropagation();
    if (menu?.store._id === store._id) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    const MENU_W = 224;
    setMenu({
      store,
      top: Math.min(r.bottom + 4, window.innerHeight - 190),
      left: Math.max(8, r.right - MENU_W),
    });
  };

  // Close floating menu on scroll / resize
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const handleResetPassword = async (store: StoreRow) => {
    setMenu(null);
    try {
      await resetStorePassword(store.email);
      notify(`Password reset email sent to ${store.email}`);
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      let message = 'Failed to reset password';
      if (axios.isAxiosError(error)) message = error.response?.data?.message || error.message;
      else if (error instanceof Error) message = error.message;
      notify(message, 'error');
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { store, action } = confirm;
    setStatusLoading(true);
    try {
      if (action === 'deactivate') await deactivateStore(store._id);
      else await activateStore(store._id); // approve = activate

      const next: StoreStatus = action === 'deactivate' ? 'suspended' : 'active';
      setStores((prev) => prev.map((s) => (s._id === store._id ? { ...s, status: next } : s)));
      notify(
        action === 'approve'
          ? `${store.storeName} approved`
          : `Store ${action === 'deactivate' ? 'deactivated' : 'activated'} successfully`
      );
    } catch (error) {
      console.error('Error updating store status:', error);
      notify(error instanceof Error ? error.message : 'Failed to update store status', 'error');
    } finally {
      setStatusLoading(false);
      setConfirm(null);
    }
  };

  const handleCreateStore = async (form: NewStoreForm): Promise<boolean> => {
    if (!schoolId) {
      notify('School information is missing. Cannot create a store.', 'error');
      return false;
    }
    setCreating(true);
    try {
      const [firstName, ...rest] = form.ownerName.split(/\s+/);
      await createStore({
        schoolId,
        schoolName,
        storeName: form.storeName,
        storeType: form.storeType,
        location: form.location,
        firstName,
        lastName: rest.join(' '),
        email: form.email,
        phone: form.phone,
      });
      setDrawerOpen(false);
      notify(`${form.storeName} created. An invitation was sent to ${form.email}.`);
      fetchStores();
      return true;
    } catch (error: unknown) {
      console.error('Error creating store:', error);
      let message = 'Failed to create store';
      if (axios.isAxiosError(error)) message = error.response?.data?.message || error.message;
      else if (error instanceof Error) message = error.message;
      notify(message, 'error');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const reviewPending = () => {
    setStatusFilter('pending');
    setTypeFilter('all');
    setSearchQuery('');
  };

  const confirmCopy = (c: { store: StoreRow; action: ConfirmAction }) => {
    const name = c.store.storeName;
    switch (c.action) {
      case 'deactivate':
        return {
          variant: 'danger' as const,
          title: 'Deactivate store?',
          message: `${name} will be marked suspended and may lose access until you activate it again.`,
          label: 'Deactivate store',
        };
      case 'approve':
        return {
          variant: 'success' as const,
          title: 'Approve store?',
          message: `${name} will go live and the owner can start adding agents.`,
          label: 'Approve store',
        };
      default:
        return {
          variant: 'success' as const,
          title: 'Activate store?',
          message: `${name} will be marked active and regain access to its account.`,
          label: 'Activate store',
        };
    }
  };

  /* ---- render ---- */
  const pendingFirst = stats.pending[0];

  return (
    <>
      <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-x-hidden">
        {/* Page header */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Stores</h1>
            <p className="mt-1 text-sm text-slate-500">
              The vendors operating on {schoolName ? `${schoolName}’s` : 'your'} campus.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LinkIcon className="h-4 w-4" />
              Invite via link
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Store
            </button>
          </div>
        </div>

        {/* Pending approval banner */}
        {!loading && pendingFirst && !bannerDismissed && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300 text-amber-600">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {stats.pending.length} {stats.pending.length === 1 ? 'store' : 'stores'} awaiting your approval
                </p>
                <p className="text-xs text-amber-800/80">
                  {pendingFirst.storeName}
                  {stats.pending.length > 1 ? ` and ${stats.pending.length - 1} more were` : ' was'} registered{' '}
                  {relativeDay(pendingFirst.createdAt)} and{' '}
                  {stats.pending.length > 1 ? 'are' : 'is'} pending review.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-11 sm:pl-0">
              <button
                onClick={() => setBannerDismissed(true)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Dismiss
              </button>
              <button
                onClick={reviewPending}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Review store{stats.pending.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active stores</p>
            {loading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {stats.active} <span className="text-sm font-normal text-slate-400">of {stores.length}</span>
                </p>
                {stats.pending.length > 0 && (
                  <span className="mt-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    {stats.pending.length} pending
                  </span>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Volume</p>
            {loading ? (
              <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-100" />
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-900">{nairaCompact(stats.volume)}</p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <TrendingUp className="h-3 w-3" />
                  Across all stores
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Agents deployed</p>
            {loading ? (
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-100" />
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stats.agents}</p>
                <p className="mt-1.5 text-[11px] text-slate-400">Across all stores</p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Store mix</p>
            {loading ? (
              <div className="mt-2 h-8 w-full animate-pulse rounded bg-slate-100" />
            ) : stats.mix.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No stores yet</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stats.mix.map((m) => (
                  <span
                    key={m.type}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_BADGE[m.type]}`}
                  >
                    {m.count} {m.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table card */}
        <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by store name, owner, or ID"
                aria-label="Search stores"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: 'all', label: 'All' }, ...typeOptions.map((t) => ({ value: t, label: t }))]}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              options={SORT_OPTIONS}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              highlight
            />
            {filtersDirty && (
              <button onClick={resetFilters} className="px-2 text-sm text-slate-500 hover:text-slate-800">
                Reset
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                <button
                  onClick={() => setView('list')}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={`p-2 ${view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={`p-2 ${view === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="ml-auto h-3 w-24 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <StoreIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-800">
                {stores.length === 0 ? 'No stores yet' : 'No stores match your filters'}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {stores.length === 0
                  ? 'Add your first vendor, or share the registration link so they can sign up themselves.'
                  : 'Try a different search, or reset the filters.'}
              </p>
              {stores.length === 0 ? (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add your first store
                </button>
              ) : (
                <button onClick={resetFilters} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                  Reset filters
                </button>
              )}
            </div>
          ) : view === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-[960px] w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Store</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Agents</th>
                    <th className="px-4 py-3">Volume</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((s) => (
                    <tr
                      key={s._id}
                      className={`transition-colors ${s.status === 'pending' ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <StoreAvatar name={s.storeName} muted={s.status === 'suspended'} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                title={s.location || undefined}
                                className={`truncate text-sm font-semibold ${s.status === 'suspended' ? 'text-slate-500' : 'text-slate-900'}`}
                              >
                                {s.storeName}
                              </span>
                              {s.isStandAlone && (
                                <span className="rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                                  Standalone
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">{s.storeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={s.storeType} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">{s.ownerName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{s.phone || s.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <AgentStack store={s} />
                      </td>
                      <td className="px-4 py-3">
                        <VolumeCell store={s} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{formatJoined(s.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => openMenu(e, s)}
                          aria-label={`Actions for ${s.storeName}`}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginated.map((s) => (
                <div
                  key={s._id}
                  className={`rounded-xl border p-4 ${s.status === 'pending' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <StoreAvatar name={s.storeName} muted={s.status === 'suspended'} size="h-10 w-10" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{s.storeName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{s.storeCode}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => openMenu(e, s)}
                      aria-label={`Actions for ${s.storeName}`}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <TypeBadge type={s.storeType} />
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    {s.ownerName}
                    <span className="block font-mono text-[11px] text-slate-400">{s.phone || s.email || '—'}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                    <VolumeCell store={s} />
                    <AgentStack store={s} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <label className="flex items-center gap-2">
                  Rows per page
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  {rangeStart} to {rangeEnd} of {filtered.length}
                </span>
              </div>

              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageWindow(page, pageCount).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    aria-current={n === page ? 'page' : undefined}
                    className={`h-7 min-w-7 rounded-md px-2 text-xs font-semibold ${
                      n === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  aria-label="Next page"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          )}
        </section>
      </main>

      {/* Row action menu (fixed so the table's overflow never clips it) */}
      {menu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
          <div
            role="menu"
            className="fixed z-40 w-56 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg"
            style={{ top: menu.top, left: menu.left }}
          >
            <button
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                const id = menu.store._id;
                setMenu(null);
                navigate(`/schools/stores/${id}/edit`);
              }}
            >
              <Info className="h-4 w-4" />
              View details
            </button>
            <button
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => handleResetPassword(menu.store)}
            >
              <Mail className="h-4 w-4" />
              Reset password
            </button>
            <div className="my-1 border-t border-slate-100" />
            {menu.store.status === 'pending' ? (
              <button
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-emerald-600 hover:bg-slate-50"
                onClick={() => {
                  setConfirm({ store: menu.store, action: 'approve' });
                  setMenu(null);
                }}
              >
                <CheckCircle className="h-4 w-4" />
                Approve store
              </button>
            ) : menu.store.status === 'active' ? (
              <button
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                onClick={() => {
                  setConfirm({ store: menu.store, action: 'deactivate' });
                  setMenu(null);
                }}
              >
                <XCircle className="h-4 w-4" />
                Deactivate store
              </button>
            ) : (
              <button
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-emerald-600 hover:bg-slate-50"
                onClick={() => {
                  setConfirm({ store: menu.store, action: 'activate' });
                  setMenu(null);
                }}
              >
                <CheckCircle className="h-4 w-4" />
                Activate store
              </button>
            )}
          </div>
        </>
      )}

      {/* Confirm dialog */}
      {confirm &&
        (() => {
          const copy = confirmCopy(confirm);
          return (
            <ConfirmDialog
              isOpen
              variant={copy.variant}
              title={copy.title}
              message={copy.message}
              confirmLabel={copy.label}
              loading={statusLoading}
              onConfirm={handleConfirm}
              onCancel={() => setConfirm(null)}
            />
          );
        })()}

      {/* Add store drawer */}
      <AddStoreDrawer
        open={drawerOpen}
        submitting={creating}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreateStore}
      />

      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <div
            className={`flex items-center gap-3 rounded-lg px-5 py-3 text-sm text-white shadow-lg ${
              snackbar.severity === 'success'
                ? 'bg-emerald-600'
                : snackbar.severity === 'error'
                  ? 'bg-red-600'
                  : snackbar.severity === 'warning'
                    ? 'bg-amber-600'
                    : 'bg-blue-600'
            }`}
          >
            <span>{snackbar.message}</span>
            <button
              onClick={() => setSnackbar((p) => ({ ...p, open: false }))}
              aria-label="Dismiss"
              className="text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StorePage;