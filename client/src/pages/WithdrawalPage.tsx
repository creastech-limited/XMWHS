import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Edit,
  Wallet,
  Lock,
  CheckCircle,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';

// Define types
interface User {
  name: string;
  wallet: {
    balance: number;
    currency: string;
    walletId: string;
  };
  withdrawalBank?: string;
  withdrawalAccountNumber?: string;
  withdrawalAccountName?: string;
}

interface Bank {
  id: string;
  name: string;
  code: string;
}
interface ApiBankData {
  id: number;
  name: string;
  code: string;
  slug: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  supports_transfer: boolean;
  available_for_direct_debit: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const steps = ['Select Bank', 'Account Details', 'Verify OTP'];

const WithdrawalPage: React.FC = () => {
  // States for bank setup modal
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isBankSet, setIsBankSet] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );

  // State for withdrawal form
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalNote, setWithdrawalNote] = useState<string>('');
  const [withdrawalError, setWithdrawalError] = useState<string>('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<boolean>(false);

  // State for user profile (fetched from backend)
  const [user, setUser] = useState<User | null>(null);

  // State for banks (fetched from backend)
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankLoading, setBankLoading] = useState<boolean>(false);

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // API Base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
        console.log('Mapped banks length:', mappedBanks.code);
        setBanks(mappedBanks);
      } else {
        console.error('Failed to fetch banks');
        setBanks([]); // Set empty array instead of fallback banks
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      setBanks([]); // Set empty array instead of fallback banks
    } finally {
      setBankLoading(false);
    }
  };
  
  fetchBanks();
}, [API_BASE_URL]);

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
          
          // Pre-populate bank details if they exist
        const bankName = userInfo.bankDetails?.bankName || userInfo.withdrawalBank;
const accountNumber = userInfo.bankDetails?.accountNumber || userInfo.withdrawalAccountNumber;
const accountName = userInfo.bankDetails?.accountName || userInfo.withdrawalAccountName;
const bankCode = userInfo.bankDetails?.bankCode;

