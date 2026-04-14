import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import { getAllCharges } from '../../services';
import type { Charge } from '../../types';

interface ChargeDisplayData extends Charge {
  formattedDate?: string;
  formattedUpdated?: string;
}

const ITEMS_PER_PAGE = 10;

const GetCharges = () => {
  const { user: authUser } = useAuth() ?? {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('get-charges');
  const [loading, setLoading] = useState(true);
  const [charges, setCharges] = useState<ChargeDisplayData[]>([]);
  const [filteredCharges, setFilteredCharges] = useState<ChargeDisplayData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chargeTypeFilter, setChargeTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCharges = useCallback(async () => {
    try {
      const token = authUser?.token || localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      const data = await getAllCharges();
      console.log('Charges data received:', data);
      console.log('Is array:', Array.isArray(data));
      console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
      
      const chargesWithFormatting: ChargeDisplayData[] = (Array.isArray(data) ? data : []).map((charge) => ({
        ...charge,
        formattedDate: charge.createdAt
          ? new Date(charge.createdAt as string).toLocaleDateString('en-NG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'N/A',
        formattedUpdated: charge.updatedAt
          ? new Date(charge.updatedAt as string).toLocaleDateString('en-NG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'N/A'
      }));

      console.log('Formatted charges:', chargesWithFormatting);
      setCharges(chargesWithFormatting);
      setFilteredCharges(chargesWithFormatting);
    } catch (error) {
      console.error('Error fetching charges:', error);
      setCharges([]);
      setFilteredCharges([]);
    } finally {
      setLoading(false);
    }
  }, [authUser?.token]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const token = authUser?.token || localStorage.getItem('token');

        if (!token || typeof token !== 'string') {
          setLoading(false);
          return;
        }

        await fetchCharges();
      } catch (error) {
        console.error('Error initializing charges:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [authUser?.token, fetchCharges]);

  // Filter charges based on search term and filters
  useEffect(() => {
    let filtered = charges;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((charge) =>
        charge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charge.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((charge) => charge.status === statusFilter);
    }

    // Charge type filter
    if (chargeTypeFilter !== 'all') {
      filtered = filtered.filter((charge) => charge.chargeType === chargeTypeFilter);
    }

    setFilteredCharges(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, chargeTypeFilter, charges]);

  const totalPages = Math.ceil(filteredCharges.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCharges = filteredCharges.slice(startIndex, endIndex);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCharges();
    setRefreshing(false);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
        <div className="flex-1 flex flex-col">
          <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <p className="text-gray-700 font-medium">Loading charges...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transaction Charges</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage all transaction charges and rates</p>
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

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Charges</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{charges.length}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-600 opacity-20" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Charges</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {charges.filter((c) => c.status === 'Active').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Inactive Charges</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {charges.filter((c) => c.status !== 'Active').length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by charge name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                {/* Charge Type Filter */}
                <select
                  value={chargeTypeFilter}
                  onChange={(e) => setChargeTypeFilter(e.target.value)}
                  className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Flat">Flat</option>
                  <option value="Percentage">Percentage</option>
                </select>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {currentCharges.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Charge Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentCharges.map((charge, index) => (
                          <tr key={charge._id || index} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <CreditCard className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">{charge.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {String(charge.chargeType)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                              {charge.chargeType === 'Flat' ? (
                                `₦${(Number(charge.amount) || 0).toLocaleString('en-NG')}`
                              ) : (
                                <div className="space-y-1">
                                  <div>T1: {String(charge.amount)}%</div>
                                  {charge.amount2 ? <div>T2: {String(charge.amount2)}%</div> : null}
                                  {charge.amount3 ? <div>T3: {String(charge.amount3)}%</div> : null}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {charge.description || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                  charge.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {charge.status === 'Active' ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <AlertCircle className="w-4 h-4" />
                                )}
                                {charge.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {charge.formattedDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredCharges.length)} of{' '}
                      {filteredCharges.length} charges
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center text-black gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                      </div>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center text-black gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                    {searchTerm || statusFilter !== 'all' || chargeTypeFilter !== 'all'
                      ? 'No charges match your filters'
                      : 'No charges found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GetCharges;