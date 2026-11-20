import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

export interface ActivityRow {
  id: string;
  title: string;
  subtitle: string;
  party: string;
  date: string;
  direction: 'credit' | 'debit';
  status: 'success' | 'pending' | 'failed';
  amount: number;
}

const TYPE_LABELS: Record<string, string> = {
  wallet_topup: 'Wallet top-up',
  wallet_transfer_received: 'Transfer received',
  wallet_transfer_sent: 'Transfer sent',
  withdrawal: 'Withdrawal',
};

const humanize = (s: string) => {
  const t = s.replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const walletName = (w: any): string | null =>
  w && typeof w === 'object' ? [w.firstName, w.lastName].filter(Boolean).join(' ') || null : null;

/**
 * Accepts either a raw /getusertransaction item or the shape your
 * useSchoolDashboard hook already produces, and returns one row shape.
 */
export const toActivityRow = (raw: any): ActivityRow => {
  const direction: 'credit' | 'debit' =
    raw.direction === 'credit' || raw.category === 'credit' || raw.type === 'credit' ? 'credit' : 'debit';
  const status: ActivityRow['status'] =
    raw.type === 'pending' || raw.status === 'pending'
      ? 'pending'
      : raw.status === 'failed'
        ? 'failed'
        : 'success';
  const rawDesc = raw.description && raw.description !== 'No description provided' ? raw.description : '';
  const typeKey = raw.transactionType as string | undefined;
  const party =
    raw.party ??
    (direction === 'credit' ? walletName(raw.senderWalletId) : walletName(raw.receiverWalletId)) ??
    (rawDesc || '—');

  return {
    id: String(raw._id ?? raw.id),
    title: typeKey ? TYPE_LABELS[typeKey] ?? humanize(typeKey) : raw.category && raw.category !== 'credit' && raw.category !== 'debit' ? raw.category : rawDesc || humanize(direction),
    subtitle: rawDesc,
    party,
    date: raw.createdAt ?? raw.date,
    direction,
    status,
    amount: Number(raw.amount) || 0,
  };
};

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return `Today · ${time}`;
  if (diffDays === 1) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} · ${time}`;
};

const statusStyle = (r: ActivityRow) => {
  if (r.status === 'pending') return { text: 'Pending', cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' };
  if (r.status === 'failed') return { text: 'Failed', cls: 'bg-red-50 text-red-600', dot: 'bg-red-500' };
  return r.direction === 'credit'
    ? { text: 'Received', cls: 'bg-green-50 text-green-600', dot: 'bg-green-500' }
    : { text: 'Paid', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '•';

interface Props {
  rows: ActivityRow[];
  maxItems?: number;
}

export const RecentActivityCard: React.FC<Props> = ({ rows, maxItems = 6 }) => {
  const list = rows.slice(0, maxItems);
  const head = 'px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500';

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between px-6 py-5">
        <div>
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          <p className="mt-0.5 text-xs text-slate-500">Flows across your school ecosystem</p>
        </div>
        <Link to="/transactions" className="text-xs font-semibold !text-slate-900 hover:underline">View all →</Link>
      </div>

      {list.length === 0 ? (
        <p className="px-6 pb-10 pt-4 text-center text-sm text-slate-500">No transactions available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className={`${head} pl-6`}>Type</th>
                <th className={head}>Party</th>
                <th className={head}>Date</th>
                <th className={head}>Status</th>
                <th className={`${head} pr-6 text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((r) => {
                const st = statusStyle(r);
                const credit = r.direction === 'credit';
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${credit ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {credit ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                          {r.subtitle && <div className="max-w-[160px] truncate text-xs text-slate-500">{r.subtitle}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
                          {initials(r.party)}
                        </span>
                        <span className="text-sm text-slate-900">{r.party}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatWhen(r.date)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                        <span className={`h-1 w-1 rounded-full ${st.dot}`} />{st.text}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap py-3 pl-3 pr-6 text-right text-sm font-bold ${credit ? 'text-green-600' : 'text-slate-900'}`}>
                      {credit ? '+' : '−'}₦{r.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};