if (bankName && accountNumber && accountName) {
  setSelectedBank(bankName);
  setAccountNumber(accountNumber);
  setAccountName(accountName);
  if (bankCode) {
    setSelectedBankCode(bankCode);
  }
  setIsBankSet(true);
}
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [API_BASE_URL]);

  // Derive available balance from the user profile, defaulting to 0 if not available
  const availableBalance = user?.wallet?.balance || 0;

  const handleOpenModal = () => {
    setOpenModal(true);
    setActiveStep(0);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    if (!isBankSet) {
      resetModalForm();
    }
  };

  const resetModalForm = () => {
    setSelectedBank('');
    setSelectedBankCode('');
    setAccountNumber('');
    setAccountName('');
    setOtp('');
    setOtpSent(false);
    setActiveStep(0);
    setVerificationStatus(null);
  };

  // Verify account number using the new API endpoint
  const handleVerifyAccount = async () => {
    if (accountNumber.length !== 10) {
      setVerificationStatus('error');
      setAccountName('');
      return;
    }
    
    if (!selectedBankCode) {
      alert('Bank code not found. Please reselect your bank.');
      return;
    }
    
    setLoading(true);
    
    try {
     const response = await fetch(`${API_BASE_URL}/api/transaction/resolveaccount?account_number=${accountNumber}&bank_code=${selectedBankCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
      console.log (accountNumber, selectedBankCode);
      if (response.ok) {
        const data = await response.json();
        // Assuming the API returns account_name in the response
        setAccountName(data.account_name || data.data?.account_name);
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
    } finally {
      setLoading(false);
    }
  };

  // Send OTP via new backend API
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setOtpSent(true);
        alert('OTP sent to your registered email address.');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('An error occurred while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Update bank details with OTP verification using new API
  const handleSetBank = async () => {
    if (!selectedBank || !accountNumber || !otp || !accountName) {
      alert('Please fill in all fields and enter the OTP.');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp,
          accountName,
          accountNumber,
          bankName: selectedBank,
          bankCode: selectedBankCode,
        }),
      });
      
      if (response.ok) {
        await response.json();
        setIsBankSet(true);
        setOpenModal(false);
        resetModalForm();
        setSnackbar({
          open: true,
          message: 'Withdrawal bank details updated successfully!',
          severity: 'success',
        });
        
        // Update the user state to reflect the new bank details
        if (user) {
          setUser({
            ...user,
            withdrawalBank: selectedBank,
            withdrawalAccountNumber: accountNumber,
            withdrawalAccountName: accountName,
          });
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to verify OTP and set bank details.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('An error occurred while verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Submit a withdrawal request via backend API (integrated with Paystack)
  const handleWithdrawalSubmit = async () => {
    setWithdrawalError('');
    setWithdrawalSuccess(false);
    if (!withdrawalAmount) {
      setWithdrawalError('Please enter an amount to withdraw.');
      return;
    }
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawalError('Please enter a valid amount.');
      return;
    }
    if (amount > availableBalance) {
      setWithdrawalError('Insufficient balance.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/withdrawals/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          note: withdrawalNote,
        }),
      });
      if (response.ok) {
        await response.json();
        setWithdrawalSuccess(true);
        setWithdrawalAmount('');
        setWithdrawalNote('');
        setSnackbar({
          open: true,
          message: 'Withdrawal request submitted successfully',
          severity: 'success',
        });
      } else {
        const errorData = await response.json();
        setWithdrawalError(
          errorData.message || 'Failed to submit withdrawal request.'
        );
      }
    } catch (error) {
      console.error('Withdrawal Error:', error);
      setWithdrawalError(
        'An error occurred while submitting withdrawal request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header profilePath="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Asidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-indigo-900">Withdrawal</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Balance Card */}
            <div className="md:col-span-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-gray-600 text-md font-medium mb-2">
                  Available Balance
                </h2>
                <p className="text-3xl font-bold text-gray-800 mb-4">
                  ₦{availableBalance.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Bank Details Card */}
            <div className="md:col-span-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="text-blue-600" size={20} />
                    <h2 className="text-lg font-medium text-gray-800">
                      Withdrawal Bank Details
                    </h2>
                  </div>
                  {isBankSet && (
                    <button
                      onClick={handleOpenModal}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit withdrawal bank details"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                </div>

                {!isBankSet ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">
                      Please set your withdrawal bank details to proceed.
                    </p>
                    <button
                      onClick={handleOpenModal}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                    >
                      <Landmark size={18} />
                      Set Withdrawal Bank
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="text-gray-800 font-medium">
                        {selectedBank ? selectedBank : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="text-gray-800 font-medium">
                        {accountNumber ? accountNumber : 'Not set'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Account Name</p>
                      <p className="text-gray-800 font-medium">
                        {accountName ? accountName : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Withdrawal Form */}
            {isBankSet && (
              <div className="md:col-span-12">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Wallet className="text-blue-600" size={20} />
                    <h2 className="text-lg font-medium text-gray-800">
                      Make a Withdrawal
                    </h2>
                  </div>

                  {withdrawalSuccess && (
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 p-4 rounded-md mb-4">
                      <CheckCircle size={18} />
                      <p>Withdrawal request submitted successfully!</p>
                    </div>
                  )}

                  {withdrawalError && (
                    <div className="flex items-center gap-2 bg-red-100 text-red-800 p-4 rounded-md mb-4">
                      <AlertCircle size={18} />
                      <p>{withdrawalError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label
                        className="block text-gray-700 mb-2"
                        htmlFor="withdrawalAmount"
                      >
                        Withdrawal Amount (₦)
                      </label>
                      <input
                        id="withdrawalAmount"
                        type="number"
                        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                          withdrawalError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-gray-700 mb-2"
                        htmlFor="withdrawalNote"
                      >
                        Note (Optional)
                      </label>
                      <input
                        id="withdrawalNote"
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={withdrawalNote}
                        onChange={(e) => setWithdrawalNote(e.target.value)}
                        placeholder="Add a note for this withdrawal"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleWithdrawalSubmit}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition disabled:bg-blue-400"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Wallet size={18} />
                    )}
                    Submit Withdrawal Request
                  </button>
                </div>
              </div>
            )}

            {/* Withdrawal Tips Section */}
            <div className="md:col-span-12">
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="text-blue-600" size={20} />
                  <h2 className="text-lg font-medium text-gray-800">
                    Withdrawal Tips
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Processing Times
                    </h3>
                    <p className="text-gray-600">
                      Withdrawals are typically processed within 24 hours during
                      business days. Weekend requests may take longer.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Minimum Withdrawal
                    </h3>
                    <p className="text-gray-600">
                      The minimum withdrawal amount is ₦1,000. Ensure your
                      request meets this threshold to avoid rejections.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Verification
                    </h3>
                    <p className="text-gray-600">
                      Always ensure your bank details are correct. Withdrawals
                      to incorrectly specified accounts cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Bank Setup Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Set Withdrawal Bank Details
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center mb-8">
              {steps.map((step, index) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      activeStep >= index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-600">{step}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Select Bank */}
            {activeStep === 0 && (
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="withdrawal-bank-select"
                >
                  Select Bank
                </label>
                {bankLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-gray-600">Loading banks...</span>
                  </div>
                ) : (
                  <select
                    id="withdrawal-bank-select"
                    className="block text-gray-700 mb-2 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedBank}
                   onChange={(e) => {
  const selectedBankName = e.target.value;
  const selectedBankObj = banks.find(bank => bank.name === selectedBankName);
  
  setSelectedBank(selectedBankName);
  setSelectedBankCode(selectedBankObj?.code || '');
  setActiveStep(1);
}}
                  >
                    <option value="" className="block text-gray-700 mb-2">
                      Select your bank
                    </option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 2: Account Details */}
            {activeStep === 1 && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  className="block text-gray-700 mb-2 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter 10-digit account number"
                />
                <button
                  onClick={handleVerifyAccount}
                  disabled={loading || accountNumber.length !== 10}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition disabled:bg-blue-400"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  Verify Account
                </button>

                {verificationStatus === 'success' && (
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 p-4 rounded-md mt-4">
                    <CheckCircle size={18} />
                    <div className="flex-1">
                      <p>Account verified: {accountName}</p>
                    </div>
                    <button
                      onClick={() => setActiveStep(2)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {verificationStatus === 'error' && (
                  <div className="flex items-center gap-2 bg-red-100 text-red-800 p-4 rounded-md mt-4">
                    <AlertCircle size={18} />
                    <p>Invalid account number. Please check and try again.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Verify OTP */}
            {activeStep === 2 && (
              <div className="text-center">
                <label className="block text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  className="block text-gray-700 mb-2 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP sent to your email"
                />

                {!otpSent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition disabled:bg-blue-400 mx-auto"
                    title="Send OTP"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock size={16} />
                    )}
                    Send OTP
                  </button>
                ) : (
                  <button
                    onClick={handleSetBank}
                    disabled={loading || !otp}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition disabled:bg-green-400 mx-auto"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Verify & Set Bank
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snackbar Notification */}
      {snackbar.open && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white shadow-lg rounded-lg overflow-hidden">
          <div
            className={`px-4 py-3 flex items-center gap-2 ${
              snackbar.severity === 'success'
                ? 'bg-green-600 text-white'
                : snackbar.severity === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
            }`}
          >
            {snackbar.severity === 'success' ? (
              <CheckCircle size={18} />
            ) : snackbar.severity === 'error' ? (
              <AlertCircle size={18} />
            ) : (
              <Info size={18} />
            )}
            <p className="flex-1">{snackbar.message}</p>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="text-white hover:text-gray-200"
              title="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalPage;