import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaWallet, FaUsers, FaStore, FaCalendarAlt } from 'react-icons/fa';

interface Stats {
  balance: number;
  totalStudents: number;
  totalStores: number;
}

interface PieDataEntry {
  name: string;
  value: number;
  color: string;
}

interface BarDataEntry {
  month: string;
  fees: number;
}

type SnackbarSeverity = 'success' | 'error';

interface Transaction {
  id: string;
  _id?: string;
  date: string;
  createdAt?: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
  direction?: string;
}

interface Wallet {
  id: string;
  balance: number;
  currency: string;
  type: string;
  // ... other wallet properties
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  balance?: number;
  wallet?: Wallet;
  [key: string]: unknown;
}

interface Student {
  _id: string;
  classLevel: string;
  createdAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth?.user || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    balance: 0,
    totalStudents: 0,
    totalStores: 0,
  });

  const [pieData, setPieData] = useState<PieDataEntry[]>([]);
  const [barData, setBarData] = useState<BarDataEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Show error and logout
  const handleAuthError = useCallback(
    (message: string) => {
      setAuthError(message);
      setSnackbar({ open: true, message, severity: 'error' });
      auth?.logout?.();
      setUser(null);
    },
    [auth]
  );

  // Enhanced fetchUserDetails function with better balance handling
  const fetchUserDetails = useCallback(
  async (authToken: string): Promise<User> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);

      const data = await res.json();

      console.log('Full API Response:', JSON.stringify(data, null, 2));

      let profile: User | undefined;
      let userBalance: number = 0;

      // Try different possible response structures
      if (data.user?.data) {
        profile = data.user.data;
        // Check if wallet exists and has balance
        if (data.user.wallet?.balance !== undefined) {
          userBalance = data.user.wallet.balance;
        }
      } else if (data.data) {
        profile = data.data;
        if (data.wallet?.balance !== undefined) {
          userBalance = data.wallet.balance;
        }
      } else if (data.user) {
        profile = data.user as User;
        if (data.user.wallet?.balance !== undefined) {
          userBalance = data.user.wallet.balance;
        }
      } else {
        profile = data as User;
        if (data.wallet?.balance !== undefined) {
          userBalance = data.wallet.balance;
        }
      }

      // Convert balance to number if it's a string
      if (typeof userBalance === 'string') {
        userBalance = parseFloat(userBalance) || 0;
      }

      console.log('Extracted profile:', profile);
      console.log('Extracted balance (raw):', userBalance);
      console.log('Balance type:', typeof userBalance);

      if (!profile?._id) throw new Error('Invalid user payload');

      // Create updated profile with balance
      const updatedProfile = { 
        ...profile, 
        balance: userBalance 
      };

      console.log('Updated profile with balance:', updatedProfile);

      // Update user state
      setUser(updatedProfile);
      
      // Update stats with the balance - do this immediately
      setStats(prevStats => {
        const newStats = {
          ...prevStats,
          balance: userBalance
        };
        console.log('Setting stats with balance:', newStats);
        return newStats;
      });
      
      // Update auth context
      auth?.login?.(updatedProfile, authToken);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },
  [auth]
);

  // Fetch students data for distribution
 const fetchStudentsData = useCallback(async (userId: string, authToken: string) => {
  try {
    // First fetch the classes data
    const classesResponse = await fetch(`${API_BASE_URL}/api/users/getclasse`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (!classesResponse.ok) throw new Error('Failed to fetch classes');
    
    const classesData = await classesResponse.json();
    
    // Process classes data for pie chart (class distribution)
    if (classesData.data && Array.isArray(classesData.data)) {
      // Create data for pie chart
      const pieColors = ['#42a5f5', '#66bb6a', '#ffca28', '#ef5350', '#ab47bc', '#26c6da'];
      
    interface ClassItem {
      className: string;
      students?: Student[];
      [key: string]: unknown;
    }

    const pieData: PieDataEntry[] = (classesData.data as ClassItem[])
      .filter((classItem: ClassItem) => classItem.className) // ensure className exists
      .map((classItem: ClassItem, index: number): PieDataEntry => ({
        name: classItem.className,
        value: classItem.students?.length || 0,
        color: pieColors[index % pieColors.length]
      }));
      
      // Calculate total students
      const totalStudents = classesData.data.reduce(
        (sum: number, classItem: ClassItem) => sum + (classItem.students?.length || 0), 
        0
      );
      
      setPieData(pieData);
      setStats(prev => ({
        ...prev, 
        totalStudents,
        totalStores: 0 // You might want to update this with actual store data
      }));
    }
  } catch (error) {
    console.error('Error fetching classes data:', error);
    setSnackbar({
      open: true,
      message: 'Failed to load class data',
      severity: 'error'
    });
  }
}, []);

  // Fetch transactions data with proper credit/debit handling
  const fetchTransactionsData = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      
      console.log('Transactions API Response:', JSON.stringify(data, null, 2));
      
      if (data.data && Array.isArray(data.data)) {
        // Process recent transactions with proper credit/debit logic
        const recentTransactions = data.data
          .slice(0, 4)
          .map((tx: Transaction) => {
            // Determine transaction type based on category and direction
            let transactionType: 'credit' | 'debit' = 'credit';
            
            // Use the direction field if available, otherwise fall back to category
            if (tx.direction) {
              transactionType = tx.direction === 'credit' ? 'credit' : 'debit';
            } else if (tx.category) {
              transactionType = tx.category === 'credit' ? 'credit' : 'debit';
            }
            
            return {
              id: tx.id || tx._id,
              date: tx.createdAt || tx.date,
              description: tx.description || 'Transaction',
              amount: tx.amount,
              type: transactionType
            };
          });
        
        setTransactions(recentTransactions);
        
        // Process fee collection trend (last 6 months) - only credit transactions
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const last6Months = Array.from({length: 6}, (_, i) => {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          return {
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            monthIndex: date.getMonth()
          };
        }).reverse();
        
        const feeData = last6Months.map(({month, year, monthIndex}) => {
          const monthlyTotal = data.data
            .filter((tx: Transaction) => {
              const txDate = new Date(tx.createdAt || tx.date);
              const txMonth = txDate.getMonth();
              const txYear = txDate.getFullYear();
              
              // Check if it's a credit transaction (fee received)
              const isCredit = tx.direction === 'credit' || tx.category === 'credit';
              
              return txMonth === monthIndex && txYear === year && isCredit;
            })
            .reduce((sum: number, tx: Transaction) => sum + (tx.amount || 0), 0);
          
          return {
            month,
            fees: monthlyTotal
          };
        });
        
        console.log('Processed fee data:', feeData);
        setBarData(feeData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load transaction data',
        severity: 'error'
      });
    }
  }, []);

  // Enhanced initialization with better balance handling
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Check if we already have user data in context with valid balance
        if (auth?.user?._id && auth?.token && typeof auth.user?.balance === 'number') {
          console.log('Using context user with balance:', auth.user.balance);
          setUser(auth.user);
          setStats(prev => ({
            ...prev,
            balance: (auth.user && typeof auth.user.balance === 'number') ? auth.user.balance : 0
          }));
          
          // Still fetch other data
          await Promise.all([
            fetchStudentsData(auth.user._id, auth.token),
            fetchTransactionsData(auth.token)
          ]);
          
          setLoading(false);
          return;
        }

        // Try localStorage for token
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching fresh user data...');
        // Fetch fresh user data
        const profile = await fetchUserDetails(storedToken);
        
        console.log('Profile fetched, balance should be:', profile.balance);

        // After successful auth, fetch other data
        if (profile._id) {
          await Promise.all([
            fetchStudentsData(profile._id, storedToken),
            fetchTransactionsData(storedToken)
          ]);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth?.token, fetchUserDetails, fetchStudentsData, fetchTransactionsData, handleAuthError]);

  // Debug effect to monitor stats changes
  useEffect(() => {
    console.log('Stats updated:', stats);
  }, [stats]);

  // Debug effect to monitor user changes
  useEffect(() => {
    console.log('User updated:', user);
  }, [user]);

  // auto-hide snackbar
  useEffect(() => {
    if (!snackbar.open) return;
    const t = setTimeout(
      () => setSnackbar((s) => ({ ...s, open: false })),
      6000
    );
    return () => clearTimeout(t);
  }, [snackbar.open]);

  // redirect on error
  useEffect(() => {
    if (authError) setTimeout(() => (window.location.href = '/login'), 3000);
  }, [authError]);

  if (loading)
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-grow">
          <div className="z-[100] hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow z-10">
            <Asidebar />
          </div>
          <main className="flex-1 p-4 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-r-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-indigo-800">Loading...</p>
          </main>
        </div>
        <Footer />
      </div>
    );

    
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
            <Asidebar />
          </aside>

        <main className="flex-grow p-4 md:p-8 md:ml-64">
          {/* Top Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
                  School Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back,{' '}
                  {user && user.name ? user.name : 'Administrator'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                <FaWallet className="text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Wallet Balance
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                 ₦{stats.balance.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                 {stats.balance > 0 ? '+5.3% from last month' : 'No balance history'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <FaUsers className="text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Students
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalStudents.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +12 new this week
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                <FaStore className="text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Stores
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalStores.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +2 new this month
                </p>
              </div>
            </div>
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Student Distribution
                </h3>
                <select
                  className="text-sm border border-gray-300 rounded p-1 bg-white text-gray-600"
                  aria-label="Student distribution period"
                >
                  <option>This Year</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="w-full h-64">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartTooltip
                        content={({ payload, label }) => (
                          <div className="bg-white p-2 shadow rounded text-sm">
                            <p>{label}</p>
                            {payload?.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {entry.value}
                              </p>
                            ))}
                          </div>
                        )}
                      />
                      <Legend verticalAlign="bottom" layout="horizontal" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No student data available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Fee Collection Trend
                </h3>
                <select
                  className="text-sm border border-gray-300 rounded p-1 bg-white text-gray-600"
                  aria-label="Fee collection period"
                >
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className="w-full h-64">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartTooltip />
                      <Bar
                        dataKey="fees"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No fee data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions & Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => (window.location.href = '/transactions')}
                  className="text-indigo-600 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="overflow-y-auto max-h-72">
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-full mr-3 ${transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                          >
                            <FaWallet className="text-sm" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                transaction.date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}₦
                          {transaction.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-8">
                    No transactions available.
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  School Calendar
                </h3>
                <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                  <FaCalendarAlt className="text-sm" />
                </div>
              </div>
              <div className="flex justify-center text-black">
                <Calendar
                  onChange={(value) => {
                    if (value instanceof Date) {
                      setCalendarDate(value);
                    } else if (
                      Array.isArray(value) &&
                      value[0] instanceof Date
                    ) {
                      setCalendarDate(value[0]);
                    }
                  }}
                  value={calendarDate}
                  className="react-calendar rounded-lg w-full border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border-l-4 ${
            snackbar.severity === 'success'
              ? 'border-green-500'
              : 'border-red-500'
          } transition-all duration-300 z-50`}
        >
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full mr-3 ${
                snackbar.severity === 'success'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {snackbar.severity === 'success' ? '✓' : '✕'}
            </div>
            <p className="text-sm text-gray-800">{snackbar.message}</p>
          </div>
          <button
            onClick={() => setSnackbar((s) => ({ ...s, open: false }))}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;