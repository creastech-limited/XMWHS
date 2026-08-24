import React from 'react';
import { usePaymentVerification } from '../../hooks/usePaymentVerification';
import { CallbackLayout } from '../../components/shared/CallbackLayout';
import { VerificationStatus } from '../../components/shared/VerificationStatus';

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

  // Determine background color based on status
  const getBgColor = (): string => {
    if (isVerifying) return 'bg-gray-50';
    if (isSuccess) return 'bg-green-50';
    if (isFailed) return 'bg-red-50';
    return 'bg-gray-50';
  };

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