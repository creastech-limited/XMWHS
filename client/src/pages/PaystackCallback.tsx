import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Ensure this matches your Vite environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type VerificationStatus = 'verifying' | 'success' | 'failed';

const PaystackCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

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
      
      const response = await fetch(`${API_BASE_URL}/api/transaction/verifyTransaction/${reference}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus('success');
        setIsRedirecting(true);
        
        let count = 5;
        const timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            handleManualRedirect();
          }
        }, 1000);
      } else {
        setVerificationStatus('failed');
        setErrorMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setVerificationStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleManualRedirect = (): void => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const isExpired = tokenData.exp * 1000 < Date.now();
      
      if (isExpired) {
        navigate('/login');
      } else {
        navigate('/parent');
      }
    } catch {
      navigate('/login');
    }
  };

  useEffect(() => {
    const reference = getReference();
    verifyTransaction(reference);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 py-4 px-6">
            <h2 className="text-white text-center text-xl font-bold">Payment Verification</h2>
          </div>
          
          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Verifying state */}
            {verificationStatus === 'verifying' && (
              <div className="flex flex-col items-center text-center py-6">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Verifying Your Payment</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Please wait while we confirm your payment details. This should only take a moment.
                </p>
              </div>
            )}

            {/* Success state */}
            {verificationStatus === 'success' && (
              <div className="flex flex-col items-center text-center py-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-green-100 rounded-full opacity-75 animate-ping"></div>
                  <div className="relative flex items-center justify-center h-16 w-16 bg-green-100 rounded-full">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Payment Successful!</h3>
                <p className="text-green-600 font-medium mb-2">Your transaction has been verified.</p>
                <p className="text-gray-600 mb-4">
                  {isRedirecting 
                    ? `Redirecting to dashboard in ${countdown} seconds...` 
                    : 'Your payment has been confirmed.'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Failed state */}
            {verificationStatus === 'failed' && (
              <div className="flex flex-col items-center text-center py-6">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Failed</h3>
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex flex-col items-center">
                    <XCircle className="h-6 w-6 text-red-600 mb-1" />
                    <h4 className="text-red-800 font-medium text-center">Error</h4>
                    <p className="text-red-700 text-center mt-1">
                      {errorMessage || 'We could not verify your payment. Please try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm mb-4">
                If this page does not automatically redirect you, please click the button below.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-center">
            <button
              onClick={handleManualRedirect}
              disabled={verificationStatus === 'verifying'}
              className={`px-6 py-2 rounded-md font-medium ${
                verificationStatus === 'verifying' 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : verificationStatus === 'success'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transition-colors duration-200 w-full sm:w-auto`}
            >
              {verificationStatus === 'verifying' ? (
                'Verifying...'
              ) : verificationStatus === 'success' ? (
                'Continue to Dashboard'
              ) : (
                'Try Again'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Your Creastech. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaystackCallback;