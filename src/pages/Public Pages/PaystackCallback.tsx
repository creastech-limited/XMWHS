import React from 'react';
import { usePaymentVerification } from '../../hooks/usePaymentVerification';
import { CallbackLayout } from '../../components/shared/CallbackLayout';
import { VerificationStatus } from '../../components/shared/VerificationStatus';
// import { useEffect, useCallback } from 'react';
// import { useAuth } from '../../context/AuthContext';
// import axios from 'axios';
// import { getUserDetails, getUserWallet } from '../../services';
// import { useNavigate } from 'react-router-dom';
// import type { UserData } from '../../types';
// import type { usePaymentVerification } from '../../hooks/usePaymentVerification';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PaystackCallback: React.FC = () => {
  const {
    status,
    errorMessage,
    isVerifying,
    isSuccess,
    isFailed,
    handleProceed,
    handleRetry,
  } = usePaymentVerification('/parent');
  // const authContext = useAuth();
  // const token = authContext?.token;
  // const authToken = token || localStorage.getItem('token');
  // const navigate = useNavigate();

  // // Form state
  // const [amount, setAmount] = useState<string>('');
  // const [email, setEmail] = useState<string>('');
  // const [snackbar, setSnackbar] = useState({
  //   open: false,
  //   message: '',
  //   severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  // });
  // const [activeStep, setActiveStep] = useState<number>(0);
  // const [quickAmounts] = useState<number[]>([5000, 10000, 20000, 50000]);
  // const [loading, setLoading] = useState<boolean>(false);
  // const [userId, setUserId] = useState<string>('');
  // const [isLoading, setIsLoading] = useState<boolean>(true);
  // const [transactionFee, setTransactionFee] = useState<number>(0);

  // User data state
  // const [userData, setUserData] = useState<UserData>({
  //   username: "",
  //   balance: 0,
  //   email: "",
  //   lastTransactions: []
  // });

  // Determine background color based on status
  const getBgColor = (): string => {
    if (isVerifying) return 'bg-gray-50';
    if (isSuccess) return 'bg-green-50';
    if (isFailed) return 'bg-red-50';
    return 'bg-gray-50';
  };

  // const fetchWalletBalance = useCallback(async () => {
  //   if (!authToken) {
  //     navigate('/login');
  //     return;
  //   }

  //   try {
  //     const data = await getUserWallet();

  //     const walletData = data?.data;

  //     if (walletData?.balance !== undefined) {
  //       setUserData(prev => ({
  //         ...prev,
  //         balance: walletData.balance
  //       }));
  //     }
  //   } catch (error: unknown) {
  //     console.error('Error fetching wallet balance:', error);

  //     const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
  //       ? error.response.data.message
  //       : 'Failed to fetch wallet balance';

  //     setSnackbar({
  //       open: true,
  //       message: errorMessage,
  //       severity: 'error'
  //     });
  //   }
  // }, [authToken, navigate]);

  // const verifyTransaction = async (reference: string) => {
  //   if (!authToken) return;

  //   try {
  //     //const response = await axios.get(`${API_BASE_URL}/api/transaction/verifyTransaction/${reference}`, {
  //     const response = await axios.post(`${API_BASE_URL}/api/transaction/verifynomba/${reference}`, {
  //       headers: {
  //         Authorization: `Bearer ${authToken}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (response.data?.status === 'success') {
  //       setSnackbar({
  //         open: true,
  //         message: 'Payment successful! Your wallet has been funded.',
  //         severity: 'success'
  //       });

  //       await fetchWalletBalance();
  //       // await fetchTransactions();
  //       setAmount('');
  //       setActiveStep(0);
  //     }
  //   } catch (error: unknown) {
  //     console.error('Error verifying transaction:', error);
  //     setSnackbar({
  //       open: true,
  //       message: axios.isAxiosError(error) && error.response?.data?.message
  //         ? error.response.data.message
  //         : 'Failed to verify payment',
  //       severity: 'error'
  //     });
  //   }
  // };

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const reference = urlParams.get('reference') || localStorage.getItem('paymentReference');

  //   if (reference) {
  //     localStorage.removeItem('paymentReference');
  //     verifyTransaction(reference);
  //   }
  // },);

  return (
    <CallbackLayout bgColor={getBgColor()}>
      <VerificationStatus
        status={status}
        errorMessage={errorMessage}
        onSuccess={handleProceed}
        onRetry={handleRetry}
        onCancel={() => handleProceed()}
        successTitle="Payment Confirmed!"
        successMessage="Your transaction has been successfully verified and your wallet has been credited."
        failureTitle="Verification Failed"
        failureMessage="We were unable to verify your payment. Please try again."
      />
    </CallbackLayout>
  );
};

export default PaystackCallback;