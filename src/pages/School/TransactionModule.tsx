import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Sidebar as Asidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';

// Import services
import { getUserTransactions } from '../../services';

// Import types
import type { Transaction, TransactionsResponse, SnackbarState } from '../../types/user';

const TransactionModule: React.FC = () => {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Get authentication token
  const getAuthToken = (): string | null => {
    // First check auth context
    if (auth?.token) {
      return auth.token;
    }
    // Fallback to localStorage
    return localStorage.getItem('token');
  };

  // Fetch transactions from API using service
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Using the service function
      const data: TransactionsResponse = await getUserTransactions();

      if (data.success && data.data) {
        setTransactions(data.data);
        setTotalPages(Math.ceil(data.data.length / itemsPerPage));
        console.log('Transactions fetched successfully:', data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setSnackbar({
        open: true,
        message: 'Failed to fetch transactions',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Get paginated transactions
  const getPaginatedTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transactions.slice(startIndex, endIndex);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  // Get transaction display name
  const getTransactionName = (transaction: Transaction) => {
    if (transaction.senderWalletId) {
      return `${transaction.senderWalletId.firstName} ${transaction.senderWalletId.lastName}`;
    }
    if (transaction.receiverWalletId) {
      return `${transaction.receiverWalletId.firstName} ${transaction.receiverWalletId.lastName}`;
    }
    return 'System Transaction';
  };
    
  
  // Export transactions to CSV
  const exportTransactions = () => {
    if (transactions.length === 0) {
      setSnackbar({
        open: true,
        message: 'No transactions to export',
        severity: 'warning',
      });
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,User,Transaction Type,Amount,Status,Date,Reference,Description\n' +
      transactions
        .map((t) => 
          `${t._id},${getTransactionName(t)},${t.transactionType},${t.amount},${t.status},${formatDate(t.createdAt)},${t.reference},"${t.description}"`
        )
        .join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({
      open: true,
      message: 'Transactions exported successfully!',
      severity: 'success',
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
   
  const getTransactionTypeColor = (transaction: Transaction) => {
    const isDebit = transaction.direction === 'debit' || 
                    transaction.transactionType.toLowerCase().includes('debit') ||
                    transaction.amount < 0;
    
    if (isDebit) {
      return 'text-red-600'; // Red for debits
    } else {
      return 'text-green-600'; // Green for credits
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header profilePath="/settings"/>
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Asidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-hidden">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
              Transaction Module
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              View and manage all fee transactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-black">
                  Transaction History ({transactions.length} total)
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={fetchTransactions}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200"
                  >
                    <svg
                      className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                  <button
                    onClick={exportTransactions}
                    disabled={loading || transactions.length === 0}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200 w-full md:w-auto"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Loading transactions...</span>
                </div>
              ) : (
                <>
                  {/* Scrollable table container */}
                  <div className="relative">
                    <div className="block md:hidden bg-gray-50 px-2 py-1 text-xs text-gray-600 border-b border-gray-200">
                      Scroll horizontally to view all columns
                    </div>
                    <div className="overflow-x-auto pb-2">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reference
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getPaginatedTransactions().length > 0 ? (
                              getPaginatedTransactions().map((transaction) => (
                                <tr key={transaction._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>
                                      <div className="font-medium">{getTransactionName(transaction)}</div>
                                      <div className="text-gray-500 text-xs">{transaction.description}</div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span className="capitalize">{transaction.transactionType.replace(/_/g, ' ')}</span>
                                    <div className="text-xs text-gray-500">{transaction.category}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                    <span className={getTransactionTypeColor(transaction)}>
                                      {formatCurrency(transaction.amount)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(transaction.status)}`}
                                    >
                                      {transaction.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(transaction.createdAt)}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {transaction.reference}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                                  No transactions found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Pagination */}
                  {transactions.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} entries
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 border rounded-md text-sm ${
                              currentPage === page
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Snackbar/Toast Notification */}
          {snackbar.open && (
            <div
              className={`fixed bottom-4 right-4 ${
                snackbar.severity === 'success' 
                  ? 'bg-green-600' 
                  : snackbar.severity === 'error' 
                  ? 'bg-red-600' 
                  : snackbar.severity === 'warning'
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              } text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 max-w-xs md:max-w-sm`}
            >
              <span className="text-sm">{snackbar.message}</span>
              <button
                onClick={() => setSnackbar({ ...snackbar, open: false })}
                className="ml-4 text-white focus:outline-none"
                title="Close notification"
                aria-label="Close notification"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default TransactionModule;