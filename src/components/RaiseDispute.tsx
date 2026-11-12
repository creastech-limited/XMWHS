import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  School,
  Plus,
  RefreshCw,
  List,
  Upload,
  Send,
  Clock,
  CircleDot,
  Search,
  Check,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { getUserDetails, getUserTransactions } from '../services';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// TODO: point this at your real file-upload endpoint. It must accept multipart
// form-data (field "file") and return JSON containing the file URL
// ({ url } | { fileUrl } | { data: { url } }).
const UPLOAD_ENDPOINT = `${API_BASE_URL}/api/dispute/uploaddocument`;

const MAX_DESCRIPTION = 500;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ---------- Types ----------
interface User {
  [key: string]: unknown;
  _id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  data?: {
    schoolId?: string;
    academicDetails?: {
      schoolId?: string;
    };
  };
}

interface School {
  school_id: string;
  schoolName: string;
  schoolAddress: string;
  schoolType: string;
}

interface DisputeFormData {
  disputeType: string;
  description: string;
  transactionId: string; // transaction reference
  paymentCategory: string;
  amount: number | '';
  supportingDocuments: string[]; // links
  schoolId?: string;
}

interface Transaction {
  _id: string;
  senderWalletId: string;
  receiverWalletId: string;
  transactionType: string;
  category: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: string;
  metadata: {
    initiatedBy: string;
    email: string;
    platform: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Dispute {
  _id: string;
  userId: string;
  disputeType: string;
  description: string;
  disputeDate: string;
  status: string;
  transactionId: Transaction;
  paymentCategory: string;
  amount: number;
  supportingDocuments: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface CreateDisputeResponse {
  message?: string;
  savedDispute?: Dispute;
  dispute?: Dispute;
  data?: Dispute;
  error?: string;
  details?: string;
  [key: string]: unknown;
}

// A transaction the user can pick in the "Related transaction" field
interface TxnOption {
  id: string;
  reference: string;
  description: string;
  counterparty: string;
  amount: number;
  status: string;
  category: string;
  transactionType: string;
  createdAt: string;
}

// ---------- Static config ----------
// The visible labels follow the new design; `value` is what the backend already accepts.
const issueTypes: {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
    {
      value: 'Billing Issue',
      label: 'Wrong amount charged',
      description: 'Student says they paid the wrong amount.',
      icon: <DollarSign size={14} />,
    },
    {
      value: 'Transaction Error',
      label: "Payment didn't go through",
      description: 'Student says the payment failed but was deducted.',
      icon: <CircleDot size={14} />,
    },
    {
      value: 'Account Discrepancy',
      label: 'Settlement delayed',
      description: "Funds haven't arrived at your bank in time.",
      icon: <Clock size={14} />,
    },
    {
      value: 'Other',
      label: 'Something else',
      description: 'A different issue not listed above.',
      icon: <FileText size={14} />,
    },
  ];

const paymentCategories = ['Deposit', 'Withdrawal', 'Transfer', 'Store Purchase', 'Other'];

const emptyForm: DisputeFormData = {
  disputeType: '',
  description: '',
  transactionId: '',
  paymentCategory: '',
  amount: '',
  supportingDocuments: [],
  schoolId: '',
};

// ---------- Helpers ----------
const naira = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${time}`;
};

const capitalise = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');

const txnMeta = (t: TxnOption) =>
  `${dayLabel(t.createdAt)} · ${naira(t.amount)} · ${capitalise(t.status)}`;

const guessCategory = (t: TxnOption): string => {
  const hay = `${t.transactionType} ${t.category}`.toLowerCase();
  if (hay.includes('withdraw')) return 'Withdrawal';
  if (hay.includes('deposit') || hay.includes('fund')) return 'Deposit';
  if (hay.includes('transfer')) return 'Transfer';
  if (hay.includes('store') || hay.includes('purchase')) return 'Store Purchase';
  return '';
};

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'rejected':
    case 'closed':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'in_progress':
    case 'in progress':
    case 'under investigation':
    case 'under review':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const isUnderReview = (s: string) =>
  ['in_progress', 'in progress', 'under investigation', 'under review'].includes(s?.toLowerCase());

const RaiseDispute: React.FC = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState('');

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState('');

  const [formData, setFormData] = useState<DisputeFormData>(emptyForm);

  // Related-transaction picker
  const [txns, setTxns] = useState<TxnOption[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnOpen, setTxnOpen] = useState(false);
  const [txnQuery, setTxnQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<TxnOption | null>(null);

  // Supporting documents
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftNotice, setDraftNotice] = useState('');
  const draftLoadedFor = useRef<string>('');

  // ---------- API ----------
  const fetchUserDetails = async (): Promise<User> => {
    try {
      const data = await getUserDetails();

      let profile: User | undefined;
      if (data.user?.data) {
        profile = data.user.data;
      } else if (data.data) {
        profile = data.data;
      } else if (data.user) {
        profile = data.user as User;
      } else {
        profile = data as User;
      }

      if (!profile) {
        throw new Error('User profile not found in response');
      }
      return profile;
    } catch (error) {
      console.error('❌ Error fetching user details:', error);
      throw error;
    }
  };

  const fetchUserDisputes = async (authToken: string): Promise<Dispute[]> => {
    const response = await fetch(`${API_BASE_URL}/api/dispute/getuserdispute`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (Array.isArray(data.disputes)) return data.disputes;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  };

  const fetchSchools = async (authToken: string): Promise<School[]> => {
    try {
      setSchoolsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/getallSchools`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.schools || data.data || [];
    } catch (error) {
      console.error('❌ Error fetching schools:', error);
      throw error;
    } finally {
      setSchoolsLoading(false);
    }
  };

