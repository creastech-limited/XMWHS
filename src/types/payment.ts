// src/types/payment.ts
export type VerificationStatus = 'verifying' | 'success' | 'failed';

export interface PaymentVerificationResponse {
  status: boolean;
  message: string;
  transaction?: {
    status: string;
    [key: string]: unknown;
  };
}

export interface PaymentCallbackProps {
  reference?: string;
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
}