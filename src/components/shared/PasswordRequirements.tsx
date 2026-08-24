import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  requirements: PasswordRequirement[];
  className?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ 
  requirements, 
  className = '' 
}) => {
  if (!requirements.length) return null;
  
  return (
    <div className={`bg-gray-50 p-4 rounded-lg border border-gray-200 ${className}`}>
      <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
      <ul className="space-y-2">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2">
            {req.met ? (
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
            ) : (
              <XCircle size={16} className="text-gray-400 flex-shrink-0" />
            )}
            <span className={`text-sm ${req.met ? 'text-green-600' : 'text-gray-600'}`}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};