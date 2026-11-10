import React from 'react';
import { getGreeting, formatDashboardDate } from '../../utils/greeting';

interface DashboardGreetingProps {
  ownerName: string;
  storeName: string;
}

const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  ownerName,
  storeName,
}) => {
  const now = new Date();

  return (
    <div className="mb-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-[#0F1B3D]">
        {getGreeting(now)}, {ownerName}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Here&apos;s what&apos;s happening at {storeName} today, {formatDashboardDate(now)}.
      </p>
    </div>
  );
};

export default DashboardGreeting;