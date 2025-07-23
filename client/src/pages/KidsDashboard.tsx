import { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  School as SchoolIcon,
  History,
  Wallet,
  Download,
  AlertCircle,
  Settings,
  WalletCards,
  Calendar,
  TrendingUp,
   MessageSquare

} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import KidsHeader from '../components/KidsHeader';
import { useAuth } from '../context/AuthContext';

interface Profile {
  _id?: string;
  name?: string;
  fullName?: string;
  profilePic?: string;
  qrCodeId?: string;
}

interface Wallet {
  balance: number;
  _id?: string;
}

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  category: string;
  transactionType: string;
  status: string;
  createdAt: string;
  metadata?: {
    senderEmail?: string;
  };
  senderWalletId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  receiverWalletId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  balanceBefore?: number;
  balanceAfter?: number;
}

interface AnalyticsData {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
  name: string;
  credits: number;
  debits: number;
}

const KidsDashboard = () => {
  const navigate = useNavigate();
  const { token: authContextToken } = useAuth() || {};
  const token = authContextToken || localStorage.getItem('token');

  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  // const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const API_URL =
    import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';
  const qrRef = useRef<HTMLDivElement>(null);
  const COLORS = [
    '#4caf50',
    '#f44336',
    '#2196f3',
    '#ff9800',
    '#9c27b0',
    '#00bcd4',
  ];

  // Navigation items
  const navItems = [
    {
      label: 'Dashboard',
      icon: <Wallet className="w-5 h-5" />,
      route: '/kidswallet',
    },
    {
      label: 'Pay Agent',
      icon: <WalletCards className="w-5 h-5" />,
      route: '/kidpayagent',
    },
    {
      label: 'History',
      icon: <History className="w-5 h-5" />,
      route: '/kidpaymenthistory',
    },
    {
      label: 'School Bills',
      icon: <SchoolIcon className="w-5 h-5" />,
      route: '/schoolbills',
    },
    {
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      route: '/ksettings',
    },
    { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/api/users/getuserone`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        let userData: Profile;
        if (response.data.user) {
          userData = response.data.user.data || response.data.user;
        } else {
          userData = response.data.data || response.data;
        }

        setProfile(userData);
        fetchUserWallet();
      } catch {
        setError('Failed to load profile data');
        setIsLoading(false);
        showNotification('Error fetching profile', 'error');
      }
    };

    fetchUserProfile();
  }, [API_URL, token, navigate]);

  // Fetch user wallet
  const fetchUserWallet = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/getuserwallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setWallet(response.data.data || response.data);
      setIsLoading(false);
      fetchTransactions();
    } catch {
      setError('Failed to load wallet data');
      setIsLoading(false);
      showNotification('Error fetching wallet data', 'error');
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      if (!token) return;

      setLoadingTransactions(true);
      const response = await axios.get(
        `${API_URL}/api/transaction/getusertransaction`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Raw transaction response:', response.data);

      // Handle different response structures
      let transactionData;
      if (response.data.success && response.data.data) {
        // If response has success and data fields
        transactionData = response.data.data;
      } else if (response.data.data) {
        // If response has only data field
        transactionData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // If response is directly an array
        transactionData = response.data;
      } else {
        // If the structure is different
        console.log('Unexpected response structure:', response.data);
        transactionData = [];
      }

      // Safety check to ensure it's an array
      const validTransactions = Array.isArray(transactionData)
        ? transactionData.filter((tx: Transaction) => tx._id)
        : [];

      console.log('Valid transactions:', validTransactions.length);
      // setTransactions(validTransactions);

      // Get only the 5 most recent transactions
      const recent = [...validTransactions]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      setRecentTransactions(recent);
      console.log('Recent transactions:', recent.length);

      // Process analytics data
      processAnalyticsData(validTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showNotification('Error fetching transactions', 'error');
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Process analytics data
  const processAnalyticsData = (transactionData: Transaction[]) => {
    console.log(
      'Processing analytics for',
      transactionData.length,
      'transactions'
    );
    if (transactionData && transactionData.length > 0) {
      // Basic credit/debit analysis
      let credits = 0,
        debits = 0;
      transactionData.forEach((tx) => {
        if (tx.category === 'credit') {
          credits += tx.amount;
        } else if (tx.category === 'debit') {
          debits += tx.amount;
        } else {
          // Fallback if category is not explicitly set
          if (tx.amount > 0) {
            credits += tx.amount;
          } else {
            debits += Math.abs(tx.amount);
          }
        }
      });

      console.log('Credits:', credits, 'Debits:', debits);
      setAnalytics([
        { name: 'Credits', value: credits, color: '#4caf50' },
        { name: 'Debits', value: debits, color: '#f44336' },
      ]);

      // Category analysis
      const categories: Record<string, number> = {};
      transactionData.forEach((tx) => {
        const category = tx.transactionType || 'other';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += Math.abs(tx.amount);
      });

      const categoryAnalytics = Object.entries(categories).map(
        ([name, value], index) => ({
          name: formatTransactionType(name),
          value,
          color: COLORS[index % COLORS.length],
        })
      );

      console.log('Category analytics:', categoryAnalytics);
      setCategoryData(categoryAnalytics);

      // Monthly data analysis
      const monthlyAnalytics: Record<
        string,
        { credits: number; debits: number }
      > = {};
      const currentDate = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(currentDate.getMonth() - 5);

      // Initialize the last 6 months
      for (let i = 0; i < 6; i++) {
        const month = new Date(sixMonthsAgo);
        month.setMonth(sixMonthsAgo.getMonth() + i);
        const monthStr = month.toLocaleString('default', { month: 'short' });
        monthlyAnalytics[monthStr] = { credits: 0, debits: 0 };
      }

      // Populate with actual data
      transactionData.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (txDate >= sixMonthsAgo) {
          const monthStr = txDate.toLocaleString('default', { month: 'short' });
          if (monthlyAnalytics[monthStr]) {
            if (tx.category === 'credit') {
              monthlyAnalytics[monthStr].credits += tx.amount;
            } else if (tx.category === 'debit') {
              monthlyAnalytics[monthStr].debits += tx.amount;
            } else {
              // Fallback if category is not explicitly set
              if (tx.amount > 0) {
                monthlyAnalytics[monthStr].credits += tx.amount;
              } else {
                monthlyAnalytics[monthStr].debits += Math.abs(tx.amount);
              }
            }
          }
        }
      });

      const monthlyChartData = Object.entries(monthlyAnalytics).map(
        ([name, data]) => ({
          name,
          credits: data.credits,
          debits: data.debits,
        })
      );

      console.log('Monthly chart data:', monthlyChartData);
      setMonthlyData(monthlyChartData);
    } else {
      console.log('No transactions data available for analytics');
      setAnalytics([]);
      setCategoryData([]);
      setMonthlyData([]);
    }
  };

  // Format transaction type for display
  const formatTransactionType = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get transaction display name
  const getTransactionDisplayName = (tx: Transaction): string => {
    if (
      tx.senderWalletId &&
      tx.senderWalletId.firstName &&
      tx.senderWalletId.lastName
    ) {
      return `${tx.senderWalletId.firstName} ${tx.senderWalletId.lastName}`;
    } else if (tx.senderWalletId && tx.senderWalletId.email) {
      return tx.senderWalletId.email.split('@')[0];
    } else if (tx.metadata && tx.metadata.senderEmail) {
      return tx.metadata.senderEmail.split('@')[0];
    } else if (tx.transactionType) {
      return formatTransactionType(tx.transactionType);
    }
    return tx.description || 'Transaction';
  };

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Download QR Code
  const handleDownloadQRCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${profile?.name?.replace(/\s+/g, '-').toLowerCase() || 'kid'}-qr-code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  // Navigation tab state
  const [activeTab, setActiveTab] = useState(0);
  const [activeChart, setActiveChart] = useState('pie');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-full max-w-md p-6">
          <h2 className="text-xl font-semibold text-center mb-4">
            <span className='text-blue-600'>Loading your dashboard...</span>
          </h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">
            Please try refreshing the page or log in again.
          </p>
          <Link
            to="/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Render Dashboard Content
  const renderDashboardContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition">
        <div className="flex items-center mb-4">
          <Wallet className="w-6 h-6" />
          <h3 className="ml-2 text-lg font-medium">Wallet Balance</h3>
        </div>
        <p className="text-3xl font-bold my-3">
          ₦{wallet?.balance.toLocaleString() || '0'}
        </p>
        <p className="text-sm opacity-90">Available to spend</p>
      </div>

      {/* School Bills Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition">
        <div className="flex items-center mb-4">
          <SchoolIcon className="w-6 h-6" />
          <h3 className="ml-2 text-lg font-medium">School Bills</h3>
        </div>
        <p className="text-3xl font-bold my-3">All Paid ✓</p>
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-90">Next payment: Jun 1</p>
          <Link
            to="/schoolbills"
            className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm transition"
          >
            View
          </Link>
        </div>
      </div>

{/* Analytics Card */}
<div className="md:col-span-2 bg-gray-50 rounded-xl shadow-lg p-6">
  <div className="flex flex-col mb-6">
    <h3 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
      Transaction Analytics
    </h3>
    <div className="flex space-x-2 md:self-end">
      <button
        onClick={() => setActiveChart('pie')}
        className={`px-3 py-1 rounded-md text-sm ${activeChart === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
      >
        Overview
      </button>
      <button
        onClick={() => setActiveChart('category')}
        className={`px-3 py-1 rounded-md text-sm ${activeChart === 'category' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
      >
        Categories
      </button>
      <button
        onClick={() => setActiveChart('monthly')}
        className={`px-3 py-1 rounded-md text-sm ${activeChart === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
      >
        Monthly
      </button>
    </div>
  </div>

  {loadingTransactions ? (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <>
      {/* Rest of the chart rendering code remains the same */}
      {activeChart === 'pie' && analytics.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={30}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {analytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  `₦${value.toLocaleString()}`
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

            {activeChart === 'category' && categoryData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        `₦${value.toLocaleString()}`
                      }
                    />
                    <Bar dataKey="value" name="Amount">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'monthly' && monthlyData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        `₦${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      stroke="#4caf50"
                      activeDot={{ r: 8 }}
                      name="Credits"
                    />
                    <Line
                      type="monotone"
                      dataKey="debits"
                      stroke="#f44336"
                      name="Debits"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {(analytics.length === 0 || categoryData.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  No transaction data available yet.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Complete some transactions to see analytics.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="md:col-span-2 bg-gray-50 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Recent Transactions
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Last 5 transactions</span>
          </div>
        </div>

        {loadingTransactions ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                >
                  {' '}
                  {/* Changed hover:bg-gray-50 to hover:bg-gray-100 */}
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.category === 'credit' || tx.amount > 0
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {tx.category === 'credit' || tx.amount > 0 ? (
                        <ArrowDown className="w-5 h-5" />
                      ) : (
                        <ArrowUp className="w-5 h-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">
                        {getTransactionDisplayName(tx)}
                      </p>{' '}
                      {/* Added text-gray-800 */}
                      <p className="text-sm text-gray-600">
                        {' '}
                        {/* Changed text-gray-500 to text-gray-600 */}
                        {tx.description} •{' '}
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${tx.category === 'credit' || tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {tx.category === 'credit' || tx.amount > 0 ? '+' : '-'}₦
                      {Math.abs(tx.amount).toLocaleString()}
                    </p>
                    {tx.balanceAfter !== undefined && (
                      <p className="text-xs text-gray-500">
                        Balance: ₦{tx.balanceAfter.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions found.</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your transaction history will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Link
            to="/kidpaymenthistory"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-lg transition flex items-center gap-2"
          >
            <History className="w-4 h-4 text-white" />
            <span className="text-white">View All Transactions</span>
          </Link>
        </div>
      </div>
    </div>
  );

  // Pay Agent Content
  const renderPayAgentContent = () => (
    <div className="flex justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-blue-600 mb-2">
          Pay to Agent
        </h3>
        <p className="text-gray-600 mb-6">
          Show this QR code to any authorized payment agent to send or receive
          money.
        </p>
        <div
          ref={qrRef}
          className="flex flex-col items-center my-4 p-4 border-2 border-dashed border-gray-200 rounded-lg"
        >
          <QRCodeCanvas
            value={profile?.qrCodeId || 'default-qr-code-id'}
            size={220}
            level="H"
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
          <p className="text-xs text-gray-500 mt-2">
            Unique ID: {profile?.qrCodeId || 'Not available'}
          </p>
        </div>
        <button
          onClick={handleDownloadQRCode}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 w-full"
        >
          <Download className="w-5 h-5" />
          Download QR Code
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl px-4 flex flex-col min-h-screen">
        {/* Header */}
        <KidsHeader profile={profile} wallet={wallet} />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="flex overflow-x-auto">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.route}
                onClick={() => setActiveTab(index)}
                className={`flex flex-col md:flex-row items-center justify-center px-4 py-3 md:py-4 min-w-24 md:min-w-32 transition ${activeTab === index ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="mb-1 md:mb-0 md:mr-2">{item.icon}</span>
                <span className="text-sm md:text-base">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 mb-8">
          {activeTab === 0 ? (
            renderDashboardContent()
          ) : activeTab === 1 ? (
            renderPayAgentContent()
          ) : (
            <div className="text-center py-12 text-gray-500">
              This feature is coming soon!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4 border-t border-gray-200">
          © {new Date().getFullYear()} Kids Wallet. All rights reserved.
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default KidsDashboard;
