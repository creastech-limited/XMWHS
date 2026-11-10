// src/components/dashboard/DashboardStatCards.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  ClockIcon,
  WalletIcon,
  UsersIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface Props {
  feesCollected: string;
  feesCollectedChange: number;
  feesOutstanding: string;
  outstandingStudents: number;
  daysToDeadline: number;
  walletBalance: number;
  students: number;
  stores: number;
  parents: number;
}

const card = 'rounded-2xl border border-slate-200 bg-white p-5';
const label = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500';

const IconBox: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = 'bg-slate-100 text-slate-600', children }) => (
  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}>{children}</div>
);

export const DashboardStatCards: React.FC<Props> = (p) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <div className={card}>
      <div className="flex items-start justify-between">
        <span className={label}>Fees collected</span>
        <IconBox className="bg-indigo-50 text-indigo-600"><CurrencyDollarIcon className="h-5 w-5" /></IconBox>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{p.feesCollected}</div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 font-semibold text-green-600">
          <ChevronUpIcon className="mr-0.5 h-3 w-3" />{p.feesCollectedChange}%
        </span>
        vs last term
      </div>
    </div>

    <div className={card}>
      <div className="flex items-start justify-between">
        <span className={label}>Fees outstanding</span>
        <IconBox className="bg-amber-100 text-amber-600"><ClockIcon className="h-5 w-5" /></IconBox>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{p.feesOutstanding}</div>
      <div className="mt-2 text-xs text-slate-500">
        <span className="font-semibold text-amber-600">{p.outstandingStudents} students</span>
        <span className="ml-2">{p.daysToDeadline} days to deadline</span>
      </div>
    </div>

    <div className={card}>
      <div className="flex items-start justify-between">
        <span className={label}>Wallet balance</span>
        <IconBox><WalletIcon className="h-5 w-5" /></IconBox>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">₦{p.walletBalance.toLocaleString()}</div>
      <Link to="/withdrawal" className="mt-2 inline-block text-xs font-semibold !text-slate-900 hover:underline">
        Withdraw →
      </Link>
    </div>

    <div className={card}>
      <div className="flex items-start justify-between">
        <span className={label}>Ecosystem</span>
        <IconBox><UsersIcon className="h-5 w-5" /></IconBox>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[['Students', p.students], ['Stores', p.stores], ['Parents', p.parents]].map(([k, v]) => (
          <div key={k as string}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{k}</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{(v as number).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);