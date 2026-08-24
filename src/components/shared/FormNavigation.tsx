import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface FormNavigationProps {
  activeStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  isValid: boolean;
  onBack: () => void;
  onNext: (e: React.FormEvent) => void;
  nextLabel?: string;
  backLabel?: string;
  submitLabel?: string;
  className?: string;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  activeStep,
  totalSteps,
  isSubmitting,
  isValid,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  submitLabel = 'Complete Registration',
  className = ''
}) => {
  const isLastStep = activeStep === totalSteps - 1;

  return (
    <div className={`flex justify-between items-center ${className}`}>
      <button
        onClick={onBack}
        disabled={activeStep === 0 || isSubmitting}
        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
          activeStep === 0 || isSubmitting
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
        }`}
      >
        <ArrowLeft size={20} />
        <span>{backLabel}</span>
      </button>

      <button
        onClick={onNext}
        disabled={!isValid || isSubmitting}
        className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
          !isValid || isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        <span>
          {isSubmitting 
            ? 'Processing...' 
            : (isLastStep ? submitLabel : nextLabel)
          }
        </span>
        {isLastStep ? <Check size={20} /> : <ArrowRight size={20} />}
      </button>
    </div>
  );
};