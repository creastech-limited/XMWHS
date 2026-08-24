// src/components/shared/SubmitButton.tsx
import React from 'react';

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  defaultText: string;
  className?: string;
  disabled?: boolean; // Add disabled prop
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading,
  loadingText,
  defaultText,
  className = '',
  disabled = false
}) => {
  const isDisabled = isLoading || disabled;
  
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`w-full bg-indigo-900 text-white py-3 px-4 rounded-lg hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition transform hover:-translate-y-1 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </span>
      ) : (
        defaultText
      )}
    </button>
  );
};