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
  walletBalance: number;
  withdrawalBank?: string;
  withdrawalAccountNumber?: string;
  withdrawalAccountName?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const banks = [
  'Access Bank',
  'GTBank',
  'First Bank',
  'Zenith Bank',
  'UBA',
  'Fidelity Bank',
  'Union Bank',
  'Sterling Bank',
  'Ecobank',
];

const steps = ['Select Bank', 'Account Details', 'Verify OTP'];

const WithdrawalPage: React.FC = () => {
  // States for bank setup modal
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
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

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // API Base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nodes-staging-xp.up.railway.app';

  // Fetch the logged-in user's profile on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched user profile:', data);
          setUser(data);
          // Pre-populate bank details if they exist
          if (
            data.withdrawalBank &&
            data.withdrawalAccountNumber &&
            data.withdrawalAccountName
          ) {
            setSelectedBank(data.withdrawalBank);
            setAccountNumber(data.withdrawalAccountNumber);
            setAccountName(data.withdrawalAccountName);
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
  const availableBalance =
    user && typeof user.walletBalance === 'number' ? user.walletBalance : 0;

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
    setAccountNumber('');
    setAccountName('');
    setOtp('');
    setOtpSent(false);
    setActiveStep(0);
    setVerificationStatus(null);
  };

  // Verify account number by setting the accountName as the logged-in user's name.
  const handleVerifyAccount = () => {
    if (accountNumber.length !== 10) {
      setVerificationStatus('error');
      setAccountName('');
      return;
    }
    if (!user || !user.name) {
      alert('User profile not loaded. Please try again.');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      setAccountName(user.name); // Use logged-in user's name as account name
      setVerificationStatus('success');
      setLoading(false);
    }, 1500);
  };

  // Send OTP via backend API
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/withdrawals/send-otp`, {
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

  // Update bank details with OTP verification by calling the backend API
  const handleSetBank = async () => {
    if (!selectedBank || !accountNumber || !otp) {
      alert('Please fill in all fields and enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/withdrawals/update-bank`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            withdrawalBank: selectedBank,
            withdrawalAccountNumber: accountNumber,
            withdrawalAccountName: accountName,
            otp, // Send the OTP for verification
          }),
        }
      );
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
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to set bank details.');
      }
    } catch (error) {
      console.error('Error setting bank details:', error);
      alert('An error occurred while setting bank details.');
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
                <select
                  id="withdrawal-bank-select"
                  className="block text-gray-700 mb-2 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedBank}
                  onChange={(e) => {
                    setSelectedBank(e.target.value);
                    setActiveStep(1);
                  }}
                >
                  <option value="" className="block text-gray-700 mb-2">
                    Select your bank
                  </option>
                  {banks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
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
