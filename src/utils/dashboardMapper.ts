// src/utils/dashboardMapper.ts
import type { Agent } from '../types';
import type {
  DashboardData,
  DashboardTransaction,
  RawDashboardTransaction,
  StoreDashboardResponse,
} from '../types/dashboard';

export const emptyDashboard: DashboardData = {
  balance: 0,
  dailyRevenue: 0,
  todayTransactionCount: 0,
  totalRevenue: 0,
  totalTransactionCount: 0,
  numberOfAgents: 0,
  activeAgents: 0,
  recentTransactions: [],
  transactionsTotal: 0,
  topAgents: [],
  agentStats: [],
  notifications: [],
};

const TYPE_LABELS: Record<string, string> = {
  wallet_transfer_received: 'Payment received',
  wallet_transfer_sent: 'Transfer sent',
  transfer_charge: 'Transfer charge',
  wallet_topup: 'Wallet top-up',
};

const labelFor = (type: string) =>
  TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const mapStatus = (s?: string): 'Completed' | 'Pending' | 'Failed' => {
  const v = (s || '').toLowerCase();
  if (v === 'success' || v === 'completed') return 'Completed';
  if (v === 'pending') return 'Pending';
  return 'Failed';
};

// Rows belong to an agent's wallet: a credit means the agent received money (receiverEmail is the
// agent), a debit means the agent sent it (senderEmail is the agent). Top-ups carry no emails.
export const mapTransaction = (
  raw: RawDashboardTransaction,
  agentNames: Map<string, string>
): DashboardTransaction => {
  const direction = raw.category === 'debit' ? 'debit' : 'credit';
  const sender = raw.metadata?.senderEmail ?? '';
  const receiver = raw.metadata?.receiverEmail ?? '';
  const agentEmail = direction === 'credit' ? receiver : sender;
  const counterpartyEmail = direction === 'credit' ? sender : receiver;

  return {
    ...raw,
    id: raw._id,
    date: new Date(raw.createdAt).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    amount: Number(raw.amount) || 0,
    customer: counterpartyEmail || agentEmail || 'Unknown',
    status: mapStatus(raw.status),
    direction,
    typeLabel: labelFor(raw.transactionType),
    agentEmail,
    agentName: agentNames.get(agentEmail.toLowerCase()) ?? '',
    counterpartyEmail,
  } as unknown as DashboardTransaction;
};

export const mapDashboard = (res: StoreDashboardResponse): DashboardData => {
  const d = res.data;
  const agentStats = d.agentRevenue?.agents ?? [];
  const agentNames = new Map(agentStats.map((a) => [a.email.toLowerCase(), a.name]));
  const maxCount = Math.max(0, ...agentStats.map((a) => a.totalTransactionCount));

  // "performance" is each agent's transaction count relative to the busiest agent (same idea as before).
  const topAgents: Agent[] = [...agentStats]
    .filter((a) => a.totalTransactionCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map((a) => ({
      name: a.name,
      sales: a.totalTransactionCount,
      performance: maxCount > 0 ? Math.round((a.totalTransactionCount / maxCount) * 100) : 0,
      revenue: a.totalRevenue,
    }));

  return {
    balance: d.wallet?.balance ?? 0,
    dailyRevenue: d.agentRevenue?.todayRevenue ?? 0,
    todayTransactionCount: d.agentRevenue?.todayTransactionCount ?? 0,
    totalRevenue: d.agentRevenue?.totalRevenue ?? 0,
    totalTransactionCount: d.agentRevenue?.totalTransactionCount ?? 0,
    numberOfAgents: d.agents?.total ?? 0,
    activeAgents: d.agents?.active ?? 0,
    recentTransactions: (d.transactions?.data ?? [])
      .slice(0, 5)
      .map((tx) => mapTransaction(tx, agentNames)),
    transactionsTotal: d.transactions?.pagination?.total ?? 0,
    topAgents,
    agentStats,
    notifications: [],
  };
};