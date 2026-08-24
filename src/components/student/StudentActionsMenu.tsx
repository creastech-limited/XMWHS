// src/components/student/StudentActionsMenu.tsx
import React from 'react';
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
  if (!isOpen || !student) return null;

  const isActive = (student.status || '').toLowerCase() === 'active';

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      
      <div
        className="fixed z-20 bg-white rounded-lg shadow-lg py-2 w-56 border border-gray-200 max-h-[70vh] overflow-y-auto overscroll-contain"
        style={{
          top: Math.min(position.top, window.innerHeight - Math.min(window.innerHeight * 0.7, 400) - 16),
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
          Assign Guardian
        </button>

        <div className="border-t border-gray-100 my-1" />

        <button
          className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left ${
            isActive ? 'text-red-600' : 'text-green-600'
          }`}
          onClick={() => onActivateDeactivate(student)}
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
  );
};

export default StudentActionsMenu;