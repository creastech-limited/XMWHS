import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, History, Info, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AHeader from '../components/AHeader';
import Footer from '../components/Footer';
import axios from 'axios';

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
  isPinSet?: boolean;
  wallet: {
    balance: number;
    currency: string;
    walletId: string;
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
  receiver?: string; 
};

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [form, setForm] = useState({ 
    amount: '', 
    description: '', 
    storeEmail: '', 
    pin: '' 
  });
  const [formErrors, setFormErrors] = useState({ 
    amount: '', 
    storeEmail: '', 
    pin: '' 
  });
  const [needsStoreEmail, setNeedsStoreEmail] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<Transaction | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [authError, setAuthError] = useState('');

const [showPinModal, setShowPinModal] = useState(false);
const [pinData, setPinData] = useState({
  currentPin: '',
  pin: '',
  newPin: ''
});
const [isLoadingPin, setIsLoadingPin] = useState(false);
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
      console.log('Raw API response:', data);
      
      // Handle the nested response structure based on your API response
      let profile: User | undefined;
      let walletData: User["wallet"] | null = null;

      if (data.user?.data) {
        // Main user data is in data.user.data
        profile = data.user.data;
        // Wallet data is in data.user.wallet
        walletData = data.user.wallet;
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

      // Merge wallet data - it should be in data.user.wallet based on your API response
      if (walletData) {
        profile.wallet = {
          balance: walletData.balance || 0,
          currency: walletData.currency || 'NGN',
          walletId: walletData.walletId || '',
        };
      } else if (!profile.wallet) {
        // Fallback to default values if wallet data is missing
        profile.wallet = {
          balance: 0,
          currency: 'NGN',
          walletId: '',
        };
      }

      console.log('Wallet data extracted:', walletData);
      console.log('Final profile with wallet:', profile);

      console.log('Parsed user profile:', profile);
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
    // Store ID format: "GRE343652/68302b8272d28bf99cc6f62b"
    const [storeCode, actualStoreId] = storeId.split('/');
    
    return {
      name: `Parent Store (${storeCode})`,
      email: `store.${storeCode.toLowerCase()}@${actualStoreId.substring(0, 8)}.com`,
      accountNumber: `STORE-${actualStoreId.substring(0, 8)}`,
      storeId: actualStoreId,
      fullStoreId: storeId,
    };
  }, []);

  // Try to fetch parent store details - with fallback
  const fetchParentStoreDetails = useCallback(async (storeId: string, authToken: string) => {
    try {
      const actualStoreId = storeId.split('/')[1];
      const response = await fetch(`${API_BASE_URL}/api/store/${actualStoreId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Store details endpoint not available');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching parent store details:', error);
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
            setNeedsStoreEmail(true); 
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
  // PIN Update Handler
const handlePinUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation
  if (pinData.pin !== pinData.newPin) {
    alert('PINs do not match. Please ensure both PIN fields are identical.');
    return;
  }
  
  if (pinData.pin.length !== 4) {
    alert('PIN must be exactly 4 digits long.');
    return;
  }
  
  // Check if PIN contains only numbers
  if (!/^\d{4}$/.test(pinData.pin)) {
    alert('PIN must contain only numbers (0-9).');
    return;
  }
  
  setIsLoadingPin(true);
  
  try {
    if (user?.isPinSet) {
      // Update existing PIN
      if (!pinData.currentPin || pinData.currentPin.length !== 4) {
        alert('Please enter your current 4-digit PIN.');
        setIsLoadingPin(false);
        return;
      }
      
      if (!/^\d{4}$/.test(pinData.currentPin)) {
        alert('Current PIN must be 4 digits.');
        setIsLoadingPin(false);
        return;
      }
      
      await axios.post(`${API_BASE_URL}/api/pin/update`, {
        currentPin: pinData.currentPin,
        newPin: pinData.newPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('PIN updated successfully! Your new PIN is now active.');
    } else {
      // Set new PIN
      await axios.post(`${API_BASE_URL}/api/pin/set`, {
        pin: pinData.pin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('PIN set successfully! Your account is now more secure.');
      setUser(prev => prev ? { ...prev, isPinSet: true } : null);
    }
    
    // Clear form data and close modal
    setPinData({ currentPin: '', pin: '', newPin: '' });
    setShowPinModal(false);
    
  } catch (error: unknown) {
    console.error('PIN operation failed:', error);
    
    // More specific error messages
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { status?: number } }).response === 'object'
    ) {
      const response = (error as { response?: { status?: number } }).response;
      if (response?.status === 401) {
        alert('Current PIN is incorrect. Please try again.');
      } else if (response?.status === 400) {
        alert('Invalid PIN format. Please ensure your PIN is 4 digits.');
      } else {
        alert(`Failed to ${user?.isPinSet ? 'update' : 'set'} PIN. Please try again.`);
      }
    } else {
      alert(`Failed to ${user?.isPinSet ? 'update' : 'set'} PIN. Please try again.`);
    }
  } finally {
    setIsLoadingPin(false);
  }
};
const handlePinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  // Only allow digits and limit to 4 characters
  const numericValue = value.replace(/\D/g, '').slice(0, 4);
  setPinData(prev => ({ ...prev, [name]: numericValue }));
};

  // Form validation
  const validateForm = useCallback(() => {
    const errors = { amount: '', storeEmail: '', pin: '' };
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

    if (!form.pin) {
      errors.pin = 'PIN is required';
    } else if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) {
      errors.pin = 'PIN must be exactly 4 digits';
    }

    setFormErrors(errors);
    return !errors.amount && !errors.storeEmail && !errors.pin;
  }, [form.amount, form.storeEmail, form.pin, user, needsStoreEmail]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For PIN, only allow digits and limit to 4 characters
    if (name === 'pin') {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setForm(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Process transfer using the new API structure
  const handleSubmitTransfer = async () => {
    if (!validateForm() || !user || !parentStoreData || !token) {
      setShowConfirm(false);
      return;
    }

    setProcessing(true);
    setShowConfirm(false);

    try {
      const receiverEmail = needsStoreEmail ? form.storeEmail : parentStoreData.email;
      
      const response = await axios.post(
        `${API_BASE_URL}/api/transaction/transfer`,
        {
          receiverEmail: receiverEmail,
          amount: Number(form.amount),
          pin: form.pin
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Transfer successful:', response.data);

      // Update user wallet balance
      setUser(prev => prev ? {
        ...prev,
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance - Number(form.amount)
        }
      } : null);

      // Set transaction details from response
      if (response.data.transaction) {
        setTransactionDetails(response.data.transaction);
      } else {
        // Create a mock transaction detail if not returned
        setTransactionDetails({
          _id: response.data._id || 'unknown',
          reference: response.data.reference || 'Transfer to Store',
          receiver: receiverEmail,
          amount: Number(form.amount),
          status: 'completed',
          createdAt: new Date().toISOString(),
          transactionType: 'transfer',
          category: 'debit',
          balanceBefore: user.wallet.balance,
          balanceAfter: user.wallet.balance - Number(form.amount),
          description: form.description || 'Transfer to parent store',
          direction: 'outbound'
        });
      }

      setTransferComplete(true);

      // Refresh transactions
      const updatedTransactions = await fetchUserTransactions(token);
      setRecentTransactions(updatedTransactions.slice(0, 5));

    } catch (error: unknown) {
      console.error('Transfer error:', error);

      let errorMessage = 'An unknown error occurred';
      // Use AxiosError type guard for better type safety
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
          errorMessage = (error.response.data as { message?: string }).message || errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
        errorMessage = (error as { message?: string }).message || errorMessage;
      }

      setSnackbar(`Transfer failed: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  // Reset transfer form
  const resetTransfer = () => {
    setForm({ amount: '', description: '', storeEmail: '', pin: '' });
    setFormErrors({ amount: '', storeEmail: '', pin: '' });
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
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{user.wallet.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
           
         {/* PIN Management Button - Floating */}
<div className="fixed bottom-20 right-4 z-40">
  <button
    onClick={() => setShowPinModal(true)}
    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 min-w-max"
    title="Manage PIN"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <span className="text-sm font-medium">
      {user?.isPinSet ? 'Update PIN' : 'Set PIN'}
    </span>
  </button>
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
                  to="/agent" 
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
                  <label className="block text-sm font-medium mb-1">Transaction PIN *</label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      name="pin"
                      value={form.pin}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your 4-digit PIN"
                      maxLength={4}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.pin && <p className="text-red-500 text-sm mt-1">{formErrors.pin}</p>}
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
                  disabled={!form.amount || !form.pin || !!formErrors.amount || !!formErrors.pin || (needsStoreEmail && (!form.storeEmail || !!formErrors.storeEmail))}
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
                      {tx.receiver && (
                        <div className="text-xs text-gray-500">
                          Store ID: {tx.receiver.includes('/') ? tx.receiver.split('/')[1] : tx.receiver}
                        </div>
                      )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
            <div className="bg-white p-6 rounded shadow max-w-md w-full mx-4">
              <h4 className="font-semibold text-lg mb-2">Confirm Transfer</h4>
              <p className="mb-4">Please confirm the following details:</p>
              <ul className="text-sm space-y-2 mb-4">
                <li><strong>To:</strong> {parentStoreData?.name || 'Parent Store'}</li>
                <li><strong>Store ID:</strong> {parentStoreData?.storeId}</li>
                <li><strong>Email:</strong> {needsStoreEmail ? form.storeEmail : parentStoreData?.email}</li>
                <li><strong>Amount:</strong> ₦{parseFloat(form.amount).toLocaleString()}</li>
                {form.description && <li><strong>Description:</strong> {form.description}</li>}
                <li><strong>PIN:</strong> {'*'.repeat(form.pin.length)}</li>
              </ul>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitTransfer} 
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
      {/* PIN Management Modal */}
{showPinModal && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-xl">
              {user?.isPinSet ? 'Update Your PIN' : 'Set Your PIN'}
            </h4>
            <p className="text-blue-100 text-sm">
              {user?.isPinSet ? 'Change your 4-digit security PIN' : 'Create a 4-digit security PIN'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Modal Body */}
      <div className="p-6">
        <form onSubmit={handlePinUpdate} className="space-y-5">
          {user?.isPinSet && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current PIN
              </label>
              <input
                type="password"
                name="currentPin"
                value={pinData.currentPin}
                onChange={handlePinInputChange}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg text-center tracking-widest text-black"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {user?.isPinSet ? 'New PIN' : 'Create PIN'}
            </label>
            <input
              type="password"
              name="pin"
              value={pinData.pin}
              onChange={handlePinInputChange}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg text-center tracking-widest text-black"
              placeholder="••••"
              maxLength={4}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm {user?.isPinSet ? 'New ' : ''}PIN
            </label>
            <input
              type="password"
              name="newPin"
              value={pinData.newPin}
              onChange={handlePinInputChange}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg text-center tracking-widest text-black"
              placeholder="••••"
              maxLength={4}
              required
            />
          </div>
          
          {/* Security Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Security Note</p>
                <p className="text-xs text-blue-600 mt-1">
                  Your PIN must be exactly 4 digits (0-9). Keep it secure and don't share it with anyone.
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowPinModal(false);
                setPinData({ currentPin: '', pin: '', newPin: '' });
              }}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
              disabled={isLoadingPin}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              disabled={isLoadingPin}
            >
              {isLoadingPin ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  <span>{user?.isPinSet ? 'Updating...' : 'Setting...'}</span>
                </div>
              ) : (
                <span>{user?.isPinSet ? 'Update PIN' : 'Set PIN'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
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
            to="/agent"
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