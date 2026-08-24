// src/components/student/StudentTable.tsx
import React from 'react';
import { 
  MailIcon, 
  BookOpenIcon, 
  MoreVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon
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
}

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
}) => {
  const getStatusBadgeColor = (status: string = 'Pending'): string => {
    const statusLower = (status || 'Pending').toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string = 'Pending') => {
    const statusLower = (status || 'Pending').toLowerCase();
    switch (statusLower) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'inactive':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 md:mb-8 border border-gray-100">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 md:mb-8 border border-gray-100">
        <div className="flex flex-col justify-center items-center h-64 text-gray-500">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <UserIcon className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium mb-2">No students found</p>
          <p className="text-sm">Start by adding your first student</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 md:mb-8 border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Adm No
              </th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Guardian
              </th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {students.map((student) => (
              <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="flex min-w-[220px] items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-blue-100">
                      {getStudentProfileImage(student) ? (
                        <img
                          src={getStudentProfileImage(student) || ''}
                          alt={getStudentDisplayName(student)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-blue-700">
                          {getStudentInitials(student)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {getStudentDisplayName(student)}
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                    {student.admissionNumber || student.student_id || 'N/A'}
                  </div>
                </td>
                
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="flex min-w-[220px] items-center gap-2 text-sm text-gray-700">
                    <MailIcon className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{student.email || 'No email'}</span>
                  </div>
                </td>
                
                <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  {student.guardian ? (
                    <div className="text-sm font-medium text-gray-900">
                      {student.guardian.fullName}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No guardian assigned</span>
                  )}
                </td>
                
                <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {student.classAdmittedTo || 'Not Assigned'}
                    </span>
                  </div>
                </td>
                
                <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(student.status)}`}
                  >
                    {getStatusIcon(student.status)}
                    <span className="capitalize">{student.status || 'Pending'}</span>
                  </span>
                </td>
                
                <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-center">
                  <button
                    onClick={(e) => onMenuOpen(e, student)}
                    className="text-gray-400 hover:text-gray-600 p-1 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Open actions menu"
                    aria-label="Open actions menu"
                  >
                    <MoreVerticalIcon className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-xl p-3 md:p-4 shadow-sm border-t border-gray-100">
          <div className="text-xs md:text-sm text-gray-600 mb-3 sm:mb-0">
            Showing page {currentPage} of {pageCount}
          </div>
          
          <div className="flex justify-center">
            <nav className="inline-flex rounded-lg shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-1 md:px-3 md:py-2 rounded-l-lg border text-xs md:text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let pageNum = i + 1;
                if (pageCount > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                  }
                  if (currentPage > pageCount - 2) {
                    pageNum = pageCount - 4 + i;
                  }
                }
                return (
                  pageNum <= pageCount && (
                    <button
                      key={i}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-3 py-1 md:px-4 md:py-2 border text-xs md:text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                );
              })}
              
              <button
                onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                className={`relative inline-flex items-center px-2 py-1 md:px-3 md:py-2 rounded-r-lg border text-xs md:text-sm font-medium ${
                  currentPage === pageCount
                    ? 'text-gray-300 bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;