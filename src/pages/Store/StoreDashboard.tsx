import React, { useMemo } from 'react';
import { useStoreDashboard } from '../../hooks/useStoreDashboard';
import {
  StoreStatCards,
  StoreTransactionTable,
} from '../../components/store';
import NeedsAttention from '../../components/store/NeedsAttention';
import DashboardGreeting from '../../components/store/DashboardGreeting';
import { useAuth } from '../../context/AuthContext';
import TopAgentsCard from '../../components/store/TopAgentsCard';
import RevenueChart from '../../components/store/RevenueChart';
import { computeRevenueStats } from '../../utils/revenueStats';

const StoreDashboard: React.FC = () => {
  const { user } = useAuth() as { user?: any };

  const {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
  } = useStoreDashboard();

  const ownerName =
    user?.firstName ||
    user?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const storeName =
    user?.storeName ||
    user?.store?.name ||
    // dashboardData?.storeName ||
    'your store';

  const revenueStats = useMemo(
    () => computeRevenueStats(dashboardData?.recentTransactions ?? []),
    [dashboardData?.recentTransactions]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // const pendingTransactions = dashboardData.recentTransactions.filter(
  //   (tx) => tx.status === 'Pending'
  // );

  return (
    <>
        <DashboardGreeting ownerName={ownerName} storeName={storeName} />
        {/* Stats Cards */}
        <StoreStatCards data={{ ...dashboardData, ...revenueStats }} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div className="lg:col-span-1">
            <TopAgentsCard
              agents={dashboardData.topAgents}
              viewAllLink="/agents"
            />
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            {/* <StoreNotifications
              notifications={dashboardData.notifications}
              onRefresh={refreshNotifications}
              onMarkAsRead={markNotificationAsRead}
            /> */}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2">
            {/* <StorePerformanceTab
              activeTab={activeTab}
              onTabChange={setActiveTab}
              topAgents={dashboardData.topAgents}
              pendingTransactions={pendingTransactions}
            /> */}
            <StoreTransactionTable
              transactions={dashboardData.recentTransactions}
              onRefresh={() => fetchDashboardData()}
              viewAllLink="/stransactions"
            />
          </div>
          <div className="lg:col-span-1">
            <NeedsAttention 
            />
          </div>
        </div>
    </>
  );
};

export default StoreDashboard;