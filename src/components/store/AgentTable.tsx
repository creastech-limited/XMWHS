// src/components/store/AgentTable.tsx
// Replaces AgentCard. Always shows what the API returns today (agent, phone, status, enabled).
// Transactions / revenue / last-active columns appear automatically once the API sends those fields.
import React from 'react';
import { AgentAvatar, StatusBadge, Switch, naira } from './ui';
import type { StoreAgent } from '../../types';

// status comes from the API ("active" | "inactive"); anything else counts as active.
export const isAgentActive = (a: StoreAgent) =>
  String(a.status ?? '').toLowerCase() !== 'inactive';

export type AgentRow = StoreAgent & {
  transactionCount?: number;
  revenueThisMonth?: number;
  lastActiveAt?: string; // ISO date
};

interface AgentTableProps {
  agents: AgentRow[];
  onToggleStatus: (agent: StoreAgent) => void;
  /** Agent ids with a status request in flight: their switch is disabled. */
  pendingIds?: Set<string>;
}

const th = 'whitespace-nowrap px-5 py-2.5 text-xs font-medium text-slate-500';
const td = 'whitespace-nowrap px-5 py-3 text-sm';

const timeAgo = (iso?: string) => {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hr ago`;
  return `${Math.floor(mins / 1440)} days ago`;
};

const AgentTable: React.FC<AgentTableProps> = ({ agents, onToggleStatus, pendingIds }) => {
  const showTx = agents.some((a) => a.transactionCount !== undefined);
  const showRevenue = agents.some((a) => a.revenueThisMonth !== undefined);
  const showLastActive = agents.some((a) => a.lastActiveAt);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="border-y border-slate-100 bg-slate-50/60">
          <tr>
            <th className={`${th} text-left`}>Agent</th>
            <th className={`${th} text-left`}>Phone</th>
            {showTx && <th className={`${th} text-right`}>Transactions</th>}
            {showRevenue && <th className={`${th} text-right`}>Revenue (this month)</th>}
            {showLastActive && <th className={`${th} text-left`}>Last active</th>}
            <th className={`${th} text-left`}>Status</th>
            <th className={`${th} text-right`}>Enabled</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {agents.map((agent) => {
            const name = agent.fullName || `${agent.firstName} ${agent.lastName}`;
            const active = isAgentActive(agent);
            return (
              <tr key={agent.id} className="hover:bg-slate-50/60">
                <td className={td}>
                  <span className="flex items-center gap-3">
                    <AgentAvatar name={name} />
                    <span className="min-w-0">
                      <span className="block max-w-[220px] truncate font-medium text-slate-900" title={name}>
                        {name}
                      </span>
                      <span className="block max-w-[220px] truncate font-mono text-xs text-slate-500" title={agent.email}>
                        {agent.email || 'No email'}
                      </span>
                    </span>
                  </span>
                </td>
                <td className={`${td} tabular-nums text-slate-600`}>{agent.phone || '—'}</td>
                {showTx && (
                  <td className={`${td} text-right font-medium tabular-nums text-slate-900`}>
                    {agent.transactionCount ?? '—'}
                  </td>
                )}
                {showRevenue && (
                  <td className={`${td} text-right font-medium tabular-nums text-slate-900`}>
                    {agent.revenueThisMonth !== undefined ? naira(agent.revenueThisMonth) : '—'}
                  </td>
                )}
                {showLastActive && <td className={`${td} text-slate-500`}>{timeAgo(agent.lastActiveAt)}</td>}
                <td className={td}>
                  <StatusBadge status={active ? 'Active' : 'Inactive'} />
                </td>
                <td className={`${td} text-right`}>
                  <Switch
                    checked={active}
                    onChange={() => onToggleStatus(agent)}
                    disabled={pendingIds?.has(agent.id)}
                    label={`${active ? 'Deactivate' : 'Activate'} ${name}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AgentTable;