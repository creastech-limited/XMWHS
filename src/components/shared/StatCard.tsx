// src/components/shared/StatCard.tsx
import React, { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  title: string;
  value: string | number;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconBgColor,
  iconTextColor,
  title,
  value,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start ${className}`}>
      <div className={`p-3 rounded-full ${iconBgColor} ${iconTextColor} mr-4`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};