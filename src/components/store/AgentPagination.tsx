import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AgentPaginationProps {
  total: number;
  page: number; // 1-based
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const getPages = (total: number, current: number): (number | '…')[] => {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [...range(1, 5), '…', total];
  if (current >= total - 3) return [1, '…', ...range(total - 4, total)];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

const btn =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40';

const AgentPagination: React.FC<AgentPaginationProps> = ({
  total,
  page,
  pageSize,
  pageSizeOptions = [5, 10, 20],
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing {from} to {to} of {total} {total === 1 ? 'agent' : 'agents'}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className={`${btn} text-slate-600 hover:bg-slate-100`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {getPages(totalPages, page).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`${btn} ${
                  p === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className={`${btn} text-slate-600 hover:bg-slate-100`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AgentPagination;