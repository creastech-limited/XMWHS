import { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import axios from 'axios';

interface UserWallet {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
  type: string;
  email: string;
  walletName: string;
  lastTransactionAmount: number;
  lastTransactionType: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastTransaction: string;
}

interface DisplayWallet extends UserWallet {
  formattedDate?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ITEMS_PER_PAGE = 10;

const UserWallets = () => {
  const { user: authUser } = useAuth() ?? {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('user-wallets');
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<DisplayWallet[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<DisplayWallet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  const token = authUser?.token || localStorage.getItem('token');

  const fetchUserWallets = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/getChargesWallets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('User wallets response:', response.data);
      
      let walletsData: UserWallet[] = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        walletsData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        walletsData = response.data.data;
      } else if (response.data && response.data.wallets && Array.isArray(response.data.wallets)) {
        walletsData = response.data.wallets;
      }

      const walletsWithFormatting: DisplayWallet[] = walletsData.map((wallet) => ({
        ...wallet,
        formattedDate: wallet.lastTransaction
          ? new Date(wallet.lastTransaction).toLocaleDateString('en-NG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'Never',
      }));

      console.log('Formatted wallets:', walletsWithFormatting);
      setWallets(walletsWithFormatting);
      setFilteredWallets(walletsWithFormatting);
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      setWallets([]);
      setFilteredWallets([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        if (!token || typeof token !== 'string') {
          setLoading(false);
          return;
        }

        await fetchUserWallets();
      } catch (error) {
        console.error('Error initializing user wallets:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [token, fetchUserWallets]);

  // Filter wallets based on search term and filters
  useEffect(() => {
    let filtered = wallets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((wallet) =>
        wallet.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.walletName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter - based on wallet type
    if (roleFilter !== 'all') {
      filtered = filtered.filter((wallet) => wallet.type === roleFilter);
    }

    setFilteredWallets(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, wallets]);

  const totalPages = Math.ceil(filteredWallets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWallets = filteredWallets.slice(startIndex, endIndex);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const totalWallets = wallets.length;
  const activeWallets = wallets.filter((w) => w.balance > 0).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserWallets();
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
              <p className="text-gray-700 font-medium">Loading user wallets...</p>
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
                  <Wallet className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Wallets</h1>
                    <p className="text-gray-600 text-sm mt-1">View and manage all user wallet balances</p>
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
                      <p className="text-gray-600 text-sm">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {showBalances ? `₦${totalBalance.toLocaleString('en-NG')}` : '₦••••••'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Wallets</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totalWallets}</p>
                    </div>
                    <Wallet className="w-8 h-8 text-blue-600 opacity-20" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Wallets</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{activeWallets}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
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
                    placeholder="Search by email, wallet name, or wallet ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Wallet Types</option>
                  <option value="charges">Charges</option>
                  <option value="user">User Wallet</option>
                  <option value="school">School</option>
                  <option value="store">Store</option>
                  <option value="agent">Agent</option>
                </select>

                {/* Show/Hide Balance Toggle */}
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-black"
                  title={showBalances ? 'Hide balances' : 'Show balances'}
                >
                  {showBalances ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Hide</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="text-sm font-medium">Show</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {currentWallets.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Wallet Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Wallet Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Balance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Last Transaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Transaction Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentWallets.map((wallet, index) => (
                          <tr key={wallet._id || index} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <Wallet className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">{wallet.email || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {wallet.firstName && wallet.lastName
                                ? `${wallet.firstName} ${wallet.lastName}`
                                : wallet.firstName || wallet.lastName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {wallet.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {String(wallet.type || 'N/A').charAt(0).toUpperCase() + String(wallet.type || 'N/A').slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {wallet.walletName || 'Main'}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {showBalances
                                ? `₦${(wallet.balance || 0).toLocaleString('en-NG')}`
                                : '₦••••••'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {wallet.formattedDate}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {wallet.lastTransactionType || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredWallets.length)} of{' '}
                      {filteredWallets.length} wallets
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center  text-black gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                    {searchTerm || roleFilter !== 'all'
                      ? 'No wallets match your filters'
                      : 'No user wallets found'}
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

export default UserWallets;