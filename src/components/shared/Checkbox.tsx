import React from 'react';

interface CheckboxProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  error?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  name,
  checked,
  onChange,
  label,
  error,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        {label && (
          <span className="text-gray-700 text-sm">
            {label}
          </span>
        )}
      </label>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};