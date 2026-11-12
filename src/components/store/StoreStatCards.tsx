// src/components/store/StoreStatCards.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CircleDollarSign, TrendingUp, Users } from 'lucide-react';
import { Card, naira } from './ui';
import type { DashboardData } from '../../types/dashboard';

interface StoreStatCardsProps {
  data: DashboardData;
}

const WITHDRAW_ROUTE = '/swithdrawal';
const AGENTS_ROUTE = '/agents';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const StatCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ label, icon, value, footer }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <span className="text-slate-400">{icon}</span>
    </div>
    <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    {footer}
  </Card>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-2 text-xs text-slate-500">{children}</p>
);

const linkClass =
  'mt-2 inline-block rounded text-xs font-medium text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

const StoreStatCards: React.FC<StoreStatCardsProps> = ({ data }) => (
  <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard
      label="Wallet balance"
      icon={<Wallet className="h-4 w-4" />}
      value={naira(data.balance)}
      footer={
        <Link to={WITHDRAW_ROUTE} className={linkClass}>
          Withdraw →
        </Link>
      }
    />
    <StatCard
      label="Today's revenue"
      icon={<CircleDollarSign className="h-4 w-4" />}
      value={naira(data.dailyRevenue)}
      footer={<Note>{plural(data.todayTransactionCount, 'transaction')} today</Note>}
    />
    <StatCard
      label="Total revenue"
      icon={<TrendingUp className="h-4 w-4" />}
      value={naira(data.totalRevenue)}
      footer={<Note>{plural(data.totalTransactionCount, 'transaction')} in total</Note>}
    />
    <StatCard
      label="Active agents"
      icon={<Users className="h-4 w-4" />}
      value={
        <>
          {data.activeAgents}
          <span className="ml-1 text-sm font-normal text-slate-500">of {data.numberOfAgents}</span>
        </>
      }
      footer={
        <Link to={AGENTS_ROUTE} className={linkClass}>
          Manage agents →
        </Link>
      }
    />
  </div>
);

export default StoreStatCards;