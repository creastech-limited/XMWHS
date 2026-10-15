import React from 'react';

interface PageSizeSelectorProps {
  pageSize: number;
  total: number;
  page: number;
  options?: number[];
  onChange: (size: number) => void;
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  total,
  page,
  options = [10, 25, 50, 100],
  onChange,
}) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{start}–{end}</span> of{' '}
        <span className="font-medium">{total}</span> students
      </p>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Rows per page
        <select
          value={pageSize}
          onChange={(e) => onChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-lg bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {options.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default PageSizeSelector;