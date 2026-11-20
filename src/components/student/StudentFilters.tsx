import React from 'react';
import {
  SearchIcon,
  DownloadIcon,
  UploadIcon,
  FileSpreadsheetIcon,
  LayersIcon,
  CircleDotIcon,
  ChevronDownIcon,
} from 'lucide-react';

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
  onReset: () => void;
}

/** A pill that shows "Label  Value" but is a real <select> underneath. */
const FilterSelect: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}> = ({ icon, label, value, active, onChange, children }) => (
  <label
    className={`relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${active
        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
  >
    <span className="text-slate-400">{icon}</span>
    <span>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer appearance-none bg-transparent pr-4 font-semibold text-slate-900 focus:outline-none"
    >
      {children}
    </select>
    <ChevronDownIcon className="pointer-events-none absolute right-2.5 h-3 w-3 text-slate-400" />
  </label>
);

const ghostBtn =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50';

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
  onReset,
}) => {
  const hasFilters = !!searchQuery || statusFilter !== 'all' || gradeFilter !== 'all';

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3">
      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Class */}
      <FilterSelect
        icon={<LayersIcon className="h-3.5 w-3.5" />}
        label="Class"
        value={gradeFilter}
        active={gradeFilter !== 'all'}
        onChange={onGradeFilterChange}
      >
        <option value="all">All</option>
        {availableClasses.map((className) => (
          <option key={className} value={className}>
            {className}
          </option>
        ))}
        <option value="Not Assigned">Not Assigned</option>
      </FilterSelect>

      {/* Status */}
      <FilterSelect
        icon={<CircleDotIcon className="h-3.5 w-3.5" />}
        label="Status"
        value={statusFilter}
        active={statusFilter !== 'all'}
        onChange={onStatusFilterChange}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="inactive">Inactive</option>
      </FilterSelect>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="h-9 px-2 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Reset
        </button>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onDownloadSample} className={ghostBtn} title="Download sample CSV">
          <FileSpreadsheetIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Sample CSV</span>
        </button>
        <button onClick={onBulkUpload} className={ghostBtn}>
          <UploadIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Upload</span>
        </button>
        <button onClick={onExport} className={ghostBtn}>
          <DownloadIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
};

export default StudentFilters;