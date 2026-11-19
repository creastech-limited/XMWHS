import React, { useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Copy, Check, Download } from 'lucide-react';
import { useManageAgents } from '../../hooks/useManageAgents';
import {
  AgentDrawer,
  AgentTable,
  isAgentActive,
  AgentEmptyState,
  AgentSearchBar,
  AgentStatCards,
  AgentPagination,
  type AgentRow,
  Card,
} from '../../components/store';
import AgentRateModal from '../../components/store/AgentRateModal';
import AgentReportModal from '../../components/store/AgentReportModal';
import { downloadCsv, slugify } from '../../utils/Exportcsv';
import { getDidRates, toggleAgentDID } from '../../services';
import type { StoreAgent } from '../../types';

type Filter = 'all' | 'active' | 'inactive';
const isActive = isAgentActive;

const Chip: React.FC<{ label: string; value: string; copyValue?: string }> = ({ label, value, copyValue }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: ignore */
    }
  };
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="truncate font-medium text-slate-900" title={copyValue ?? value}>
        {value}
      </span>
      {copyValue && (
        <button
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="rounded text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </span>
  );
};

const ManageAgentsPage: React.FC = () => {
  const {
    agents,
    agentCount,
    storeInfo,
    searchTerm,
    showForm,
    showPassword,
    isLoading,
    isPageLoading,
    agentData,
    errors,
    filteredAgents,
    setSearchTerm,
    setShowForm,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleToggleStatus,
    resetForm,
    getStoreName,
  } = useManageAgents();

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Ids with a status request in flight: their switch is disabled to prevent double-clicks.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // DID state: overrides hold the latest known isDIDAgent per agent id after a toggle in this session.
  const [didOverrides, setDidOverrides] = useState<Record<string, boolean>>({});
  const [didPendingIds, setDidPendingIds] = useState<Set<string>>(new Set());

  // Agent whose rate is being set / viewed (opens the rate modal)
  const [rateAgent, setRateAgent] = useState<AgentRow | null>(null);

  // agentId -> current rate per minute (only agents that have a rate appear here)
  const [ratesByAgent, setRatesByAgent] = useState<Record<string, number>>({});

  // Agent whose call report is open
  const [reportAgent, setReportAgent] = useState<AgentRow | null>(null);

  // Load every client's rate once, then keep the map up to date locally when a rate is saved.
  useEffect(() => {
    let cancelled = false;
    getDidRates()
      .then((list) => {
        if (cancelled) return;
        const map: Record<string, number> = {};
        // Oldest first, so if an agent has several active rates the newest one wins.
        [...list]
          .filter((r) => r.status === 'active' && !r.deactivatedAt)
          .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
          .forEach((r) => {
            const id = typeof r.agentId === 'string' ? r.agentId : r.agentId?._id;
            if (id) map[id] = r.ratePerMinute ?? r.rate;
          });
        setRatesByAgent(map);
      })
      .catch(() => toast.error('Could not load agent rates.'));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAgent = async (agent: StoreAgent) => {
    if (pendingIds.has(agent.id)) return;
    setPendingIds((prev) => new Set(prev).add(agent.id));
    try {
      await handleToggleStatus(agent); // calls the real endpoint via the hook
    } catch {
      toast.error('Could not update the agent status. Please try again.');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
    }
  };

  // Enable / disable DID for an agent
  const toggleAgentDIDStatus = async (agent: AgentRow) => {
    if (didPendingIds.has(agent.id)) return;

    const enable = !agent.isDIDAgent;
    const name = agent.fullName || agent.email || 'this agent';

    if (!window.confirm(`Are you sure you want to ${enable ? 'enable' : 'disable'} DID for ${name}?`)) {
      return;
    }

    setDidPendingIds((prev) => new Set(prev).add(agent.id));
    try {
      const res = await toggleAgentDID(agent.id, enable);
      setDidOverrides((prev) => ({ ...prev, [agent.id]: res?.data?.isDIDAgent ?? enable }));
      toast.success(res?.message || `DID ${enable ? 'enabled' : 'disabled'} for ${name}`);
    } catch {
      toast.error(`Could not ${enable ? 'enable' : 'disable'} DID. Please try again.`);
    } finally {
      setDidPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
    }
  };

  const activeCount = useMemo(() => agents.filter(isActive).length, [agents]);

  const visible = useMemo(
    () => filteredAgents.filter((a: StoreAgent) => filter === 'all' || (filter === 'active') === isActive(a)),
    [filteredAgents, filter]
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Merge session DID state into the rows the table receives
  const pagedWithDID: AgentRow[] = useMemo(
    () =>
      paged.map((a: StoreAgent) => ({
        ...a,
        isDIDAgent: didOverrides[a.id] ?? (a as AgentRow).isDIDAgent,
      })),
    [paged, didOverrides]
  );

  // Exports everything matching the current search and filter (all pages, not just the visible one).
  const handleExport = () => {
    const rows = visible as AgentRow[];
    const cols: [string, (a: AgentRow) => string | number | undefined][] = [
      ['Name', (a) => a.fullName || `${a.firstName} ${a.lastName}`],
      ['Email', (a) => a.email],
      ['Phone', (a) => a.phone],
      ['Role', (a) => a.role],
      ['Status', (a) => (isActive(a) ? 'Active' : 'Inactive')],
    ];
    // These columns are included automatically once the API sends them.
    if (rows.some((a) => a.transactionCount !== undefined)) cols.push(['Transactions', (a) => a.transactionCount]);
    if (rows.some((a) => a.revenueThisMonth !== undefined)) cols.push(['Revenue (this month)', (a) => a.revenueThisMonth]);
    if (rows.some((a) => a.lastActiveAt)) cols.push(['Last active', (a) => a.lastActiveAt]);

    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `${slugify(getStoreName())}-agents-${date}.csv`,
      cols.map(([h]) => h),
      rows.map((a) => cols.map(([, get]) => get(a)))
    );
    toast.success(`Exported ${rows.length} ${rows.length === 1 ? 'agent' : 'agents'}`);
  };

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: agentCount },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'inactive', label: 'Inactive', count: agentCount - activeCount },
  ];

  return (
    <div className="text-slate-700">
      <ToastContainer position="top-right" autoClose={3000} closeOnClick pauseOnFocusLoss pauseOnHover theme="light" />

      <div className=" mb-20 w-full space-y-5 px-2 py-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">Agents</h1>
            <p className="mt-1 text-sm text-slate-500">
              The people on the ground taking payments for your store.
            </p>
            {storeInfo && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip label="Store" value={getStoreName()} />
                <Chip label="Type" value={storeInfo.type} />
                <Chip label="Store ID" value={storeInfo.store_id} copyValue={storeInfo.store_id} />
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isPageLoading || visible.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setShowForm(true)}
              disabled={!storeInfo?.store_id}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add agent
            </button>
          </div>
        </div>

        <AgentStatCards totalAgents={agentCount} activeAgents={activeCount} />

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <AgentSearchBar
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setPage(1);
              }}
            />
            <div className="flex shrink-0 gap-1.5" role="group" aria-label="Filter agents by status">
              {chips.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setFilter(c.id);
                    setPage(1);
                  }}
                  aria-pressed={filter === c.id}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    filter === c.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.label} <span className="ml-1 opacity-70">{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          {isPageLoading ? (
            <div className="flex justify-center py-14" role="status" aria-label="Loading agents">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>
          ) : visible.length > 0 ? (
            <>
              <AgentTable
                agents={pagedWithDID}
                onToggleStatus={toggleAgent}
                pendingIds={pendingIds}
                onToggleDID={toggleAgentDIDStatus}
                didPendingIds={didPendingIds}
                ratesByAgent={ratesByAgent}
                onSetRate={setRateAgent}
                onViewReport={setReportAgent}
              />
              <AgentPagination
                total={visible.length}
                page={safePage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            </>
          ) : (
            <AgentEmptyState
              searchTerm={searchTerm || (filter !== 'all' ? filter : '')}
              hasStoreId={!!storeInfo?.store_id}
              onAddAgent={() => setShowForm(true)}
            />
          )}
        </Card>
      </div>

      <AgentDrawer
        isOpen={showForm}
        storeName={getStoreName()}
        formData={agentData}
        errors={errors}
        isLoading={isLoading}
        showPassword={showPassword}
        onClose={resetForm}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <AgentRateModal
        agent={rateAgent}
        currentRate={rateAgent ? ratesByAgent[rateAgent.id] : undefined}
        onClose={() => setRateAgent(null)}
        onSaved={(agent, rate) => {
          setRateAgent(null);
          setRatesByAgent((prev) => ({ ...prev, [agent.id]: rate }));
          toast.success(`Rate for ${agent.fullName || agent.email || 'the agent'} set to ${rate} per minute`);
        }}
      />

      <AgentReportModal agent={reportAgent} onClose={() => setReportAgent(null)} />
    </div>
  );
};

export default ManageAgentsPage;