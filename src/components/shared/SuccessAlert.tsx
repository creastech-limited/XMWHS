import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;
  
  return (
    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between border border-green-200">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-green-500 hover:text-green-700"
        >
          ×
        </button>
      )}
    </div>
  );
};