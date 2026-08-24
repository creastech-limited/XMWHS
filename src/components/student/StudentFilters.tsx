// src/components/student/StudentFilters.tsx
import React from 'react';
import { SearchIcon, DownloadIcon, PlusIcon } from 'lucide-react';

interface StudentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (value: string) => void;
  availableClasses: string[];
  onDownloadSample: () => void;
  onBulkUpload: () => void;
  onExport: () => void;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  gradeFilter,
  onGradeFilterChange,
  availableClasses,
  onDownloadSample,
  onBulkUpload,
  onExport,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-800"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base text-gray-700 font-medium bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div>
          <select
            value={gradeFilter}
            onChange={(e) => onGradeFilterChange(e.target.value)}
            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base text-gray-700 font-medium bg-white"
          >
            <option value="all">All Classes</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
            <option value="Not Assigned">Not Assigned</option>
          </select>
        </div>
      </div>
      
      <div className="mt-3 md:mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={onDownloadSample}
          className="bg-green-100 hover:bg-green-200 text-green-700 font-medium px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
          title="Download sample CSV"
        >
          <DownloadIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Sample CSV</span>
        </button>
        
        <button
          onClick={onBulkUpload}
          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
        >
          <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Bulk Upload</span>
        </button>
        
        <button
          onClick={onExport}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
        >
          <DownloadIcon className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Export Data</span>
        </button>
      </div>
    </div>
  );
};

export default StudentFilters;