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
  did_invoice_payment_received: 'Invoice payment received',
  did_invoice_payment: 'Invoice payment initiated',
};

const labelFor = (type: string) =>
  TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const mapStatus = (s?: string): 'Completed' | 'Pending' | 'Failed' => {
  const v = (s || '').toLowerCase();
  if (v === 'success' || v === 'completed') return 'Completed';
  if (v === 'pending') return 'Pending';
  return 'Failed';
};

type AgentInfo = { name: string; email: string };

type AgentLookup = {
  byEmail: Map<string, string>;
  byId: Map<string, AgentInfo>;
};

const isDidTransaction = (type?: string) =>
  typeof type === 'string' && type.startsWith('did_invoice');

// Every DID payment creates two rows: an agent-side debit (`did_invoice_payment`) and a
// store-side credit (`did_invoice_payment_received`). The store dashboard only shows the
// credit, so a payment appears once and as money coming in.
const isAgentSideDidRow = (raw: RawDashboardTransaction) =>
  raw.transactionType === 'did_invoice_payment';

// Non-DID rows belong to an agent's wallet: a credit means the agent received money
// (receiverEmail is the agent), a debit means the agent sent it (senderEmail is the agent).
// DID rows carry no emails, so the agent is resolved from metadata.agentId instead.
export const mapTransaction = (
  raw: RawDashboardTransaction,
  agents: AgentLookup
): DashboardTransaction => {
  const direction = raw.category === 'debit' ? 'debit' : 'credit';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (raw.metadata ?? {}) as Record<string, any>;

  let agentEmail = '';
  let agentName = '';
  let counterpartyEmail = '';
  let customer = '';

  if (isDidTransaction(raw.transactionType)) {
    const agent = meta.agentId ? agents.byId.get(String(meta.agentId)) : undefined;
    agentEmail = agent?.email ?? '';
    agentName = agent?.name ?? '';
    customer = meta.invoiceNumber ? `Invoice ${meta.invoiceNumber}` : 'Invoice payment';
  } else {
    const sender: string = meta.senderEmail ?? '';
    const receiver: string = meta.receiverEmail ?? '';
    agentEmail = direction === 'credit' ? receiver : sender;
    counterpartyEmail = direction === 'credit' ? sender : receiver;
    agentName = agents.byEmail.get(agentEmail.toLowerCase()) ?? '';
    customer = counterpartyEmail || agentEmail || 'Unknown';
  }

  return {
    ...raw,
    id: raw._id,
    date: new Date(raw.createdAt).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    }),
    amount: Number(raw.amount) || 0,
    customer,
    status: mapStatus(raw.status),
    direction,
    typeLabel: labelFor(raw.transactionType),
    agentEmail,
    agentName,
    counterpartyEmail,
  } as unknown as DashboardTransaction;
};

export const mapDashboard = (res: StoreDashboardResponse): DashboardData => {
  const d = res.data;
  const agentStats = d.agentRevenue?.agents ?? [];

  const agents: AgentLookup = {
    byEmail: new Map(agentStats.map((a) => [a.email.toLowerCase(), a.name])),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byId: new Map(
      agentStats.map((a) => [
        String((a as { agentId?: string }).agentId ?? ''),
        { name: a.name, email: a.email },
      ])
    ),
  };

  const maxCount = Math.max(0, ...agentStats.map((a) => a.totalTransactionCount));

  // "performance" is each agent's transaction count relative to the busiest agent.
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
      .filter((tx) => !isAgentSideDidRow(tx))
      .slice(0, 5)
      .map((tx) => mapTransaction(tx, agents)),
    transactionsTotal: d.transactions?.pagination?.total ?? 0,
    topAgents,
    agentStats,
    notifications: [],
  };
};