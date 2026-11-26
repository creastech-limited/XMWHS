import React, { useEffect, useState } from 'react';
import { Coins, FileText, MoreVertical, Shield } from 'lucide-react';
import { AgentAvatar, StatusBadge, Switch, naira } from './ui';
import type { StoreAgent } from '../../types';

// status comes from the API ("active" | "inactive"); anything else counts as active.
export const isAgentActive = (a: StoreAgent) =>
  String(a.status ?? '').toLowerCase() !== 'inactive';

export type AgentRow = StoreAgent & {
  isDIDAgent?: boolean;
  transactionCount?: number;
  revenueThisMonth?: number;
  lastActiveAt?: string; // ISO date
};

interface AgentTableProps {
  agents: AgentRow[];
  isDIDStore?: boolean;
  onToggleStatus: (agent: StoreAgent) => void;
  pendingIds?: Set<string>;
  onToggleDID: (agent: AgentRow) => void;
  didPendingIds?: Set<string>;
  // agentId -> current rate per minute; agents missing from this map have no rate yet
  ratesByAgent?: Record<string, number>;
  onSetRate: (agent: AgentRow) => void;
  onViewReport: (agent: AgentRow) => void;
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

const MENU_WIDTH = 176;

const AgentTable: React.FC<AgentTableProps> = ({
  agents,
  isDIDStore = false,
  onToggleStatus,
  pendingIds,
  onToggleDID,
  didPendingIds,
  ratesByAgent,
  onSetRate,
  onViewReport,
}) => {
  const showTx = agents.some((a) => a.transactionCount !== undefined);
  const showRevenue = agents.some((a) => a.revenueThisMonth !== undefined);
  const showLastActive = agents.some((a) => a.lastActiveAt);

  // Action menu (fixed-positioned so the table's horizontal scroll container doesn't clip it)
  const [menuAgent, setMenuAgent] = useState<AgentRow | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const closeMenu = () => setMenuAgent(null);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, agent: AgentRow) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: Math.min(rect.bottom + 4, window.innerHeight - 160),
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
    setMenuAgent(agent);
  };

  // Close the menu if the page or table scrolls, since its fixed position would go stale
  useEffect(() => {
    if (!menuAgent) return;
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [menuAgent]);

  const menuHasRate = menuAgent ? ratesByAgent?.[menuAgent.id] !== undefined : false;

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
            {isDIDStore && <th className={`${th} text-right`}>Actions</th>}
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
                      <span className="flex items-center gap-2">
                        <span className="block max-w-[220px] truncate font-medium text-slate-900" title={name}>
                          {name}
                        </span>
                        {isDIDStore && agent.isDIDAgent && (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                            DID
                          </span>
                        )}
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
                {isDIDStore && (
                  <td className={`${td} text-right`}>
                    <button
                      onClick={(e) => openMenu(e, agent)}
                      aria-label={`Open actions for ${name}`}
                      aria-haspopup="menu"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <MoreVertical className="h-[18px] w-[18px]" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Action menu */}
      {isDIDStore  && menuAgent && (
        <>
          <div className="fixed inset-0 z-30" onClick={closeMenu} />
          <div
            role="menu"
            className="fixed z-40 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
          >
            <button
              role="menuitem"
              onClick={() => {
                const a = menuAgent;
                closeMenu();
                onSetRate(a);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
            >
              <Coins className="h-4 w-4 text-slate-500" />
              {menuHasRate ? 'Get rate' : 'Set rate'}
            </button>

            <button
              role="menuitem"
              onClick={() => {
                const a = menuAgent;
                closeMenu();
                onViewReport(a);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
            >
              <FileText className="h-4 w-4 text-slate-500" />
              View report
            </button>

            <button
              role="menuitem"
              disabled={didPendingIds?.has(menuAgent.id)}
              onClick={() => {
                const a = menuAgent;
                closeMenu();
                onToggleDID(a);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:opacity-50 ${menuAgent.isDIDAgent ? 'text-red-600' : 'text-blue-600'
                }`}
            >
              <Shield className="h-4 w-4" />
              {didPendingIds?.has(menuAgent.id)
                ? 'Updating...'
                : menuAgent.isDIDAgent
                  ? 'Disable DID'
                  : 'Enable DID'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentTable;