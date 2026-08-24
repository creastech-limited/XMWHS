// src/components/student/BulkUploadModal.tsx
import React from 'react';
import { UsersIcon, DownloadIcon } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  file: File | null;
  loading: boolean;
  progress: number;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onDownloadSample: () => void;
  onClose: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  file,
  loading,
  progress,
  onFileChange,
  onUpload,
  onDownloadSample,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        alert('Please select a valid CSV file');
        return;
      }
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
            <UsersIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Bulk Upload Students</h3>
            <p className="text-sm text-gray-500">Upload a CSV file to register multiple students</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <DownloadIcon className="h-12 w-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Click to select CSV file'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Maximum file size: 5MB
              </span>
            </label>
          </div>

          {progress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>CSV Format:</strong> firstName, lastName, email, phone, classAdmittedTo
            </p>
            <button
              onClick={onDownloadSample}
              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
            >
              Download sample CSV file
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
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
            onClick={onUpload}
            disabled={!file || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                Uploading...
              </>
            ) : (
              'Upload Students'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;