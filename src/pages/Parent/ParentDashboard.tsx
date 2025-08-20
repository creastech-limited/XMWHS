import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  HandRaisedIcon,
  AcademicCapIcon,
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import Psidebar from '../../components/Psidebar';
import Footer from '../../components/Footer';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

interface Profile {
  name?: string;
  fullName?: string;
  avatar?: string;
  _id?: string;
  wallet?: {
    balance: number;
    [key: string]: number | undefined;
  };
}

interface Transaction {
  _id?: string;
  amount: number;
  category: 'credit' | 'debit';
  status: 'success' | 'pending' | 'failed';
  description?: string;
  createdAt: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalCredit: {
    success: number;
    pending: number;
  };
  totalDebit: {
    success: number;
    pending: number;
  };
}

interface TrendData {
  name: string;
  payment: number;
  transaction: number;
}

interface SpendingCategory {
  name: string;
  value: number;
  color: string;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  route: string;
}

const ParentDashboard: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalCredit: { success: 0, pending: 0 },
    totalDebit: { success: 0, pending: 0 },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('This Month');

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

  const handleUnauthorized = () => {
    auth?.logout(); // Clear any existing auth state
    navigate('/login');
  };

  const fetchTransactions = async () => {
    if (!auth?.token) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/transaction/getusertransaction`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.success && data.data) {
        setTransactions(data.data);

        setTransactionStats({
          totalTransactions: data.data.length,
          totalCredit: {
            success: data.data
              .filter(
                (t: Transaction) =>
                  t.category === 'credit' && t.status === 'success'
              )
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            pending: data.data
              .filter(
                (t: Transaction) =>
                  t.category === 'credit' && t.status === 'pending'
              )
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          },
          totalDebit: {
            success: data.data
              .filter(
                (t: Transaction) =>
                  t.category === 'debit' && t.status === 'success'
              )
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            pending: data.data
              .filter(
                (t: Transaction) =>
                  t.category === 'debit' && t.status === 'pending'
              )
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          },
        });
      }

      setIsLoading(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
      }
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!auth?.token) {
      handleUnauthorized();
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Full API Response:', response.data); // Debug log

      // Based on your API response structure, the user data is directly in response.data.user
      // And the wallet is a separate property within that user object
      const userData = response.data.user;
      
      console.log('User data:', userData); // Debug log
      console.log('Wallet data:', userData?.wallet); // Debug log

      setProfile(userData);
      await fetchTransactions();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          handleUnauthorized();
          return;
        }
      }
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth?.token) {
      handleUnauthorized();
    } else {
      fetchUserProfile();
    }
  }, [auth?.token]);

  // Enhanced wallet balance extraction with better error handling
  const getWalletBalance = (): number => {
    console.log('Getting wallet balance. Profile:', profile); // Debug log
    
    if (!profile) {
      console.log('No profile data available');
      return 0;
    }

    // Based on your API response, wallet should be directly accessible
    if (profile.wallet && typeof profile.wallet.balance === 'number') {
      console.log('Found wallet balance:', profile.wallet.balance);
      return profile.wallet.balance;
    }

    // Try alternative paths just in case
    // Try alternative balance property if present
    const altBalance = (profile as { balance?: number }).balance;
    if (typeof altBalance === 'number') {
      console.log('Found alternative balance:', altBalance);
      return altBalance;
    }

    // Try data.wallet if there's a nested data object
    const dataWallet =
      typeof (profile as { data?: { wallet?: { balance?: number } } }).data?.wallet?.balance === 'number'
        ? (profile as { data?: { wallet?: { balance?: number } } }).data!.wallet!.balance
        : undefined;
    if (typeof dataWallet === 'number') {
      console.log('Found data.wallet.balance:', dataWallet);
      return dataWallet;
    }

    console.log('No wallet balance found anywhere, defaulting to 0');
    console.log('Profile structure:', Object.keys(profile));
    return 0;
  };

  const walletBalance = getWalletBalance();
  const moneyOut = transactionStats.totalDebit.success;

  const prepareTrendData = (): TrendData[] => {
    const monthlyData = transactions.reduce(
      (
        acc: Record<string, { payment: number; transaction: number }>,
        transaction
      ) => {
        const date = new Date(transaction.createdAt);
        const monthKey = date.toLocaleString('default', { month: 'short' });

        if (!acc[monthKey]) {
          acc[monthKey] = { payment: 0, transaction: 0 };
        }

        if (transaction.status === 'success') {
          if (transaction.category === 'credit') {
            acc[monthKey].payment += transaction.amount;
          } else if (transaction.category === 'debit') {
            acc[monthKey].transaction += transaction.amount;
          }
        }

        return acc;
      },
      {}
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month) => ({
      name: month,
      payment: monthlyData[month]?.payment || 0,
      transaction: monthlyData[month]?.transaction || 0,
    }));
  };

  const prepareSpendingCategories = (): SpendingCategory[] => {
    const categorySpending = transactions
      .filter((t) => t.category === 'debit' && t.status === 'success')
      .reduce((acc: Record<string, number>, transaction) => {
        const category = transaction.description || 'Other';
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      }, {});

    const colors = [
      '#1a237e',
      '#f59e0b',
      '#10b981',
      '#ec4899',
      '#3b82f6',
      '#8b5cf6',
    ];

    return Object.entries(categorySpending).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  const trendData =
    transactions.length > 0
      ? prepareTrendData()
      : [
          { name: 'Jan', payment: 20000, transaction: 18000 },
          { name: 'Feb', payment: 25000, transaction: 22000 },
          { name: 'Mar', payment: 22000, transaction: 21000 },
          { name: 'Apr', payment: 30000, transaction: 28000 },
          { name: 'May', payment: 27000, transaction: 26000 },
          { name: 'Jun', payment: 32000, transaction: 30000 },
        ];

  const spendingCategories =
    transactions.length > 0
      ? prepareSpendingCategories()
      : [
          { name: 'School Fees', value: 45000, color: '#1a237e' },
          { name: 'Pocket Money', value: 15000, color: '#f59e0b' },
          { name: 'Books', value: 8000, color: '#10b981' },
          { name: 'Transport', value: 7000, color: '#ec4899' },
        ];

  const quickActions: QuickAction[] = [
    {
      icon: <CreditCardIcon className="w-8 h-8" />,
      label: 'Fund Wallet',
      color: 'bg-indigo-900',
      route: '/fundwallet',
    },
    {
      icon: <UsersIcon className="w-8 h-8" />,
      label: 'Transfer to Kids',
      color: 'bg-indigo-800',
      route: '/transfertokids',
    },
    {
      icon: <AcademicCapIcon className="w-8 h-8" />,
      label: 'Pay School Bills',
      color: 'bg-blue-600',
      route: '/payschoolbills',
    },
    {
      icon: <DocumentTextIcon className="w-8 h-8" />,
      label: 'Pay to Agent',
      color: 'bg-blue-700',
      route: '/paytoagent',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-4/5 max-w-xl">
          <p className="mb-4 text-center text-lg font-medium">
            Loading your dashboard...
          </p>
          <div className="w-full h-1 bg-gray-200 rounded">
            <div className="h-1 bg-indigo-900 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <p className="text-gray-700">
            Please try refreshing the page or log in again.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header profilePath="/psettings" />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col min-h-screen">
          <div className="flex flex-grow gap-6">
            <div className="z-[100] fixed top-20 left-0 h-[calc(100vh-6rem)]">
              <Psidebar />
            </div>

            <div className="flex-grow transition-all duration-300 lg:pl-64">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.route} className="block">
                    <div
                      className={`${action.color} text-white rounded-xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                    >
                      <div className="flex flex-col items-center p-6 space-y-3">
                        {action.icon}
                        <h3 className="text-lg font-medium">{action.label}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 text-white rounded-xl shadow-md p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Wallet Balance</h3>
                    <CreditCardIcon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">
                    ₦{walletBalance.toLocaleString()}
                  </p>
                  <p className="text-sm mt-2 opacity-90">
                    Available balance
                  </p>
                
                </div>

                <div className="bg-gradient-to-r from-rose-600 to-rose-400 text-white rounded-xl shadow-md p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Money Out</h3>
                    <ArrowUpIcon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">
                    ₦{moneyOut.toLocaleString()}
                  </p>
                  <p className="text-sm mt-2 opacity-90">
                    {transactionStats.totalDebit.pending > 0
                      ? `+${((transactionStats.totalDebit.pending / (moneyOut || 1)) * 100).toFixed(2)}% pending`
                      : '+0% pending'}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl shadow-md p-5 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium mb-3">Quick Transfer</h3>
                      <CreditCardIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm">
                      Transfer money to your kids and pay school bills.
                    </p>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-10">
                    <HandRaisedIcon className="w-32 h-32" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Payment & Transaction Trends
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-1 px-3 py-1 text-gray-700 rounded-md hover:bg-gray-100"
                      >
                        {selectedPeriod}
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-md py-1 z-10 w-36">
                          {['This Week', 'This Month', 'This Year'].map(
                            (period) => (
                              <button
                                key={period}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                onClick={() => {
                                  setSelectedPeriod(period);
                                  setMenuOpen(false);
                                }}
                              >
                                {period}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="payment"
                          fill="#1a237e"
                          radius={[4, 4, 0, 0]}
                          name="Payment"
                        />
                        <Bar
                          dataKey="transaction"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                          name="Transaction"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Spending Categories
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingCategories}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {spendingCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Recent Activities
                </h3>
                {transactions.length > 0 ? (
                  <div className="space-y-1">
                    {transactions.slice(0, 4).map((activity, index) => (
                      <React.Fragment key={activity._id || index}>
                        <div className="flex justify-between items-center py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                activity.category === 'credit'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-rose-100 text-rose-600'
                              }`}
                            >
                              {activity.category === 'credit' ? (
                                <ArrowUpIcon className="w-5 h-5" />
                              ) : (
                                <ArrowDownIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {activity.description ||
                                  (activity.category === 'credit'
                                    ? 'Credit'
                                    : 'Debit')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  activity.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                activity.category === 'credit'
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {activity.category === 'credit' ? '+' : '-'}₦
                              {activity.amount.toLocaleString()}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                activity.status === 'success'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {activity.status}
                            </span>
                          </div>
                        </div>
                        {index < 3 && <div className="h-px bg-gray-100"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No recent transactions
                  </p>
                )}
                <div className="flex justify-center mt-5">
                  <Link
                    to="/ptransactionhistory"
                    className="px-6 py-2 rounded-lg border border-indigo-900 text-indigo-900 hover:bg-indigo-50 transition-colors"
                  >
                    View All Transactions
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;