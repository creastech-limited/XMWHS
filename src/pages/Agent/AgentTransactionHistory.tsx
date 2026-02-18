import { useState, useEffect, useCallback } from 'react';
import { ArrowDown, ArrowUp, Search, ChevronLeft, ChevronRight } from 'lucide-react'; // Added icons for pagination
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import AHeader from '../../components/AHeader';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/user';

// API Base URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Transaction = {
  id: number;
  type: 'credit' | 'transfer';
  amount: number;
  description: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
};

const AgentTransactionHistory = () => {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Handle authentication errors
  const handleAuthError = useCallback((message: string) => {
    setError(message);
    localStorage.removeItem('token');
    auth?.logout?.();
  }, [auth]);

  // Fetch user details from API
  const fetchUserDetails = useCallback(async (authToken: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const userData = data.user?.data || data.data || data.user || data;
      const walletData = data.user?.wallet || data.wallet || { balance: 0 };

      const profile: User = {
        _id: userData._id || '',
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
        email: userData.email || '',
        role: userData.role || '',
        status: userData.status || 'Active',
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        avatar: userData.avatar,
        profilePic: userData.profilePic,
        walletBalance: walletData.balance || 0,
        accountNumber: userData.accountNumber,
        withdrawalBank: userData.withdrawalBank,
        schoolId: userData.schoolId,
        schoolName: userData.schoolName,
        schoolCanTransfer: userData.schoolCanTransfer,
        ...userData
      };

      return profile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }, []);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async (authToken: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      let transactionList: unknown[] = [];
      if (data.transactions) transactionList = data.transactions;
      else if (data.data) transactionList = Array.isArray(data.data) ? data.data : [data.data];
      else if (Array.isArray(data)) transactionList = data;

      const transformedTransactions: Transaction[] = transactionList.map((txn, index: number) => {
        const t = txn as Record<string, unknown>;
        let transactionType: 'credit' | 'transfer' = 'credit';
        if (t.type === 'debit' || t.transactionType === 'debit' || t.category === 'debit' || (typeof t.amount === 'number' && t.amount < 0)) {
          transactionType = 'transfer';
        }

        const getTransactionDescription = (): string => {
          const metadata = t.metadata as { receiverEmail?: string; senderEmail?: string } | undefined;
          if (transactionType === 'transfer' && metadata?.receiverEmail) return `Transfer to ${metadata.receiverEmail}`;
          else if (transactionType === 'credit' && metadata?.senderEmail) return `Payment from ${metadata.senderEmail}`;
          else return (t.description as string) || (t.note as string) || 'Transaction';
        };

        return {
          id: (t.id as number) || (t._id as number) || index + 1,
          type: transactionType,
          amount: Math.abs((t.amount as number) || 0),
          description: getTransactionDescription(),
          date: (t.date as string) || (t.createdAt as string) || new Date().toISOString().split('T')[0],
          status: t.status as string | undefined,
          createdAt: t.createdAt as string | undefined,
          updatedAt: t.updatedAt as string | undefined,
        };
      });

      return transformedTransactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }, []);

  // Initialize authentication and fetch data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        if (auth?.user?._id && auth?.token) {
          setToken(auth.token);
          const transactionData = await fetchTransactions(auth.token);
          setTransactions(transactionData);
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('token');
        if (!storedToken) throw new Error('No authentication token found');

        const profile = await fetchUserDetails(storedToken);
        setToken(storedToken);
        auth?.login?.(profile, storedToken);
        const transactionData = await fetchTransactions(storedToken);
        setTransactions(transactionData);

      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth, fetchUserDetails, fetchTransactions, handleAuthError]);

  const retryFetch = async () => {
    if (token) {
      setLoading(true);
      setError(null);
      try {
        const transactionData = await fetchTransactions(token);
        setTransactions(transactionData);
        setCurrentPage(1); // Reset to page 1 on retry
      } catch {
        setError('Failed to load transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: scroll to top when changing page
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      <AHeader />

      <main className="text-gray-600 flex-grow">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {loading ? (
            <div>
              <div className="h-16 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="bg-white shadow-md rounded p-4">
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium">{error}</p>
                </div>
                <button
                  onClick={retryFetch}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-xl p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">All Transactions</h2>
                <Link
                  to="/agent/transactions"
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Search transactions"
                >
                  <Search className="w-5 h-5 text-blue-600" />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions found</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-50">
                    {currentTransactions.map((txn) => {
                      let iconColor = '';
                      let textColor = '';
                      let IconComponent = ArrowDown;
                      let sign = '+';

                      if (txn.status === 'failed' || txn.status === 'rejected') {
                        iconColor = 'text-red-500';
                        textColor = 'text-red-600';
                        IconComponent = ArrowUp;
                        sign = '*';
                      } else if (txn.type === 'transfer') {
                        iconColor = 'text-yellow-500';
                        textColor = 'text-yellow-600';
                        IconComponent = ArrowUp;
                        sign = '-';
                      } else {
                        iconColor = 'text-green-500';
                        textColor = 'text-green-600';
                        IconComponent = ArrowDown;
                        sign = '+';
                      }

                      return (
                        <li key={txn.id} className="flex items-center justify-between py-4 hover:bg-gray-50/50 transition-colors px-2">
                          <div className="flex items-center gap-3">
                            <IconComponent className={`${iconColor} w-5 h-5`} />
                            <div>
                              <p className="font-medium text-gray-800">{txn.description}</p>
                              <p className="text-xs text-gray-400">{txn.date}</p>
                              {txn.status && (
                                <p className="text-[10px] font-bold text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                  {txn.status}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className={`font-bold text-sm ${textColor}`}>
                            {sign}₦{txn.amount.toLocaleString()}
                          </p>
                        </li>
                      );
                    })}
                  </ul>

                  {/* --- PAGINATION CONTROLS --- */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                      <div className="text-xs text-gray-500 font-medium">
                        Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, transactions.length)} of {transactions.length}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Show first, last, and current page surroundings for clean UI if total pages is high
                            if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                              if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                              return null;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-100'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-6">
            <Link
              to="/agent"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              <span className="text-white">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgentTransactionHistory;