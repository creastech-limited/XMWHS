// src/pages/Store/StoreDashboard.tsx
import React from 'react';
import StoreSidebar from '../../components/StoreSidebar';
import StoreHeader from '../../components/StoreHeader';
import Footer from '../../components/Footer';
import { useStoreDashboard } from '../../hooks/useStoreDashboard';
import {
  StoreStatCards,
  StoreTransactionTable,
  StoreNotifications,
  StorePerformanceTab,
} from '../../components/store';

const StoreDashboard: React.FC = () => {
  const {
    dashboardData,
    activeTab,
    loading,
    error,
    setActiveTab,
    refreshNotifications,
    markNotificationAsRead,
    fetchDashboardData,
  } = useStoreDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
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

  const pendingTransactions = dashboardData.recentTransactions.filter(
    (tx) => tx.status === 'Pending'
  );

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
      <StoreHeader />
      <div className="z-100">
        <StoreSidebar />
      </div>

      <main className="flex-grow p-4 lg:p-8 lg:ml-64 transition-all duration-300">
        {/* Stats Cards */}
        <StoreStatCards data={dashboardData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <StoreTransactionTable
              transactions={dashboardData.recentTransactions}
              onRefresh={() => fetchDashboardData()}
              viewAllLink="/stransactions"
            />
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            <StoreNotifications
              notifications={dashboardData.notifications}
              onRefresh={refreshNotifications}
              onMarkAsRead={markNotificationAsRead}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <StorePerformanceTab
            activeTab={activeTab}
            onTabChange={setActiveTab}
            topAgents={dashboardData.topAgents}
            pendingTransactions={pendingTransactions}
          />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  );
};

export default StoreDashboard;