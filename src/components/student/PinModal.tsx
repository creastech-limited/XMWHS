// src/components/student/PinModal.tsx
import React from 'react';
import { KeyIcon } from 'lucide-react';
import type { Student } from '../../types/student';
import type { PinData } from '../../types/student-management';

interface PinModalProps {
  isOpen: boolean;
  action: 'set' | 'update';
  student: Student | null;
  pinData: PinData;
  loading: boolean;
  onPinChange: (data: PinData) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  action,
  student,
  pinData,
  loading,
  onPinChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  const handleChange = (field: keyof PinData, value: string) => {
    onPinChange({ ...pinData, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <KeyIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {action === 'set' ? 'Set PIN' : 'Update PIN'}
            </h3>
            <p className="text-sm text-gray-500">
              For student: <strong>{student.name || 'Unknown'}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {action === 'update' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current PIN
              </label>
              <input
                type="password"
                value={pinData.currentPin}
                onChange={(e) => handleChange('currentPin', e.target.value)}
                placeholder="Enter current PIN"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
                maxLength={4}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {action === 'set' ? 'New PIN' : 'New PIN'}
            </label>
            <input
              type="password"
              value={pinData.newPin}
              onChange={(e) => handleChange('newPin', e.target.value)}
              placeholder="Enter 4-digit PIN"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
              maxLength={4}
              pattern="[0-9]{4}"
              title="PIN must be 4 digits"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm PIN
            </label>
            <input
              type="password"
              value={pinData.confirmPin}
              onChange={(e) => handleChange('confirmPin', e.target.value)}
              placeholder="Confirm PIN"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
              maxLength={4}
              pattern="[0-9]{4}"
              title="PIN must be 4 digits"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> PIN must be exactly 4 digits (0-9)
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !pinData.newPin || !pinData.confirmPin || pinData.newPin !== pinData.confirmPin}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                {action === 'set' ? 'Setting...' : 'Updating...'}
              </>
            ) : (
              action === 'set' ? 'Set PIN' : 'Update PIN'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinModal;