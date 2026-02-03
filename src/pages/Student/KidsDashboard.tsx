import { useState, useEffect, useRef, useCallback } from 'react';
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
import KidsHeader from '../../components/KidsHeader';
import { useAuth } from '../../context/AuthContext';

interface Profile {
  _id?: string;
  name?: string;
  fullName?: string;
  profilePic?: string;
  qrCodeId?: string;
  email?: string;
  studentCanTopup?: boolean;
  studentCanTransfer?: boolean;
}

interface Wallet {
  balance: number;
  _id?: string;
}

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  category: string; // 'credit' | 'debit' | 'pending'
  transactionType: string;
  status: string; // 'success' | 'failed' | 'pending'
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

interface Recipient {
  email: string;
  name: string;
}


const KidsDashboard = () => {
  const navigate = useNavigate();
  const { token: authContextToken } = useAuth() || {};
  const token = authContextToken || localStorage.getItem('token');

  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
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

  // New state variables for modals and transactions
  const [showFundModal, setShowFundModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transactionFee, setTransactionFee] = useState(0);
  const [fundAmount, setFundAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [fundLoading, setFundLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // School users state
  const [schoolUsers, setSchoolUsers] = useState<Recipient[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Recipient[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;
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

  // Fetch transaction charges
  const fetchTransactionCharges = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/charge/getallcharges`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      interface Charge {
        name: string;
        status: string;
        amount: number;
        [key: string]: unknown;
      }

      if (response.data && Array.isArray(response.data)) {
        const transferCharge = response.data.find((charge: Charge) => 
          charge.name.toLowerCase().includes('transfer') && charge.status === 'Active'
        );
        
        if (transferCharge) {
          setTransactionFee(transferCharge.amount);
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching transaction charges:', error);
      setTransactionFee(0);
    }
  };

  // Fetch school users
  const fetchSchoolUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      setFetchingUsers(true);
      const response = await axios.get(`${API_URL}/api/users/getallschooluser`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('School users response:', response.data);
      
      let users: Recipient[] = [];
      if (response.data.users) {
        users = response.data.users.map((user: { email: string; name?: string }) => ({
          email: user.email,
          name: user.name || user.email
        }));
      } else if (response.data.data) {
        users = response.data.data.map((user: Recipient) => ({
          email: user.email,
          name: user.name || user.email
        }));
      } else if (Array.isArray(response.data)) {
        users = response.data.map((user: { email: string; name?: string }) => ({
          email: user.email,
          name: user.name || user.email
        }));
      }

      // Filter out current user if needed
      const filteredUsers = users.filter(u => u.email !== profile?.email);
      
      setSchoolUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching school users:', error);
      showNotification('Failed to load school users', 'error');
    } finally {
      setFetchingUsers(false);
    }
  }, [token, profile?.email, API_URL]);

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
        fetchTransactionCharges(); // Fetch transaction charges
      } catch {
        setError('Failed to load profile data');
        setIsLoading(false);
        showNotification('Error fetching profile', 'error');
      }
    };

    fetchUserProfile();
  }, [API_URL, token, navigate]);

  // Fetch school users when component mounts
  useEffect(() => {
    fetchSchoolUsers();
  }, [fetchSchoolUsers]);

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

      let transactionData;
      if (response.data.success && response.data.data) {
        transactionData = response.data.data;
      } else if (response.data.data) {
        transactionData = response.data.data;
      } else if (Array.isArray(response.data)) {
        transactionData = response.data;
      } else {
        transactionData = [];
      }

      // Add proper type determination
      const typedTransactions = transactionData.map((tx: Transaction) => {
        // If status is pending, mark as pending regardless of amount
        if (tx.status === 'pending') {
          return { ...tx, category: 'pending' };
        }
        // If category is explicitly set, use that
        if (tx.category === 'credit' || tx.category === 'debit') {
          return tx;
        }
        // Otherwise determine by amount
        return {
          ...tx,
          category: tx.amount > 0 ? 'credit' : 'debit'
        };
      });

      const validTransactions = Array.isArray(typedTransactions)
        ? typedTransactions.filter((tx: Transaction) => tx._id)
        : [];

      // Get only the 5 most recent transactions
      const recent = [...validTransactions]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      setRecentTransactions(recent);
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
    if (transactionData && transactionData.length > 0) {
      let credits = 0, debits = 0, pending = 0;
      transactionData.forEach((tx) => {
        if (tx.status === 'pending') {
          pending += Math.abs(tx.amount);
        } else if (tx.category === 'credit') {
          credits += tx.amount;
        } else {
          debits += Math.abs(tx.amount);
        }
      });

      setAnalytics([
        { name: 'Credits', value: credits, color: '#4caf50' },
        { name: 'Debits', value: debits, color: '#f44336' },
        { name: 'Pending', value: pending, color: '#ff9800' },
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
    // First check if there's a meaningful description
    if (tx.description && tx.description !== 'No description provided') {
      return tx.description;
    }
    
    // Then check for sender/receiver names
    if (tx.senderWalletId && tx.senderWalletId.firstName && tx.senderWalletId.lastName) {
      return `${tx.senderWalletId.firstName} ${tx.senderWalletId.lastName}`;
    } else if (tx.senderWalletId && tx.senderWalletId.email) {
      return tx.senderWalletId.email.split('@')[0];
    } else if (tx.metadata && tx.metadata.senderEmail) {
      return tx.metadata.senderEmail.split('@')[0];
    } else if (tx.transactionType) {
      return formatTransactionType(tx.transactionType);
    }
    return 'Transaction';
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

  // Handle fund wallet
  const handleFundWallet = async () => {
    if (!fundAmount || !token) return;
    
    setFundLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      
      const response = await axios.post(`${API_URL}/api/transaction/initiateTransaction`, 
        {
          email: profile?.email || '',
          amount: Number(fundAmount),
          callback_url: callbackUrl
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data?.authorization_url) {
        localStorage.setItem('paymentReference', response.data.reference);
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('Invalid response from payment gateway');
      }
    } catch (error: unknown) {
      console.error('Error initiating transaction:', error);
      showNotification('Failed to initiate payment', 'error');
    } finally {
      setFundLoading(false);
    }
  };

  // Handle transfer
  const handleTransfer = async () => {
    if (!selectedRecipient?.email || !transferAmount || !transferPin) return;
    
    setTransferLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/transaction/transfer`,
        {
          receiverEmail: selectedRecipient.email,
          amount: Number(transferAmount),
          pin: transferPin
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.message === "Transfer successful") {
        showNotification(`₦${Number(transferAmount).toLocaleString()} successfully transferred!`, 'success');
        setShowTransferModal(false);
        setSelectedRecipient(null);
        setTransferAmount('');
        setTransferNote('');
        setTransferPin('');
        fetchUserWallet();
        fetchTransactions();
      } else {
        throw new Error(response.data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      let errorMessage = 'Transfer failed. Please try again.';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setTransferLoading(false);
    }
  };

  // User dropdown handlers
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedRecipient({ email: value, name: value });
    
    // Filter users based on input
    if (value) {
      const filtered = schoolUsers.filter(user =>
        user.email.toLowerCase().includes(value.toLowerCase()) ||
        user.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
    } else {
      setFilteredUsers(schoolUsers);
      setShowUserDropdown(true);
    }
  };

  const handleUserSelect = (user: Recipient) => {
    setSelectedRecipient(user);
    setShowUserDropdown(false);
  };

  const handleInputFocus = () => {
    if (schoolUsers.length > 0) {
      setShowUserDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Small delay to allow click on dropdown items
    setTimeout(() => {
      setShowUserDropdown(false);
    }, 200);
  };

  // Fund Modal Component
  const FundModal = () => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFundAmount(e.target.value);
  };

  const handleQuickAmountClick = (amount: number) => {
    setFundAmount(amount.toString());
  };

  const handleClose = () => {
    setShowFundModal(false);
    setFundAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <ArrowDown className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold">Fund Wallet</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm opacity-90 mt-2">Add money to your wallet securely</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span>Amount to Fund</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₦</span>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium text-black"
                  placeholder="0.00"
                  min="1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Minimum amount: ₦100</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000, 5000, 10000, 20000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmountClick(amount)}
                  className="py-2 px-3 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-sm font-medium transition border border-transparent hover:border-blue-200"
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFundWallet}
              disabled={fundLoading || !fundAmount || Number(fundAmount) < 100}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition"
            >
              {fundLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Continue to Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

 // Transfer Modal Component
const TransferModal = () => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransferAmount(e.target.value);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransferNote(e.target.value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransferPin(e.target.value);
  };

  const handleClose = () => {
    setShowTransferModal(false);
    setSelectedRecipient(null);
    setTransferAmount('');
    setTransferNote('');
    setTransferPin('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <ArrowUp className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold">Transfer Money</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm opacity-90 mt-2">Send money to friends and family</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-5">
            {/* Recipient Field */}
            <div className="relative">
              <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span>Recipient Email</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                value={selectedRecipient?.email || ''}
                onChange={handleRecipientChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                placeholder="Search by email or name"
              />
              
              {showUserDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {fetchingUsers ? (
                    <div className="p-3 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mx-auto"></div>
                      <p className="text-sm mt-1">Loading users...</p>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.email}
                        onClick={() => handleUserSelect(user)}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount Field */}
            <div>
              <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span>Amount</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₦</span>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={handleAmountChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  placeholder="0.00"
                  min="1"
                />
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
              <input
                type="text"
                value={transferNote}
                onChange={handleNoteChange}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                placeholder="What's this transfer for?"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{transferNote.length}/50 characters</p>
            </div>

            {/* PIN Field */}
            <div>
              <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span>Security PIN</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                value={transferPin}
                onChange={handlePinChange}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                placeholder="Enter your 4-digit PIN"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>

            {/* Fee Information */}
            {transactionFee > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-700">Transaction Fee:</span>
                  <span className="font-semibold text-blue-800">₦{transactionFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-blue-700">Total Amount:</span>
                  <span className="font-semibold text-blue-800">
                    ₦{(Number(transferAmount || 0) + transactionFee).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Balance Info */}
            {wallet && (
              <div className="text-sm text-gray-600 text-center">
                Available Balance: <span className="font-semibold">₦{wallet.balance.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={transferLoading || !selectedRecipient?.email || !transferAmount || !transferPin || transferPin.length !== 4 || Number(transferAmount) < 1}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition"
            >
              {transferLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Confirm Transfer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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


      {/* Quick Actions Card  */}
<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition">
  <div className="flex items-center mb-4">
    <div className="bg-white/20 p-2 rounded-lg">
      <WalletCards className="w-5 h-5" />
    </div>
    <h3 className="ml-3 text-lg font-semibold">Quick Actions</h3>
  </div>
  
  <div className="grid grid-cols-1 gap-3">
    {profile?.studentCanTopup && (
      <button
        onClick={() => setShowFundModal(true)}
        className="group w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center justify-between hover:bg-white/20 hover:shadow-lg border border-white/10 hover:border-white/20"
      >
        <div className="flex items-center">
          <div className="bg-green-500 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform">
            <ArrowDown className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">Fund Wallet</p>
            <p className="text-xs text-white/70">Add money to your account</p>
          </div>
        </div>
        <div className="bg-white/10 p-1 rounded group-hover:bg-white/20">
          <ArrowUp className="w-3 h-3 transform rotate-90 text-white" />
        </div>
      </button>
    )}
    
    {profile?.studentCanTransfer && (
      <button
        onClick={() => setShowTransferModal(true)}
        className="group w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center justify-between hover:bg-white/20 hover:shadow-lg border border-white/10 hover:border-white/20"
      >
        <div className="flex items-center">
          <div className="bg-purple-500 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform">
            <ArrowUp className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">Transfer Money</p>
            <p className="text-xs text-white/70">Send to friends </p>
          </div>
        </div>
        <div className="bg-white/10 p-1 rounded group-hover:bg-white/20">
          <ArrowUp className="w-3 h-3 transform rotate-90 text-white" />
        </div>
      </button>
    )}
    
    {!profile?.studentCanTopup && !profile?.studentCanTransfer && (
      <div className="text-center py-4 bg-white/10 rounded-xl">
        <p className="text-white/80 text-sm">No quick actions available</p>
        <p className="text-white/50 text-xs mt-1">Contact admin to enable features</p>
      </div>
    )}
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
              recentTransactions.map((tx) => {
                // Use the category from API response directly
                const isPending = tx.status === 'pending';
                const isCredit = tx.category === 'credit';
                const isFailed = tx.status === 'failed';

                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isFailed
                            ? 'bg-red-100 text-red-600'
                            : isPending
                            ? 'bg-yellow-100 text-yellow-600'
                            : isCredit
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {isFailed ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : isPending ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : isCredit ? (
                          <ArrowDown className="w-5 h-5" />
                        ) : (
                          <ArrowUp className="w-5 h-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-800">
                          {getTransactionDisplayName(tx)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTransactionType(tx.transactionType)} • {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isFailed
                              ? 'bg-red-100 text-red-600'
                              : isPending
                              ? 'bg-yellow-100 text-yellow-600'
                              : isCredit
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {isFailed ? 'Failed' : isPending ? 'Pending' : isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        isFailed
                          ? 'text-red-600'
                          : isPending
                          ? 'text-yellow-600'
                          : isCredit
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {isFailed ? '✗' : isPending ? '⏳' : isCredit ? '+' : '-'}₦
                        {Math.abs(tx.amount).toLocaleString()}
                      </p>
                      {tx.balanceAfter !== undefined && (
                        <p className="text-xs text-gray-500">
                          Balance: ₦{tx.balanceAfter.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
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

      {/* Modals */}
      {showFundModal && <FundModal />}
      {showTransferModal && <TransferModal />}

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