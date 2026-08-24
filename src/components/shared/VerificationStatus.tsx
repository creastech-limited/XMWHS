import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VerificationStatusProps {
  status: 'verifying' | 'success' | 'failed';
  errorMessage?: string;
  onSuccess?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  successTitle?: string;
  successMessage?: string;
  failureTitle?: string;
  failureMessage?: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  errorMessage,
  onSuccess,
  onRetry,
  onCancel,
  successTitle = 'Payment Confirmed!',
  successMessage = 'Your transaction has been successfully verified and your wallet has been credited.',
  failureTitle = 'Verification Failed',
  failureMessage = 'We were unable to verify your payment. Please try again.',
}) => {
  if (status === 'verifying') {
    return (
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
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-green-600 py-4 px-6">
            <h2 className="text-white text-center text-xl font-bold">Payment Successful</h2>
          </div>
          
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full opacity-75 animate-ping"></div>
              <div className="relative flex items-center justify-center h-20 w-20 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-green-600 mb-3">{successTitle}</h3>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Transaction Complete</span>
              </div>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
            >
              Proceed to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-red-600 py-4 px-6">
            <h2 className="text-white text-center text-xl font-bold">Payment Failed</h2>
          </div>
          
          <div className="p-8 text-center">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-red-600 mb-3">{failureTitle}</h3>
            <p className="text-gray-700 mb-6">{failureMessage}</p>
            
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
                onClick={onRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Try Again
              </button>
              
              <button
                onClick={onCancel}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};