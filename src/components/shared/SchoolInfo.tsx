import React from 'react';
import { Building, MapPin, GraduationCap } from 'lucide-react';

interface SchoolInfoProps {
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
  className?: string;
}

export const SchoolInfo: React.FC<SchoolInfoProps> = ({
  schoolName,
  schoolType,
  schoolAddress,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <h2 className="text-xl font-semibold text-blue-600 flex items-center gap-2 justify-center">
        <Building size={20} />
        {schoolName}
      </h2>
      <p className="text-gray-600 capitalize flex items-center gap-2 justify-center">
        <GraduationCap size={16} />
        {schoolType} School
      </p>
      {schoolAddress && (
        <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
          <MapPin size={14} />
          {schoolAddress}
        </p>
      )}
    </div>
  );
};