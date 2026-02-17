import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Sidebar as Asidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';

// Import services
import { getUserTransactions } from '../../services';

// Import types
import type { Transaction, TransactionsResponse } from '../../types/user';

const TransactionModule: React.FC = () => {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get authentication token
  const getAuthToken = useCallback((): string | null => {
    if (auth?.token) return auth.token;
    return localStorage.getItem('token');
  }, [auth?.token]);

  // Fetch transactions from API using service
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const data: TransactionsResponse = await getUserTransactions();

      if (data.success && data.data) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Initialize component
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Pagination Logic
  const getPaginatedTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return transactions.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  // Formatters
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  // Safe property access using Type Casting instead of 'any'
  const getTransactionName = (transaction: Transaction) => {
    if (transaction.senderWalletId && typeof transaction.senderWalletId === 'object') {
      return `${transaction.senderWalletId.firstName} ${transaction.senderWalletId.lastName}`;
    }
    if (transaction.receiverWalletId && typeof transaction.receiverWalletId === 'object') {
      return `${transaction.receiverWalletId.firstName} ${transaction.receiverWalletId.lastName}`;
    }
    return 'System Transaction';
  };
    
  const exportTransactions = () => {
    if (transactions.length === 0) return;

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,User,Transaction Type,Amount,Status,Date,Reference,Description\n' +
      transactions
        .map((t) => {
          const tType = (t.transactionType as string) || '';
          return `${t._id},${getTransactionName(t)},${tType},${t.amount},${t.status},${formatDate(t.createdAt)},${t.reference},"${t.description}"`;
        })
        .join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
    
  const getTransactionTypeColor = (transaction: Transaction) => {
    const isDebit = transaction.direction === 'debit' || 
                    transaction.transactionType?.toLowerCase().includes('debit') ||
                    transaction.amount < 0;
    
    if (isDebit) {
      return 'text-red-600'; // Red for debits
    } else {
      return 'text-green-600'; // Green for credits
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
     <Header PsettingsPage="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Asidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-hidden">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">Transaction Module</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-black">
                  History ({transactions.length})
                </h2>
                <div className="flex gap-2">
                  <button onClick={fetchTransactions} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                    {loading ? '...' : 'Refresh'}
                  </button>
                  <button onClick={exportTransactions} disabled={loading || transactions.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Export
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading...</div>
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
                                    <span className="capitalize">{transaction.transactionType?.replace(/_/g, ' ') || 'N/A'}</span>
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

                  {/* Pagination UI - Using variables to clear ESLint warnings */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="py-1">Page {currentPage} of {totalPages}</span>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default TransactionModule;