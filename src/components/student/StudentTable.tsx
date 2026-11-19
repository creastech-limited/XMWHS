import React from 'react';
import {
  MailIcon,
  MoreVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
} from 'lucide-react';
import type { Student } from '../../types/student';

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onMenuOpen: (e: React.MouseEvent, student: Student) => void;
  getStudentDisplayName: (student: Student) => string;
  getStudentInitials: (student: Student) => string;
  getStudentProfileImage: (student: Student) => string | null;
  pageSize: number;
  totalItems: number;
  onPageSizeChange: (size: number) => void;
}

/* ---------- helpers ---------- */

// Full class strings so Tailwind can see them at build time.
const CLASS_COLORS = [
  { pill: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  { pill: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  { pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  { pill: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  { pill: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  { pill: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500' },
  { pill: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
];

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-500',
  'bg-rose-600',
  'bg-violet-600',
  'bg-blue-700',
  'bg-emerald-600',
  'bg-sky-600',
];

// Same input always gives the same colour
const hashIndex = (value: string, length: number): number => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h % length;
};

const initialsFromName = (name: string = ''): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusBadgeColor = (status: string = 'Pending'): string => {
  switch ((status || 'Pending').toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700';
    case 'pending':
      return 'bg-amber-50 text-amber-700';
    case 'inactive':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getStatusIcon = (status: string = 'Pending') => {
  switch ((status || 'Pending').toLowerCase()) {
    case 'active':
      return <CheckCircleIcon className="h-3.5 w-3.5" />;
    case 'inactive':
      return <XCircleIcon className="h-3.5 w-3.5" />;
    default:
      return <ClockIcon className="h-3.5 w-3.5" />;
  }
};

const th =
  'px-4 py-3 md:px-5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500';
const td = 'px-4 py-3 md:px-5';

/* ---------- component ---------- */

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  loading,
  pageCount,
  currentPage,
  onPageChange,
  onMenuOpen,
  getStudentDisplayName,
  getStudentInitials,
  getStudentProfileImage,
  totalItems,
  pageSize,
  onPageSizeChange,
}) => {
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const shell = 'mb-6 overflow-hidden rounded-xl border border-slate-200/70 bg-white md:mb-8';

  if (loading) {
    return (
      <div className={shell}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className={shell}>
        <div className="flex h-64 flex-col items-center justify-center text-slate-500">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <UserIcon className="h-7 w-7" />
          </div>
          <p className="mb-1 text-base font-medium text-slate-800">No students found</p>
          <p className="text-sm">Try changing the filters, or add a new student</p>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className={th}>Student</th>
              <th className={th}>Adm No</th>
              <th className={th}>Email</th>
              <th className={th}>Guardian</th>
              <th className={th}>Class</th>
              <th className={th}>Status</th>
              <th className={`${th} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const name = getStudentDisplayName(student);
              const image = getStudentProfileImage(student);
              const className = student.classAdmittedTo || '';
              const classColor = className
                ? CLASS_COLORS[hashIndex(className, CLASS_COLORS.length)]
                : null;
              const guardianName = student.guardian?.fullName || '';

              return (
                <tr key={student._id} className="transition-colors hover:bg-slate-50/70">
                  {/* Student */}
                  <td className={td}>
                    <div className="flex min-w-[220px] items-center gap-3">
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold text-white ${
                          AVATAR_COLORS[hashIndex(student._id || name, AVATAR_COLORS.length)]
                        }`}
                      >
                        {image ? (
                          <img src={image} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          getStudentInitials(student)
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{name}</span>
                    </div>
                  </td>

                  {/* Adm no */}
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                      {student.admissionNumber || student.student_id || 'N/A'}
                    </span>
                  </td>

                  {/* Email */}
                  <td className={td}>
                    <div className="flex min-w-[200px] items-center gap-2 text-sm text-slate-600">
                      <MailIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{student.email || 'No email'}</span>
                    </div>
                  </td>

                  {/* Guardian */}
                  <td className={`${td} whitespace-nowrap`}>
                    {guardianName ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {initialsFromName(guardianName)}
                        </span>
                        <span className="text-sm text-slate-800">{guardianName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400">
                          ?
                        </span>
                        <span className="text-xs italic text-slate-500">No guardian assigned</span>
                      </div>
                    )}
                  </td>

                  {/* Class */}
                  <td className={`${td} whitespace-nowrap`}>
                    {classColor ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${classColor.pill}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${classColor.dot}`} />
                        {className}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                        Not Assigned
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className={`${td} whitespace-nowrap`}>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeColor(
                        student.status
                      )}`}
                    >
                      {getStatusIcon(student.status)}
                      <span className="capitalize">{student.status || 'Pending'}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className={`${td} whitespace-nowrap text-center`}>
                    <button
                      onClick={(e) => onMenuOpen(e, student)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      title="Open actions menu"
                      aria-label="Open actions menu"
                    >
                      <MoreVerticalIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row md:px-5">
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <p className="hidden text-xs text-slate-500 sm:block">
              {rangeStart} to {rangeEnd} of {totalItems}
            </p>
          </div>

          <nav className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-center" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Previous
            </button>

            <span className="text-xs text-slate-500 sm:hidden">
              Page {currentPage} of {pageCount}
            </span>

            <div className="hidden items-center gap-1 sm:flex">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let pageNum = i + 1;
                if (pageCount > 5) {
                  if (currentPage > 3) pageNum = currentPage - 3 + i;
                  if (currentPage > pageCount - 2) pageNum = pageCount - 4 + i;
                }
                return (
                  pageNum <= pageCount && (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage === pageCount}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default StudentTable;