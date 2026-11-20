import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useSchoolDashboard } from '../../hooks/useSchoolDashboard';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Snackbar } from '../../components/shared/Snackbar';
import { DashboardStatCards } from '../../components/dashboard/Dashboardstatcards';
import { FeeCollectionCard } from '../../components/dashboard/Feecollectioncard';
import type { FeeMonth } from '../../components/dashboard/Feecollectioncard';
import { StudentsByClassCard } from '../../components/dashboard/Studentsbyclasscard';
import { RecentActivityCard, toActivityRow } from '../../components/dashboard/Recentactivitycard';
import { NeedsAttentionCard } from '../../components/dashboard/NeedsAttentionCard';
// import { UpcomingCard } from '../../components/dashboard/UpcomingCard';

// ---- DUMMY DATA
const DUMMY = {
  termLabel: '1st Term, 2026/27',
  feesCollected: '₦24.6M',
  feesCollectedChange: 12,
  feesOutstanding: '₦3.2M',
  outstandingStudents: 120,
  daysToDeadline: 15,
  deadlineLabel: '12 November',
  collectedTotal: '₦24,620,000',
  collectedPercent: 88,
  targetLabel: '₦27.8M',
  parents: 527,
  pendingRegistrations: 8,
};

const FEE_MONTHS: FeeMonth[] = [
  { month: 'Sep', target: 5.5, collected: 5.1 },
  { month: 'Oct', target: 5.6, collected: 6.4 },
  { month: 'Nov', target: 5.6, collected: 3.9, current: true },
  { month: 'Dec', target: 5.5, collected: null, projected: 5.6 },
  { month: 'Jan', target: 5.1, collected: null, projected: 4.7 },
];

const RANGES = ['Today', 'This Week', 'This Term', 'This Year'];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const SchoolDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, stats, pieData, transactions, snackbar, closeSnackbar } = useSchoolDashboard();
  const [range, setRange] = useState('This Term');

  const firstName: string = (user as any)?.firstName || (user as any)?.name?.split(' ')[0] || 'Administrator';
  const schoolName: string = (user as any)?.schoolName || 'your school';

  // pieData is assumed to be [{ name, value }]. Tolerates label/count too.
  const classData = useMemo(
    () =>
      (pieData ?? []).map((d: any) => ({
        name: String(d.name ?? d.label ?? d.class ?? ''),
        value: Number(d.value ?? d.count ?? 0),
      })),
    [pieData]
  );

  const rows = useMemo(() => (transactions ?? []).map(toActivityRow), [transactions]);

  const totalStudents = stats.totalStudents || 0;

  if (loading) {
    return (
      <main className="flex-grow md:ml-64">
        <LoadingScreen message="Loading dashboard..." />
      </main>
    );
  }

  return (
    <main className="flex-grow overflow-x-auto p-4 md:ml-64 md:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              A quick look at {schoolName}'s money and ecosystem for {DUMMY.termLabel}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${range === r ? 'bg-slate-900 !text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/schoolfees')}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <BanknotesIcon className="h-4 w-4" />
              Invoice Fees
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <DashboardStatCards
          feesCollected={DUMMY.feesCollected}
          feesCollectedChange={DUMMY.feesCollectedChange}
          feesOutstanding={DUMMY.feesOutstanding}
          outstandingStudents={DUMMY.outstandingStudents}
          daysToDeadline={DUMMY.daysToDeadline}
          walletBalance={stats.balance}
          students={totalStudents}
          stores={stats.totalStores}
          parents={DUMMY.parents}
        />

        {/* Row 1: fee collection + students by class */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FeeCollectionCard
              total={DUMMY.collectedTotal}
              percent={DUMMY.collectedPercent}
              targetLabel={DUMMY.targetLabel}
              daysToDeadline={DUMMY.daysToDeadline}
              months={FEE_MONTHS}
            />
          </div>
          <StudentsByClassCard data={classData} termLabel="Term 1, 2026/27" />
        </div>

        {/* Row 2: recent activity + attention / upcoming */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivityCard rows={rows} maxItems={6} />
          </div>
          <div className="space-y-6">
            <NeedsAttentionCard />
            {/* <UpcomingCard /> */}
          </div>
        </div>

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
          position="bottom-right"
        />
      </div>
    </main>
  );
};

export default SchoolDashboard;