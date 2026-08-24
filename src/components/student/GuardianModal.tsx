// src/components/student/GuardianModal.tsx
import React from 'react';
import { UsersIcon } from 'lucide-react';
import type { Student, Parent } from '../../types/student';

interface GuardianModalProps {
  isOpen: boolean;
  student: Student | null;
  parents: Parent[];
  selectedEmail: string;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onAssign: () => void;
  onClose: () => void;
}

const GuardianModal: React.FC<GuardianModalProps> = ({
  isOpen,
  student,
  parents,
  selectedEmail,
  loading,
  onEmailChange,
  onAssign,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  const getParentDisplayName = (parent: Parent): string => {
    return parent.name || 
           `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 
           'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <UsersIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Assign Guardian</h3>
            <p className="text-sm text-gray-500">
              For student: <strong>{student.name || 'Unknown'}</strong>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Guardian
          </label>

          {parents.length === 0 ? (
            <div className="flex justify-center items-center py-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading available parents...</p>
              </div>
            </div>
          ) : (
            <select
              value={selectedEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
            >
              <option value="">Select a guardian...</option>
              {parents.map((parent) => (
                <option key={parent._id} value={parent.email}>
                  {getParentDisplayName(parent)} ({parent.email})
                </option>
              ))}
            </select>
          )}

          {parents.length > 0 && selectedEmail && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                Selected guardian: <strong>
                  {parents.find(p => p.email === selectedEmail) && 
                    getParentDisplayName(parents.find(p => p.email === selectedEmail)!)}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAssign}
            disabled={!selectedEmail || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                Assigning...
              </>
            ) : (
              'Assign Guardian'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardianModal;