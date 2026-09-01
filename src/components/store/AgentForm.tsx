// src/components/store/AgentForm.tsx
import React from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import type { AgentFormData, AgentFormErrors } from '../../types/agent';

interface AgentFormProps {
  isOpen: boolean;
  formData: AgentFormData;
  errors: AgentFormErrors;
  isLoading: boolean;
  showPassword: boolean;
  onClose: () => void;
  onChange: (field: keyof AgentFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTogglePassword: () => void;
}

const AgentForm: React.FC<AgentFormProps> = ({
  isOpen,
  formData,
  errors,
  isLoading,
  showPassword,
  onClose,
  onChange,
  onSubmit,
  onTogglePassword,
}) => {
  if (!isOpen) return null;

  const fields = [
    { key: 'firstName', label: 'First Name *', placeholder: 'John', type: 'text' },
    { key: 'lastName', label: 'Last Name *', placeholder: 'Doe', type: 'text' },
    { key: 'email', label: 'Email *', placeholder: 'john.doe@example.com', type: 'email' },
    { key: 'phone', label: 'Phone Number *', placeholder: '+1 (555) 123-4567', type: 'tel' },
  ] as const;

  return (
    <div className="relative bg-white p-5 sm:p-6 md:p-6 lg:p-7 mb-5 sm:mb-6 md:mb-7 rounded-xl shadow-lg overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

      <h2 className="text-lg sm:text-xl md:text-[20px] font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
        <UserPlus className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
        <span>Create New Agent Account</span>
      </h2>

      <form onSubmit={onSubmit} className="mt-2 sm:mt-3 md:mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <div className="col-span-2">
            <h3 className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-500 mb-1 sm:mb-2">
              Agent Information
            </h3>
            <div className="border-b border-gray-200 mb-2 sm:mb-3 md:mb-4" />
          </div>

          {fields.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs sm:text-sm md:text-[14px] font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                className={`w-full rounded-md border ${
                  errors[key as keyof AgentFormErrors] ? 'border-red-500' : 'border-gray-300'
                } shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-[14px] py-2 px-3`}
                value={formData[key as keyof AgentFormData]}
                onChange={onChange(key)}
                placeholder={placeholder}
                required
              />
              {errors[key as keyof AgentFormErrors] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[key as keyof AgentFormErrors]}
                </p>
              )}
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-xs sm:text-sm md:text-[14px] font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full rounded-md border pr-10 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-[14px] py-2 px-3`}
                value={formData.password}
                onChange={onChange('password')}
                placeholder="At least 6 characters"
                required
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            type="button"
            className="px-3 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm md:text-[14px] text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center text-xs sm:text-sm md:text-[14px]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Agent...
              </>
            ) : (
              'Create Agent Account'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentForm;