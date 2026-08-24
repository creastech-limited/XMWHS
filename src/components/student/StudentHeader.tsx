// src/components/student/StudentHeader.tsx
import React from 'react';
import { UserIcon } from 'lucide-react';
import type { Student } from '../../types/student';

interface StudentHeaderProps {
  student: Student & { fullName?: string };
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ student }) => {
  return (
    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-indigo-900">
            {student.name || `${student.firstName} ${student.lastName}`.trim()}
          </h3>
          <p className="text-sm text-indigo-600">
            Class: {student.academicDetails?.classAdmittedTo || student.classAdmittedTo || 'Not Assigned'}
          </p>
          {student.email && (
            <p className="text-xs text-indigo-500">
              {student.email}
            </p>
          )}
          {student.status && (
            <p className="text-xs text-indigo-400 mt-1">
              Status: <span className="capitalize">{student.status.toLowerCase()}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;