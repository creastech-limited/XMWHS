import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;
  
  return (
    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between border border-red-200">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700"
        >
          ×
        </button>
      )}
    </div>
  );
};