import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Psidebar from '../../components/Psidebar';
import Footer from '../../components/Footer';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: string;
}

interface UserData {
  username: string;
  balance: number;
  email: string;
  lastTransactions: Transaction[];
}
interface Charge {
  _id: string;
  name: string;
  chargeType: string;
  amount: number;
  amount2?: number;
  amount3?: number;
  description: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FundWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const token = authContext?.token;
  const authToken = token || localStorage.getItem('token');
  
  // User data state
  const [userData, setUserData] = useState<UserData>({
    username: "",
    balance: 0,
    email: "",
    lastTransactions: []
  });

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [activeStep, setActiveStep] = useState<number>(0);
  const [quickAmounts] = useState<number[]>([5000, 10000, 20000, 50000]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactionFee, setTransactionFee] = useState<number>(0);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
  if (!authToken) {
    navigate('/login'); 
    return;
  }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallet/getuserwallet`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.data?.balance) {
        setUserData(prev => ({
          ...prev,
          balance: response.data.data.balance
        }));
      }
    } catch (error: unknown) {
      console.error('Error fetching wallet balance:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setSnackbar({
          open: true,
          message: error.response.data.message,
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to fetch wallet balance',
          severity: 'error'
        });
      }
    }
  };

  // Fetch user profile
 useEffect(() => {
  const fetchUserProfile = async () => {
    if (!authToken) {
      setIsLoading(false);
      navigate('/login'); 
      setSnackbar({
        open: true,
        message: 'You need to be logged in to access this page',
        severity: 'error'
      });
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
        
        if (response.data?.user) {
          const profile = response.data.user;
          const id = profile.data._id;
          setUserId(id);
          
          setUserData({
            username: profile.data.name || profile.data.username || "User",
            balance: 0,
            email: profile.data.email || "",
            lastTransactions: profile.data.transactions || []
          });
          
          setEmail(profile.data.email || "");
          await fetchWalletBalance();
        }
      } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Handle 401 Unauthorized (token expired)
        navigate('/login'); 
      }
      console.error('Error fetching user profile:', error);
      setSnackbar({
        open: true,
        message: axios.isAxiosError(error) && error.response?.data?.message 
          ? error.response.data.message 
          : 'Failed to fetch user profile',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
    
   fetchUserProfile();
}, [authToken, navigate]);

// Quick amount selection
const handleQuickAmountClick = async (value: number) => {
  setAmount(value.toString());
  setActiveStep(1);
  
  // Calculate transaction fee inline
  if (authToken) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/charge/getallcharges`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const charges: Charge[] = response.data as Charge[];
        const topupCharge = charges.find((charge: Charge) => 
          charge.name.toLowerCase().includes('topup') && charge.status === 'Active'
        );
        
        if (topupCharge) {
          const calculatedFee = calculateCharge(value, topupCharge);
          setTransactionFee(calculatedFee);
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching transaction charges:', error);
      setTransactionFee(0);
    }
  }
};

const handleAmountChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const inputValue = e.target.value;
  setAmount(inputValue);
  setActiveStep(inputValue ? 1 : 0);
  
  // Calculate transaction fee inline
  const numericAmount = Number(inputValue) || 0;
  if (authToken && numericAmount > 0) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/charge/getallcharges`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const charges: Charge[] = response.data as Charge[];
        const topupCharge = charges.find((charge: Charge) => 
          charge.name.toLowerCase().includes('topup') && charge.status === 'Active'
        );
        
        if (topupCharge) {
          const calculatedFee = calculateCharge(inputValue, topupCharge);
          setTransactionFee(calculatedFee);
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching transaction charges:', error);
      setTransactionFee(0);
    }
  } else {
    setTransactionFee(0);
  }
};


const calculateCharge = (transactionAmount: number | string, charge: Charge): number => {
  let chargeAmount = 0;
  const amt = Number(transactionAmount) || 0;
  
  if (charge.chargeType === 'Flat') {
    chargeAmount = charge.amount;
  } 
  else if (charge.chargeType === 'Percentage') {
    let computedPercent = 0;
    
    if (amt > 0 && amt <= 50000) {
      computedPercent = (amt * (charge.amount || 0)) / 100;
    } 
    else if (amt > 50000 && amt <= 150000) {
      computedPercent = (amt * (charge.amount2 || 0)) / 100;
    } 
    else if (amt > 150000) {
      computedPercent = (amt * (charge.amount3 || 0)) / 100;
    }
    
    chargeAmount = Math.min(computedPercent, 2500);
  }
   
  return chargeAmount;
 console.log('Calculated charge amount:', chargeAmount);
};

  // Fetch transaction
  const fetchTransactions = async () => {
    if (!authToken || !userId) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.transactions) {
        interface TransactionData {
          _id: string;
          amount: number;
          createdAt: string;
          status: string;
        }

        const formattedTransactions: Transaction[] = response.data.transactions.map((tx: TransactionData, index: number) => ({
          id: tx._id || index.toString(),
          amount: tx.amount,
          date: new Date(tx.createdAt).toLocaleDateString('en-US', 
            {month: 'short', day: 'numeric', year: 'numeric'}),
          status: tx.status
        }));
        
        setUserData(prev => ({
          ...prev,
          lastTransactions: formattedTransactions
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

 

  const validateForm = (): boolean => {
    return !!amount && Number(amount) > 0 && !!email && email.includes('@');
  };

  // Initiate transaction
  const initiateTransaction = async () => {
    if (!validateForm()) return;
    if (!authToken) {
      setSnackbar({
        open: true,
        message: 'Authentication required to initiate transaction',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      
      const response = await axios.post(`${API_BASE_URL}/api/transaction/initiateTransaction`, 
        {
          email,
          amount: Number(amount) ,
          callback_url: callbackUrl
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
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
      if (axios.isAxiosError(error)) {
        console.error('Error initiating transaction:', error.message);
        setSnackbar({
          open: true,
          message: axios.isAxiosError(error) && error.response?.data?.message 
            ? error.response.data.message 
            : 'Failed to initiate payment',
          severity: 'error'
        });
      } else {
        console.error('Unexpected error:', error);
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify transaction
  const verifyTransaction = async (reference: string) => {
    if (!authToken) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transaction/verifyTransaction/${reference}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Payment successful! Your wallet has been funded.',
          severity: 'success'
        });
        
        await fetchWalletBalance();
        await fetchTransactions();
        setAmount('');
        setActiveStep(0);
      }
    } catch (error: unknown) {
      console.error('Error verifying transaction:', error);
      setSnackbar({
        open: true,
        message: axios.isAxiosError(error) && error.response?.data?.message 
          ? error.response.data.message 
          : 'Failed to verify payment',
        severity: 'error'
      });
    }
  };
  
  // Check for payment callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || localStorage.getItem('paymentReference');
    
    if (reference) {
      localStorage.removeItem('paymentReference');
      verifyTransaction(reference);
    }
  }, [authToken]);
  
  // Fetch transactions
  useEffect(() => {
    if (authToken && userId) {
      fetchTransactions();
    }
  }, [authToken, userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-4/5 max-w-xl">
          <p className="mb-4 text-center text-lg font-medium">
            Loading ...
          </p>
          <div className="w-full h-1 bg-gray-200 rounded">
            <div className="h-1 bg-indigo-900 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!authToken) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
        <p className="mb-6 text-gray-700">
          You need to be logged in to access the wallet funding page.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-lg hover:from-indigo-800 hover:to-indigo-900 transition-colors shadow-md"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-gray-50">
         <div className="min-h-screen bg-gray-50 flex flex-col">
           <Header profilePath="/psettings"/>
           
           <div className="z-[100] flex flex-grow gap-6">
             <Psidebar />
         </div>  
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex-grow md:ml-64">
          <div className="max-w-4xl mx-auto">
            {/* Display user balance */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-700">Wallet Balance</h2>
              <p className="text-2xl font-bold text-indigo-700">₦{userData.balance.toLocaleString()}</p>
            </div>
          
            {/* Display last transactions */}
            
           <div className="bg-white p-6 rounded-xl shadow-md">
  <h1 className="text-2xl md:text-3xl font-bold text-center text-black mb-6">
    Fund Your Wallet
  </h1>

  {/* Stepper */}
  <div className="flex justify-between mb-8 max-w-md mx-auto">
    {[1, 2, 3].map((step) => (
      <div key={step} className="flex flex-col items-center">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${
            activeStep >= step - 1
              ? 'bg-indigo-700 text-white'
              : 'bg-gray-200 text-black'
          }`}
        >
          {step}
        </div>
        <span
          className={`text-sm mt-2 ${
            activeStep >= step - 1
              ? 'text-indigo-700 font-medium'
              : 'text-black'
          }`}
        >
          {['Select Amount', 'Confirm Details', 'Complete Payment'][step - 1]}
        </span>
      </div>
    ))}
  </div>

  {/* Quick Select */}
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4 text-black">Quick Select</h3>
    <div className="flex flex-wrap gap-3">
      {quickAmounts.map((quickAmount) => (
        <button
          key={quickAmount}
          onClick={() => handleQuickAmountClick(quickAmount)}
          className={`px-4 py-3 rounded-lg ${
            Number(amount) === quickAmount
              ? 'bg-indigo-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-black'
          } transition-colors`}
        >
          ₦{quickAmount.toLocaleString()}
        </button>
      ))}
      <button
        onClick={() => setAmount('')}
        className={`px-4 py-3 rounded-lg flex items-center gap-1 ${
          !quickAmounts.includes(Number(amount)) && amount
            ? 'bg-indigo-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-black'
        } transition-colors`}
      >
        <PlusIcon className="h-5 w-5" />
        <span>Custom</span>
      </button>
    </div>
  </div>

  {/* Form */}
  <div className="space-y-6">
    <div>
      <label htmlFor="amount" className="block text-sm font-medium text-black mb-1">
        Amount to Fund
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">₦</span>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={handleAmountChange}
          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
          placeholder="Enter amount"
        />
      </div>
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
        Email for Receipt
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
        placeholder="Your email address"
      />
      <p className="mt-1 text-sm text-gray-600">We'll send your receipt to this email</p>
    </div>

    {/* Payment Summary */}
    {activeStep >= 1 && (
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <h4 className="font-medium text-black mb-4">Payment Summary</h4>
        <div className="space-y-3 text-black">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-semibold">₦{Number(amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
  <span>Transaction Fee:</span>
  <span className="font-semibold">₦{transactionFee.toLocaleString()}</span>
</div>
          <div className="border-t border-gray-200 my-2"></div>
        <div className="flex justify-between">
  <span className="font-semibold">Total:</span>
  <span className="font-semibold text-indigo-700">
    ₦{(Number(amount) + transactionFee).toLocaleString()}
  </span>
</div>
        </div>
      </div>
    )}

    {/* Submit Button */}
    <div className="flex justify-center pt-4">
      {validateForm() ? (
        <button
          onClick={initiateTransaction}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-lg hover:from-indigo-800 hover:to-indigo-900 transition-colors shadow-md disabled:opacity-70"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCardIcon className="h-5 w-5" />
              <span>Proceed to Payment</span>
            </>
          )}
        </button>
      ) : (
        <button
          disabled
          className="px-8 py-3 bg-blue-700 text-white rounded-lg cursor-not-allowed"
        >
          Enter Amount to Continue
        </button>
      )}
    </div>
  </div>
</div>

            
            {/* Snackbar */}
            {snackbar.open && (
              <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
                snackbar.severity === 'error' ? 'bg-red-100 text-red-800' :
                snackbar.severity === 'success' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <div className="flex items-center">
                  {snackbar.severity === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
                  <span>{snackbar.message}</span>
                  <button 
                    onClick={() => setSnackbar({...snackbar, open: false})}
                    className="ml-4 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FundWalletPage;