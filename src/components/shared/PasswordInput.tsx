// src/components/shared/PasswordInput.tsx
import React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string; // Add optional label prop
  error?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  helperText?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  error,
  showPassword,
  onToggleShow,
  disabled = false,
  name = 'password',
  required = false,
  helperText
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock size={18} className="text-gray-400" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          name={name}
          disabled={disabled}
          className={`w-full pl-10 pr-12 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black placeholder-gray-500 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};