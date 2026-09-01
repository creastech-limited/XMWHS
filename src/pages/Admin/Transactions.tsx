import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Search,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building2,
  Store as StoreIcon,
  Shield,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Copy,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import {
  getAllTransactionsForAdmin,
  getAllUsers,
  getAllParents,
  getAllStudents,
  getAllSchools,
  getStoresInSchoolByAdmin,
  getStudentsInSchoolByAdmin,
  extractStudentName,
  extractStudentEmail
} from '../../services';
import type { Transaction, UserData, Store } from '../../types/user';
import type { Kid, SchoolsResponse, StudentsInSchoolResponse } from '../../types/student';

type RoleTab = 'all' | 'student' | 'school' | 'parent' | 'agent' | 'store';

interface EnrichedTransaction extends Transaction {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  displayDate?: string;
  displayAmount?: number;
}

const Transactions: React.FC = () => {
  useAuth();
  const [searchParams] = useSearchParams();
  const initialRoleParam = (searchParams.get('role')?.toLowerCase() as RoleTab) || 'all';
  const initialUserParam = searchParams.get('user') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allTransactions, setAllTransactions] = useState<EnrichedTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<RoleTab>(
    ['all', 'student', 'school', 'parent', 'agent', 'store'].includes(initialRoleParam)
      ? initialRoleParam
      : 'all'
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState(initialUserParam);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal / Receipt state
  const [selectedTxn, setSelectedTxn] = useState<EnrichedTransaction | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateString);
    }
  };

  const getTxType = (tx?: EnrichedTransaction | null): string => {
    if (!tx) return 'Transfer';
    const raw = tx as Record<string, unknown>;
    return String(tx.transactionType || raw.type || raw.category || 'Transfer');
  };

  const getTxStatus = (tx?: EnrichedTransaction | null): string => {
    if (!tx) return 'Successful';
    return String(tx.status || 'Successful');
  };

  const getTxDirection = (tx?: EnrichedTransaction | null): string => {
    if (!tx) return 'debit';
    const raw = tx as Record<string, unknown>;
    return String(tx.direction || raw.category || 'debit');
  };

  const fetchTransactionsData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [txData, usersData, parentsData, studentsData, schoolsData] = await Promise.all([
        getAllTransactionsForAdmin(),
        getAllUsers().catch(() => [] as UserData[]),
        getAllParents().catch(() => [] as UserData[]),
        getAllStudents().catch(() => [] as Kid[]),
        getAllSchools().catch(() => ({ data: [], schools: [] } as SchoolsResponse))
      ]);

      // Create multi-key user lookup maps (school/store/agent/parent accounts)
      const userById = new Map<string, UserData['user']>();
      const userByEmail = new Map<string, UserData['user']>();
      const userByWallet = new Map<string, UserData['user']>();
      const userByPhone = new Map<string, UserData['user']>();

      const indexUser = (usr: UserData['user']) => {
        if (!usr) return;
        if (usr._id) userById.set(usr._id, usr);
        if (usr.email) userByEmail.set(usr.email.toLowerCase(), usr);
        if (usr.phone) userByPhone.set(usr.phone, usr);
        if (usr.accountNumber) userByWallet.set(usr.accountNumber, usr);
        if (usr.wallet?.walletId) userByWallet.set(usr.wallet.walletId, usr);
        const usrAny = usr as unknown as Record<string, unknown>;
        if (usrAny.storeId) userById.set(String(usrAny.storeId), usr);
        if (usrAny.id) userById.set(String(usrAny.id), usr);
      };

      // getAllUsers returns flat objects (the user IS the root, not nested under .user)
      // Handle both {user: {...}} wrapped shape and flat {_id, email, name, ...} shape
      const indexUserData = (u: UserData) => {
        if (u.user) {
          // Wrapped shape: { user: { _id, email, ... } }
          indexUser(u.user);
        } else {
          // Flat shape: { _id, email, name, role, ... } — cast the whole object as User
          const flat = u as unknown as UserData['user'];
          if (flat && (flat._id || flat.email)) {
            indexUser(flat);
          }
        }
      };

      usersData.forEach(indexUserData);
      parentsData.forEach((u) => indexUser(u.user));

      // Dedicated student lookup maps keyed by _id, studentId, student_id, id, email, name, phone
      const studentById = new Map<string, Kid>();
      const studentByEmail = new Map<string, Kid>();
      const studentByName = new Map<string, Kid>();

      const indexKid = (kid: Kid) => {
        const kidAny = kid as unknown as Record<string, unknown>;
        if (kid._id) studentById.set(kid._id, kid);
        if (kid.student_id && kid.student_id !== kid._id) studentById.set(kid.student_id, kid);
        if (kid.id && kid.id !== kid._id && kid.id !== kid.student_id) studentById.set(kid.id, kid);
        if (kidAny.studentId && typeof kidAny.studentId === 'string') studentById.set(kidAny.studentId as string, kid);
        if (kidAny.admissionNumber && typeof kidAny.admissionNumber === 'string') studentById.set(kidAny.admissionNumber as string, kid);
        if (kid.email) studentByEmail.set(kid.email.toLowerCase(), kid);
        // Only index by name if it's a real, non-generic name (avoid polluting map with "Unknown Student")
        const GENERIC_NAMES = new Set(['unknown student', 'unknown', 'unnamed', 'unnamed student', '']);
        if (kid.name && !GENERIC_NAMES.has(kid.name.toLowerCase().trim())) {
          studentByName.set(kid.name.toLowerCase().trim(), kid);
        }
        const fullNameStr = typeof kidAny.fullName === 'string' ? kidAny.fullName : '';
        if (fullNameStr && !GENERIC_NAMES.has(fullNameStr.toLowerCase().trim())) {
          studentByName.set(fullNameStr.toLowerCase().trim(), kid);
        }
      };

      studentsData.forEach(indexKid);

      // Dedicated store lookup maps
      const storeById = new Map<string, Store>();
      const storeByEmail = new Map<string, Store>();
      const storeByName = new Map<string, Store>();

      const indexStore = (store: Store) => {
        const s = store as unknown as Record<string, unknown>;
        if (store._id) storeById.set(store._id, store);
        if (s.id && typeof s.id === 'string') storeById.set(s.id, store);
        if (s.storeId && typeof s.storeId === 'string') storeById.set(s.storeId, store);
        if (s.store_id && typeof s.store_id === 'string') storeById.set(s.store_id, store);
        if (store.email) storeByEmail.set(store.email.toLowerCase(), store);
        if (s.accountNumber && typeof s.accountNumber === 'string') storeById.set(s.accountNumber, store);
        if (store.storeName) storeByName.set(store.storeName.toLowerCase().trim(), store);
      };

      // Index stores from usersData where role is store (handle both wrapped and flat shapes)
      usersData.forEach((u) => {
        const usr = u.user || (u as unknown as UserData['user']); // handle flat shape
        if (usr && (usr.role?.toLowerCase() === 'store' || usr.storeName)) {
          indexStore(usr as unknown as Store);
        }
      });

      // Fetch and index stores AND students from each school
      const schoolList = (schoolsData as SchoolsResponse).data ?? (schoolsData as SchoolsResponse).schools ?? [];
      if (Array.isArray(schoolList)) {
        await Promise.allSettled(
          schoolList.map(async (school) => {
            const schoolId = school.schoolId || school.school_id || school._id;
            if (!schoolId) return;
            try {
              const [stores, studentsRes] = await Promise.all([
                getStoresInSchoolByAdmin(schoolId).catch(() => [] as Store[]),
                getStudentsInSchoolByAdmin(schoolId).catch(() => ({ data: [] } as StudentsInSchoolResponse))
              ]);

              if (Array.isArray(stores)) {
                stores.forEach(indexStore);
              }

              const schoolStudents = (studentsRes as StudentsInSchoolResponse).data ?? (studentsRes as StudentsInSchoolResponse).students ?? [];
              if (Array.isArray(schoolStudents)) {
                schoolStudents.forEach((st) => {
                  const s = st as unknown as Record<string, unknown>;
                  const name = extractStudentName(s);
                  const email = extractStudentEmail(s);
                  const kidObj: Kid = {
                    id: String(s.studentId || st._id || st.student_id || st.admissionNumber || email),
                    student_id: String(st.student_id || s.studentId || st._id || ''),
                    _id: String(st._id || s.studentId || ''),
                    name: name,
                    email: email,
                    isBeneficiary: false,
                    avatar: (name && name[0]) || 'S'
                  };
                  indexKid(kidObj);
                });
              }
            } catch {
              // Ignore individual school fetch errors
            }
          })
        );
      }

      // Enrich transactions with user details and roles
      const enriched: EnrichedTransaction[] = txData.map((tx, idx) => {
        const rawTx = tx as Record<string, unknown>;
        const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0)) || 0;

        // Extract nested objects if present
        const nestedUser = typeof rawTx.user === 'object' && rawTx.user !== null ? (rawTx.user as Record<string, unknown>) : undefined;
        const nestedStudent = typeof rawTx.student === 'object' && rawTx.student !== null ? (rawTx.student as Record<string, unknown>) : undefined;
        const nestedStore = typeof rawTx.store === 'object' && rawTx.store !== null ? (rawTx.store as Record<string, unknown>) : undefined;
        const nestedSender = typeof rawTx.sender === 'object' && rawTx.sender !== null ? (rawTx.sender as Record<string, unknown>) : undefined;
        const nestedRecipient = typeof rawTx.recipient === 'object' && rawTx.recipient !== null ? (rawTx.recipient as Record<string, unknown>) : undefined;
        const nestedCustomer = typeof rawTx.customer === 'object' && rawTx.customer !== null ? (rawTx.customer as Record<string, unknown>) : undefined;
        const nestedWallet = typeof rawTx.senderWalletId === 'object' && rawTx.senderWalletId !== null ? (rawTx.senderWalletId as Record<string, unknown>) : undefined;
        const nestedRecvWallet = typeof rawTx.receiverWalletId === 'object' && rawTx.receiverWalletId !== null ? (rawTx.receiverWalletId as Record<string, unknown>) : undefined;
        const nestedMeta = typeof rawTx.metadata === 'object' && rawTx.metadata !== null ? (rawTx.metadata as Record<string, unknown>) : undefined;

        // Candidate identifiers — include student and store specific ID fields
        const candidateId = String(
          rawTx.userId ||
          rawTx.studentId ||
          rawTx.student_id ||
          rawTx.storeId ||
          rawTx.store_id ||
          rawTx.agentId ||
          rawTx.agent_id ||
          (typeof rawTx.user === 'string' ? rawTx.user : '') ||
          (typeof rawTx.customer === 'string' ? rawTx.customer : '') ||
          (typeof rawTx.senderId === 'string' ? rawTx.senderId : '') ||
          (typeof rawTx.recipientId === 'string' ? rawTx.recipientId : '') ||
          (typeof rawTx.receiverId === 'string' ? rawTx.receiverId : '') ||
          (typeof rawTx.store === 'string' ? rawTx.store : '') ||
          nestedStudent?.studentId ||
          nestedStudent?._id ||
          nestedStudent?.id ||
          nestedStore?._id ||
          nestedStore?.id ||
          nestedStore?.storeId ||
          nestedUser?._id ||
          nestedUser?.userId ||
          nestedCustomer?._id ||
          nestedSender?._id ||
          nestedRecipient?._id ||
          nestedRecipient?.storeId ||
          ''
        );

        const candidateEmail = String(
          rawTx.email ||
          rawTx.userEmail ||
          rawTx.studentEmail ||
          rawTx.storeEmail ||
          rawTx.customerEmail ||
          rawTx.senderEmail ||
          rawTx.recipientEmail ||
          rawTx.receiverEmail ||
          nestedStudent?.email ||
          nestedStore?.email ||
          nestedUser?.email ||
          nestedCustomer?.email ||
          nestedSender?.email ||
          nestedRecipient?.email ||
          nestedWallet?.email ||
          nestedRecvWallet?.email ||
          nestedMeta?.email ||
          nestedMeta?.customerEmail ||
          nestedMeta?.studentEmail ||
          nestedMeta?.storeEmail ||
          ''
        ).toLowerCase();

        const candidateWallet = String(
          (typeof rawTx.senderWalletId === 'string' ? rawTx.senderWalletId : '') ||
          (typeof rawTx.receiverWalletId === 'string' ? rawTx.receiverWalletId : '') ||
          rawTx.accountNumber ||
          rawTx.senderAccountNumber ||
          rawTx.receiverAccountNumber ||
          nestedWallet?.walletId ||
          nestedWallet?.accountNumber ||
          nestedRecvWallet?.walletId ||
          nestedRecvWallet?.accountNumber ||
          ''
        );

        const candidateName = String(
          rawTx.studentName ||
          rawTx.storeName ||
          rawTx.userName ||
          rawTx.customerName ||
          rawTx.accountName ||
          rawTx.senderName ||
          rawTx.recipientName ||
          rawTx.name ||
          nestedStudent?.name ||
          nestedStudent?.fullName ||
          nestedStore?.storeName ||
          nestedCustomer?.name ||
          ''
        ).toLowerCase().trim();

        // Find matching student
        const matchedStudent =
          (candidateId ? studentById.get(candidateId) : undefined) ||
          (candidateEmail ? studentByEmail.get(candidateEmail) : undefined) ||
          (candidateName ? studentByName.get(candidateName) : undefined);

        // Find matching store
        const matchedStore =
          (candidateId ? storeById.get(candidateId) : undefined) ||
          (candidateEmail ? storeByEmail.get(candidateEmail) : undefined) ||
          (candidateName ? storeByName.get(candidateName) : undefined);

        // Find matching non-student user from indices
        const matchedUser =
          (candidateId ? userById.get(candidateId) : undefined) ||
          (candidateEmail ? userByEmail.get(candidateEmail) : undefined) ||
          (candidateWallet ? userByWallet.get(candidateWallet) : undefined);

        // Inferred Role — check store and student fields accurately
        const isStore = Boolean(
          matchedStore ||
          nestedStore ||
          rawTx.storeId ||
          rawTx.store_id ||
          rawTx.storeName ||
          rawTx.store ||
          (typeof rawTx.role === 'string' && rawTx.role.toLowerCase() === 'store') ||
          (typeof rawTx.userRole === 'string' && rawTx.userRole.toLowerCase() === 'store') ||
          matchedUser?.role?.toLowerCase() === 'store'
        );

        const isStudent = !isStore && Boolean(
          matchedStudent ||
          nestedStudent ||
          rawTx.studentId ||
          rawTx.student_id ||
          rawTx.studentName ||
          rawTx.studentEmail ||
          (typeof rawTx.role === 'string' && rawTx.role.toLowerCase() === 'student') ||
          (typeof rawTx.userRole === 'string' && rawTx.userRole.toLowerCase() === 'student') ||
          matchedUser?.role?.toLowerCase() === 'student'
        );

        const inferredRole = isStore
          ? 'store'
          : isStudent
            ? 'student'
            : (
                rawTx.role ||
                rawTx.userRole ||
                nestedUser?.role ||
                matchedUser?.role ||
                (rawTx.agent || rawTx.agentId ? 'agent' : undefined) ||
                (rawTx.schoolId ? 'school' : undefined) ||
                (rawTx.parentId ? 'parent' : undefined) ||
                // Only infer student when we actually have a matched student
                (matchedStudent ? 'student' : undefined) ||
                'other'
              ) as string;

        // Resolved student name — only use matchedStudent if we actually matched by ID or email, not by name
        // (name-based matching is too broad and can return the wrong student)
        const matchedStudentById =
          (candidateId ? studentById.get(candidateId) : undefined) ||
          (candidateEmail ? studentByEmail.get(candidateEmail) : undefined);

        const studentName =
          (nestedStudent?.name as string) ||
          (nestedStudent ? `${nestedStudent.firstName || ''} ${nestedStudent.lastName || ''}`.trim() : undefined) ||
          (nestedStudent?.fullName as string) ||
          (rawTx.studentName as string) ||
          matchedStudentById?.name ||
          undefined;

        // Resolved store name
        const storeName =
          matchedStore?.storeName ||
          (nestedStore?.storeName as string) ||
          (rawTx.storeName as string) ||
          (typeof rawTx.store === 'string' ? rawTx.store : undefined) ||
          (matchedUser?.storeName as string) ||
          undefined;

        // Resolved Display Name
        const resolvedName =
          (isStore ? storeName : undefined) ||
          (isStudent ? studentName : undefined) ||
          studentName ||
          storeName ||
          (rawTx.userName as string) ||
          (nestedUser?.name as string) ||
          (nestedUser ? `${nestedUser.firstName || ''} ${nestedUser.lastName || ''}`.trim() : undefined) ||
          (nestedCustomer?.name as string) ||
          (nestedSender?.name as string) ||
          (nestedRecipient?.name as string) ||
          (rawTx.customerName as string) ||
          (rawTx.senderName as string) ||
          (rawTx.recipientName as string) ||
          (rawTx.accountName as string) ||
          (rawTx.schoolName as string) ||
          matchedUser?.name ||
          (matchedUser ? `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim() : undefined) ||
          (matchedUser?.schoolName as string) ||
          'Unknown User';

        // Resolved Display Email
        const resolvedEmail =
          (isStore ? (matchedStore?.email || (rawTx.storeEmail as string)) : undefined) ||
          (isStudent ? (matchedStudentById?.email || (rawTx.studentEmail as string)) : undefined) ||
          matchedStudentById?.email ||
          matchedStore?.email ||
          (nestedStudent?.email as string) ||
          (nestedStore?.email as string) ||
          (rawTx.studentEmail as string) ||
          (rawTx.storeEmail as string) ||
          (matchedUser?.email as string) ||
          '';

        return {
          ...tx,
          _id: tx._id || `tx-${idx}`,
          amount: rawAmount,
          displayAmount: rawAmount,
          userRole: inferredRole.toLowerCase(),
          userName: resolvedName,
          userEmail: resolvedEmail,
          displayDate: formatDate(tx.createdAt || tx.date),
          status: tx.status || 'Successful',
          reference: tx.reference || (rawTx.reference as string) || (rawTx.transactionId as string) || `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        };
      });

      setAllTransactions(enriched);
    } catch (error) {
      console.error('Error loading admin transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allTransactions.length,
      student: allTransactions.filter(t => (t.userRole || '').toLowerCase() === 'student').length,
      school: allTransactions.filter(t => (t.userRole || '').toLowerCase() === 'school').length,
      parent: allTransactions.filter(t => (t.userRole || '').toLowerCase() === 'parent').length,
      agent: allTransactions.filter(t => (t.userRole || '').toLowerCase() === 'agent').length,
      store: allTransactions.filter(t => (t.userRole || '').toLowerCase() === 'store').length,
    };
  }, [allTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Role tab filter
      if (activeTab !== 'all' && (tx.userRole || '').toLowerCase() !== activeTab) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRef = String(tx.reference || '').toLowerCase().includes(query);
        const matchesName = String(tx.userName || '').toLowerCase().includes(query);
        const matchesEmail = String(tx.userEmail || '').toLowerCase().includes(query);
        const matchesDesc = String(tx.description || '').toLowerCase().includes(query);
        const matchesType = getTxType(tx).toLowerCase().includes(query);
        const matchesAmount = String(tx.amount).includes(query);

        if (!matchesRef && !matchesName && !matchesEmail && !matchesDesc && !matchesType && !matchesAmount) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const normStatus = getTxStatus(tx).toLowerCase();
        if (normStatus !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all') {
        const normType = (getTxType(tx) + ' ' + getTxDirection(tx)).toLowerCase();
        if (!normType.includes(typeFilter.toLowerCase())) {
          return false;
        }
      }

      // Date Range Filter
      if (fromDate) {
        const txTime = new Date(tx.createdAt || tx.date || '').getTime();
        const fromTime = new Date(fromDate).getTime();
        if (txTime < fromTime) return false;
      }

      if (toDate) {
        const txTime = new Date(tx.createdAt || tx.date || '').getTime();
        const toTime = new Date(toDate).setHours(23, 59, 59, 999);
        if (txTime > toTime) return false;
      }

      return true;
    });
  }, [allTransactions, activeTab, searchTerm, statusFilter, typeFilter, fromDate, toDate]);

  // Stats Analytics
  const stats = useMemo(() => {
    const totalVolume = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const successful = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'successful' || (t.status || '').toLowerCase() === 'success');
    const pending = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'pending');
    const failed = filteredTransactions.filter(t => ['failed', 'declined', 'cancelled'].includes((t.status || '').toLowerCase()));

    const successVolume = successful.reduce((acc, t) => acc + (t.amount || 0), 0);

    return {
      totalVolume,
      totalCount: filteredTransactions.length,
      successCount: successful.length,
      successVolume,
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }, [filteredTransactions]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const currentTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, statusFilter, typeFilter, fromDate, toDate, itemsPerPage]);

  // CSV Export
  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const headers = [
      'Transaction Reference',
      'Date & Time',
      'User Name',
      'User Role',
      'User Email',
      'Transaction Type',
      'Direction',
      'Amount (NGN)',
      'Charges (NGN)',
      'Status',
      'Description'
    ];

    const rows = filteredTransactions.map((t) => [
      t.reference || '',
      t.displayDate || formatDate(t.createdAt),
      t.userName || 'N/A',
      t.userRole || 'N/A',
      t.userEmail || 'N/A',
      t.transactionType || t.type || 'Transaction',
      t.direction || 'debit',
      t.amount || 0,
      t.charges || 0,
      t.status || 'Successful',
      t.description || ''
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `admin-transactions-${activeTab}-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyReference = (ref?: string) => {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getStatusBadge = (status?: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'successful' || norm === 'success' || norm === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Successful
        </span>
      );
    }
    if (norm === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          <Clock size={12} className="mr-1" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        <XCircle size={12} className="mr-1" />
        {status || 'Failed'}
      </span>
    );
  };

  const getRoleBadge = (role?: string) => {
    const roleColors: Record<string, string> = {
      student: 'bg-blue-100 text-blue-800',
      school: 'bg-cyan-100 text-cyan-800',
      parent: 'bg-pink-100 text-pink-800',
      agent: 'bg-emerald-100 text-emerald-800',
      store: 'bg-amber-100 text-amber-800',
      admin: 'bg-purple-100 text-purple-800',
    };
    const norm = (role || 'student').toLowerCase();
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${roleColors[norm] || 'bg-gray-100 text-gray-800'}`}>
        {role || 'User'}
      </span>
    );
  };

  const tabs: Array<{ id: RoleTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'all', label: 'All Transactions', icon: Users },
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'school', label: 'School', icon: Building2 },
    { id: 'parent', label: 'Parent', icon: User },
    { id: 'agent', label: 'Agent', icon: Shield },
    { id: 'store', label: 'Store', icon: StoreIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeMenu={activeMenu}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <ArrowLeftRight size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Transactions</h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                      Monitor and audit all student, school, parent, agent, and store financial activities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchTransactionsData}
                  disabled={refreshing}
                  className="bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center shadow-sm transition"
                  title="Refresh transaction records"
                >
                  <RefreshCw size={16} className={`mr-1.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={filteredTransactions.length === 0}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Download size={16} className="mr-2" />
                  Export CSV ({filteredTransactions.length})
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalVolume)}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <span>Total Records:</span>
                  <span className="font-semibold text-gray-800">{stats.totalCount}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Successful Volume</p>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {stats.successCount}
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(stats.successVolume)}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <span>Success Rate:</span>
                  <span className="font-semibold text-green-700">
                    {stats.totalCount > 0 ? Math.round((stats.successCount / stats.totalCount) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700">Pending Transactions</p>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {stats.pendingCount}
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pendingCount}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <span>Requires Attention</span>
                  <span className="text-xs text-yellow-600 font-medium">{stats.pendingCount > 0 ? 'Pending action' : 'All clear'}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Failed / Cancelled</p>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {stats.failedCount}
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-1">{stats.failedCount}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <span>Failure Rate:</span>
                  <span className="font-semibold text-red-700">
                    {stats.totalCount > 0 ? Math.round((stats.failedCount / stats.totalCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = tabCounts[tab.id];

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search */}
                <div className="md:col-span-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search ref, user, email, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="md:col-span-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="successful">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="md:col-span-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="transfer">Transfer</option>
                    <option value="withdraw">Withdrawal</option>
                    <option value="fee">School Fee</option>
                    <option value="credit">Credit / Deposit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>

                {/* From Date */}
                <div className="md:col-span-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full py-2 px-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    title="From Date"
                  />
                </div>

                {/* To Date */}
                <div className="md:col-span-2">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full py-2 px-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    title="To Date"
                  />
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Reference / ID
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User / Account
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-sm font-medium text-gray-600">Loading transactions data...</p>
                        </td>
                      </tr>
                    ) : currentTransactions.length > 0 ? (
                      currentTransactions.map((tx) => {
                        const direction = getTxDirection(tx).toLowerCase();
                        const isCredit = direction === 'credit' || getTxType(tx).toLowerCase().includes('deposit');

                        return (
                          <tr key={tx._id || tx.reference} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-mono text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                                <span>{tx.reference || 'N/A'}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyReference(tx.reference)}
                                  className="text-gray-400 hover:text-gray-700 transition"
                                  title="Copy Reference"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                                {tx.description ? String(tx.description) : 'Transaction'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{tx.userName ? String(tx.userName) : 'Platform User'}</div>
                              <div className="text-xs text-gray-500">{tx.userEmail ? String(tx.userEmail) : 'No email'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getRoleBadge(tx.userRole)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                              {getTxType(tx)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
                                {isCredit ? '+' : ''}{formatCurrency(tx.amount)}
                              </span>
                              {Boolean(tx.charges) && (
                                <div className="text-xs text-gray-400">
                                  Fee: {formatCurrency(tx.charges)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(getTxStatus(tx))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar size={12} className="mr-1 text-gray-400" />
                                {tx.displayDate || formatDate(tx.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => setSelectedTxn(tx)}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-semibold text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition"
                              >
                                <Eye size={14} />
                                Receipt
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-14 text-center">
                          <ArrowLeftRight size={44} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-semibold text-gray-800">No transactions found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters, search term, or role tab.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar with Page Size Dropdown */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                      <span className="font-semibold">
                        {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                      </span> of{' '}
                      <span className="font-semibold">{filteredTransactions.length}</span> transactions
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Rows per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md text-xs px-2 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border text-gray-700 border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) {
                            pageNum = currentPage - 3 + i;
                          }
                          if (currentPage > totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          }
                        }
                        return pageNum <= totalPages ? (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded-md text-sm transition ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ) : null;
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Modal */}
          {selectedTxn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                      <ArrowLeftRight size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">Transaction Receipt</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTxn(null)}
                    className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none"
                  >
                    ×
                  </button>
                </div>

                <div ref={receiptRef} className="p-6 space-y-6">
                  {/* XPAY Receipt Header */}
                  <div className="text-center pb-4 border-b border-dashed border-gray-200">
                    <div className="flex justify-center mb-3">
                      <img src="/xpay.jpeg" alt="XPAY Logo" className="h-14 w-auto object-contain rounded-xl" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Transaction Receipt</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Transaction Amount</p>
                    <p className="text-3xl font-extrabold text-blue-700 mt-1">
                      {formatCurrency(selectedTxn.amount)}
                    </p>
                    <div className="mt-2 flex justify-center">
                      {getStatusBadge(selectedTxn.status)}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Reference:</span>
                      <span className="font-mono font-medium text-gray-900">{selectedTxn.reference}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">User Account:</span>
                      <span className="font-medium text-gray-900">{selectedTxn.userName ? String(selectedTxn.userName) : 'Platform User'}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Role:</span>
                      <span>{getRoleBadge(selectedTxn.userRole)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900">{selectedTxn.userEmail ? String(selectedTxn.userEmail) : 'N/A'}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {getTxType(selectedTxn)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Service Fee:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedTxn.charges)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Date & Time:</span>
                      <span className="text-gray-900">{selectedTxn.displayDate || formatDate(selectedTxn.createdAt)}</span>
                    </div>

                    <div className="py-1">
                      <span className="text-gray-500 block mb-1">Description / Note:</span>
                      <p className="p-2.5 bg-gray-50 rounded-lg text-xs text-gray-700 font-medium">
                        {selectedTxn.description ? String(selectedTxn.description) : 'No additional note provided.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-100 text-center">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Official XPAY Digital Receipt</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => handleCopyReference(selectedTxn.reference)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-semibold hover:text-blue-600 transition"
                  >
                    <Copy size={14} />
                    {copySuccess ? 'Copied Reference!' : 'Copy Ref'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintReceipt}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition"
                    >
                      <Printer size={14} />
                      Print
                    </button>

                    <button
                      onClick={() => setSelectedTxn(null)}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Transactions;
