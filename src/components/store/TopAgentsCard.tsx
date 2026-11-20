import React from 'react';
import type { Agent } from '../../types';

interface TopAgentsCardProps {
  agents: Agent[];
  subtitle?: string;
  viewAllLink?: string;
  limit?: number;
}

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-teal-600',
  'bg-amber-600',
  'bg-pink-700',
  'bg-sky-600',
];

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const TopAgentsCard: React.FC<TopAgentsCardProps> = ({
  agents,
  subtitle = 'By revenue',
  viewAllLink = '/agents',
  limit = 4,
}) => {
  const sorted = [...agents].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sorted.reduce((sum, a) => sum + a.revenue, 0);
  const visible = sorted.slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Top Agents</h3>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <a
          href={viewAllLink}
          className="text-xs font-medium text-indigo-700 hover:underline"
        >
          View all
        </a>
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">
          No agent data available
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {visible.map((agent, i) => {
            const share =
              totalRevenue > 0
                ? Math.round((agent.revenue / totalRevenue) * 100)
                : 0;

            return (
              <li
                key={agent.name}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="w-4 text-xs text-gray-400">{i + 1}</span>

                <div
                  className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white ${
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  }`}
                >
                  {getInitials(agent.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {agent.sales} transactions
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₦{agent.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">{share}% of total</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TopAgentsCard;