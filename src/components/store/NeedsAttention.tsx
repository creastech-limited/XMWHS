import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// How many disputes to show in the card before pointing to the full page
const MAX_VISIBLE = 5;

interface Dispute {
  _id: string;
  disputeType: string;
  description: string;
  status: string;
  amount: number;
  paymentCategory?: string;
  createdAt: string;
}

type Tone = 'open' | 'resolved' | 'rejected';

const OPEN_STATUSES = ['pending', 'in_progress', 'in progress', 'under investigation'];

const getTone = (status: string): Tone => {
  const s = status?.toLowerCase();
  if (s === 'resolved') return 'resolved';
  if (s === 'rejected' || s === 'closed') return 'rejected';
  return 'open'; // pending, in progress, anything unknown
};

const isOpen = (status: string): boolean => {
  const s = status?.toLowerCase();
  return !s || OPEN_STATUSES.includes(s) || getTone(status) === 'open';
};

const toneStyles: Record<
  Tone,
  { iconBg: string; iconColor: string; badge: string; icon: React.ReactNode }
> = {
  open: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
    icon: <AlertTriangle size={14} strokeWidth={2} />,
  },
  resolved: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badge: 'bg-green-50 text-green-700',
    icon: <CheckCircle2 size={14} strokeWidth={2} />,
  },
  rejected: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    badge: 'bg-red-50 text-red-600',
    icon: <CircleAlert size={14} strokeWidth={2} />,
  },
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatStatus = (status: string): string => {
  if (!status) return 'Pending';
  const s = status.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const NeedsAttention: React.FC = () => {
  const auth = useAuth();
  const token = auth?.token;

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadDisputes = useCallback(async (): Promise<void> => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/dispute/getuserdispute`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // The API answers 404 ("No disputes found for this user") when the
      // user simply has none. That's an empty state, not a failure.
      if (response.status === 404) {
        setDisputes([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let list: Dispute[] = [];
      if (Array.isArray(data.disputes)) list = data.disputes;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data)) list = data;

      setDisputes(list);
    } catch (err) {
      console.error('Failed to load disputes:', err);
      setError('Could not load disputes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  // Open disputes first, then newest first
  const sorted = useMemo(
    () =>
      [...disputes].sort((a, b) => {
        const openDiff = Number(isOpen(b.status)) - Number(isOpen(a.status));
        if (openDiff !== 0) return openDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [disputes]
  );

  const openCount = useMemo(
    () => disputes.filter((d) => isOpen(d.status)).length,
    [disputes]
  );

  const visible = sorted.slice(0, MAX_VISIBLE);
  const hiddenCount = sorted.length - visible.length;

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold leading-5 text-[#0F1733]">
            Needs your attention
          </h2>
          <p className="mt-1 text-[12px] leading-4 text-[#6B7494]">
            {loading
              ? 'Loading disputes...'
              : disputes.length === 0
                ? 'No disputes'
                : `${openCount} open · ${disputes.length} total`}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDisputes}
          disabled={loading}
          aria-label="Refresh disputes"
          title="Refresh disputes"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5">
        {loading && disputes.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-[13px] text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadDisputes}
              className="mt-2 text-[12px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] font-medium text-[#0F1733]">All clear</p>
            <p className="mt-0.5 text-[12px] text-[#6B7494]">
              You have no disputes right now.
            </p>
          </div>
        ) : (
          visible.map((dispute, index) => {
            const tone = toneStyles[getTone(dispute.status)];

            return (
              <div
                key={dispute._id}
                className={`flex gap-2.5 py-3 ${
                  index !== visible.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                {/* Status icon */}
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.iconBg} ${tone.iconColor}`}
                >
                  {tone.icon}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[14px] font-semibold leading-[18px] text-[#0F1733]">
                      {dispute.disputeType}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-3 ${tone.badge}`}
                    >
                      {formatStatus(dispute.status)}
                    </span>
                  </div>

                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-[15px] text-[#6B7494]">
                    {dispute.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                    <span className="leading-4 text-[#6B7494]">
                      ₦{dispute.amount?.toLocaleString()} · {timeAgo(dispute.createdAt)}
                    </span>

                    <Link
                      to="/Storedispute"
                      className="inline-flex items-center justify-center rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-semibold leading-3 text-slate-700 no-underline transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {isOpen(dispute.status) ? 'Review' : 'View'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link when there are more than we show */}
      {!loading && !error && hiddenCount > 0 && (
        <div className="border-t border-slate-100 px-5 py-3">
          <Link
            to="/Storedispute"
            className="text-[12px] font-semibold text-blue-600 no-underline hover:text-blue-800"
          >
            View all {disputes.length} disputes
          </Link>
        </div>
      )}
    </section>
  );
};

export default NeedsAttention;