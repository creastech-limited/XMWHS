import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { QrCode, Send, History, SearchIcon } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import AHeader from '../components/AHeader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  store?: string;
  description?: string;
  date: string;
  status?: string;
  reference?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  walletBalance?: number;
  [key: string]: unknown; // Add index signature for compatibility
}

interface AgentData {
  monthlyTarget: number;
  performance: number;
  monthlySalesTrack: number;
  monthlySalesAmount: number;
  walletBalance: number;
}

const AgentDashboard = () => {
  const auth = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  // Removed unused token state
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string>('');

  // Fetch user details from API
 const fetchUserDetails = async (authToken: string): Promise<User> => {
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
    console.log('User API Response:', data);

    // Extract user data from different possible response structures
    const userData = data.user?.data || data.data || data.user || data;
    const walletData = data.user?.wallet || data.wallet || { balance: 0 };

    const profile: User = {
      ...userData,
      walletBalance: walletData.balance || 0
    };

    return profile;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

  // Fetch user transactions
  const fetchUserTransactions = async (authToken: string): Promise<Transaction[]> => {
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
      console.log('Transactions API Response:', data);

      // Handle different response structures
      let transactions: Transaction[] = [];
      if (data.transactions) {
        transactions = data.transactions;
      } else if (data.data) {
        transactions = Array.isArray(data.data) ? data.data : [data.data];
      } else if (Array.isArray(data)) {
        transactions = data;
      }
// In fetchUserTransactions function, update the type mapping:
return transactions.map((txn: Transaction & {
  _id?: string | number;
  merchant?: string;
  note?: string;
  createdAt?: string;
  transactionId?: string;
  transactionType?: string;
}, index: number) => {
  // More accurate type detection
  const amount = txn.amount || 0;
  let type: 'credit' | 'debit' = 'credit'; // default
  
  // Check multiple possible indicators of debit
  if (txn.type === 'debit' || 
      txn.transactionType === 'debit' || 
      (typeof txn.amount === 'number' && txn.amount < 0)) {
    type = 'debit';
  }

  return {
    id: typeof txn._id === 'number'
      ? txn._id
      : typeof txn.id === 'number'
        ? txn.id
        : Number(typeof txn._id === 'string' ? txn._id : typeof txn.id === 'string' ? txn.id : index + 1) || index + 1,
    type: type,
    amount: Math.abs(amount),
    store: txn.store || txn.merchant || txn.description || 'Transaction',
    description: txn.description || txn.note,
    date: txn.date || txn.createdAt || new Date().toISOString().split('T')[0],
    status: txn.status,
    reference: txn.reference || txn.transactionId,
  };
});
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  // Calculate monthly sales track percentage and amount
  const calculateMonthlySalesData = (transactions: Transaction[]): { percentage: number; amount: number } => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });
    
    // Calculate total sales (credit transactions) for current month
    const totalSales = currentMonthTransactions
      .filter(txn => txn.type === 'credit')
      .reduce((sum, txn) => sum + txn.amount, 0);
    
    
    const monthlyTarget = 100000;
    
    // Calculate percentage
    const percentage = Math.min((totalSales / monthlyTarget) * 100, 100);
    
    return {
      percentage: Math.round(percentage),
      amount: totalSales
    };
  };

  // Calculate performance based on transaction records
  const calculatePerformance = (transactions: Transaction[]): number => {
    if (transactions.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Filter transactions for last 30 days
    const recentTransactions = transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= thirtyDaysAgo && txnDate <= now;
    });
    
    // Calculate successful transactions (completed status or credit transactions)
    const successfulTransactions = recentTransactions.filter(txn => 
      txn.status === 'completed' || txn.status === 'success' || txn.type === 'credit'
    );
    
    // Calculate performance percentage
    const performance = recentTransactions.length > 0 
      ? (successfulTransactions.length / recentTransactions.length) * 100 
      : 0;
    
    // Factor in transaction volume (more transactions = better performance)
    const volumeBonus = Math.min(recentTransactions.length / 10, 1) * 10; // Up to 10% bonus
    
    return Math.min(Math.round(performance + volumeBonus), 100);
  };

  // Handle authentication errors
  const handleAuthError = (message: string) => {
    setError(message);
    // Optionally redirect to login
    // navigate('/login');
  };

  // Initialize authentication and fetch data
