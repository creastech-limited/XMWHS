// src/components/student/StudentEditForm.tsx
import React, { useState } from 'react';
import { Pencil, Check, X, Loader2, Lock } from 'lucide-react';
import type { StudentProfileFormData } from '../../types/student';

interface StudentEditFormProps {
  profile: StudentProfileFormData;
  isLoading: boolean;
  onProfileChange: (field: keyof StudentProfileFormData, value: string) => void;
  // Return false from an async handler to keep the form in edit mode (e.g. on API failure)
  onSubmit: (e: React.FormEvent) => void | boolean | Promise<void | boolean>;
  // Called when editing is cancelled, so the parent can reset unsaved changes
  onCancel: () => void;
}

const baseInput =
  'mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 text-black transition-colors';
const editableInput = `${baseInput} bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`;
const lockedInput = `${baseInput} bg-gray-100 text-gray-500 cursor-not-allowed`;
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const StudentEditForm: React.FC<StudentEditFormProps> = ({
  profile,
  isLoading,
  onProfileChange,
  onSubmit,
  onCancel,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit(e);
    if (result !== false) setIsEditing(false);
  };

  const handleCancel = () => {
    onCancel();
    setIsEditing(false);
  };

  const fieldsDisabled = !isEditing || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name - always read only */}
        <div>
          <label htmlFor="student-name" className={`${labelClass} flex items-center gap-1.5`}>
            Full Name
            <Lock className="w-3 h-3 text-gray-400" />
          </label>
          <input
            id="student-name"
            type="text"
            value={profile.name}
            readOnly
            disabled
            className={lockedInput}
            title="Name cannot be edited here"
          />
        </div>

        {/* Email - always read only */}
        <div>
          <label htmlFor="student-email" className={`${labelClass} flex items-center gap-1.5`}>
            Email Address
            <Lock className="w-3 h-3 text-gray-400" />
          </label>
          <input
            id="student-email"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className={lockedInput}
            title="Email cannot be edited here"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="student-phone" className={labelClass}>Phone Number</label>
          <input
            id="student-phone"
            type="tel"
            value={profile.phone}
            onChange={(e) => onProfileChange('phone', e.target.value)}
            className={fieldsDisabled ? lockedInput : editableInput}
            disabled={fieldsDisabled}
            maxLength={20}
            placeholder={isEditing ? "Enter the student's phone number" : '—'}
          />
        </div>

        {/* Class */}
        <div>
          <label htmlFor="student-class" className={labelClass}>Class</label>
          <input
            id="student-class"
            type="text"
            value={profile.class}
            onChange={(e) => onProfileChange('class', e.target.value)}
            className={fieldsDisabled ? lockedInput : editableInput}
            disabled={fieldsDisabled}
            maxLength={50}
            placeholder={isEditing ? "Enter the student's class" : '—'}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="student-address" className={labelClass}>Address</label>
        <textarea
          id="student-address"
          value={profile.address}
          onChange={(e) => onProfileChange('address', e.target.value)}
          className={fieldsDisabled ? lockedInput : editableInput}
          rows={3}
          disabled={fieldsDisabled}
          maxLength={200}
          placeholder={isEditing ? 'Enter student address' : '—'}
        />
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1 text-right">
            {profile.address.length}/200
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>
    </form>
  );
};

export default StudentEditForm;