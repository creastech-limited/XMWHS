// src/components/student/StudentInfoDisplay.tsx
import React from 'react';
import type { StudentDetails } from '../../types/student';

interface StudentInfoDisplayProps {
  user: StudentDetails;
}

const StudentInfoDisplay: React.FC<StudentInfoDisplayProps> = ({ user }) => {
  const getStatusColor = (status?: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Student Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Student ID:</p>
          <p className="text-gray-800 break-all">{user._id}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Status:</p>
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
            {user.status || 'Unknown'}
          </span>
        </div>
        {user.createdAt && (
          <div>
            <p className="text-sm font-medium text-gray-600">Joined:</p>
            <p className="text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-600">Role:</p>
          <p className="text-gray-800 capitalize">{user.role || 'Student'}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoDisplay;