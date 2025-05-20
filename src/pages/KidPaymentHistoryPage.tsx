import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KidsHeader from '../components/KidsHeader';
import Footer from '../components/Footer';

// Icons
import { 
  ArrowLeft, 
  History,
  ArrowDown,
  ArrowUp,
  Award,
  User,
  CreditCard,
  GraduationCap, 
  Settings
} from 'lucide-react';

// Type definitions
interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'reward';
  amount: number;
  description: string;
  date: string;
  from?: string;
  to?: string;
  status?: string;
}



const KidPaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(2); // History tab selected by default
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Removed unused userData state
  const [error, setError] = useState<string | null>(null);
  
  // Define API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

  // Navigation items
  const navItems = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
  ];

  // Fetch user data and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        // User data is fetched but not used, so skip assigning to 'profile'
        
        // Fetch transactions
        const transactionResponse = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!transactionResponse.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const transactionData = await transactionResponse.json();
        
        // Handle different response structures for transactions
        let transactionList: Transaction[];
        if (transactionData.transactions) {
          transactionList = transactionData.transactions;
        } else if (transactionData.data) {
          transactionList = transactionData.data;
        } else {
          transactionList = transactionData as Transaction[];
        }
        
        setTransactions(transactionList);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // Redirect to login if authentication error
        if (err instanceof Error && err.message.includes('Authentication')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_BASE_URL, navigate]);

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

  // Transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown className="w-5 h-5 text-white" />;
      case 'payment':
        return <ArrowUp className="w-5 h-5 text-white" />;
      case 'reward':
        return <Award className="w-5 h-5 text-white" />;
      default:
        return <History className="w-5 h-5 text-white" />;
    }
  };

  // Transaction background color based on type
  const getTransactionColor = (type: string): string => {
    switch (type) {
      case 'deposit':
        return 'bg-green-500';
      case 'payment':
        return 'bg-red-500';
      case 'reward':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-800 font-semibold">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Error Loading Data</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <Link to="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
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
        {/* Header Component */}
        <KidsHeader profile={null} wallet={{ balance: 0 }} />

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
                    <div className={`rounded-full p-3 ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                          <p className="text-sm text-gray-500">
                            {transaction.from ? `From: ${transaction.from}` : 
                             transaction.to ? `To: ${transaction.to}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}
                            ₦{Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      
                      {transaction.status && (
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
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