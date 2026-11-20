import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getApiErrorMessage, getDidClientReport } from '../../services';
import type { DidClientReport } from '../../types/agent';
import type { AgentRow } from './AgentTable';
import AgentReportTable from './AgentReportTable';

interface AgentReportModalProps {
  agent: AgentRow | null;
  onClose: () => void;
}

// "2026-11-01" -> "1 Nov 2026"
const formatDay = (d?: string) => {
  if (!d) return '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

const dateInput =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60';

const AgentReportModal: React.FC<AgentReportModalProps> = ({ agent, onClose }) => {
  const [report, setReport] = useState<DidClientReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rangeError, setRangeError] = useState('');
  const latest = useRef(0); // ignore responses from older requests
  const id = agent?.id;

  const load = useCallback(async (agentId: string, range?: { from: string; to: string }) => {
    const req = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const data = await getDidClientReport(agentId, range);
      if (req !== latest.current) return;
      setReport(data);
      // Show the period the server actually used.
      setFrom(data.period?.from ?? '');
      setTo(data.period?.to ?? '');
    } catch (err) {
      if (req !== latest.current) return;
      setError(getApiErrorMessage(err));
    } finally {
      if (req === latest.current) setLoading(false);
    }
  }, []);

  // Load the default period whenever the modal opens for an agent.
  useEffect(() => {
    if (!id) return;
    setReport(null);
    setFrom('');
    setTo('');
    setRangeError('');
    load(id);
  }, [id, load]);

  useEffect(() => {
    if (!agent) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agent, onClose]);

  if (!agent) return null;

  const name = report?.client?.name || agent.fullName || `${agent.firstName} ${agent.lastName}`.trim() || agent.email || 'this agent';

  const applyRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return setRangeError('Choose both a start and an end date.');
    if (from > to) return setRangeError('The start date can’t be after the end date.');
    setRangeError('');
    load(agent.id, { from, to });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-report-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="agent-report-title" className="text-base font-semibold text-slate-900">
              Call report
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-medium text-slate-900">{name}</span>
              {report?.period && (
                <>
                  {' · '}
                  {formatDay(report.period.from)} – {formatDay(report.period.to)}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date range */}
        <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={loading} className={dateInput} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            To
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} disabled={loading} className={dateInput} />
          </label>
          <button
            type="submit"
            disabled={loading || !from || !to}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && report ? 'Updating…' : 'Apply'}
          </button>
          {rangeError && <p className="w-full text-xs text-red-600">{rangeError}</p>}
        </form>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !report && (
            <div className="space-y-3" role="status" aria-label="Loading report">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className="block h-16 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
              <span className="block h-40 animate-pulse rounded-lg bg-slate-100" />
              <span className="block h-32 animate-pulse rounded-lg bg-slate-100" />
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>Couldn’t load the report. {error}</p>
              <button
                type="button"
                onClick={() => load(agent.id, from && to ? { from, to } : undefined)}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {report && (
            <div className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
              <AgentReportTable report={report} />
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentReportModal;