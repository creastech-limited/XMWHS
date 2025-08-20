import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import KidsHeader from '../../components/KidsHeader';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

// Icons
import { 
  ArrowLeft, 
  History,
  ArrowDown,
  ArrowUp,
  User,
  CreditCard,
  GraduationCap, 
  Settings,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';

// Type definitions to match KidsHeader expectations
interface Profile {
  _id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  profilePic?: string;
  qrCodeId?: string;
}

interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
}

// Updated transaction interface to match API response
interface APITransaction {
  _id: string;
  transactionType: string;
  category: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  reference: string;
  senderWalletId?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  receiverWalletId?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  metadata?: {
    senderEmail: string;
    receiverEmail: string;
  };
  createdAt: string;
  direction: 'credit' | 'debit';
  balanceBefore: number;
  balanceAfter: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'reward' | 'transfer';
  amount: number;
  description: string;
  date: string;
  from?: string;
  to?: string;
  status?: string;
  reference: string;
  category: 'credit' | 'debit';
  direction: 'credit' | 'debit';
}

const KidPaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token;
  
  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activeTab, setActiveTab] = useState<number>(2); // History tab selected by default
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedReference, setCopiedReference] = useState<string | null>(null);
  
  // API URL - matching the pattern from other components
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Navigation items
  const navItems = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
     { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];

  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error') => {
    console.log(`${type}: ${message}`);
    // You can integrate with your notification system here
  };

  // Copy reference to clipboard
  const copyToClipboard = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedReference(reference);
      setTimeout(() => setCopiedReference(null), 2000);
      showNotification("Reference copied to clipboard", "success");
    } catch (err) {
      console.error('Failed to copy: ', err);
      showNotification("Failed to copy reference", "error");
    }
  };

  // Transform API transaction to internal format
  const transformTransaction = (apiTransaction: APITransaction): Transaction => {
    // Determine transaction type based on transactionType
    let type: 'deposit' | 'payment' | 'reward' | 'transfer' = 'transfer';
    if (apiTransaction.transactionType.includes('deposit')) {
      type = 'deposit';
    } else if (apiTransaction.transactionType.includes('payment')) {
      type = 'payment';
    } else if (apiTransaction.transactionType.includes('reward')) {
      type = 'reward';
    }

    // Determine from/to based on direction and available data
    let from: string | undefined;
    let to: string | undefined;

    if (apiTransaction.direction === 'credit') {
      // Money coming in
      if (apiTransaction.senderWalletId) {
        from = `${apiTransaction.senderWalletId.firstName} ${apiTransaction.senderWalletId.lastName} (${apiTransaction.senderWalletId.email})`;
      } else if (apiTransaction.metadata?.senderEmail) {
        from = apiTransaction.metadata.senderEmail;
      }
    } else if (apiTransaction.direction === 'debit') {
      // Money going out
      if (apiTransaction.receiverWalletId) {
        to = `${apiTransaction.receiverWalletId.firstName} ${apiTransaction.receiverWalletId.lastName} (${apiTransaction.receiverWalletId.email})`;
      } else if (apiTransaction.metadata?.receiverEmail) {
        to = apiTransaction.metadata.receiverEmail;
      }
    }

    return {
      id: apiTransaction._id,
      type,
      amount: apiTransaction.direction === 'credit' ? apiTransaction.amount : -apiTransaction.amount,
      description: apiTransaction.description || 'Transaction',
      date: apiTransaction.createdAt,
      from,
      to,
      status: apiTransaction.status,
      reference: apiTransaction.reference,
      category: apiTransaction.category,
      direction: apiTransaction.direction
    };
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let userData: Profile;
      if (response.data.user) {
        userData = response.data.user.data || response.data.user;
      } else {
        userData = response.data.data || response.data;
      }

      // Ensure we have the proper name structure for KidsHeader
      if (userData.firstName && userData.lastName && !userData.fullName) {
        userData.fullName = `${userData.firstName} ${userData.lastName}`;
      }
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      setProfile(userData);
      return userData; // Return for chaining
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError("Failed to load profile data");
      showNotification("Error fetching profile", "error");
      throw err;
    }
  };

  // Fetch user wallet
  const fetchUserWallet = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/getuserwallet`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const walletData = response.data.data || response.data;
      setWallet(walletData);
      return walletData; // Return for chaining
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError("Failed to load wallet data");
      showNotification("Error fetching wallet data", "error");
      throw err;
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transaction/getusertransaction`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response:', response.data); // Debug log
      
      // Handle different response structures for transactions
      let apiTransactionList: APITransaction[];
      if (response.data.data) {
        apiTransactionList = response.data.data;
      } else if (response.data.transactions) {
        apiTransactionList = response.data.transactions;
      } else {
        apiTransactionList = response.data as APITransaction[];
      }
      
      // Transform API transactions to internal format
      const transformedTransactions = apiTransactionList.map(transformTransaction);
      
      // Sort by date (newest first)
      transformedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(transformedTransactions);
      return transformedTransactions;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showNotification("Error fetching transactions", "error");
      // Don't throw here as transactions are not critical for header display
      setTransactions([]);
    }
  };

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile first
        await fetchUserProfile();
        
        // Fetch wallet
        await fetchUserWallet();
        
        // Fetch transactions (non-blocking)
        await fetchTransactions();
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err instanceof Error && err.message.includes('Authentication')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [API_URL, token, navigate]);

  // Format date helper function
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Transaction icon based on type and direction
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.direction === 'credit') {
      return <ArrowDown className="w-5 h-5 text-white" />;
    } else {
      return <ArrowUp className="w-5 h-5 text-white" />;
    }
  };

  // Transaction background color based on direction
  const getTransactionColor = (transaction: Transaction): string => {
    if (transaction.direction === 'credit') {
      return 'bg-green-500';
    } else {
      return 'bg-red-500';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-800 font-semibold">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Error state (for critical errors like profile/wallet fetch failures)
  if (error && (!profile || !wallet)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Unable to Load Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <Link 
              to="/login" 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl px-4 flex flex-col min-h-screen">
        {/* Header Component with real data */}
        <KidsHeader 
          profile={profile} 
          wallet={wallet || { balance: 0 }} 
        />

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-md">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item, index) => (
              <Link 
                key={item.label} 
                to={item.route}
                className={`flex-shrink-0 flex flex-col md:flex-row items-center px-4 md:px-6 py-4 md:py-3 min-w-[80px] md:min-w-[120px] gap-2 border-b-2 transition-all ${
                  index === activeTab 
                    ? "border-indigo-600 text-indigo-600 font-semibold" 
                    : "border-transparent text-gray-600 hover:bg-indigo-50"
                }`}
                onClick={() => setActiveTab(index)}
              >
                <div className="text-center md:text-left">
                  {item.icon}
                </div>
                <span className="text-xs md:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Section Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight">Transaction History</h2>
              <div className="text-indigo-100 text-sm">
                {transactions.length} transactions
              </div>
            </div>
          </div>
          
          {/* Transactions List */}
          {transactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-3 ${getTransactionColor(transaction)}`}>
                      {getTransactionIcon(transaction)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                          
                          {/* Show sender/receiver info */}
                          {transaction.from && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">From:</span> {transaction.from}
                            </p>
                          )}
                          {transaction.to && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">To:</span> {transaction.to}
                            </p>
                          )}
                          
                          {/* Reference number with copy functionality */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">Ref:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-black">
                              {transaction.reference}
                            </code>
                            <button
                              onClick={() => copyToClipboard(transaction.reference)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors text-black"
                              title="Copy reference"
                            >
                              {copiedReference === transaction.reference ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}
                            ₦{Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      
                      {transaction.status && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.status.toLowerCase() === 'success' ? 'bg-green-100 text-green-800' :
                            transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.status.toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Your transaction history will appear here once you start making or receiving payments.
              </p>
            </div>
          )}
        </div>

        {/* Back to Dashboard Button */}
        <div className="text-center mt-2 mb-12">
          <Link 
            to="/kidswallet"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default KidPaymentHistoryPage;