useEffect(() => {
  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Starting auth initialization...');

      let authToken = '';
      let userProfile: User | null = null;

      // Check if already in context
      if (auth?.user?._id && auth?.token) {
        console.log('Found user in auth context:', auth.user);
        authToken = auth.token;
        userProfile = auth.user;
        setUser(auth.user);
        setWalletBalance(typeof auth.user.walletBalance === 'number' ? auth.user.walletBalance : 0);
      } else {
        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token in localStorage');
          throw new Error('No authentication token found');
        }

        console.log('Found token in localStorage');
        authToken = storedToken;

        // Fetch user from API to ensure fresh data
        console.log('Fetching user from API...');
        userProfile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', userProfile);
        
        const mergedUser: User = {
          ...userProfile,
          role: userProfile.role || '',
        };
        
        setUser(mergedUser);
        setWalletBalance(mergedUser.walletBalance || 0);
        auth?.login?.(mergedUser, storedToken);
      }

      // Fetch transactions
      console.log('Fetching user transactions...');
      const transactions = await fetchUserTransactions(authToken);
      setAllTransactions(transactions);
      setRecentTransactions(transactions.slice(0, 5));

      // Calculate monthly sales track and performance
      const monthlySalesData = calculateMonthlySalesData(transactions);
      const performance = calculatePerformance(transactions);

      // Set agent data with calculated values
      setAgentData({
        monthlyTarget: 100000,
        performance: performance,
        monthlySalesTrack: monthlySalesData.percentage,
        monthlySalesAmount: monthlySalesData.amount,
        walletBalance: userProfile?.walletBalance || 0,
      });

      console.log('Auth initialization completed successfully');
      console.log('Monthly Sales Track:', monthlySalesData.percentage + '%');
      console.log('Monthly Sales Amount:', '₦' + monthlySalesData.amount.toLocaleString());
      console.log('Performance:', performance + '%');

    } catch (error) {
      console.error('Auth initialization error:', error);
      handleAuthError('Authentication error. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  initializeAuth();
}, [auth]);

  const colors = {
    primary: '#3f51b5',
    secondary: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#f8faff',
  };

  if (loading) {
    return (
      <div className="bg-[#f8faff] min-h-screen p-4">
        <div className="bg-gray-200 h-28 mb-4 rounded-xl animate-pulse"></div>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-gray-200 h-20 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-gray-200 h-40 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
          <div className="bg-gray-200 h-48 rounded-xl animate-pulse mt-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8faff]">
        <AHeader />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      <AHeader />

      <main className="flex-grow p-4 sm:p-6">
        <div className="container mx-auto">
          {/* Welcome Message */}
          {user && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600">Here's your dashboard overview</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Link
              to="/agent/scanqr"
              className="flex items-center justify-center gap-2 py-4 sm:py-6 px-4 rounded-xl text-white font-medium shadow-md"
              style={{
                color: 'white',
                background: `linear-gradient(135deg, ${colors.info} 0%, ${colors.info}CC 100%)`,
              }}
              aria-label="Scan QR Code"
            >
              <QrCode />  
              <span>Scan QR Code</span>
            </Link>

            <Link
              to="/agent/transfertostore"
              className="flex items-center justify-center gap-2 py-4 sm:py-6 px-4 rounded-xl text-white font-medium shadow-md"
              style={{
                color: 'white',
                background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warning}CC 100%)`,
              }}
              aria-label="Transfer to Store"
            >
              <Send />
              <span>Transfer to Store</span>
            </Link>

            <Link
              to="/agent/transactions"
              className="flex items-center justify-center gap-2 py-4 sm:py-6 px-4 rounded-xl text-white font-medium shadow-md"
              style={{
                color: 'white',
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondary}CC 100%)`,
              }}
              aria-label="Transaction History"
            >
              <History />
              <span>Transaction History</span>
            </Link>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Wallet Balance */}
            <div
              className="rounded-xl shadow-md p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}CC 100%)`,
              }}
            >
              <h3 className="text-lg">Wallet Balance</h3>
              <h2 className="text-2xl font-bold">
                ₦{walletBalance.toLocaleString()}
              </h2>
              <p className="text-sm opacity-90 mt-2">Available balance</p>
            </div>

            {/* Monthly Sales Track */}
            <div
              className="rounded-xl shadow-md p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}CC 100%)`,
              }}
            >
              <h3 className="text-lg">Monthly Sales Track</h3>
              <h2 className="text-2xl font-bold">
                ₦{agentData?.monthlySalesAmount.toLocaleString()}
              </h2>
              <div className="mt-4 mb-2">
                <p className="text-sm mb-1">
                  Progress: {agentData?.monthlySalesTrack}% of ₦{agentData?.monthlyTarget.toLocaleString()}
                </p>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${agentData?.monthlySalesTrack}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div
              className="rounded-xl shadow-md p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.info} 0%, ${colors.info}CC 100%)`,
              }}
            >
              <h3 className="text-lg">Performance</h3>
              <h2 className="text-2xl font-bold">{agentData?.performance}%</h2>
              <div className="mt-4 mb-2">
                <p className="text-sm mb-1">
                  Based on {allTransactions.length} transactions
                </p>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${agentData?.performance}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl shadow-sm bg-white mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-900 text-lg font-bold">
                  Recent Transactions
                </h3>
                <div className="flex gap-2">
                  <SearchIcon style={{ color: '#3f51b5' }} />
                  <Link
                    to="/agent/transactions"
                    className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    aria-label="View all transactions"
                  >
                    <span>View All</span>
                    <History className="text-sm" />
                  </Link>
                </div>
              </div>

              {/* Transactions list */}
              <div className="text-gray-900 space-y-4">
                {recentTransactions.length > 0 ? (
  recentTransactions.map((transaction) => {
    // Determine color and sign based on status and type
    let colorClass = '';
    let sign = '';
    
    if (transaction.status === 'failed' || transaction.status === 'rejected') {
      colorClass = 'text-red-500'; // Red for failed transactions
      sign = '*'; // No sign for failed transactions
    } else if (transaction.type === 'debit') {
      colorClass = 'text-yellow-500'; // Yellow for debit transactions
      sign = '-'; // Minus sign for debits
    } else {
      colorClass = 'text-green-500'; // Green for successful credits
      sign = '+'; // Plus sign for credits
    }

    return (
      <div
        key={transaction.id}
        className="flex justify-between items-center p-3 border-b border-gray-100"
      >
        <div>
          <p className="font-medium">{transaction.store}</p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString()}
          </p>
          {transaction.reference && (
            <p className="text-xs text-gray-400">
              Ref: {transaction.reference}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className={`font-bold ${colorClass}`}>
            {sign}₦{transaction.amount.toLocaleString()}
          </div>
          {transaction.status && (
            <p className="text-xs text-gray-500 capitalize">
              {transaction.status}
            </p>
          )}
        </div>
      </div>
    );
  })
) : (
  <div className="text-center py-8 text-gray-500">
    <p>No recent transactions found</p>
  </div>
)}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgentDashboard;