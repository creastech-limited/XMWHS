import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Receipt,
  Menu,
  X
} from 'lucide-react';

type Transaction = {
  _id: string;
  createdAt: string;
  reference: string;
  category: 'credit' | 'debit';
  description: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
};

type UserData = {
  username: string;
  email: string;
  balance: number;
  lastTransactions: Transaction[];
};

type TransactionStats = {
  totalTransactions: number;
  totalCredit: {
    success: number;
    pending: number;
  };
  totalDebit: {
    success: number;
    pending: number;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TransactionHistoryPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    username: "User",
    email: "",
    balance: 0,
    lastTransactions: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalCredit: {
      success: 0,
      pending: 0
    },
    totalDebit: {
      success: 0,
      pending: 0
    }
  });

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
  };

  const fetchWalletBalance = async (authToken: string): Promise<void> => {
    if (!authToken) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/getuserwallet`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.data) {
        const balance = response.data.data.balance || 0;
        setUserData(prev => ({
          ...prev,
          balance: balance
        }));
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setSnackbar({
        open: true,
        message: axios.isAxiosError(error) && error.response?.data?.message 
          ? error.response.data.message 
          : 'Failed to fetch wallet balance',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const authToken = getAuthToken();
      if (!authToken) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'You need to be logged in to access this page',
          severity: 'error'
        });
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.user) {
          const profile = response.data.user;
          
          setUserData({
            username: profile.data.firstName 
              ? `${profile.data.firstName} ${profile.data.lastName || ''}`
              : profile.data.name || profile.data.username || "User",
            balance: 0,
            email: profile.data.email || "",
            lastTransactions: profile.data.transactions || []
          });
          
          await fetchWalletBalance(authToken);
          fetchTransactions(authToken);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please try again.');
        setSnackbar({
          open: true,
          message: axios.isAxiosError(err) && err.response?.data?.message 
            ? err.response.data.message 
            : 'Failed to fetch user profile',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchTransactions = async (authToken: string): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      const data = response.data;
      
      if (data.success && data.data) {
        setTransactions(data.data);
        
        setTransactionStats({
          totalTransactions: data.data.length,
          totalCredit: {
            success: data.data
              .filter((t: Transaction) => t.category === 'credit' && t.status === 'success')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            pending: data.data
              .filter((t: Transaction) => t.category === 'credit' && t.status === 'pending')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          },
          totalDebit: {
            success: data.data
              .filter((t: Transaction) => t.category === 'debit' && t.status === 'success')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            pending: data.data
              .filter((t: Transaction) => t.category === 'debit' && t.status === 'pending')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          }
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setSnackbar({
        open: true,
        message: (axios.isAxiosError(err) && err.response?.data?.message) || 'Failed to load transactions',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleChangePage = (newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: string): void => {
    setRowsPerPage(parseInt(value, 10));
    setPage(0);
  };

  const handleFilterChange = (value: string): void => {
    setFilter(value);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') {
      return true;
    }
    else if (filter === 'success' && txn.status !== 'success') return false;
    else if (filter === 'pending' && txn.status !== 'pending') return false;
    else if (filter === 'credit' && txn.category !== 'credit') return false;
    else if (filter === 'debit' && txn.category !== 'debit') return false;
    
    if (searchTerm && !txn.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const renderStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    if (status === 'success') {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 flex items-center gap-1`}>
          <CheckCircle className="w-3 h-3" />
          Success
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800 flex items-center gap-1`}>
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-red-100 text-red-800 flex items-center gap-1`}>
        <XCircle className="w-3 h-3" />
        Failed
      </span>
    );
  };

  const renderTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    if (type === 'credit') {
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-800 flex items-center gap-1`}>
          <ArrowDown className="w-3 h-3" />
          Credit
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-gray-100 text-gray-800 flex items-center gap-1`}>
        <ArrowUp className="w-3 h-3" />
        Debit
      </span>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSnackbarClose = (): void => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header profilePath="/psettings" />

      <div className="flex flex-1 relative">
        {/* Sidebar - hidden on mobile */}
        <div className=" z-[100] fixed top-20 left-0 h-[calc(100vh-6rem)]">
          <Psidebar />
        </div>
        
        {/* Mobile sidebar toggle button */}
        <button 
          className="md:hidden fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg z-50"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileSidebarOpen(false)}
            ></div>
            <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl">
              <Psidebar />
            </div>
          </div>
        )}

        {/* Main content with reduced padding on mobile */}
        <main className="md:ml-65 flex-1 p-2 md:p-6 overflow-x-hidden">
          {/* User info card */}
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-medium text-gray-800">Welcome, {userData.username}</h2>
                <p className="text-xs md:text-sm text-gray-600">{userData.email}</p>
              </div>
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Wallet Balance</p>
                <p className="text-lg md:text-xl font-bold text-blue-700">₦{userData.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transaction history section */}
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <Receipt className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                <h1 className="text-lg md:text-xl font-bold text-gray-800">Transaction History</h1>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400 w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="text-sm md:text-base text-gray-600 pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <select
                  aria-label="Filter transactions"
                  className="text-sm md:text-base text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-auto"
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="all">All Transactions</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="credit">Credit Only</option>
                  <option value="debit">Debit Only</option>
                </select>
              </div>
            </div>

            {/* Stats Cards - single column on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
                <p className="text-xs md:text-sm font-medium text-blue-800">Total Transactions</p>
                <p className="text-lg md:text-xl font-bold text-blue-900">{transactionStats.totalTransactions}</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg shadow-sm">
                <p className="text-xs md:text-sm font-medium text-green-800">Total Credit</p>
                <p className="text-lg md:text-xl font-bold text-green-900">
                  ₦{transactionStats.totalCredit.success.toLocaleString()}
                </p>
                <p className="text-xs text-green-700">
                  Pending: ₦{transactionStats.totalCredit.pending.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg shadow-sm">
                <p className="text-xs md:text-sm font-medium text-red-800">Total Debit</p>
                <p className="text-lg md:text-xl font-bold text-red-900">
                  ₦{transactionStats.totalDebit.success.toLocaleString()}
                </p>
                <p className="text-xs text-red-700">
                  Pending: ₦{transactionStats.totalDebit.pending.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="block md:hidden bg-gray-50 px-2 py-1 text-xs text-gray-600 border-b border-gray-200">
              Scroll horizontally to view all columns
              </div>
              
  <div className="overflow-x-auto scrollbar-thin">
  <table className="w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
    {/* Increased minWidth to 800px to accommodate all columns */}
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
          Date
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
          Transaction ID
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
          Reference
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
          Type
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Description
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
          Amount (₦)
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredTransactions.length > 0 ? (
        filteredTransactions
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((txn) => (
            <tr key={txn._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(txn.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 break-all">
                {txn._id}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {txn.reference}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {renderTypeBadge(txn.category)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {txn.description}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                txn.category === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {txn.category === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {renderStatusBadge(txn.status)}
              </td>
            </tr>
          ))
      ) : (
        <tr>
          <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
            <div className="flex flex-col items-center">
              <Receipt className="w-6 h-6 text-gray-300 mb-1" />
              <p>No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-2 bg-gray-50 p-2 md:p-3 rounded-lg">
              <div className="text-xs text-gray-700">
                Showing <span className="font-medium">{page * rowsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((page + 1) * rowsPerPage, filteredTransactions.length)}
                </span>{' '}
                of <span className="font-medium">{filteredTransactions.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChangePage(page - 1)}
                  disabled={page === 0}
                  className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm font-medium ${
                    page === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.ceil(filteredTransactions.length / rowsPerPage) })
                    .slice(Math.max(0, page - 2), Math.min(Math.ceil(filteredTransactions.length / rowsPerPage), page + 3))
                    .map((_, index) => {
                      const pageNumber = Math.max(0, page - 2) + index;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handleChangePage(pageNumber)}
                          className={`px-2 py-1 rounded text-xs md:text-sm ${
                            pageNumber === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNumber + 1}
                        </button>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => handleChangePage(page + 1)}
                  disabled={(page + 1) * rowsPerPage >= filteredTransactions.length}
                  className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm font-medium ${
                    (page + 1) * rowsPerPage >= filteredTransactions.length
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Next
                </button>
                
                <select
                  aria-label="Rows per page"
                  className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 md:px-3 md:py-1.5 bg-white"
                  value={rowsPerPage}
                  onChange={(e) => handleChangeRowsPerPage(e.target.value)}
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md mx-auto sm:mx-0 ${
          snackbar.severity === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          snackbar.severity === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          snackbar.severity === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium pr-2">{snackbar.message}</span>
            <button 
              onClick={handleSnackbarClose} 
              className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity" 
              title="Close notification" 
              aria-label="Close notification"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;