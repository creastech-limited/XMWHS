import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

interface SnackbarProps {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  onClose: () => void;
  autoHideDuration?: number;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export const Snackbar: React.FC<SnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 5000,
  position = 'bottom-right'
}) => {
  useEffect(() => {
    if (open && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!open || !message) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const severityStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const icons = {
    success: <CheckCircle size={20} className="flex-shrink-0" />,
    error: <XCircle size={20} className="flex-shrink-0" />,
    warning: <AlertCircle size={20} className="flex-shrink-0" />,
    info: <AlertCircle size={20} className="flex-shrink-0" />
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]} animate-slide-in-right`}>
      <div className={`${severityStyles[severity]} p-4 rounded-lg shadow-lg max-w-md`}>
        <div className="flex items-start">
          <div className="flex items-center gap-3">
            {icons[severity]}
            <span className="font-medium">{message}</span>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};