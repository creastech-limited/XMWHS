// src/components/student/StudentEditForm.tsx
import React from 'react';
import type { StudentProfileFormData } from '../../types/student';

interface StudentEditFormProps {
  profile: StudentProfileFormData;
  isLoading: boolean;
  onProfileChange: (field: keyof StudentProfileFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const StudentEditForm: React.FC<StudentEditFormProps> = ({
  profile,
  isLoading,
  onProfileChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name - Read Only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={profile.name}
            readOnly
            disabled
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
            title="Name cannot be edited here"
          />
        </div>

        {/* Email - Read Only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
            title="Email cannot be edited here"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => onProfileChange('phone', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
            disabled={isLoading}
            maxLength={20}
            title="Enter the student's phone number"
          />
        </div>

        {/* Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <input
            type="text"
            value={profile.class}
            onChange={(e) => onProfileChange('class', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
            disabled={isLoading}
            maxLength={50}
            title="Enter the student's class"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          value={profile.address}
          onChange={(e) => onProfileChange('address', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
          rows={3}
          disabled={isLoading}
          maxLength={200}
          placeholder="Enter student address"
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          className={`flex-1 py-3 px-4 rounded-lg text-white font-semibold transition-colors ${isLoading
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default StudentEditForm;