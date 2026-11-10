// src/components/dashboard/NeedsAttentionCard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getUserDisputes } from '../../services/api/userService';

interface Dispute {
    _id: string;
    status: string;
    amount: number;
    disputeDate?: string;
    createdAt: string;
}

export const NeedsAttentionCard: React.FC = () => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getUserDisputes();
                const list = res.disputes ?? res.data ?? [];
                if (!cancelled) setDisputes(Array.isArray(list) ? (list as Dispute[]) : []);
            } catch {
                if (!cancelled) setDisputes([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const open = disputes.filter((d) => d.status?.toLowerCase() !== 'resolved');
    const oldestDays = open.length
        ? Math.max(
            ...open.map((d) =>
                Math.floor((Date.now() - new Date(d.disputeDate || d.createdAt).getTime()) / 86400000)
            )
        )
        : 0;
    const openAmount = open.reduce((s, d) => s + (Number(d.amount) || 0), 0);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="font-semibold text-slate-900">Needs your attention</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                    {loading ? 'Checking…' : `${open.length} ${open.length === 1 ? 'item' : 'items'}`}
                </p>
            </div>

            {loading ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : open.length > 0 ? (
                <Link to="/Sdisputes" className="block">
                    <div className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <ExclamationCircleIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">
                                {open.length} open dispute{open.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-slate-500">
                                ₦{openAmount.toLocaleString()} in question. Oldest is {oldestDays} day
                                {oldestDays === 1 ? '' : 's'} old.
                            </div>
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="flex items-center gap-3 px-6 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                        <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">You're all caught up</div>
                        <div className="text-xs text-slate-500">No open disputes right now.</div>
                    </div>
                </div>
            )}
        </div>
    );
};