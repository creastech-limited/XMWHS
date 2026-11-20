import React from 'react';
import { UsersIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';
import type { StudentStats } from '../../types/student-management';

interface StudentStatsCardsProps {
  stats: StudentStats;
}

const StudentStatsCards: React.FC<StudentStatsCardsProps> = ({ stats }) => {
  const pct = (n: number) =>
    stats.total > 0 ? `${Math.round((n / stats.total) * 100)}% of total` : 'No students yet';

  const cards = [
    {
      label: 'Total students',
      value: stats.total,
      sub: 'Across all classes',
      Icon: UsersIcon,
      iconWrap: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Active',
      value: stats.active,
      sub: pct(stats.active),
      Icon: CheckCircleIcon,
      iconWrap: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pending',
      value: stats.pending,
      sub: stats.pending > 0 ? `${pct(stats.pending)} · awaiting activation` : pct(stats.pending),
      Icon: ClockIcon,
      iconWrap: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      sub: pct(stats.inactive),
      Icon: XCircleIcon,
      iconWrap: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
      {cards.map(({ label, value, sub, Icon, iconWrap }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-200/70 bg-white p-4 md:p-5"
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconWrap}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-[28px]">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StudentStatsCards;