import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Banknote,
  Send,
  CreditCard,
  ArrowLeft,
  Info,
  CheckCircle2,
  User,
  Receipt,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import Footer from '../components/Footer';

// API Base URL - adjust according to your environment
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Type definitions
type Bank = {
  id: string;
  name: string;
  code: string;
};

type ApiBankData = {
  id: number;
  name: string;
  code: string;
};

type User = {
  name: string;
  wallet: {
    balance: number;
    currency: string;
    walletId: string;
  };
  withdrawalBank?: string;
  withdrawalAccountNumber?: string;
  withdrawalAccountName?: string;
};

type FormData = {
  amount: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
};

const SWithdrawalPage = () => {
  // State for banks
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  
  // User state
  const [user, setUser] = useState<User | null>(null);

  // Form state for withdrawal details
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  // Account verification state
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Available balance from user wallet
  const availableBalance = user?.wallet?.balance || 0;

  // Snackbar state for feedback messages
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Fetch banks from API
  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/transaction/banks`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Fetched banks:', result);
          
          // Extract banks from the API response structure
          const banksData = result.data || [];
          
          // Map the API response to match your Bank interface
          const mappedBanks = banksData.map((bank: ApiBankData) => ({
            id: bank.id.toString(),
            name: bank.name,
            code: bank.code,
          }));
          console.log('Mapped banks:', mappedBanks);
          setBanks(mappedBanks);
        } else {
          console.error('Failed to fetch banks');
          setBanks([]);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        setBanks([]);
      } finally {
        setBankLoading(false);
      }
    };
    
    fetchBanks();
  }, []);

  // Fetch the logged-in user's profile on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          
          // Validate API response structure
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid user profile response format');
          }

          // Create safe user data with null coalescing and optional chaining
          const userInfo = data.user?.data || data.data || data;
          const walletInfo = data.user?.wallet || data.wallet;

          const userData: User = {
            name: userInfo.name ?? `${userInfo.firstName ?? ''} ${userInfo.lastName ?? ''}`.trim(),
            wallet: {
              balance: walletInfo?.balance || 0,
              currency: walletInfo?.currency || 'NGN',
              walletId: walletInfo?.walletId || '',
            },
            withdrawalBank: userInfo.bankDetails?.bankName || userInfo.withdrawalBank,
            withdrawalAccountNumber: userInfo.bankDetails?.accountNumber || userInfo.withdrawalAccountNumber,
            withdrawalAccountName: userInfo.bankDetails?.accountName || userInfo.withdrawalAccountName,
          };
          
          setUser(userData);
          setUser(userData);
          // Pre-populate bank details if they exist
          const bankName = userInfo.bankDetails?.bankName || userInfo.withdrawalBank;
          const bankAccountNumber = userInfo.bankDetails?.accountNumber || userInfo.withdrawalAccountNumber;
          const bankAccountName = userInfo.bankDetails?.accountName || userInfo.withdrawalAccountName;
          const bankCode = userInfo.bankDetails?.bankCode;

          if (bankName && bankAccountNumber && bankAccountName) {
            setSelectedBank(bankName);
            setAccountNumber(bankAccountNumber);
            setAccountName(bankAccountName);
            setFormData(prev => ({
              ...prev,
              bankName: bankName,
              accountNumber: bankAccountNumber,
              accountName: bankAccountName
            }));
            if (bankCode) {
              setSelectedBankCode(bankCode);
            }
            setVerificationStatus('success');
          }
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Handle bank selection
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBankName = e.target.value;
    const selectedBankData = banks.find(bank => bank.name === selectedBankName);
    
    setSelectedBank(selectedBankName);
    setSelectedBankCode(selectedBankData?.code || '');
    setFormData(prev => ({ ...prev, bankName: selectedBankName }));
    
    // Reset account verification when bank changes
    setVerificationStatus('idle');
    setAccountName('');
  };

  // Handle account number change and verification
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountNumber(value);
    setFormData(prev => ({ ...prev, accountNumber: value }));
    
    // Auto-verify when account number is 10 digits
    if (value.length === 10 && selectedBankCode) {
      handleVerifyAccount(value, selectedBankCode);
    } else {
      setVerificationStatus('idle');
      setAccountName('');
    }
  };

  // Verify account number with bank
  const handleVerifyAccount = async (accNumber: string, bankCode: string) => {
    if (accNumber.length !== 10) {
      setVerificationStatus('error');
      setAccountName('');
      return;
    }
    
    if (!bankCode) {
      alert('Bank code not found. Please reselect your bank.');
      return;
    }
    
    setVerificationStatus('loading');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/resolveaccount?account_number=${accNumber}&bank_code=${bankCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(accNumber, bankCode);
      if (response.ok) {
        const data = await response.json();
        const resolvedAccountName = data.account_name || data.data?.account_name;
        setAccountName(resolvedAccountName);
        setFormData(prev => ({ ...prev, accountName: resolvedAccountName }));
        setVerificationStatus('success');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to verify account. Please check account number and try again.');
        setVerificationStatus('error');
        setAccountName('');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      alert('An error occurred while verifying account.');
      setVerificationStatus('error');
      setAccountName('');
    }
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !selectedBank || !accountNumber || !accountName) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid amount',
        severity: 'error'
      });
      return;
    }

    if (amount > availableBalance) {
      setSnackbar({
        open: true,
        message: 'Insufficient balance',
        severity: 'error'
      });
      return;
    }

    if (verificationStatus !== 'success') {
      setSnackbar({
        open: true,
        message: 'Please verify your account number first',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/transaction/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          description: 'Withdrawal request',
          account_name: accountName,
          account_number: accountNumber,
          bank_code: selectedBankCode,
        }),
      });

      if (response.ok) {
        await response.json();
        setSnackbar({ 
          open: true, 
          message: 'Withdrawal request submitted successfully!', 
          severity: 'success' 
        });
        setFormData({
          amount: '',
          bankName: '',
          accountNumber: '',
          accountName: ''
        });
        setAccountNumber('');
        setAccountName('');
        setSelectedBank('');
        setSelectedBankCode('');
        setVerificationStatus('idle');
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.message || 'Failed to submit withdrawal request',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Withdrawal Error:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while submitting withdrawal request',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
      {/* Header and Sidebar */}
      <StoreHeader />
      <StoreSidebar />
      
      {/* Main content wrapper with proper layout */}
      <main className="flex-grow p-4 lg:p-8 lg:ml-64 transition-all duration-300">
        {/* Main content */}
        <div className="flex flex-1 flex-col px-4 sm:px-6 mt-4 mb-4 max-w-6xl mx-auto">
          {/* Withdrawal process steps */}
          <div className="hidden sm:flex mb-6">
            <div className="w-full flex justify-center">
              <div className="flex items-center">
                <div className="flex flex-col items-center mx-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">1</div>
                  <span className="mt-2 text-sm font-medium">Enter Details</span>
                </div>
                <ChevronRight className="text-gray-400" />
                <div className="flex flex-col items-center mx-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">2</div>
                  <span className="mt-2 text-sm font-medium text-gray-500">Review</span>
                </div>
                <ChevronRight className="text-gray-400" />
                <div className="flex flex-col items-center mx-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">3</div>
                  <span className="mt-2 text-sm font-medium text-gray-500">Confirmation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side - Withdrawal Form */}
            <div className="md:col-span-2">
              <div className="p-6 rounded-xl shadow-sm bg-white mb-6 h-full">
                <div className="flex items-center mb-6">
                  <Banknote className="mr-3 text-blue-600 h-7 w-7" />
                  <h1 className="text-2xl font-bold">
                    Withdrawal
                  </h1>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Enter your account details below to withdraw funds to your preferred account via Paystack.
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Withdrawal Amount (₦)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="amount"
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange('amount')}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          title={`Maximum amount you can withdraw is ₦${availableBalance.toLocaleString()}`}
                        >
                          <Info className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Available Balance: ₦{availableBalance.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="bankName"
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={selectedBank}
                        onChange={handleBankChange}
                        required
                        disabled={bankLoading}
                      >
                        <option value="">
                          {bankLoading ? 'Loading banks...' : 'Select Bank'}
                        </option>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.name}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                      {bankLoading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Receipt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="accountNumber"
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234567890"
                        value={accountNumber}
                        onChange={handleAccountNumberChange}
                        maxLength={10}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {verificationStatus === 'loading' && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        )}
                        {verificationStatus === 'success' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {verificationStatus === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    {accountNumber.length > 0 && accountNumber.length !== 10 && (
                      <p className="mt-1 text-sm text-amber-600">
                        Account number must be exactly 10 digits
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-8">
                    <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder's Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="accountName"
                        className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        placeholder="Account name will appear here after verification"
                        value={accountName}
                        readOnly
                        required
                      />
                    </div>
                    {verificationStatus === 'success' && accountName && (
                      <p className="mt-1 text-sm text-green-600">
                        ✓ Account verified successfully
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || verificationStatus !== 'success'}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Withdraw Now
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Right side - Information Panel */}
            <div className="md:col-span-1 space-y-6">
              <div className="p-6 rounded-xl shadow-sm bg-blue-600 text-white">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <Info className="mr-2 h-5 w-5" /> Withdrawal Information
                </h2>
                <div className="border-b border-blue-500 mb-4"></div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Processing Time:</h3>
                  <p className="text-sm opacity-90">1-2 business days</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Withdrawal Fee:</h3>
                  <p className="text-sm opacity-90">₦100 for transactions below ₦5,000</p>
                  <p className="text-sm opacity-90">₦200 for transactions above ₦5,000</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Available Balance:</h3>
                  <p className="text-xl font-bold">₦{availableBalance.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-6 rounded-xl shadow-sm bg-gray-50">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" /> Tips
                </h2>
                <div className="border-b border-gray-200 mb-4"></div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Account details are automatically verified when you enter a 10-digit account number.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>The minimum withdrawal amount is ₦1,000.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>For any issues with your withdrawal, please contact our support team.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-auto mb-6 text-center">
            <Link
              to="/store"
              className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
        
        {/* Footer stays at the bottom */}
        <Footer />
      </main>
      
      {/* Snackbar notification */}
      {snackbar.open && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 ${
          snackbar.severity === 'success' ? 'bg-green-600' :
          snackbar.severity === 'error' ? 'bg-red-600' :
          snackbar.severity === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
        } text-white`}>
          <div className="flex items-center">
            {snackbar.severity === 'success' && <CheckCircle2 className="mr-2 h-5 w-5" />}
            {snackbar.severity === 'error' && <AlertCircle className="mr-2 h-5 w-5" />}
            <span>{snackbar.message}</span>
            <button 
              onClick={() => setSnackbar({...snackbar, open: false})}
              className="ml-4 text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SWithdrawalPage;