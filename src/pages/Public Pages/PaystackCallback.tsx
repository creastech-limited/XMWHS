import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

type VerificationStatus = 'verifying' | 'success' | 'failed';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PaystackCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getReference = (): string | null => {
    return searchParams.get('reference');
  };

  const verifyTransaction = async (reference: string | null): Promise<void> => {
    if (!reference) {
      setVerificationStatus('failed');
      setErrorMessage('No payment reference found');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

    setVerificationStatus('verifying');
    console.log('Verifying transaction with reference:', reference);
    
       // Changed to GET request to match FundWalletPage
      const response = await axios.post(
        `${API_BASE_URL}/api/transaction/verifynomba/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Verification response:', response.data);

      const data = response.data;

      // Check if transaction is successful
      const isSuccessful = (response.status >= 200 && response.status < 300) && 
                          (data.status === 'success' || 
                           data.success === true ||
                           (data.message && data.message.includes('Payment verified')));

      if (isSuccessful) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('failed');
        setErrorMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
      
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message || 
          error.message || 
          'An unexpected error occurred'
        );
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    }
  };


  const handleProceedToDashboard = (): void => {
    navigate('/parent');
  };

  const handleTryAgain = (): void => {
    const reference = getReference();
    verifyTransaction(reference);
  };

  useEffect(() => {
    const reference = getReference();
    console.log('Payment reference from URL:', reference);
    
    if (reference) {
      verifyTransaction(reference);
    } else {
      // Check localStorage as fallback
      const storedReference = localStorage.getItem('paymentReference');
      console.log('Payment reference from localStorage:', storedReference);
      
      if (storedReference) {
        verifyTransaction(storedReference);
        localStorage.removeItem('paymentReference');
      } else {
        setVerificationStatus('failed');
        setErrorMessage('No payment reference found');
      }
    }
  }, [searchParams]);

  // PENDING/VERIFYING STATE
  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-blue-600 py-4 px-6">
              <h2 className="text-white text-center text-xl font-bold">Verifying Payment</h2>
            </div>
            
            <div className="p-8 text-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Processing Your Payment</h3>
              <p className="text-gray-600 mb-6">
                Please wait while we verify your transaction. This may take a few moments.
              </p>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-blue-600 py-4 px-6">
              <h2 className="text-white text-center text-xl font-bold">Payment Successful</h2>
            </div>
            
            <div className="p-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full opacity-75 animate-ping"></div>
                <div className="relative flex items-center justify-center h-20 w-20 bg-blue-100 rounded-full mx-auto">
                  <CheckCircle className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-blue-600 mb-3">Payment Confirmed!</h3>
              <p className="text-gray-700 mb-6">
                Your transaction has been successfully verified and processed.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Transaction Complete</span>
                </div>
              </div>

              <button
                onClick={handleProceedToDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Proceed to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FAILED STATE
  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-red-600 py-4 px-6">
              <h2 className="text-white text-center text-xl font-bold">Payment Failed</h2>
            </div>
            
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-red-600 mb-3">Verification Failed</h3>
              <p className="text-gray-700 mb-6">
                We were unable to verify your payment. Please try again.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Error Details</span>
                </div>
                <p className="text-red-700 text-sm">
                  {errorMessage || 'An error occurred while verifying your payment.'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleTryAgain}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => navigate('/parent')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaystackCallback;