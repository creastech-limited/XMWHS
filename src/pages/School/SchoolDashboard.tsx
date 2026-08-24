// src/pages/School/SchoolDashboard.tsx
import React from 'react';
import { FaWallet, FaUsers, FaStore } from 'react-icons/fa';
import { Header } from '../../components/Header';
import { Sidebar as Asidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useSchoolDashboard } from '../../hooks/useSchoolDashboard';
import { StatCard } from '../../components/shared/StatCard';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Snackbar } from '../../components/shared/Snackbar';
import { ChartCard } from '../../components/shared/ChartCard';
import { TransactionList } from '../../components/shared/TransactionList';
import { CalendarWidget } from '../../components/shared/CalendarWidget';

const SchoolDashboard: React.FC = () => {
  const {
    user,
    loading,
    stats,
    pieData,
    barData,
    transactions,
    calendarDate,
    snackbar,
    setCalendarDate,
    closeSnackbar,
  } = useSchoolDashboard();

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Asidebar />
        </aside>

        <main className="flex-grow p-4 md:p-8 md:ml-64">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
                  School Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back, {user && user.name ? user.name : 'Administrator'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<FaWallet className="text-xl" />}
              iconBgColor="bg-indigo-100"
              iconTextColor="text-indigo-600"
              title="Wallet Balance"
              value={`₦${stats.balance.toLocaleString()}`}
            />
            <StatCard
              icon={<FaUsers className="text-xl" />}
              iconBgColor="bg-green-100"
              iconTextColor="text-green-600"
              title="Total Students"
              value={stats.totalStudents.toLocaleString()}
            />
            <StatCard
              icon={<FaStore className="text-xl" />}
              iconBgColor="bg-amber-100"
              iconTextColor="text-amber-600"
              title="Total Stores"
              value={stats.totalStores.toLocaleString()}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <ChartCard
              title="Student Distribution"
              type="pie"
              data={pieData}
              colors={['#42a5f5', '#66bb6a', '#ffca28', '#ef5350', '#ab47bc', '#26c6da']}
              emptyMessage="No student data available"
            />
            <ChartCard
              title="Fee Collection Trend"
              type="bar"
              data={barData}
              emptyMessage="No fee data available"
            />
          </div>

          {/* Transactions & Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TransactionList
              transactions={transactions}
              title="Recent Transactions"
              viewAllLink="/transactions"
              emptyMessage="No transactions available."
            />
            <CalendarWidget
              value={calendarDate}
              onChange={setCalendarDate}
            />
          </div>
        </main>
      </div>
      <Footer />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        position="bottom-right"
      />
    </div>
  );
};

export default SchoolDashboard;