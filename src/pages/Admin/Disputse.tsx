import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
  Wallet,
  X
} from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import AdminSidebar from '../../components/Adminsidebar';
import { getAllDisputes, updateDisputeStatus } from '../../services';
import type { Dispute } from '../../types';

interface DisputeDisplayData extends Dispute {
  formattedCreatedAt?: string;
  formattedUpdatedAt?: string;
}

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = ['all', 'Pending', 'Under Investigation', 'Resolved', 'Closed'];
const TYPE_OPTIONS = ['all', 'Billing Issue', 'Account Discrepancy', 'Transaction Error', 'Service Concern', 'Other'];

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const formatDate = (value?: string): string => {
  if (!value) return 'N/A';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (value?: string): string => {
  if (!value) return 'N/A';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount?: number) => {
  const safeAmount = Number(amount) || 0;
  return `₦${safeAmount.toLocaleString('en-NG')}`;
};

const getStatusStyles = (status?: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Under Investigation':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'Pending':
      return <ClockIcon />;
    case 'Under Investigation':
      return <ShieldAlert className="h-4 w-4" />;
    case 'Resolved':
      return <CheckCircle className="h-4 w-4" />;
    case 'Closed':
      return <X className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const ClockIcon = () => <AlertCircle className="h-4 w-4" />;

const getTransactionLabel = (transactionId?: Dispute['transactionId']) => {
  if (!transactionId) return 'N/A';
  if (typeof transactionId === 'string') return transactionId;
  return transactionId.reference || transactionId._id || 'N/A';
};

const getTransactionDetails = (transactionId?: Dispute['transactionId']) => {
  if (!transactionId || typeof transactionId === 'string') return null;

  return {
    id: transactionId._id || 'N/A',
    reference: transactionId.reference || 'N/A',
    amount: formatCurrency(transactionId.amount),
    status: transactionId.status || 'N/A'
  };
};

const normalizeDisputes = (items: Dispute[]): DisputeDisplayData[] => {
  return items.map((dispute) => ({
    ...dispute,
    formattedCreatedAt: formatDate(dispute.createdAt),
    formattedUpdatedAt: formatDateTime(dispute.updatedAt)
  }));
};

const DisputePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('disputes');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<DisputeDisplayData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDisplayData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Update-status modal state
  const [updateTarget, setUpdateTarget] = useState<DisputeDisplayData | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      setError(null);
      const response = await getAllDisputes();
      const normalized = normalizeDisputes(Array.isArray(response) ? response : []);
      setDisputes(normalized);
    } catch (fetchError) {
      console.error('Error fetching disputes:', fetchError);
      setDisputes([]);
      setError('Unable to load disputes right now.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        await fetchDisputes();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [fetchDisputes]);

  const filteredDisputes = useMemo(() => {
    let list = [...disputes];

    if (searchTerm.trim()) {
      const query = normalizeText(searchTerm);
      list = list.filter((dispute) => {
        const transactionLabel = getTransactionLabel(dispute.transactionId);
        return (
          normalizeText(dispute._id).includes(query) ||
          normalizeText(dispute.disputeType).includes(query) ||
          normalizeText(dispute.description).includes(query) ||
          normalizeText(dispute.paymentCategory).includes(query) ||
          normalizeText(dispute.status).includes(query) ||
          normalizeText(dispute.raisedByName).includes(query) ||
          normalizeText(dispute.raisedByEmail).includes(query) ||
          normalizeText(transactionLabel).includes(query)
        );
      });
    }

    if (statusFilter !== 'all') {
      list = list.filter((dispute) => dispute.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      list = list.filter((dispute) => dispute.disputeType === typeFilter);
    }

    return list;
  }, [disputes, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDisputes.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDisputes = filteredDisputes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = disputes.length;
    const pending = disputes.filter((d) => d.status === 'Pending').length;
    const investigating = disputes.filter((d) => d.status === 'Under Investigation').length;
    const resolved = disputes.filter((d) => d.status === 'Resolved').length;
    const closed = disputes.filter((d) => d.status === 'Closed').length;
    const totalAmount = disputes.reduce((sum, dispute) => sum + (Number(dispute.amount) || 0), 0);

    return { total, pending, investigating, resolved, closed, totalAmount };
  }, [disputes]);

  const uniqueTypes = useMemo(() => {
    const types = disputes
      .map((dispute) => dispute.disputeType)
      .filter((type): type is string => Boolean(type && type.trim()));
    return Array.from(new Set(types));
  }, [disputes]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDisputes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenDetails = (dispute: DisputeDisplayData) => {
    setSelectedDispute(dispute);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDispute(null);
  };

  const handleOpenUpdate = (dispute: DisputeDisplayData) => {
    setUpdateTarget(dispute);
    setNewStatus(dispute.status || 'Pending');
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleCloseUpdate = () => {
    setUpdateTarget(null);
    setNewStatus('');
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleSubmitUpdate = async () => {
    if (!updateTarget?._id || !newStatus) return;
    try {
      setUpdating(true);
      setUpdateError(null);
      await updateDisputeStatus(updateTarget._id, newStatus);
      setUpdateSuccess('Status updated successfully!');
      // Refresh list
      await fetchDisputes();
      // Close modal after brief pause
      setTimeout(() => {
        handleCloseUpdate();
      }, 1200);
    } catch (err) {
      console.error('Failed to update dispute status:', err);
      setUpdateError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <div className="flex-1 flex flex-col">
          <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <p className="text-gray-700 font-medium">Loading disputes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
                    <p className="text-gray-600 text-sm mt-1">
                      View, search, and manage all disputes raised across the app
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Disputes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Investigating</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{stats.investigating}</p>
                    </div>
                    <ShieldAlert className="w-8 h-8 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Resolved</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
                    </div>
                    <Wallet className="w-8 h-8 text-purple-600 opacity-20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="relative xl:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by dispute ID, user, type, status, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter disputes by status"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All Statuses' : option}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter disputes by type"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {['all', ...uniqueTypes.length ? uniqueTypes : TYPE_OPTIONS.filter((option) => option !== 'all')].map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All Types' : option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </button>

                <p className="text-sm text-gray-600">
                  Showing {filteredDisputes.length} of {disputes.length} disputes
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {currentDisputes.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Dispute
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Raised By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentDisputes.map((dispute, index) => (
                          <tr key={dispute._id || index} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">
                                  #{dispute._id?.slice(-8) || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600 max-w-sm line-clamp-2">
                                  {dispute.description || 'No description provided'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span>{dispute.raisedByName || 'Unknown User'}</span>
                                </div>
                                <p className="text-xs text-gray-500">{dispute.raisedByEmail || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {dispute.disputeType || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {dispute.paymentCategory || 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(dispute.amount)}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(
                                  dispute.status
                                )}`}
                              >
                                {getStatusIcon(dispute.status)}
                                {dispute.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {dispute.formattedCreatedAt || formatDate(dispute.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetails(dispute)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                                  title="View dispute details"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdate(dispute)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors text-sm"
                                  title="Update dispute status"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredDisputes.length)} of{' '}
                      {filteredDisputes.length} disputes
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <button
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <span className="text-sm text-gray-600 px-2">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No disputes match your filters'
                      : 'No disputes found'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Disputes raised in the app will appear here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showDetails && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
                <p className="text-sm text-gray-600">Review the dispute record and linked transaction info</p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Dispute ID</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{selectedDispute._id || 'N/A'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(
                      selectedDispute.status
                    )}`}
                  >
                    {getStatusIcon(selectedDispute.status)}
                    {selectedDispute.status || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {selectedDispute.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Dispute Type</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDispute.disputeType || 'N/A'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Payment Category</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDispute.paymentCategory || 'N/A'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedDispute.amount)}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Created At</p>
                  <p className="text-sm text-gray-900">{selectedDispute.formattedCreatedAt || formatDate(selectedDispute.createdAt)}</p>
                </div>
              </div>

              {selectedDispute.updatedAt && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {selectedDispute.formattedUpdatedAt || formatDateTime(selectedDispute.updatedAt)}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-700 mb-3">Raised By</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedDispute.raisedByName || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedDispute.raisedByEmail || 'N/A'}</p>
                </div>
              </div>

              {selectedDispute.transactionId && (
                <div className="rounded-lg bg-purple-50 border border-purple-100 p-4">
                  <p className="text-xs uppercase tracking-wide text-purple-700 mb-3">Transaction Details</p>
                  {getTransactionDetails(selectedDispute.transactionId) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Transaction ID</p>
                        <p className="text-gray-900 font-medium break-all">
                          {getTransactionDetails(selectedDispute.transactionId)?.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Reference</p>
                        <p className="text-gray-900 font-medium break-all">
                          {getTransactionDetails(selectedDispute.transactionId)?.reference}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Amount</p>
                        <p className="text-gray-900 font-medium">
                          {getTransactionDetails(selectedDispute.transactionId)?.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Status</p>
                        <p className="text-gray-900 font-medium">
                          {getTransactionDetails(selectedDispute.transactionId)?.status}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {getTransactionLabel(selectedDispute.transactionId)}
                    </p>
                  )}
                </div>
              )}

              {selectedDispute.supportingDocuments && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Supporting Documents</p>
                  <div className="space-y-2">
                    {(Array.isArray(selectedDispute.supportingDocuments)
                      ? selectedDispute.supportingDocuments
                      : [selectedDispute.supportingDocuments]
                    )
                      .filter((doc): doc is string => Boolean(doc))
                      .map((doc, index) => (
                        <a
                          key={`${doc}-${index}`}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          Document {index + 1}
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {selectedDispute.resolvedBy || selectedDispute.resolvedDate ? (
                <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                  <p className="text-xs uppercase tracking-wide text-green-700 mb-3">Resolution</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-900">
                      Resolved by: {selectedDispute.resolvedBy?._id || selectedDispute.resolvedBy?.email || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      Resolved date: {selectedDispute.resolvedDate ? formatDateTime(selectedDispute.resolvedDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedDispute) handleOpenUpdate(selectedDispute);
                  handleCloseDetails();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Update Status
              </button>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Update Status Modal ── */}
      {updateTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Update Dispute Status</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  #{updateTarget._id?.slice(-8) || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseUpdate}
                disabled={updating}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Current status pill */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Current status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    getStatusStyles(updateTarget.status)
                  }`}
                >
                  {getStatusIcon(updateTarget.status)}
                  {updateTarget.status || 'N/A'}
                </span>
              </div>

              {/* New status select */}
              <div>
                <label
                  htmlFor="new-status-select"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  New Status
                </label>
                <select
                  id="new-status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900 bg-white disabled:opacity-60"
                >
                  {STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Feedback messages */}
              {updateError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {updateError}
                </div>
              )}
              {updateSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {updateSuccess}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseUpdate}
                disabled={updating}
                className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitUpdate}
                disabled={updating || !newStatus || newStatus === updateTarget.status}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputePage;
