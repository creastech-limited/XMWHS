import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, History, Info, AlertCircle } from 'lucide-react';
import AHeader from '../components/AHeader';
import Footer from '../components/Footer';

// Types
type User = {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  accountNumber: string;
  role: string;
  agent_id: string;
  store_id: string;
  wallet: {
    id: string;
    balance: number;
    currency: string;
    type: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
};

type Transaction = {
  _id: string;
  transactionType: string;
  category: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: string;
  createdAt: string;
  direction: string;
  receiver?: string; // Added to match usage in the code
};

type TransferData = {
  amount: number;
  description: string;
  receiverEmail: string;
};

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

const AgentTransferToStore = () => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  type ParentStoreData = {
    name: string;
    email: string;
    accountNumber: string;
    storeId: string;
    fullStoreId: string;
  } | null;
  
    const [parentStoreData, setParentStoreData] = useState<ParentStoreData>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // Form state
  const [form, setForm] = useState({ amount: '', description: '', storeEmail: '' });
  const [formErrors, setFormErrors] = useState({ amount: '', storeEmail: '' });
  const [needsStoreEmail, setNeedsStoreEmail] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<Transaction | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [authError, setAuthError] = useState('');

  // Authentication and data fetching
  const fetchUserDetails = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
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
        throw new Error('Invalid user data received');
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }, []);

  const fetchUserTransactions = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }, []);

  const generateParentStoreInfo = useCallback((storeId: string) => {
    // Extract the store ID from the format "GRE343652/68302b8272d28bf99cc6f62b"
    const parts = storeId.split('/');
    const storeCode = parts[0] || 'UNKNOWN';
    const actualStoreId = parts[1];
    
    // Generate a store email based on the store ID pattern
    const storeEmail = `store.${storeCode.toLowerCase()}@${actualStoreId?.substring(0, 8) || 'unknown'}.com`;
    
    return {
      name: `Parent Store (${storeCode})`,
      email: storeEmail,
      accountNumber: `STORE-${actualStoreId?.substring(0, 8) || 'UNKNOWN'}`,
      storeId: actualStoreId,
      fullStoreId: storeId,
    };
  }, []);

  // Try to fetch parent store details - with fallback
  const fetchParentStoreDetails = useCallback(async (storeId: string, authToken: string) => {
    try {
      // Extract the store ID from the format "GRE343652/68302b8272d28bf99cc6f62b"
      const actualStoreId = storeId.split('/')[1];
      
      // Try different possible endpoints
      const endpoints = [
        `api/users/getstorebyid${actualStoreId}`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Successfully fetched store details from:', endpoint);
            return data.user?.data || data.data || data.user || data;
          }
        } catch (error) {
          console.log(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }

      throw new Error('All store endpoints failed');
    } catch (error) {
      console.error('Error fetching parent store details:', error);
      // Return fallback data if API call fails
      return null;
    }
  }, []);

  // Initialize authentication and data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Starting auth initialization...');

        // Try localStorage first
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          setAuthError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }

        console.log('Found token in localStorage');
        setToken(storedToken);

        // Fetch user details
        const userProfile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', userProfile);

        // Verify user is an agent
        if (userProfile.role !== 'agent') {
          setAuthError('Access denied. This page is only for agents.');
          setLoading(false);
          return;
        }

        setUser(userProfile);

        // Try to fetch parent store details, fallback to generated info
        if (userProfile.store_id) {
          console.log('Attempting to fetch parent store details for:', userProfile.store_id);
          
          const storeDetails = await fetchParentStoreDetails(userProfile.store_id, storedToken);
          if (storeDetails) {
            console.log('Successfully fetched store details:', storeDetails);
            setParentStoreData(storeDetails);
          } else {
            console.log('Using fallback store info');
            const fallbackStoreInfo = generateParentStoreInfo(userProfile.store_id);
            setParentStoreData(fallbackStoreInfo);
            setNeedsStoreEmail(true); // User needs to provide store email
          }
        } else {
          console.log('No store_id found for user');
        }

        // Fetch recent transactions
        const transactions = await fetchUserTransactions(storedToken);
        setRecentTransactions(transactions.slice(0, 5)); // Show last 5 transactions

      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUserDetails, fetchUserTransactions, generateParentStoreInfo, fetchParentStoreDetails]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = { amount: '', storeEmail: '' };
    const amount = parseFloat(form.amount);
    
    if (!form.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Enter a valid amount';
    } else if (user && amount > user.wallet.balance) {
      errors.amount = 'Insufficient balance';
    }

    if (needsStoreEmail && !form.storeEmail) {
      errors.storeEmail = 'Store email is required';
    } else if (needsStoreEmail && form.storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.storeEmail)) {
      errors.storeEmail = 'Enter a valid email address';
    }

    setFormErrors(errors);
    return !errors.amount && !errors.storeEmail;
  }, [form.amount, form.storeEmail, user, needsStoreEmail]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Process transfer
  const handleTransfer = async () => {
    if (!validateForm() || !user || !parentStoreData || !token) {
      setShowConfirm(false);
      return;
    }

    setProcessing(true);
    setShowConfirm(false);

    try {
      const transferData: TransferData = {
        amount: parseFloat(form.amount),
        description: form.description || 'Transfer to parent store',
        receiverEmail: needsStoreEmail ? form.storeEmail : parentStoreData.email,
      };

      const response = await fetch(`${API_BASE_URL}/api/wallet/walletToWalletTransfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transfer failed');
      }

      const result = await response.json();
      console.log('Transfer successful:', result);

      // Update user wallet balance
      setUser(prev => prev ? {
        ...prev,
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance - transferData.amount
        }
      } : null);

      setTransactionDetails(result.transaction);
      setTransferComplete(true);

      // Refresh transactions
      const updatedTransactions = await fetchUserTransactions(token);
      setRecentTransactions(updatedTransactions.slice(0, 5));

    } catch (error: unknown) {
      console.error('Transfer error:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      setSnackbar(`Transfer failed: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  // Reset transfer form
  const resetTransfer = () => {
    setForm({ amount: '', description: '', storeEmail: '' });
    setFormErrors({ amount: '', storeEmail: '' });
    setTransferComplete(false);
    setTransactionDetails(null);
  };

  // Detect mobile
  const isMobile = window.innerWidth <= 640;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8faff]">
        <AHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (authError || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8faff]">
        <AHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{authError}</p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
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
        <div className="mx-auto py-8 px-4" 
             style={isMobile ? { maxWidth: '100%' } : { maxWidth: '800px' }}>
          
          {/* Agent Info Card */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
                <p className="text-gray-600">Agent ID: {user.agent_id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{user.wallet.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {transferComplete ? (
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="text-green-600 w-10 h-10" />
              </div>
              <h2 className="text-green-700 text-xl font-bold mb-2">Transfer Successful!</h2>
              <p className="mb-4">
                You transferred <strong>₦{parseFloat(form.amount).toLocaleString()}</strong> to{' '}
                <strong>{parentStoreData?.name || 'Parent Store'}</strong>.
              </p>
              {transactionDetails && (
                <div className="bg-gray-100 p-4 rounded my-4 text-sm text-gray-700">
                  <p><strong>Transaction ID:</strong> {transactionDetails.reference}</p>
                  <p><strong>Receiver:</strong> {transactionDetails.receiver}</p>
                  <p><strong>Amount:</strong> ₦{transactionDetails.amount.toLocaleString()}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                </div>
              )}
              <div className="flex justify-center gap-4">
                <button 
                  onClick={resetTransfer} 
                  className="border px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  New Transfer
                </button>
                <Link 
                  to="/agent/dashboard" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (validateForm()) setShowConfirm(true); }}>
              <div className="text-gray-600 bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5" />
                  Transfer to Parent Store
                </h2>

                {parentStoreData && (
                  <div className="flex items-center gap-2 bg-blue-100 text-blue-800 p-3 rounded mb-4 text-sm">
                    <Info className="w-4 h-4" />
                    <div>
                      <p><strong>Store:</strong> {parentStoreData.name}</p>
                      {!needsStoreEmail && <p><strong>Email:</strong> {parentStoreData.email}</p>}
                      <p><strong>Account:</strong> {parentStoreData.accountNumber}</p>
                      <p><strong>Store ID:</strong> {parentStoreData.fullStoreId}</p>
                    </div>
                  </div>
                )}

                {needsStoreEmail && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    <p className="text-sm">
                      <strong>Note:</strong> Please enter your parent store's email address to complete the transfer.
                    </p>
                  </div>
                )}

                {needsStoreEmail && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Parent Store Email *</label>
                    <input
                      type="email"
                      name="storeEmail"
                      value={form.storeEmail}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter parent store email"
                      required
                    />
                    {formErrors.storeEmail && <p className="text-red-500 text-sm mt-1">{formErrors.storeEmail}</p>}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    min="1"
                    max={user.wallet.balance}
                  />
                  {formErrors.amount && <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!form.amount || !!formErrors.amount || (needsStoreEmail && (!form.storeEmail || !!formErrors.storeEmail))}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition-colors"
                >
                  Transfer Funds
                </button>
              </div>
            </form>
          )}

          {!transferComplete && (
            <div className="text-gray-600 bg-white shadow-md rounded-lg p-4 mt-6">
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <History className="w-4 h-4" />
                Recent Transactions
              </h3>
              {recentTransactions.length > 0 ? (
                recentTransactions.map(tx => (
                  <div key={tx._id} className="flex justify-between items-center bg-gray-100 p-3 rounded mb-2">
                    <div>
                      <div className="text-sm font-medium">{tx.reference}</div>
                      <div className="text-xs text-gray-500">{tx.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${tx.category === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.category === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">No recent transactions</p>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow max-w-md w-full mx-4">
              <h4 className="font-semibold text-lg mb-2">Confirm Transfer</h4>
              <p className="mb-4">Please confirm the following details:</p>
              <ul className="text-sm space-y-2 mb-4">
                <li><strong>To:</strong> {parentStoreData?.name || 'Parent Store'}</li>
                <li><strong>Email:</strong> {needsStoreEmail ? form.storeEmail : parentStoreData?.email}</li>
                <li><strong>Amount:</strong> ₦{parseFloat(form.amount).toLocaleString()}</li>
                {form.description && <li><strong>Description:</strong> {form.description}</li>}
              </ul>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTransfer} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Modal */}
        {processing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
              <p>Processing transfer...</p>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {snackbar && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
            {snackbar}
            <button onClick={() => setSnackbar('')} className="ml-4 underline text-sm">
              Dismiss
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/agent/dashboard"
            className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <span className="text-white">Back to Dashboard</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AgentTransferToStore;