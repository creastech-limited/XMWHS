// src/components/student/StudentActionsMenu.tsx
import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  CalendarIcon,
  MailIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  RefreshCwIcon,
} from 'lucide-react';
import type { Student } from '../../types/student';

interface StudentActionsMenuProps {
  isOpen: boolean;
  student: Student | null;
  position: { top: number; left: number };
  onClose: () => void;
  onViewDetails: (student: Student) => void;
  onViewTransactions: (student: Student) => void;
  onAssignGuardian: (student: Student) => void;
  onActivateDeactivate: (student: Student) => void;
  onSetPin: () => void;
  onUpdatePin: () => void;
}

const StudentActionsMenu: React.FC<StudentActionsMenuProps> = ({
  isOpen,
  student,
  position,
  onClose,
  onViewDetails,
  onViewTransactions,
  onAssignGuardian,
  onActivateDeactivate,
  onSetPin,
  onUpdatePin,
}) => {
  // Kept locally so the modal survives the dropdown closing
  const [confirmStudent, setConfirmStudent] = useState<Student | null>(null);

  // Close the modal with Escape
  useEffect(() => {
    if (!confirmStudent) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmStudent(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmStudent]);

  const confirmIsActive = confirmStudent
    ? (confirmStudent.status || '').toLowerCase() === 'active'
    : false;

  const confirmName = confirmStudent
    ? [confirmStudent.firstName, confirmStudent.lastName].filter(Boolean).join(' ') ||
    'this student'
    : '';

  const handleConfirm = () => {
    if (!confirmStudent) return;
    onActivateDeactivate(confirmStudent);
    setConfirmStudent(null);
  };

  const handleActivateDeactivateClick = () => {
    if (!student) return;
    setConfirmStudent(student); // open the confirmation modal
    onClose(); // close the dropdown
  };

  const confirmModal = confirmStudent && (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setConfirmStudent(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-status-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmIsActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}
        >
          {confirmIsActive ? (
            <XCircleIcon className="h-6 w-6" />
          ) : (
            <CheckCircleIcon className="h-6 w-6" />
          )}
        </div>

        <h2 id="confirm-status-title" className="text-lg font-semibold text-gray-900">
          {confirmIsActive ? 'Deactivate student?' : 'Activate student?'}
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          {confirmIsActive
            ? `${confirmName} will be marked inactive and may lose access until you activate them again.`
            : `${confirmName} will be marked active and regain access to their account.`}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setConfirmStudent(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmIsActive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            onClick={handleConfirm}
          >
            {confirmIsActive ? 'Deactivate student' : 'Activate student'}
          </button>
        </div>
      </div>
    </div>
  );

  if ((!isOpen || !student) && !confirmStudent) return null;

  const isActive = student ? (student.status || '').toLowerCase() === 'active' : false;
  const hasGuardian = !!student?.guardian;

  return (
    <>
      {isOpen && student && (
        <>
          <div className="fixed inset-0 z-20" onClick={onClose} />

          <div
            className="fixed z-20 bg-white rounded-lg shadow-lg py-2 w-56 border border-gray-200 max-h-[70vh] overflow-y-auto overscroll-contain"
            style={{
              top: Math.min(
                position.top,
                window.innerHeight - Math.min(window.innerHeight * 0.7, 400) - 16
              ),
              left: Math.min(position.left - 100, window.innerWidth - 224),
            }}
          >
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={() => onViewDetails(student)}
            >
              <UserIcon className="h-4 w-4" />
              View Details
            </button>

            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={() => onViewTransactions(student)}
            >
              <CalendarIcon className="h-4 w-4" />
              Transaction Info
            </button>

            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={onClose}
            >
              <MailIcon className="h-4 w-4" />
              Reset Password
            </button>

            {/* PIN Management Options */}
            <div className="border-t border-gray-100 my-1" />

            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 w-full text-left"
              onClick={onSetPin}
            >
              <KeyIcon className="h-4 w-4" />
              Set PIN
            </button>

            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 w-full text-left"
              onClick={onUpdatePin}
            >
              <RefreshCwIcon className="h-4 w-4" />
              Update PIN
            </button>

            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={() => onAssignGuardian(student)}
            >
              <UsersIcon className="h-4 w-4" />
              {hasGuardian ? 'Re-assign Guardian' : 'Assign Guardian'}
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left ${isActive ? 'text-red-600' : 'text-green-600'
                }`}
              onClick={handleActivateDeactivateClick}
            >
              {isActive ? (
                <>
                  <XCircleIcon className="h-4 w-4" />
                  Deactivate Student
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Activate Student
                </>
              )}
            </button>
          </div>
        </>
      )}

      {confirmModal}
    </>
  );
};

export default StudentActionsMenu;