  const createDispute = async (disputeData: {
    disputeType: string;
    description: string;
    transactionId: string;
    paymentCategory: string;
    amount: number;
    supportingDocuments: string[];
    schoolId?: string;
  }): Promise<CreateDisputeResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/dispute/createdispute`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(disputeData),
    });

    let responseData: CreateDisputeResponse;
    try {
      responseData = await response.json();
    } catch {
      throw new Error('Server returned invalid response');
    }

    if (response.ok) return responseData;

    throw new Error(
      responseData.message ||
      responseData.error ||
      (responseData.details ? String(responseData.details) : '') ||
      'Failed to create dispute'
    );
  };

  const uploadDocument = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    if (!res.ok) throw new Error(`Could not upload ${file.name}. Please try again.`);
    const data = await res.json();
    const url: string | undefined = data.url || data.fileUrl || data.data?.url;
    if (!url) throw new Error(`Upload of ${file.name} did not return a file URL.`);
    return url;
  };

  const loadUserDisputes = useCallback(async () => {
    if (!token) return;
    setDisputesLoading(true);
    setDisputesError('');
    try {
      setDisputes(await fetchUserDisputes(token));
    } catch (error) {
      console.error('❌ Error loading disputes:', error);
      setDisputesError('Failed to load your disputes. Please try again.');
    } finally {
      setDisputesLoading(false);
    }
  }, [token]);

  const loadTransactions = useCallback(async () => {
    setTxnsLoading(true);
    try {
      const data = (await getUserTransactions()) as unknown as
        | { transactions?: unknown[]; data?: unknown }
        | unknown[];

      let list: unknown[] = [];
      if (Array.isArray(data)) list = data;
      else if (data?.transactions) list = data.transactions;
      else if (data?.data) list = Array.isArray(data.data) ? data.data : [data.data];

      const options: TxnOption[] = list
        .map(
          (item) =>
            item as Record<string, unknown> & {
              metadata?: Record<string, unknown>;
              receiverWalletId?: { email?: string; name?: string };
              senderWalletId?: { email?: string; name?: string };
            }
        )
        .filter((t) => t.reference)
        .map((t) => ({
          id: String(t._id || t.id || t.reference),
          reference: String(t.reference),
          description: t.description ? String(t.description) : '',
          counterparty: String(
            t.receiverWalletId?.name ||
            t.senderWalletId?.name ||
            t.metadata?.receiverEmail ||
            t.metadata?.senderEmail ||
            t.receiverWalletId?.email ||
            t.senderWalletId?.email ||
            ''
          ),
          amount: Math.abs(Number(t.amount) || 0),
          status: String(t.status || ''),
          category: String(t.category || ''),
          transactionType: String(t.transactionType || ''),
          createdAt: String(t.createdAt || t.date || ''),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTxns(options);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      setTxns([]);
    } finally {
      setTxnsLoading(false);
    }
  }, []);

  // ---------- Effects ----------
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        if (auth?.user?._id && auth?.token) {
          setUser(auth.user);
          setToken(auth.token);
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('token');
        if (!storedToken) throw new Error('No authentication token found');

        const profile = await fetchUserDetails();
        setUser(profile);
        setToken(storedToken);

        const mergedUser: User = {
          _id: profile._id || '',
          name: profile.name || '',
          email: profile.email || '',
          role: profile.role || '',
          schoolId: profile.schoolId || profile.data?.schoolId || profile.data?.academicDetails?.schoolId || '',
          status: profile.status || 'active',
          createdAt:
            profile.createdAt !== undefined && profile.createdAt !== null
              ? String(profile.createdAt)
              : new Date().toISOString(),
          updatedAt:
            profile.updatedAt !== undefined && profile.updatedAt !== null
              ? String(profile.updatedAt)
              : new Date().toISOString(),
        };
        auth?.login?.(mergedUser as User & { createdAt: string; updatedAt: string }, storedToken);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setErrorMessage('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth]);

  // Disputes load as soon as we have a token (feeds the stat cards + tab count)
  useEffect(() => {
    if (token) {
      loadUserDisputes();
      loadTransactions();
    }
  }, [token, loadUserDisputes, loadTransactions]);

  useEffect(() => {
    if (token && activeTab === 'list') loadUserDisputes();
  }, [activeTab, token, loadUserDisputes]);

  useEffect(() => {
    if (token && user?.role === 'parent') {
      const loadSchools = async () => {
        try {
          setSchools(await fetchSchools(token));
        } catch (error) {
          console.error('❌ Error loading schools:', error);
          setSchoolsError('Failed to load schools. Please try again.');
        }
      };
      loadSchools();
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (user && ['store', 'kid', 'student'].includes(user.role)) {
      const schoolId =
        user.schoolId ||
        (user.data && (user.data.schoolId || (user.data.academicDetails && user.data.academicDetails.schoolId)));
      if (schoolId) {
        setFormData((prev) => ({ ...prev, schoolId: schoolId as string }));
      }
    }
  }, [user]);

  // Restore a saved draft once per user
  useEffect(() => {
    if (!user?._id || draftLoadedFor.current === user._id) return;
    draftLoadedFor.current = user._id;
    try {
      const raw = localStorage.getItem(`dispute-draft:${user._id}`);
      if (!raw) return;
      const saved = JSON.parse(raw) as { form?: DisputeFormData; txn?: TxnOption | null };
      if (saved.form) setFormData((prev) => ({ ...prev, ...saved.form, schoolId: prev.schoolId || saved.form?.schoolId }));
      if (saved.txn) setSelectedTxn(saved.txn);
      setDraftNotice('Draft restored');
    } catch {
      /* ignore corrupt drafts */
    }
  }, [user]);

  // ---------- Derived ----------
  const stats = useMemo(() => {
    const open = disputes.filter((d) => (d.status || 'pending').toLowerCase() === 'pending').length;
    const review = disputes.filter((d) => isUnderReview(d.status)).length;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const resolved = disputes.filter(
      (d) => d.status?.toLowerCase() === 'resolved' && new Date(d.updatedAt || d.createdAt).getTime() >= cutoff
    );
    const avgDays = resolved.length
      ? resolved.reduce(
        (s, d) => s + (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / 86400000,
        0
      ) / resolved.length
      : null;
    return { open, review, resolved: resolved.length, avgDays };
  }, [disputes]);

  const filteredTxns = useMemo(() => {
    const q = txnQuery.trim().toLowerCase();
    if (!q) return txns.slice(0, 50);
    return txns
      .filter(
        (t) =>
          t.reference.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.counterparty.toLowerCase().includes(q) ||
          String(t.amount).includes(q.replace(/[₦,]/g, ''))
      )
      .slice(0, 50);
  }, [txns, txnQuery]);

  // ---------- Handlers ----------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const selectTxn = (t: TxnOption) => {
    setSelectedTxn(t);
    setFormData((prev) => ({
      ...prev,
      transactionId: t.reference,
      amount: t.amount || prev.amount,
      paymentCategory: prev.paymentCategory || guessCategory(t),
    }));
    setTxnOpen(false);
    setTxnQuery('');
  };

  // Fallback when the transaction isn't in the list: use the typed text as the reference
  const useTypedReference = () => {
    const ref = txnQuery.trim();
    if (!ref) return;
    setSelectedTxn({
      id: ref,
      reference: ref,
      description: 'Entered manually',
      counterparty: '',
      amount: 0,
      status: '',
      category: '',
      transactionType: '',
      createdAt: '',
    });
    setFormData((prev) => ({ ...prev, transactionId: ref }));
    setTxnOpen(false);
    setTxnQuery('');
  };

  const addFiles = (incoming: FileList | File[]) => {
    setFileError('');
    const accepted: File[] = [];
    for (const f of Array.from(incoming)) {
      const okType = f.type.startsWith('image/') || f.type === 'application/pdf';
      if (!okType) {
        setFileError(`${f.name} isn't supported. Use screenshots, receipts or PDFs.`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`${f.name} is larger than 10 MB.`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const addLink = () => {
    const v = linkValue.trim();
    if (!v) return;
    setFormData((prev) => ({ ...prev, supportingDocuments: [...prev.supportingDocuments, v] }));
    setLinkValue('');
    setShowLinkInput(false);
  };

  const saveDraft = () => {
    if (!user?._id) return;
    try {
      localStorage.setItem(`dispute-draft:${user._id}`, JSON.stringify({ form: formData, txn: selectedTxn }));
      setDraftNotice('Draft saved');
      setTimeout(() => setDraftNotice(''), 3000);
    } catch {
      setDraftNotice('Could not save draft');
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyForm, schoolId: user?.role === 'parent' ? '' : formData.schoolId });
    setSelectedTxn(null);
    setFiles([]);
    setFileError('');
    if (user?._id) localStorage.removeItem(`dispute-draft:${user._id}`);
  };

  const handleSubmit = async () => {
    if (!token || !user) {
      setSubmitStatus('error');
      setErrorMessage('Authentication required. Please login again.');
      return;
    }

    if (
      !formData.disputeType ||
      !formData.description.trim() ||
      !formData.transactionId ||
      !formData.paymentCategory ||
      formData.amount === ''
    ) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all required fields (marked with *).');
      return;
    }

    if (user.role === 'parent' && !formData.schoolId) {
      setSubmitStatus('error');
      setErrorMessage('Please select a school for your dispute.');
      return;
    }

    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Upload attached files first, then combine with any pasted links
      const uploaded: string[] = [];
      for (const f of files) {
        uploaded.push(await uploadDocument(f));
      }
      const docs = [...formData.supportingDocuments.filter((d) => d.trim() !== ''), ...uploaded];

      const result = await createDispute({
        disputeType: formData.disputeType,
        description: formData.description.trim(),
        transactionId: formData.transactionId,
        paymentCategory: formData.paymentCategory,
        amount: Number(formData.amount),
        supportingDocuments: docs,
        schoolId: formData.schoolId || undefined,
      });

      const newDispute = result.savedDispute || result.dispute || result.data;
      if (!newDispute) throw new Error('Failed to create dispute - no dispute data returned');

      setSubmitStatus('success');
      resetForm();
      await loadUserDisputes();
      setActiveTab('list');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('❌ Error creating dispute:', error);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error && error.message ? error.message : 'Failed to submit dispute. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Early returns ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#0b1437] mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full border border-slate-200">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center text-slate-900 mb-2">Authentication required</h2>
          <p className="text-slate-600 text-center mb-6">
            {errorMessage || 'Please login to access the dispute system.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#0b1437] text-white px-6 py-3 rounded-lg hover:bg-[#162056] transition font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const inputBase =
    'w-full px-4 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1437]/30 focus:border-[#0b1437]';

  // ---------- Render ----------
  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
          <p className="text-sm text-slate-500">
            Raise a dispute when something goes wrong with a payment, and track its resolution.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500">OPEN</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.open}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Awaiting review
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500">UNDER REVIEW</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.review}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Xpay team working
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500">RESOLVED (30D)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.resolved}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {stats.avgDays !== null ? `Avg ${stats.avgDays.toFixed(1)} days to close` : 'No closed disputes yet'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition ${activeTab === 'list'
                ? 'bg-[#0b1437] text-white border-[#0b1437]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
          >
            <List size={15} />
            My Disputes
            <span
              className={`text-[11px] rounded-full px-1.5 py-0.5 ${activeTab === 'list' ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {disputes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition ${activeTab === 'create'
                ? 'bg-[#0b1437] text-white border-[#0b1437]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
          >
            <Plus size={15} />
            New Dispute
          </button>
        </div>

        {/* Banners */}
        {submitStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-green-800 font-semibold">Dispute submitted</p>
                <p className="text-green-700 text-sm">We&apos;ve received it and will respond within 24–72 hours.</p>
              </div>
            </div>
          </div>
        )}
        {submitStatus === 'error' && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ================= MAIN COLUMN ================= */}
          <div className="lg:col-span-2">
            {activeTab === 'create' ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Open a new dispute</h2>
                  <p className="text-xs text-slate-500">Tell us what happened and we&apos;ll investigate.</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* School (parents) */}
                  {user.role === 'parent' && (
                    <div>
                      <label htmlFor="schoolId" className="block text-sm font-semibold text-slate-800 mb-2">
                        School <span className="text-red-500">*</span>
                      </label>
                      {schoolsLoading ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-[#0b1437]" />
                          Loading schools...
                        </div>
                      ) : schoolsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                          {schoolsError}
                        </div>
                      ) : (
                        <div className="relative">
                          <School className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          <select
                            id="schoolId"
                            name="schoolId"
                            value={formData.schoolId || ''}
                            onChange={handleInputChange}
                            className={`${inputBase} pl-10 pr-10 appearance-none`}
                          >
                            <option value="">Select your school</option>
                            {schools.map((s) => (
                              <option key={s.school_id} value={s.school_id}>
                                {s.schoolName} - {s.schoolAddress}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Related transaction */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Related transaction <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setTxnOpen((v) => !v)}
                      className="w-full flex items-center gap-3 text-left px-3 py-2.5 border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b1437]/30"
                    >
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${selectedTxn ? 'bg-[#0b1437] text-white' : 'bg-slate-100 text-slate-400'
                          }`}
                      >
                        {selectedTxn ? <Check size={15} /> : <Search size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {selectedTxn ? (
                          <>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {selectedTxn.reference}
                              {selectedTxn.counterparty || selectedTxn.description
                                ? ` · ${selectedTxn.counterparty || selectedTxn.description}`
                                : ''}
                            </p>
                            {selectedTxn.createdAt && (
                              <p className="text-[11px] text-slate-400 font-mono truncate">{txnMeta(selectedTxn)}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-400">Select the transaction you&apos;re disputing</p>
                        )}
                      </div>
                      <ChevronRight
                        size={16}
                        className={`text-slate-400 transition-transform ${txnOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                    <p className="text-xs text-slate-400 mt-1.5">Click to search by transaction ID, agent, or amount.</p>

                    {txnOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Close transaction list"
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setTxnOpen(false)}
                        />
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input
                                autoFocus
                                value={txnQuery}
                                onChange={(e) => setTxnQuery(e.target.value)}
                                placeholder="Search reference, agent or amount"
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1437]/30"
                              />
                            </div>
                          </div>
                          <ul className="max-h-64 overflow-y-auto">
                            {txnsLoading ? (
                              <li className="px-4 py-6 text-sm text-center text-slate-500">Loading transactions...</li>
                            ) : filteredTxns.length === 0 ? (
                              <li className="px-4 py-4 text-sm text-center text-slate-500">No matching transactions.</li>
                            ) : (
                              filteredTxns.map((t) => (
                                <li key={t.id}>
                                  <button
                                    type="button"
                                    onClick={() => selectTxn(t)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50"
                                  >
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                      {t.reference}
                                      {t.counterparty || t.description ? ` · ${t.counterparty || t.description}` : ''}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-mono">{txnMeta(t)}</p>
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                          {txnQuery.trim() && (
                            <button
                              type="button"
                              onClick={useTypedReference}
                              className="w-full text-left px-4 py-3 text-sm font-medium text-[#0b1437] bg-slate-50 hover:bg-slate-100 border-t border-slate-100"
                            >
                              Use &ldquo;{txnQuery.trim()}&rdquo; as the transaction reference
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Issue type */}
                  <div>
                    <p className="block text-sm font-semibold text-slate-800 mb-2">
                      Issue type <span className="text-red-500">*</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {issueTypes.map((t) => {
                        const active = formData.disputeType === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, disputeType: t.value }))}
                            aria-pressed={active}
                            className={`flex items-start gap-3 text-left p-3 rounded-lg border transition ${active
                                ? 'bg-[#0b1437] border-[#0b1437] text-white'
                                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                              }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                              {t.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{t.label}</p>
                              <p className={`text-xs ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                                {t.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category + amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="paymentCategory" className="block text-sm font-semibold text-slate-800 mb-2">
                        Payment category <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="paymentCategory"
                          name="paymentCategory"
                          value={formData.paymentCategory}
                          onChange={handleInputChange}
                          className={`${inputBase} pr-10 appearance-none`}
                        >
                          <option value="">Select category</option>
                          {paymentCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-semibold text-slate-800 mb-2">
                        Disputed amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-sm text-slate-500">₦</span>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className={`${inputBase} pl-8`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* What happened */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-800 mb-2">
                      What happened? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value.slice(0, MAX_DESCRIPTION) }))
                      }
                      rows={5}
                      className={`${inputBase} resize-y`}
                      placeholder="e.g. The student scanned to pay ₦1,800 and received the success tone on their device, but my dashboard shows the transaction as failed and the funds never reached my wallet."
                    />
                    <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                      <span>Be specific. Dates, times and amounts help us resolve faster.</span>
                      <span>
                        {formData.description.length} / {MAX_DESCRIPTION}
                      </span>
                    </div>
                  </div>

                  {/* Supporting documents */}
                  <div>
                    <p className="block text-sm font-semibold text-slate-800 mb-2">
                      Supporting documents <span className="font-normal text-slate-400">(optional)</span>
                    </p>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                      }}
                      className={`flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border-2 border-dashed cursor-pointer transition ${dragActive ? 'border-[#0b1437] bg-slate-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3">
                        <Upload size={16} className="text-slate-700" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">Click to upload or drag files here</p>
                      <p className="text-xs text-slate-400 mt-1">Screenshots, receipts, PDFs. Up to 10 MB each.</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) addFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {fileError && <p className="text-xs text-red-600 mt-2">{fileError}</p>}

                    {(files.length > 0 || formData.supportingDocuments.length > 0) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {files.map((f, i) => (
                          <span
                            key={`${f.name}-${i}`}
                            className="inline-flex items-center gap-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                          >
                            <ImageIcon size={13} className="text-blue-500" />
                            <span className="font-medium">{f.name}</span>
                            <span className="text-slate-400">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                            <button
                              type="button"
                              onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-slate-700"
                              title="Remove file"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                        {formData.supportingDocuments.map((link, i) => (
                          <span
                            key={`${link}-${i}`}
                            className="inline-flex items-center gap-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 max-w-full"
                          >
                            <LinkIcon size={13} className="text-blue-500 shrink-0" />
                            <span className="font-medium truncate max-w-[200px]">{link}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  supportingDocuments: prev.supportingDocuments.filter((_, idx) => idx !== i),
                                }))
                              }
                              className="text-slate-400 hover:text-slate-700"
                              title="Remove link"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {showLinkInput ? (
                      <div className="flex gap-2 mt-3">
                        <input
                          type="url"
                          value={linkValue}
                          onChange={(e) => setLinkValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addLink();
                            }
                          }}
                          placeholder="https://example.com/receipt.pdf"
                          className={inputBase}
                        />
                        <button
                          type="button"
                          onClick={addLink}
                          className="px-4 text-sm font-semibold text-white bg-[#0b1437] rounded-lg hover:bg-[#162056]"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowLinkInput(true)}
                        className="mt-3 text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                      >
                        <LinkIcon size={12} />
                        Add a link instead
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={13} />
                    {draftNotice || 'We respond within 24-72 hours.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition"
                    >
                      Save draft
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0b1437] rounded-lg hover:bg-[#162056] disabled:opacity-60 transition"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Send size={14} />
                      )}
                      {submitting ? 'Submitting...' : 'Submit dispute'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= MY DISPUTES ================= */
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-slate-900">Your disputes</h2>
                    <button
                      onClick={loadUserDisputes}
                      disabled={disputesLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 disabled:opacity-50 transition"
                    >
                      <RefreshCw className={`h-4 w-4 ${disputesLoading ? 'animate-spin' : ''}`} />
                      {disputesLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {disputesError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
                      <XCircle className="h-4 w-4" />
                      {disputesError}
                    </div>
                  )}

                  {disputesLoading && disputes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#0b1437] mx-auto mb-4" />
                      <p className="text-slate-600 text-sm">Loading your disputes...</p>
                    </div>
                  ) : disputes.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-900 mb-1">No disputes yet</h3>
                      <p className="text-sm text-slate-500 mb-5">When a payment goes wrong, raise it here.</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0b1437] rounded-lg hover:bg-[#162056] transition"
                      >
                        <Plus size={16} />
                        Open your first dispute
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((dispute) => {
                        const label = issueTypes.find((t) => t.value === dispute.disputeType)?.label || dispute.disputeType;
                        return (
                          <div key={dispute._id} className="border border-slate-200 rounded-xl p-5 bg-white">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">{label}</h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                                  dispute.status
                                )}`}
                              >
                                {dispute.status || 'Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">{dispute.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <DollarSign className="h-3.5 w-3.5" />
                                {naira(dispute.amount)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />
                                {dispute.paymentCategory}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(dispute.createdAt)}
                              </span>
                            </div>

                            {dispute.transactionId && (
                              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-slate-500 text-[11px] font-medium mb-1">Transaction ID</p>
                                    <p className="text-slate-900 font-mono text-xs break-all">
                                      {dispute.transactionId._id}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-slate-500 text-[11px] font-medium mb-1">Reference</p>
                                    <p className="text-slate-900 font-mono text-xs break-all">
                                      {dispute.transactionId.reference}
                                    </p>
                                  </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm">
                                  <p className="text-slate-700">
                                    <span className="font-semibold">Transaction:</span>{' '}
                                    {dispute.transactionId.description || '—'}
                                  </p>
                                  <p className="text-slate-700">
                                    <span className="font-semibold">Amount:</span> {naira(dispute.transactionId.amount)}{' '}
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-white border border-slate-200 text-slate-600">
                                      {dispute.transactionId.status}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )}

                            {dispute.supportingDocuments?.filter(Boolean).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {dispute.supportingDocuments.filter(Boolean).map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 hover:bg-blue-100"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Document {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= SIDEBAR ================= */}
          <div className="space-y-6">
            <div className="bg-[#0b1437] text-white rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-6">
                <AlertCircle size={18} />
              </div>
              <h3 className="font-bold mb-2">Before you file</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Most issues are resolved faster through your records. Confirm the transaction isn&apos;t just pending,
                and check your agent&apos;s device if possible.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4">What makes a strong dispute</h3>
              <ol className="space-y-4">
                {[
                  {
                    t: "Attach the student's receipt or confirmation screenshot.",
                    d: 'This is the single most helpful piece of evidence.',
                  },
                  {
                    t: 'Include exact times and amounts.',
                    d: 'Rough estimates slow down investigation.',
                  },
                  {
                    t: 'Mention which agent took the payment.',
                    d: 'We can cross-check their device logs.',
                  },
                ].map((item, i) => (
                  <li key={i} className={`flex gap-3 ${i > 0 ? 'pt-4 border-t border-slate-100' : ''}`}>
                    <span className="w-5 h-5 rounded-full bg-[#0b1437] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-800">{item.t}</span> {item.d}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default RaiseDispute;