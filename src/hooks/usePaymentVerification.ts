// src/hooks/usePaymentVerification.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import type { VerificationStatus, PaymentVerificationResponse } from '../types/payment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const usePaymentVerification = (redirectPath: string = '/parent') => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reference, setReference] = useState<string | null>(null);

  const getReference = useCallback((): string | null => {
    return searchParams.get('reference') || localStorage.getItem('paymentReference');
  }, [searchParams]);

  const verifyTransaction = useCallback(async (ref: string | null): Promise<void> => {
    if (!ref) {
      setStatus('failed');
      setErrorMessage('No payment reference found');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      setStatus('verifying');
      console.log('Verifying transaction with reference:', ref);
      
      const response = await axios.post<PaymentVerificationResponse>(
        `${API_BASE_URL}/api/transaction/verifynomba/${ref}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Verification response:', response.data);

      const data = response.data;

      // Check if verification was successful
      const isSuccessful = (
        response.status >= 200 && 
        response.status < 300 && 
        data.status === true &&
        (data.message === 'Transaction verified and wallet credited' ||
         data.transaction?.status === 'success')
      );

      if (isSuccessful) {
        setStatus('success');
        localStorage.removeItem('paymentReference');
      } else {
        setStatus('failed');
        setErrorMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
      
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
  }, [navigate]);

  const handleProceed = useCallback((): void => {
    navigate(redirectPath);
  }, [navigate, redirectPath]);

  const handleRetry = useCallback((): void => {
    const ref = getReference();
    verifyTransaction(ref);
  }, [getReference, verifyTransaction]);

  // Initialize verification
  useEffect(() => {
    const ref = getReference();
    console.log('Payment reference:', ref);
    
    if (ref) {
      setReference(ref);
      verifyTransaction(ref);
    } else {
      setStatus('failed');
      setErrorMessage('No payment reference found');
    }
  }, [getReference, verifyTransaction]);

  return {
    status,
    errorMessage,
    reference,
    isVerifying: status === 'verifying',
    isSuccess: status === 'success',
    isFailed: status === 'failed',
    handleProceed,
    handleRetry,
  };
};