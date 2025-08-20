import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface WalletData {
  balance: number;
  currency: string;
  walletName: string;
  lastTransactionAmount: number;
  lastTransactionType: string;
  lastTransaction: string;
}


interface ChargeData {
  _id: string;
  amount: number;
  name: string;
  chargeType: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  role?: string;
  status?: string;
}

const Overview = () => {
  const { user } = useAuth() ?? {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [chargesData, setChargesData] = useState<ChargeData[]>([]);
  // Removed unused usersData state
  const [adminProfile, setAdminProfile] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  // Removed unused token state

  const fetchUserDetails = useCallback(async (authToken: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
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


useEffect(() => {
  const initializeAuth = async () => {
    try {
      setLoading(true);
      console.log('Starting auth initialization...');
      
      let currentToken: string | null = null;
      
      // Check auth context first
      if (user?.token && typeof user.token === 'string') {
        console.log('Found token in auth context');
        currentToken = user.token;
      } else {
        // Fallback to localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token found');
          // Don't throw error here, just set loading to false
          setLoading(false);
          return;
        }
        console.log('Found token in localStorage');
        currentToken = storedToken;
      }

      // Validate token exists before making requests
      if (!currentToken) {
        setLoading(false);
        return;
      }

      const profile = await fetchUserDetails(currentToken);
      setAdminProfile(profile);

      const [walletRes, chargesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/wallet/getChargesWallets`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }),
        fetch(`${API_BASE_URL}/api/charge/getAllCharges`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }),
        fetch(`${API_BASE_URL}/api/users/getallUsers`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }),
      ]);

      // Check if responses are ok
      if (!walletRes.ok || !chargesRes.ok || !usersRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const [walletJson, chargesJson, usersJson] = await Promise.all([
        walletRes.json(),
        chargesRes.json(),
        usersRes.json()
      ]);

      // Handle the users response to get total count
      if (usersJson && usersJson.message) {
        const numberMatch = usersJson.message.split(' ')[0];
        const userCount = parseInt(numberMatch, 10);
        
        if (!isNaN(userCount)) {
          setTotalUsers(userCount);
        } else if (usersJson.data && Array.isArray(usersJson.data)) {
          setTotalUsers(usersJson.data.length);
        } else {
          setTotalUsers(0);
        }
      } else if (usersJson && usersJson.data && Array.isArray(usersJson.data)) {
        setTotalUsers(usersJson.data.length);
      } else {
        setTotalUsers(0);
      }

      setWalletData(Array.isArray(walletJson) ? walletJson : []);
      setChargesData(Array.isArray(chargesJson) ? chargesJson : []);

    } catch (error) {
      console.error('Auth initialization error:', error);
      // Only redirect on authentication errors, not on general API errors
      if (error instanceof Error && error.message.includes('Authentication') || 
          error instanceof Error && error.message.includes('token')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  initializeAuth();
}, [user?.token, fetchUserDetails]);

  // Calculate stats from real data
  const totalRevenue = walletData.reduce((sum, wallet) => sum + wallet.balance, 0);

  const recentTransactions = walletData
    .sort((a, b) => new Date(b.lastTransaction).getTime() - new Date(a.lastTransaction).getTime())
    .slice(0, 5);

  // Process data for charts
  const revenueData = walletData.map(wallet => ({
    name: new Date(wallet.lastTransaction).toLocaleDateString('en-US', { month: 'short' }),
    revenue: wallet.balance,
    transactions: wallet.lastTransactionAmount
  }));

  const chargesTimeline = chargesData.map(charge => ({
    name: new Date(charge.createdAt).toLocaleDateString('en-US', { month: 'short' }),
    amount: charge.amount,
    type: charge.name
  }));

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeMenu={activeMenu}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section with Admin Name */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {adminProfile?.firstName || 'Admin'}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 rounded-lg p-4">
                    <Calendar className="h-8 w-8 mb-2 mx-auto" />
                    <p className="text-sm text-center">System Status</p>
                    <p className="font-semibold text-center">All Systems Normal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Users Card */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 rounded-lg p-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {totalUsers > 0 ? '+12.5%' : '0%'}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalUsers}</h3>
                <p className="text-gray-600 text-sm font-medium mb-2">Total Users</p>
                <p className="text-gray-500 text-xs">Registered platform users</p>
              </div>

              {/* Total Revenue Card */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500 rounded-lg p-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {totalRevenue > 0 ? '+8.2%' : '0%'}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {totalRevenue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </h3>
                <p className="text-gray-600 text-sm font-medium mb-2">Total Revenue</p>
                <p className="text-gray-500 text-xs">Combined wallet balances</p>
              </div>

           {/* Charges Card */}
<div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
  <div className="flex items-center justify-between mb-4">
    <div className="bg-purple-500 rounded-lg p-3">
      <CreditCard className="h-6 w-6 text-white" />
    </div>
    <div className="flex items-center text-sm font-medium text-green-600">
      <ArrowUpRight className="h-4 w-4 mr-1" />
      Active
    </div>
  </div>
  
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Charges</h3>
  
  {/* Topup Charge */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center">
      <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
      <span className="text-sm text-gray-600">Topup Charge:</span>
    </div>
    <span className="text-sm font-medium text-gray-900">
      {chargesData.find(charge => charge.name.includes('Topup'))?.amount.toLocaleString('en-NG', { 
        style: 'currency', 
        currency: 'NGN' 
      }) || '₦0'}
    </span>
  </div>
  
  {/* Withdrawal Charge */}
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
      <span className="text-sm text-gray-600">Withdrawal Charge:</span>
    </div>
    <span className="text-sm font-medium text-gray-900">
      {chargesData.find(charge => charge.name.includes('Withdrawal'))?.amount.toLocaleString('en-NG', { 
        style: 'currency', 
        currency: 'NGN' 
      }) || '₦0'}
    </span>
  </div>
  
  <div className="mt-4 pt-3 border-t border-gray-100">
    <p className="text-xs text-gray-500">System fee charges</p>
  </div>
</div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                    <p className="text-gray-600 text-sm">Wallet balances over time</p>
                  </div>
                </div>
                <div className="h-64">
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No revenue data available
                    </div>
                  )}
                </div>
              </div>

              {/* Charges Timeline Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Charges Timeline</h3>
                    <p className="text-gray-600 text-sm">Charge amounts by type</p>
                  </div>
                </div>
                <div className="h-64">
                  {chargesTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chargesTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Bar dataKey="amount" fill="#10B981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No charges data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <p className="text-gray-600 text-sm">Latest wallet activities</p>
              </div>
              <div className="divide-y divide-gray-100">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.lastTransactionType === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.lastTransactionType === 'credit' ? (
                            <ArrowUpRight className="h-5 w-5" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.walletName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.lastTransactionAmount.toLocaleString('en-NG', { 
                              style: 'currency', 
                              currency: 'NGN' 
                            })}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.lastTransaction).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No recent transactions
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Overview;