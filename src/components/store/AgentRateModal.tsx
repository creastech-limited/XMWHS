import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getApiErrorMessage, setDidClientRate } from '../../services';
import type { AgentRow } from './AgentTable';

interface AgentRateModalProps {
  agent: AgentRow | null;
  currentRate?: number;
  onClose: () => void;
  onSaved: (agent: AgentRow, rate: number) => void;
}

const AgentRateModal: React.FC<AgentRateModalProps> = ({ agent, currentRate, onClose, onSaved }) => {
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const id = agent?.id;

  // Start fresh each time the modal opens (prefilled with the current rate, if any), and focus the input.
  useEffect(() => {
    if (!id) return;
    setRate(currentRate !== undefined ? String(currentRate) : '');
    setError('');
    setSubmitting(false);
    inputRef.current?.focus();
  }, [id]);

  useEffect(() => {
    if (!agent) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agent, submitting, onClose]);

  if (!agent) return null;

  const name = agent.fullName || `${agent.firstName} ${agent.lastName}`.trim() || agent.email || 'this agent';
  const hasRate = currentRate !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = Number(rate);
    if (rate.trim() === '' || !Number.isFinite(value) || value < 0) {
      setError('Enter a valid rate per minute.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await setDidClientRate(agent.id, value);
      onSaved(agent, value);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={() => !submitting && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-rate-title"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="agent-rate-title" className="text-base font-semibold text-slate-900">
              {hasRate ? 'Agent rate' : 'Set rate'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {hasRate ? 'Current rate per minute for ' : 'Set the rate per minute for '}
              <span className="font-medium text-slate-900">{name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label htmlFor="agent-rate-per-minute" className="mb-1.5 block text-sm font-medium text-slate-700">
              Rate per minute
            </label>
            <input
              id="agent-rate-per-minute"
              ref={inputRef}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 14"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : hasRate ? 'Update rate' : 'Save rate'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentRateModal;