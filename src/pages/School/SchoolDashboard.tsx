import React, { useEffect, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useSchoolDashboard } from '../../hooks/useSchoolDashboard';
import { getFeeReport } from '../../services';
import type { FeeReport } from '../../types/school';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Snackbar } from '../../components/shared/Snackbar';
import { DashboardStatCards } from '../../components/dashboard/Dashboardstatcards';
import { FeeCollectionCard } from '../../components/dashboard/Feecollectioncard';
import type { FeeMonth } from '../../components/dashboard/Feecollectioncard';
import { StudentsByClassCard } from '../../components/dashboard/Studentsbyclasscard';
import { RecentActivityCard, toActivityRow } from '../../components/dashboard/Recentactivitycard';
import { NeedsAttentionCard } from '../../components/dashboard/NeedsAttentionCard';
// import { UpcomingCard } from '../../components/dashboard/UpcomingCard';

// ---- Fields the fee report can't supply yet (see notes below)
const PENDING = {
  feesCollectedChange: 0, 
  daysToDeadline: 0,
};

// Monthly chart: the report has no time breakdown yet
const FEE_MONTHS: FeeMonth[] = [
  { month: 'Sep', target: 0, collected: 0 },
  { month: 'Oct', target: 0, collected: 0 },
  { month: 'Nov', target: 0, collected: 0, current: true },
  { month: 'Dec', target: 0, collected: null, projected: 0 },
  { month: 'Jan', target: 0, collected: null, projected: 0 },
];

// TODO: derive from the school's current session/term
const FEE_FILTERS = { session: '2026', term: 'First' };

const naira = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n || 0);

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const SchoolDashboard: React.FC = () => {
  // const navigate = useNavigate();
  const { user, loading, stats, pieData, transactions, parentCount, snackbar, closeSnackbar } = useSchoolDashboard();

  // ---- Fee report (inline, no separate hook)
  const [report, setReport] = useState<FeeReport | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFeeReport(FEE_FILTERS)
      .then((r) => {
        if (!cancelled) {
          setReport(r);
          setFeeError(null);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setFeeError(e?.response?.data?.message || 'Failed to load fee report');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const feeStats = useMemo(() => {
    const t = report?.totals;
    return {
      feesCollected: naira(t?.collected ?? 0),
      feesOutstanding: naira(t?.outstanding ?? 0),
      outstandingStudents: (t?.notPaid ?? 0) + (t?.partlyPaid ?? 0),
      collectedTotal: naira(t?.collected ?? 0),
      collectedPercent: t?.collectionRate ?? 0,
      targetLabel: naira(t?.expected ?? 0),
    };
  }, [report]);

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
              A quick look at {schoolName}'s money and ecosystem.
            </p>
            {feeError && <p className="mt-1 text-xs text-red-600">{feeError}</p>}
          </div>
        </div>

        {/* Stat cards */}
        <DashboardStatCards
          feesCollected={feeStats.feesCollected}
          feesCollectedChange={PENDING.feesCollectedChange}
          feesOutstanding={feeStats.feesOutstanding}
          outstandingStudents={feeStats.outstandingStudents}
          daysToDeadline={PENDING.daysToDeadline}
          walletBalance={stats.balance}
          students={totalStudents}
          stores={stats.totalStores}
          parents={parentCount}
        />

        {/* Row 1: fee collection + students by class */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FeeCollectionCard
              total={feeStats.collectedTotal}
              percent={feeStats.collectedPercent}
              targetLabel={feeStats.targetLabel}
              daysToDeadline={PENDING.daysToDeadline}
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