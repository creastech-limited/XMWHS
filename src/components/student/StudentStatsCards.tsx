// src/components/student/StudentStatsCards.tsx
import React from 'react';
import { UsersIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';
import type { StudentStats } from '../../types/student-management';

interface StudentStatsCardsProps {
  stats: StudentStats;
}

const StudentStatsCards: React.FC<StudentStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
              Total Students
            </p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {stats.total}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg">
            <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
              Active Students
            </p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">
              {stats.active}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
              Pending Students
            </p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg">
            <ClockIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
              Inactive Students
            </p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">
              {stats.inactive}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg">
            <XCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStatsCards;