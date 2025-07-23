import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import AHeader from '../components/AHeader';
import { useAuth } from '../context/AuthContext';

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

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  // Add other user properties as needed
};

const AgentTransactionHistory = () => {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed unused 'user' state
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle authentication errors
  const handleAuthError = useCallback((message: string) => {
    setError(message);
    // Clear stored credentials
    localStorage.removeItem('token');
    auth?.logout?.();
    // Redirect to login page if needed
    // navigate('/login');
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures
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
        throw new Error('Invalid user data received from API');
      }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures for transactions
      let transactionList: unknown[] = [];
      if (data.transactions) {
        transactionList = data.transactions;
      } else if (data.data) {
        transactionList = Array.isArray(data.data) ? data.data : [data.data];
      } else if (Array.isArray(data)) {
        transactionList = data;
      }

      // Transform API data to match our Transaction type
      const transformedTransactions: Transaction[] = transactionList.map((txn, index: number) => {
        const t = txn as Record<string, unknown>;
       return {
  id: (t.id as number) || (t._id as number) || index + 1,
  type: (t.type as 'credit' | 'transfer') || ((typeof t.amount === 'number' && t.amount > 0) ? 'credit' : 'transfer'),
  amount: Math.abs((t.amount as number) || 0),
  description: (t.description as string) || (t.note as string) || 'Transaction',
  date: (t.date as string) || (t.createdAt as string) || new Date().toISOString().split('T')[0],
  status: t.status as string | undefined, // Add this line
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
        console.log('Starting auth initialization...');

        // Check if already in context
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          setToken(auth.token);
          
          // Fetch transactions with existing token
          try {
            const transactionData = await fetchTransactions(auth.token);
            setTransactions(transactionData);
          } catch (transactionError) {
            console.error('Error fetching transactions:', transactionError);
            setError('Failed to load transactions');
          }
          
          setLoading(false);
          return;
        }

        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token in localStorage');
          throw new Error('No authentication token found');
        }

        console.log('Found token in localStorage:', storedToken);

        // Fetch user from API to ensure fresh data
        // Fetch user from API to ensure fresh data
        console.log('Fetching user from API...');
        const profile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', profile);

        // Update local state
        setToken(storedToken);

        // Update auth context
        auth?.login?.(profile, storedToken);
        // Fetch transactions
        console.log('Fetching transactions from API...');
        const transactionData = await fetchTransactions(storedToken);
        console.log('Successfully fetched transactions:', transactionData);
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

  // Retry function for failed requests
  const retryFetch = async () => {
    if (token) {
      setLoading(true);
      setError(null);
      try {
        const transactionData = await fetchTransactions(token);
        setTransactions(transactionData);
      } catch {
        setError('Failed to load transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      {/* Header */}
      <AHeader />

      {/* Main content */}
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
            <div className="bg-white shadow-md rounded p-4">
              <div className="flex justify-between items-center mb-4">
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
  <ul>
    {transactions.map((txn, index) => {
      // Determine color and icon based on transaction status and type
      let iconColor = '';
      let textColor = '';
      let IconComponent = ArrowDown;
      let sign = '+';
      
      // First check for failed status (highest priority)
      if (txn.status === 'failed' || txn.status === 'rejected') {
        iconColor = 'text-red-500';
        textColor = 'text-red-600';
        IconComponent = ArrowUp; 
        sign = '*';      } 
      // Then check for debit type
      else if (txn.type === 'transfer') {
        iconColor = 'text-yellow-500';
        textColor = 'text-yellow-600';
        IconComponent = ArrowUp;
        sign = '-';
      } 
      // Default to credit
      else {
        iconColor = 'text-green-500';
        textColor = 'text-green-600';
        IconComponent = ArrowDown;
        sign = '+';
      }

      return (
        <React.Fragment key={txn.id}>
          <li className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <IconComponent className={`${iconColor} w-5 h-5`} />
              <div>
                <p className="font-medium">{txn.description}</p>
                <p className="text-sm text-gray-500">{txn.date}</p>
                {/* Show status if it exists */}
                {txn.status && (
                  <p className="text-xs text-gray-400 capitalize">
                    {txn.status}
                  </p>
                )}
              </div>
            </div>
            <p className={`font-bold text-sm ${textColor}`}>
              {sign}₦{txn.amount.toLocaleString()}
            </p>
          </li>
          {index < transactions.length - 1 && (
            <li aria-hidden="true" tabIndex={-1} className="p-0 m-0">
              <hr className="ml-8 border-gray-200" />
            </li>
          )}
        </React.Fragment>
      );
    })}
  </ul>
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