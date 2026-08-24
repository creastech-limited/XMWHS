// src/components/shared/SelectInput.tsx
import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string; // Add optional label prop
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  name,
  value,
  onChange,
  options,
  placeholder,
  label,
  error,
  icon,
  disabled = false,
  className = '',
  required = false
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black bg-white ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};