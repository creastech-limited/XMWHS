import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface RoleInfoProps {
  role: string;
  icon?: React.ReactNode;
  className?: string;
}

export const RoleInfo: React.FC<RoleInfoProps> = ({
  role,
  icon,
  className = ''
}) => {
  return (
    <div className={`rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ${className}`}>
      <div className="mb-2 flex items-center gap-2 font-semibold">
        {icon || <ShieldCheck className="h-4 w-4" />}
        <span>Role</span>
      </div>
      <div className="capitalize">{role}</div>
    </div>
  );
};